import { GameMode, Question, QuestionFormat, QuestionLevel, SubjectId, SubjectInfo } from '../types/game';
import { ENGLISH_QUESTIONS } from './englishQuestions';
import { GENERAL_QUESTIONS } from './generalQuestions';
import { INDONESIAN_QUESTIONS } from './indonesianQuestions';
import { IPAS_QUESTIONS } from './ipasQuestions';
import { MATH_QUESTIONS } from './mathQuestions';
import { PPKN_QUESTIONS } from './ppknQuestions';

export const ALL_QUESTIONS: Question[] = [
  ...MATH_QUESTIONS,
  ...IPAS_QUESTIONS,
  ...INDONESIAN_QUESTIONS,
  ...ENGLISH_QUESTIONS,
  ...GENERAL_QUESTIONS,
  ...PPKN_QUESTIONS,
];

export const SUBJECT_LIST: SubjectInfo[] = [
  {
    id: 'matematika',
    title: 'Matematika',
    subtitle: 'Berhitung cepat, bangun datar, pecahan & logika',
    accentColor: '#2563EB',
    lightBg: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    sampleTopics: 'Operasi Hitung · Pecahan · Geometri',
  },
  {
    id: 'ipas',
    title: 'IPAS',
    subtitle: 'Ilmu Pengetahuan Alam, ekosistem & sosial',
    accentColor: '#059669',
    lightBg: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-700',
    sampleTopics: 'Makhluk Hidup · Energi · Tata Surya',
  },
  {
    id: 'bahasa_indonesia',
    title: 'Bahasa Indonesia',
    subtitle: 'Kosakata baku, sinonim, antonim & peribahasa',
    accentColor: '#DC2626',
    lightBg: 'bg-rose-50',
    borderColor: 'border-rose-200',
    textColor: 'text-rose-700',
    sampleTopics: 'Sinonim & Antonim · EYD · Pantun',
  },
  {
    id: 'bahasa_inggris',
    title: 'Bahasa Inggris',
    subtitle: 'Vocabulary, ungkapan harian & grammar dasar',
    accentColor: '#7C3AED',
    lightBg: 'bg-violet-50',
    borderColor: 'border-violet-200',
    textColor: 'text-violet-700',
    sampleTopics: 'Vocabulary · Daily Phrases · Tenses',
  },
  {
    id: 'pengetahuan_umum',
    title: 'Pengetahuan Umum',
    subtitle: 'Nusantara, dunia, pahlawan & tokoh penemu',
    accentColor: '#D97706',
    lightBg: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
    sampleTopics: 'Sejarah · Geografi · Tokoh Dunia',
  },
  {
    id: 'ppkn_budaya',
    title: 'PPKn & Budaya',
    subtitle: 'Nilai Pancasila, norma & ragam adat Nusantara',
    accentColor: '#0D9488',
    lightBg: 'bg-teal-50',
    borderColor: 'border-teal-200',
    textColor: 'text-teal-700',
    sampleTopics: 'Pancasila · Hak & Kewajiban · Adat',
  },
  {
    id: 'campuran',
    title: 'Semua Mapel (Campuran)',
    subtitle: 'Kompetisi lintas 6 mata pelajaran sekaligus',
    accentColor: '#0F172A',
    lightBg: 'bg-slate-100',
    borderColor: 'border-slate-300',
    textColor: 'text-slate-900',
    sampleTopics: '6 Mapel Gabungan · Siap Final',
  },
];

export const LEVEL_OPTIONS: Array<{
  value: QuestionLevel | 'all';
  title: string;
  subtitle: string;
  badge: string;
}> = [
  {
    value: 1,
    title: 'Level 1',
    subtitle: 'Dasar & Pengenalan Cepat',
    badge: 'L1',
  },
  {
    value: 2,
    title: 'Level 2',
    subtitle: 'Menengah & Pemahaman',
    badge: 'L2',
  },
  {
    value: 3,
    title: 'Level 3',
    subtitle: 'Tantangan & Penalaran',
    badge: 'L3',
  },
  {
    value: 'all',
    title: 'Semua Level',
    subtitle: 'Acak Level 1, 2 & 3',
    badge: 'MIX',
  },
];

export const GAME_MODE_OPTIONS: Array<{
  id: GameMode;
  title: string;
  subtitle: string;
}> = [
  {
    id: 'pilihan_ganda',
    title: 'Estafet Pilihan Ganda',
    subtitle: '4 tombol jawaban cepat (A, B, C, D)',
  },
  {
    id: 'benar_salah',
    title: 'Kilat Benar / Salah',
    subtitle: '2 tombol raksasa adu refleks cepat',
  },
  {
    id: 'campuran',
    title: 'Tantangan Campuran',
    subtitle: 'Kombinasi Pilihan Ganda & Benar/Salah',
  },
];

export function getSubjectQuestionCount(
  subject: SubjectId,
  level: QuestionLevel | 'all',
  gameMode?: GameMode
): number {
  return ALL_QUESTIONS.filter((q) => {
    const matchSubject = subject === 'campuran' || q.subject === subject;
    const matchLevel = level === 'all' || q.level === level;
    const matchMode =
      !gameMode ||
      gameMode === 'campuran' ||
      (gameMode === 'pilihan_ganda' && q.format === 'mc') ||
      (gameMode === 'benar_salah' && q.format === 'tf');
    return matchSubject && matchLevel && matchMode;
  }).length;
}

function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function randomizeMultipleChoiceOptions(q: Question): Question {
  if (q.format !== 'mc') return q;
  const indexed = q.options.map((opt, idx) => ({
    opt,
    isCorrect: idx === q.correctIndex,
  }));
  const shuffled = shuffleArray(indexed);
  return {
    ...q,
    options: shuffled.map((item) => item.opt),
    correctIndex: shuffled.findIndex((item) => item.isCorrect),
  };
}

let dynamicCounter = 1;

function generateProceduralMathQuestion(level: QuestionLevel, desiredFormat: QuestionFormat): Question {
  const id = `mtk-dyn-${level}-${dynamicCounter++}-${Math.floor(Math.random() * 10000)}`;
  let a = 0;
  let b = 0;
  let answer = 0;
  let prompt = '';

  if (level === 1) {
    const op = Math.random() < 0.5 ? '+' : '-';
    if (op === '+') {
      a = Math.floor(Math.random() * 35) + 5;
      b = Math.floor(Math.random() * 30) + 4;
      answer = a + b;
    } else {
      a = Math.floor(Math.random() * 40) + 20;
      b = Math.floor(Math.random() * 18) + 2;
      answer = a - b;
    }
    if (desiredFormat === 'tf') {
      const isTrue = Math.random() < 0.5;
      const shown = isTrue ? answer : answer + (Math.random() < 0.5 ? 2 : -2 || 3);
      return {
        id,
        subject: 'matematika',
        format: 'tf',
        level,
        prompt: `Hasil dari ${a} ${op} ${b} sama dengan ${shown}.`,
        options: ['Benar', 'Salah'],
        correctIndex: isTrue ? 0 : 1,
      };
    }
    prompt = `Hasil dari ${a} ${op} ${b} adalah ...`;
  } else if (level === 2) {
    const ops = ['×', ':', '+'] as const;
    const op = ops[Math.floor(Math.random() * ops.length)];
    if (op === '×') {
      a = Math.floor(Math.random() * 8) + 4;
      b = Math.floor(Math.random() * 8) + 3;
      answer = a * b;
    } else if (op === ':') {
      b = Math.floor(Math.random() * 8) + 3;
      answer = Math.floor(Math.random() * 10) + 3;
      a = b * answer;
    } else {
      a = Math.floor(Math.random() * 90) + 40;
      b = Math.floor(Math.random() * 80) + 25;
      answer = a + b;
    }
    if (desiredFormat === 'tf') {
      const isTrue = Math.random() < 0.5;
      const offset = Math.random() < 0.5 ? 3 : -3;
      const shown = isTrue ? answer : Math.max(1, answer + offset);
      return {
        id,
        subject: 'matematika',
        format: 'tf',
        level,
        prompt: `Hasil dari ${a} ${op} ${b} sama dengan ${shown}.`,
        options: ['Benar', 'Salah'],
        correctIndex: isTrue ? 0 : 1,
      };
    }
    prompt = `Hasil dari ${a} ${op} ${b} adalah ...`;
  } else {
    const c = Math.floor(Math.random() * 7) + 3;
    a = Math.floor(Math.random() * 12) + 4;
    b = Math.floor(Math.random() * 9) + 2;
    answer = a + b * c;
    if (desiredFormat === 'tf') {
      const isTrue = Math.random() < 0.5;
      const shown = isTrue ? answer : answer + (Math.random() < 0.5 ? 4 : -4);
      return {
        id,
        subject: 'matematika',
        format: 'tf',
        level,
        prompt: `Hasil dari ${a} + ${b} × ${c} sama dengan ${shown}.`,
        options: ['Benar', 'Salah'],
        correctIndex: isTrue ? 0 : 1,
      };
    }
    prompt = `Hasil dari ${a} + ${b} × ${c} adalah ...`;
  }

  const distractors = new Set<number>();
  const offsets = [-10, -4, -2, -1, 1, 2, 4, 6, 10];
  while (distractors.size < 3) {
    const cand = Math.max(1, answer + offsets[Math.floor(Math.random() * offsets.length)]);
    if (cand !== answer) distractors.add(cand);
  }
  const rawOptions = [String(answer), ...Array.from(distractors).map(String)];
  return randomizeMultipleChoiceOptions({
    id,
    subject: 'matematika',
    format: 'mc',
    level,
    prompt,
    options: rawOptions,
    correctIndex: 0,
  });
}

/**
 * Draws a strictly unused question for a team so that:
 * 1) Left Team and Right Team NEVER see the same question in a match.
 * 2) Different groups across the entire tournament NEVER get repeated questions.
 */
export function drawUniqueQuestion(
  subject: SubjectId,
  level: QuestionLevel | 'all',
  gameMode: GameMode,
  usedQuestionIds: Set<string>,
  matchUsedIds: Set<string>,
  excludeQuestionId?: string
): Question {
  const matchesSubject = (q: Question) => subject === 'campuran' || q.subject === subject;
  const matchesLevel = (q: Question) => level === 'all' || q.level === level;
  const matchesMode = (q: Question) => {
    if (gameMode === 'pilihan_ganda') return q.format === 'mc';
    if (gameMode === 'benar_salah') return q.format === 'tf';
    return true;
  };

  // Tier 1: Exact subject + exact level + exact mode + never used in tournament
  let pool = ALL_QUESTIONS.filter(
    (q) =>
      matchesSubject(q) &&
      matchesLevel(q) &&
      matchesMode(q) &&
      !usedQuestionIds.has(q.id) &&
      !matchUsedIds.has(q.id)
  );

  // If Matematika curated pool is exhausted, generate fresh unique procedural Math questions at the exact requested level & mode!
  if (pool.length === 0 && subject === 'matematika') {
    const effectiveLevel: QuestionLevel =
      level === 'all' ? ([1, 2, 3] as const)[Math.floor(Math.random() * 3)] : level;
    const effectiveFormat: QuestionFormat =
      gameMode === 'benar_salah' ? 'tf' : gameMode === 'pilihan_ganda' ? 'mc' : Math.random() < 0.6 ? 'mc' : 'tf';
    const generated = generateProceduralMathQuestion(effectiveLevel, effectiveFormat);
    usedQuestionIds.add(generated.id);
    matchUsedIds.add(generated.id);
    return generated;
  }

  // Tier 2: Keep EXACT subject + EXACT level + EXACT mode, allowing questions from earlier matches
  // to reappear in random order for other groups while NEVER repeating within the same match!
  if (pool.length === 0) {
    pool = ALL_QUESTIONS.filter(
      (q) =>
        matchesSubject(q) &&
        matchesLevel(q) &&
        matchesMode(q) &&
        !matchUsedIds.has(q.id)
    );
  }

  // Tier 3: Even if a single marathon match exhausts every question in this exact level+mode,
  // recycle within the EXACT same subject, level, and mode (never leak to another level, mode, or subject!)
  if (pool.length === 0) {
    const exactPool = ALL_QUESTIONS.filter(
      (q) => matchesSubject(q) && matchesLevel(q) && matchesMode(q)
    );
    const nonImmediate = exactPool.filter((q) => q.id !== excludeQuestionId);
    pool = nonImmediate.length > 0 ? nonImmediate : exactPool;
  }

  // Safety net (should never be reached since every subject+level has both mc & tf)
  if (pool.length === 0) {
    pool = ALL_QUESTIONS.filter((q) => matchesSubject(q) && matchesMode(q));
  }

  const picked = pool[Math.floor(Math.random() * pool.length)];
  usedQuestionIds.add(picked.id);
  matchUsedIds.add(picked.id);

  return randomizeMultipleChoiceOptions(picked);
}
