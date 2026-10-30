import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// In-memory server-authoritative boards store
const boardsStore = new Map<string, any>();

// WebSocket room management: boardId -> Set of WebSockets
const boardRooms = new Map<string, Set<WebSocket>>();
// Map socket to its current boardId
const socketToBoard = new Map<WebSocket, string>();

// Gemini is optional. Creating the client without a key can prevent the server
// from starting, so initialize it only when a key is configured.
const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
const ai = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

// Broadcast helper for a specific board room
function broadcastToRoom(boardId: string, message: any, excludeSocket?: WebSocket) {
  const room = boardRooms.get(boardId);
  if (!room) return;
  const payload = JSON.stringify(message);

  for (const client of room) {
    if (client !== excludeSocket && client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

// WebSocket Server attached to the same HTTP server on path '/ws'
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      switch (msg.type) {
        case 'join_board': {
          const { boardId, initialBoard } = msg;
          if (!boardId) return;

          // Remove from previous room if any
          const prevBoardId = socketToBoard.get(ws);
          if (prevBoardId && prevBoardId !== boardId) {
            const prevRoom = boardRooms.get(prevBoardId);
            if (prevRoom) {
              prevRoom.delete(ws);
              broadcastToRoom(prevBoardId, {
                type: 'presence_update',
                boardId: prevBoardId,
                onlineCount: prevRoom.size,
              });
            }
          }

          // Add to new room
          if (!boardRooms.has(boardId)) {
            boardRooms.set(boardId, new Set());
          }
          const room = boardRooms.get(boardId)!;
          room.add(ws);
          socketToBoard.set(ws, boardId);

          // If server already has authoritative board, use it; otherwise save initialBoard
          let currentBoard = boardsStore.get(boardId);
          if (!currentBoard && initialBoard) {
            currentBoard = initialBoard;
            boardsStore.set(boardId, initialBoard);
          }

          // Send current board and online presence count to newly joined client
          ws.send(
            JSON.stringify({
              type: 'sync_board',
              boardId,
              board: currentBoard || null,
              onlineCount: room.size,
            })
          );

          // Notify everyone in the room about updated presence
          broadcastToRoom(boardId, {
            type: 'presence_update',
            boardId,
            onlineCount: room.size,
          });
          break;
        }

        case 'update_board': {
          const { board, notifySender } = msg;
          if (!board || !board.id) return;

          // Save authoritative state on server
          boardsStore.set(board.id, board);

          // Broadcast to all other participants in the board room
          broadcastToRoom(
            board.id,
            {
              type: 'board_updated',
              boardId: board.id,
              board,
            },
            notifySender ? undefined : ws
          );
          break;
        }

        case 'ping': {
          ws.send(JSON.stringify({ type: 'pong' }));
          break;
        }

        default:
          break;
      }
    } catch (e) {
      console.error('WebSocket message parsing error:', e);
    }
  });

  ws.on('close', () => {
    const boardId = socketToBoard.get(ws);
    if (boardId) {
      socketToBoard.delete(ws);
      const room = boardRooms.get(boardId);
      if (room) {
        room.delete(ws);
        if (room.size === 0) {
          boardRooms.delete(boardId);
        } else {
          broadcastToRoom(boardId, {
            type: 'presence_update',
            boardId,
            onlineCount: room.size,
          });
        }
      }
    }
  });

  ws.on('error', (err) => {
    console.error('WebSocket connection error:', err);
  });
});

// REST Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    activeBoards: boardsStore.size,
    activeRooms: boardRooms.size,
  });
});

// REST endpoint to get a board
app.get('/api/boards/:id', (req, res) => {
  const board = boardsStore.get(req.params.id);
  if (!board) {
    return res.status(404).json({ error: 'Tavle ikke funnet' });
  }
  res.json(board);
});

// REST endpoint to save/update a board
app.post('/api/boards', (req, res) => {
  const board = req.body;
  if (!board || !board.id) {
    return res.status(400).json({ error: 'Ugyldig tavle' });
  }
  boardsStore.set(board.id, board);
  // Broadcast update via WebSocket
  broadcastToRoom(board.id, {
    type: 'board_updated',
    boardId: board.id,
    board,
  });
  res.json({ success: true, board });
});

// Cluster claims endpoint for Spider diagram synthesis
app.post('/api/ai/cluster-claims', async (req, res) => {
  try {
    const { boardTitle, claims, categories } = req.body;

    if (!claims || !Array.isArray(claims) || claims.length === 0) {
      return res.status(400).json({ error: 'Ingen påstander oppgitt for analysering' });
    }

    if (!ai) {
      return res.json({
        fallback: true,
        summary: 'Gruppert basert på eksisterende kategorier (KI-nøkkel ikke oppgitt).',
        categories: clusterLocally(claims, categories),
        focusAreas: ['Fokusområder generert ut fra høyeste stress-score'],
        recommendations: [
          'Gå gjennom punktene med høyest score først.',
          'Bruk tid på å diskutere felles tiltak for teamet.',
        ],
      });
    }

    const claimsText = claims
      .map(
        (c: { participantName: string; text: string; score: number; categoryName?: string }, idx: number) =>
          `[${idx + 1}] Deltaker: "${c.participantName}" | Kategori/Farge: "${c.categoryName || 'Udefinert'}" | Stress-score (1-10): ${c.score} | Påstand: "${c.text}"`
      )
      .join('\n');

    const prompt = `Du er en erfaren smidig coach og fasilitator for retrospektiver.
Teamet har gjennomført et retrospektiv for tavlen "${boardTitle || 'Sprint Retrospektiv'}".
Hver deltaker har lagt inn påstander/nøkkelord med en stress-score (1 til 10, der 10 er maksimalt stress/friksjon/alvorlighetsgrad og 1 er uproblematisk).

Her er alle innspillene fra teamet:
${claimsText}

OPPGAVE:
1. Grupper disse påstandene inn i 4 til 7 helhetlige, presise kategorier tilpasset et edderkoppdiagram (radar chart). Hvis de eksisterende kategoriene er gode, bevar og raffiner dem.
2. For hver kategori:
   - "name": Kort og tydelig navn på norsk (f.eks. "Arbeidsflyt & Prosess", "Teknisk gjeld & Arkitektur", "Tidsfristar & Kapasitet", "Samarbeid & Kommunikasjon", "Mål & Prioritering")
   - "description": En kort forklarende setning om hva dette emnet omfatter.
   - "color": En passende Tailwind-vennlig hex-farge (f.eks. #EF4444, #F59E0B, #10B981, #6366F1, #8B5CF6, #EC4899, #06B6D4)
   - "averageScore": Gjennomsnittlig eller vurdert stress-score (1.0 til 10.0) for dette området.
   - "isHighFocus": boolean, true dersom dette er et akutt problemområde som teamet bør prioritere å løse.
   - "claimIndices": Liste med 1-baserte indekser fra listen over som tilhører denne kategorien.
   - "keyTakeaway": Hovedinnsikt for denne kategorien.
3. Lag en samlet oppsummering av stemningen i teamet ("summary"), en liste over 2-4 konkrete fokusområder som bør adresseres ("focusAreas"), og 2-3 konkrete tiltaksforslag ("recommendations").

Svar utelukkende i JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            categories: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  color: { type: Type.STRING },
                  averageScore: { type: Type.NUMBER },
                  isHighFocus: { type: Type.BOOLEAN },
                  claimIndices: {
                    type: Type.ARRAY,
                    items: { type: Type.INTEGER },
                  },
                  keyTakeaway: { type: Type.STRING },
                },
                required: ['name', 'description', 'color', 'averageScore', 'isHighFocus', 'claimIndices'],
              },
            },
            focusAreas: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['summary', 'categories', 'focusAreas', 'recommendations'],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('Mottok tomt svar fra Gemini');
    }

    const parsed = JSON.parse(text);

    // Map claim IDs back into categories
    const enrichedCategories = parsed.categories.map((cat: any, i: number) => {
      const assignedClaimIds: string[] = [];
      if (Array.isArray(cat.claimIndices)) {
        for (const idx of cat.claimIndices) {
          const c = claims[idx - 1];
          if (c && c.id) {
            assignedClaimIds.push(c.id);
          }
        }
      }
      return {
        id: `cat-ai-${i + 1}-${Date.now().toString(36)}`,
        name: cat.name,
        description: cat.description,
        color: cat.color || '#6366F1',
        averageScore: Number(cat.averageScore) || 5,
        isHighFocus: !!cat.isHighFocus,
        claimIds: assignedClaimIds,
        keyTakeaway: cat.keyTakeaway || '',
      };
    });

    res.json({
      summary: parsed.summary,
      categories: enrichedCategories,
      focusAreas: parsed.focusAreas,
      recommendations: parsed.recommendations,
    });
  } catch (err: any) {
    console.error('Error in /api/ai/cluster-claims:', err);
    const { claims, categories } = req.body;
    res.json({
      fallback: true,
      errorNotice: err?.message || 'Kunne ikke kontakte KI-tjenesten, bruker lokal gruppering',
      summary: 'Lokal analyse fullført. Her er fordeling basert på teamets innspilte kategorier og stress-score.',
      categories: clusterLocally(claims || [], categories || []),
      focusAreas: ['Fokusér på temaene med høyest gjennomsnittlig stressnivå'],
      recommendations: [
        'Diskuter årsakene til de høyeste scorene i plenum.',
        'Definer 1-2 målbare forbedringstiltak for neste periode.',
      ],
    });
  }
});

// Helper for local deterministic fallback clustering
function clusterLocally(claims: any[], defaultCategories: any[] = []) {
  if (!claims || claims.length === 0) return [];
  const map: Record<string, { name: string; color: string; scores: number[]; claimIds: string[] }> = {};

  for (const c of claims) {
    const key = c.categoryName || 'Generelt';
    if (!map[key]) {
      map[key] = {
        name: key,
        color: c.categoryColor || '#3B82F6',
        scores: [],
        claimIds: [],
      };
    }
    map[key].scores.push(Number(c.score) || 5);
    map[key].claimIds.push(c.id);
  }

  return Object.keys(map).map((k, idx) => {
    const item = map[k];
    const avg = item.scores.reduce((a, b) => a + b, 0) / (item.scores.length || 1);
    return {
      id: `cat-loc-${idx + 1}`,
      name: item.name,
      description: `Innspill samlet under ${item.name}`,
      color: item.color,
      averageScore: Math.round(avg * 10) / 10,
      isHighFocus: avg >= 6.5,
      claimIds: item.claimIds,
      keyTakeaway: avg >= 7 ? 'Høyt stress/friksjonsnivå rapportert' : 'Moderat til lavt stressnivå',
    };
  });
}

// Setup Vite or static serving
async function setupServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server with WebSockets running at http://0.0.0.0:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
