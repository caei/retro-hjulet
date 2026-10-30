import { RetroBoard, DEFAULT_CATEGORIES } from '../types/retro';

const STORAGE_KEY_BOARDS = 'retro_boards_v1';
const STORAGE_KEY_ACTIVE_BOARD = 'retro_active_board_id';

/**
 * Generer ein unik og enkel ID med tal, bokstavar og teikn
 * Døme: RTR-7X4#9k eller SPRINT-28B$7w
 */
export function generateBoardId(prefix = 'RTR'): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const symbols = ['#', '$', '-', '&'];
  const p1 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const p2 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const sym = symbols[Math.floor(Math.random() * symbols.length)];
  return `${prefix}-${p1}${sym}${p2}`;
}

export function generateParticipantId(): string {
  return 'p_' + Math.random().toString(36).substring(2, 9);
}

export function generateClaimId(): string {
  return 'c_' + Math.random().toString(36).substring(2, 9);
}

// Hent alle lagra tavler
export function getSavedBoards(): Record<string, RetroBoard> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BOARDS);
    if (!raw) return {};
    const parsed: Record<string, RetroBoard> = JSON.parse(raw);

    // Sørg for at demo-tavlen aldri inkluderes i oversikt over nylige tavler
    let hasCleaned = false;
    if (parsed['RTR-42X#7k']) {
      delete parsed['RTR-42X#7k'];
      hasCleaned = true;
    }
    Object.keys(parsed).forEach(key => {
      if (parsed[key]?.isDemo || parsed[key]?.id === 'RTR-42X#7k') {
        delete parsed[key];
        hasCleaned = true;
      }
    });

    if (hasCleaned) {
      localStorage.setItem(STORAGE_KEY_BOARDS, JSON.stringify(parsed));
    }

    return parsed;
  } catch (e) {
    console.error('Feil ved lesing av lagra tavler:', e);
    return {};
  }
}

// Lagre eller oppdater ei tavle (unntatt demo-tavler)
export function saveBoard(board: RetroBoard): void {
  // Ikke legg opp demo-tavle i nylige tavler dersom brukeren prøver den ut
  if (board.isDemo || board.id === 'RTR-42X#7k') {
    return;
  }
  try {
    const boards = getSavedBoards();
    boards[board.id] = board;
    localStorage.setItem(STORAGE_KEY_BOARDS, JSON.stringify(boards));
  } catch (e) {
    console.error('Feil ved lagring av tavle:', e);
  }
}

// Hent aktiv tavle ID
export function getActiveBoardId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_ACTIVE_BOARD);
  } catch {
    return null;
  }
}

export function setActiveBoardId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_BOARD, id);
  } catch {
    // ignore
  }
}

// Hent spesifikk tavle
export function getBoardById(id: string): RetroBoard | null {
  if (id === 'RTR-42X#7k') {
    return createDemoBoard();
  }
  const boards = getSavedBoards();
  return boards[id] || null;
}

// Slett ei tavle
export function deleteBoard(id: string): void {
  const boards = getSavedBoards();
  delete boards[id];
  localStorage.setItem(STORAGE_KEY_BOARDS, JSON.stringify(boards));
}

// Opprett standard demodokument slik at appen er levende og klar med en gang
export function createDemoBoard(): RetroBoard {
  const id = 'RTR-42X#7k';
  const participants = [
    {
      id: 'p-ingrid',
      name: 'Ingrid (Team Lead)',
      isDone: true,
      avatarColor: '#6366F1',
      joinedAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'p-magnus',
      name: 'Magnus (Senior Dev)',
      isDone: true,
      avatarColor: '#10B981',
      joinedAt: new Date(Date.now() - 3200000).toISOString()
    },
    {
      id: 'p-sara',
      name: 'Sara (UX/Designer)',
      isDone: true,
      avatarColor: '#F59E0B',
      joinedAt: new Date(Date.now() - 2800000).toISOString()
    },
    {
      id: 'p-jonas',
      name: 'Jonas (QA & DevOps)',
      isDone: true,
      avatarColor: '#EC4899',
      joinedAt: new Date(Date.now() - 2400000).toISOString()
    }
  ];

  const claims = [
    // Ingrid
    {
      id: 'c-1',
      participantId: 'p-ingrid',
      participantName: 'Ingrid (Team Lead)',
      text: 'Mange uforutsette ad-hoc møter som bryter dyp fokus',
      score: 8,
      categoryId: 'cat-prosess',
      notes: 'Må skjerme teamet bedre mot eksterne avbrudd.'
    },
    {
      id: 'c-2',
      participantId: 'p-ingrid',
      participantName: 'Ingrid (Team Lead)',
      text: 'Super lagånd og støtte på tvers av fagområder',
      score: 2,
      categoryId: 'cat-collab',
      notes: 'Folk hjelper hverandre umiddelbart ved blokkeringer.'
    },
    {
      id: 'c-3',
      participantId: 'p-ingrid',
      participantName: 'Ingrid (Team Lead)',
      text: 'Stram tidsfrist før produksjonssetting på fredager',
      score: 8,
      categoryId: 'cat-kapasitet',
      notes: 'Bør unngå fredags-deployer.'
    },
    // Magnus
    {
      id: 'c-4',
      participantId: 'p-magnus',
      participantName: 'Magnus (Senior Dev)',
      text: 'Treg CI/CD pipeline tar 35 min per build',
      score: 9,
      categoryId: 'cat-tech',
      notes: 'Hemmer kontinuerlig leveranse enormt.'
    },
    {
      id: 'c-5',
      participantId: 'p-magnus',
      participantName: 'Magnus (Senior Dev)',
      text: 'Uklare akseptansekriterier på enkelte brukerhistorier',
      score: 7,
      categoryId: 'cat-maal',
      notes: 'Fører til omkoding i sprintens siste dager.'
    },
    {
      id: 'c-6',
      participantId: 'p-magnus',
      participantName: 'Magnus (Senior Dev)',
      text: 'God kodekvalitet og grundig pull request-review',
      score: 3,
      categoryId: 'cat-kvalitet',
      notes: 'Gode diskusjoner i PR-ene.'
    },
    // Sara
    {
      id: 'c-7',
      participantId: 'p-sara',
      participantName: 'Sara (UX/Designer)',
      text: 'Figma-designs blir ikke alltid matchet 1-til-1 i frontend',
      score: 6,
      categoryId: 'cat-kvalitet',
      notes: 'Trenger felles designsynk i midten av sprinten.'
    },
    {
      id: 'c-8',
      participantId: 'p-sara',
      participantName: 'Sara (UX/Designer)',
      text: 'Høy motivasjon og gøy å se nye funksjoner lanseres',
      score: 2,
      categoryId: 'cat-trivsel',
      notes: 'Moro med gode tilbakemeldinger fra pilotbrukere.'
    },
    {
      id: 'c-9',
      participantId: 'p-sara',
      participantName: 'Sara (UX/Designer)',
      text: 'Uforutsette endringer i prioriteringer underveis i sprinten',
      score: 8,
      categoryId: 'cat-maal',
      notes: 'Vanskelig å fullføre helhetlig UX når omfang endres.'
    },
    // Jonas
    {
      id: 'c-10',
      participantId: 'p-jonas',
      participantName: 'Jonas (QA & DevOps)',
      text: 'Mangler automatiserte regresjonstester på kjerneflyt',
      score: 8,
      categoryId: 'cat-tech',
      notes: 'Mye manuell clicking før hver release.'
    },
    {
      id: 'c-11',
      participantId: 'p-jonas',
      participantName: 'Jonas (QA & DevOps)',
      text: 'God åpenhet og ingen "blame culture"',
      score: 2,
      categoryId: 'cat-collab',
      notes: 'Trygt å melde om feil og bugs.'
    },
    {
      id: 'c-12',
      participantId: 'p-jonas',
      participantName: 'Jonas (QA & DevOps)',
      text: 'Stor arbeidsmengde mot sprintslutt',
      score: 7,
      categoryId: 'cat-kapasitet',
      notes: 'QA får alle oppgavene samtidig de siste to dagene.'
    }
  ];

  const spiderCategories = [
    {
      id: 'cat-prosess',
      name: 'Arbeidsflyt & Prosess',
      color: '#3B82F6',
      averageScore: 8.0,
      isHighFocus: true,
      claimIds: ['c-1'],
      description: 'Møtekultur og skjerming av fokus',
      keyTakeaway: 'Ad-hoc møter skaper avbrudd i fokusarbeidet.'
    },
    {
      id: 'cat-tech',
      name: 'Teknologi & Verktøy',
      color: '#8B5CF6',
      averageScore: 8.5,
      isHighFocus: true,
      claimIds: ['c-4', 'c-10'],
      description: 'CI/CD og testautomatisering',
      keyTakeaway: 'Treg byggelinje og manglende automatiserte tester er kritiske flaskehalser.'
    },
    {
      id: 'cat-collab',
      name: 'Samarbeid & Kommunikasjon',
      color: '#10B981',
      averageScore: 2.0,
      isHighFocus: false,
      claimIds: ['c-2', 'c-11'],
      description: 'Teamdynamikk og psykologisk trygghet',
      keyTakeaway: 'Svært god stemning, gjensidig tillit og hjelpsomhet.'
    },
    {
      id: 'cat-kapasitet',
      name: 'Kapasitet & Tidsfristar',
      color: '#EF4444',
      averageScore: 7.5,
      isHighFocus: true,
      claimIds: ['c-3', 'c-12'],
      description: 'Belastning mot sprintslutt',
      keyTakeaway: 'Ketchupeffekt på QA og stressende fredags-deployer.'
    },
    {
      id: 'cat-maal',
      name: 'Mål & Prioriteringer',
      color: '#F59E0B',
      averageScore: 7.5,
      isHighFocus: true,
      claimIds: ['c-5', 'c-9'],
      description: 'Klarhet i akseptansekriterier',
      keyTakeaway: 'Omkoding på grunn av skiftende omfang i sprinten.'
    },
    {
      id: 'cat-kvalitet',
      name: 'Kvalitet & Testing',
      color: '#EC4899',
      averageScore: 4.5,
      isHighFocus: false,
      claimIds: ['c-6', 'c-7'],
      description: 'Kodekvalitet og UI-justering',
      keyTakeaway: 'God PR-gjennomgang, men trenger bedre Figma-synkronisering.'
    },
    {
      id: 'cat-trivsel',
      name: 'Trivsel & Motivasjon',
      color: '#06B6D4',
      averageScore: 2.0,
      isHighFocus: false,
      claimIds: ['c-8'],
      description: 'Arbeidsglede og mestring',
      keyTakeaway: 'Høy motivasjon og stolthet over ny funksjonalitet.'
    }
  ];

  return {
    id,
    title: 'Sprint 42 Retrospektiv: Kjerneplattform',
    description: 'Fokus på prosessflyt, deploy-rutiner og samarbeid på tvers av frontend, backend og QA.',
    createdAt: new Date().toISOString(),
    categories: DEFAULT_CATEGORIES,
    participants,
    claims,
    spiderCategories,
    currentPhase: 'spider',
    presentingParticipantId: 'p-ingrid',
    isDemo: true,
    aiSynthesis: {
      summary: 'Teamet har en usedvanlig sterk kultur for samarbeid, hjelpsomhet og tillit (score 2.0), men lider under tekniske flaskehalser (treg CI/CD på 35 min) og uforutsette avbrudd underveis i sprinten som fører til ketchupeffekt mot slutten.',
      focusAreas: [
        'Optimalisere CI/CD-pipeline for å kutte byggetid under 10 minutter.',
        'Innføre faste "fokus-timer" uten møter for uforstyrret flyt.',
        'Stramme inn akseptansekriterier før sprintstart for å unngå omkoding.'
      ],
      recommendations: [
        'Sett av 1 dag til dedikert DevOps-arbeid på GitHub Actions cache og parallellisering.',
        'Avtal "møtefri formiddag" tirsdager og torsdager.',
        'Flytt deploy-vindu fra fredag ettermiddag til torsdag formiddag.'
      ],
      generatedAt: new Date().toISOString()
    }
  };
}
