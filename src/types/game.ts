export type SubjectId =
  | 'matematika'
  | 'ipas'
  | 'bahasa_indonesia'
  | 'bahasa_inggris'
  | 'pengetahuan_umum'
  | 'ppkn_budaya'
  | 'campuran';

export type GameMode = 'pilihan_ganda' | 'benar_salah' | 'campuran';

export type QuestionFormat = 'mc' | 'tf';

export type QuestionLevel = 1 | 2 | 3;

export interface Question {
  id: string;
  subject: Exclude<SubjectId, 'campuran'>;
  format: QuestionFormat;
  level: QuestionLevel;
  prompt: string;
  options: string[]; // 4 options for 'mc', ['Benar', 'Salah'] for 'tf'
  correctIndex: number;
}

export interface SubjectInfo {
  id: SubjectId;
  title: string;
  subtitle: string;
  accentColor: string;
  lightBg: string;
  borderColor: string;
  textColor: string;
  sampleTopics: string;
}

export interface Team {
  id: string;
  name: string;
  colorIndex: number;
  mascot: string;
  totalPoints: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  totalCorrect: number;
  totalAnswered: number;
  bestStreak: number;
  eliminated: boolean;
}

export type RoundStage = 'PENYISIHAN' | 'PEREMPAT_FINAL' | 'SEMIFINAL' | 'FINAL';

export interface TournamentMatch {
  id: string;
  matchNumber: number;
  stage: RoundStage;
  stageLabel: string;
  teamAId: string | null;
  teamBId: string | null;
  scoreA: number;
  scoreB: number;
  correctA: number;
  correctB: number;
  answeredA: number;
  answeredB: number;
  winnerId: string | null;
  isDraw: boolean;
  status: 'pending' | 'in_progress' | 'completed';
  nextMatchId?: string;
  nextSlot?: 'A' | 'B';
}

export interface TournamentConfig {
  subject: SubjectId;
  level: QuestionLevel | 'all';
  gameMode: GameMode;
  teamCount: number;
  durationSeconds: number;
}

export type AppScreen = 'TITLE' | 'LOBBY' | 'HUB' | 'ARENA' | 'CHAMPION';
