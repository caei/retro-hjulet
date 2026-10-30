export interface Category {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export interface Claim {
  id: string;
  participantId: string;
  participantName: string;
  text: string;
  score: number; // 1 to 10 (1 = minimal friction, 10 = maximum stress/blocker)
  categoryId: string;
  notes?: string;
}

export interface Participant {
  id: string;
  name: string;
  isDone: boolean;
  avatarColor: string;
  joinedAt: string;
}

export interface SpiderCategory {
  id: string;
  name: string;
  color: string;
  averageScore: number;
  isHighFocus: boolean;
  claimIds: string[];
  description?: string;
  keyTakeaway?: string;
}

export interface AISynthesis {
  summary: string;
  focusAreas: string[];
  recommendations: string[];
  generatedAt: string;
  fallback?: boolean;
}

export type RetroPhase =
  | 'input'        // Deltakere legger inn påstander i sitt stresshjul
  | 'status'       // Felles side med status (hvem er ferdig)
  | 'present'      // En-og-en presentasjon av stresshjul
  | 'spider';      // Felles edderkoppdiagram med KI-gruppering og fokusområder

export interface RetroBoard {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  categories: Category[];
  participants: Participant[];
  claims: Claim[];
  spiderCategories: SpiderCategory[];
  aiSynthesis?: AISynthesis;
  currentPhase: RetroPhase;
  presentingParticipantId?: string;
  isReadOnly?: boolean; // Skrivebeskyttet når importert fra JSON-arkiv
  isDemo?: boolean; // Demo-tavle for utprøving (skal ikke lagres i nylige tavler)
}

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'cat-prosess',
    name: 'Arbeidsflyt & Prosess',
    color: '#3B82F6', // Blue
    description: 'Sprintflyt, møter, estimering og smidige rutiner'
  },
  {
    id: 'cat-tech',
    name: 'Teknologi & Verktøy',
    color: '#8B5CF6', // Purple
    description: 'Kodebase, arkitektur, teknisk gjeld, CI/CD og dev-miljø'
  },
  {
    id: 'cat-collab',
    name: 'Samarbeid & Kommunikasjon',
    color: '#10B981', // Emerald
    description: 'Informasjonsdeling, tillit, tilbakemeldinger og teamdynamikk'
  },
  {
    id: 'cat-kapasitet',
    name: 'Kapasitet & Tidsfristar',
    color: '#EF4444', // Red
    description: 'Arbeidsmengde, overtidsstress, urealistiske tidsfrister og pauser'
  },
  {
    id: 'cat-maal',
    name: 'Mål & Prioriteringer',
    color: '#F59E0B', // Amber
    description: 'Tydelighet fra produkteier, endringer i scope og visjon'
  },
  {
    id: 'cat-kvalitet',
    name: 'Kvalitet & Testing',
    color: '#EC4899', // Pink
    description: 'Bugs, testdekning, manuell testing og produksjonsfeil'
  },
  {
    id: 'cat-trivsel',
    name: 'Trivsel & Motivasjon',
    color: '#06B6D4', // Cyan
    description: 'Mestring, psykologisk trygghet og arbeidsglede'
  }
];
