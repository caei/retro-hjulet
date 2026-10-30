import { useEffect, useRef, useState, useCallback } from 'react';
import { RetroBoard } from '../types/retro';

interface UseRetroWebSocketOptions {
  board: RetroBoard | null;
  onRemoteBoardUpdate: (board: RetroBoard) => void;
}

export function useRetroWebSocket({ board, onRemoteBoardUpdate }: UseRetroWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(1);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const boardRef = useRef(board);
  boardRef.current = board;

  // Track if we just received a remote update so we don't echo it back
  const isRemoteUpdateRef = useRef(false);

  const connect = useCallback(() => {
    if (!boardRef.current) return;
    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        if (boardRef.current) {
          // Join the room for the active board
          ws.send(
            JSON.stringify({
              type: 'join_board',
              boardId: boardRef.current.id,
              initialBoard: boardRef.current,
            })
          );
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case 'sync_board': {
              if (data.onlineCount !== undefined) {
                setOnlineCount(data.onlineCount);
              }
              if (data.board && boardRef.current && data.board.id === boardRef.current.id) {
                isRemoteUpdateRef.current = true;
                onRemoteBoardUpdate(data.board);
                setTimeout(() => {
                  isRemoteUpdateRef.current = false;
                }, 100);
              }
              break;
            }

            case 'board_updated': {
              if (data.board && boardRef.current && data.board.id === boardRef.current.id) {
                isRemoteUpdateRef.current = true;
                onRemoteBoardUpdate(data.board);
                setTimeout(() => {
                  isRemoteUpdateRef.current = false;
                }, 100);
              }
              break;
            }

            case 'presence_update': {
              if (boardRef.current && data.boardId === boardRef.current.id && data.onlineCount !== undefined) {
                setOnlineCount(data.onlineCount);
              }
              break;
            }

            default:
              break;
          }
        } catch (e) {
          console.error('Error handling WebSocket message:', e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        socketRef.current = null;
        if (boardRef.current) {
          // Auto-reconnect after 2 seconds
          reconnectTimeoutRef.current = setTimeout(connect, 2000);
        }
      };

      ws.onerror = (err) => {
        console.warn('WebSocket error, will retry...', err);
        ws.close();
      };
    } catch (err) {
      console.warn('Failed to establish WebSocket:', err);
      if (boardRef.current) {
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      }
    }
  }, [onRemoteBoardUpdate]);

  // Handle boardId changes
  useEffect(() => {
    if (!board) {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'join_board',
          boardId: board.id,
          initialBoard: board,
        })
      );
    } else {
      connect();
    }
  }, [board?.id, connect]);

  // Initial connect & cleanup
  useEffect(() => {
    connect();

    // Heartbeat ping every 25s
    const pingInterval = setInterval(() => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 25000);

    return () => {
      clearInterval(pingInterval);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [connect]);

  // Broadcast local changes to server & all room peers
  const broadcastBoard = useCallback((updatedBoard: RetroBoard) => {
    // If this update was triggered by an incoming remote change, do not echo
    if (isRemoteUpdateRef.current) {
      return;
    }

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'update_board',
          board: updatedBoard,
        })
      );
    }
  }, []);

  return {
    isConnected,
    onlineCount,
    broadcastBoard,
  };
}
