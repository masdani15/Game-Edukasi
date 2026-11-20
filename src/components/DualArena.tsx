import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  Award,
  Check,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Trophy,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { drawUniqueQuestion, SUBJECT_LIST } from '../data/questionBank';
import {
  Question,
  Team,
  TournamentConfig,
  TournamentMatch,
} from '../types/game';
import { soundEngine } from '../utils/soundEngine';

interface DualArenaProps {
  match: TournamentMatch;
  teamA: Team;
  teamB: Team;
  config: TournamentConfig;
  usedQuestionIds: React.MutableRefObject<Set<string>>;
  isMuted: boolean;
  isFullscreen: boolean;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  onFinishMatch: (result: {
    scoreA: number;
    scoreB: number;
    correctA: number;
    correctB: number;
    answeredA: number;
    answeredB: number;
    bestStreakA: number;
    bestStreakB: number;
    winnerId: string;
  }) => void;
  onAbortMatch: () => void;
}

interface SideState {
  question: Question;
  score: number;
  correct: number;
  answered: number;
  streak: number;
  bestStreak: number;
  relayIndex: number;
  feedback: {
    type: 'correct' | 'wrong';
    pointsAdded: number;
    selectedIdx: number;
  } | null;
  scoreBumpKey: number;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

export const DualArena: React.FC<DualArenaProps> = ({
  match,
  teamA,
  teamB,
  config,
  usedQuestionIds,
  isMuted,
  isFullscreen,
  onToggleMute,
  onToggleFullscreen,
  onFinishMatch,
  onAbortMatch,
}) => {
  const matchUsedIdsRef = useRef<Set<string>>(new Set());

  const createInitialSide = useCallback((): SideState => {
    const firstQ = drawUniqueQuestion(
      config.subject,
      config.level,
      config.gameMode,
      usedQuestionIds.current,
      matchUsedIdsRef.current
    );
    return {
      question: firstQ,
      score: 0,
      correct: 0,
      answered: 0,
      streak: 0,
      bestStreak: 0,
      relayIndex: 1,
      feedback: null,
      scoreBumpKey: 0,
    };
  }, [config.gameMode, config.level, config.subject, usedQuestionIds]);

  const [left, setLeft] = useState<SideState>(() => createInitialSide());
  const [right, setRight] = useState<SideState>(() => createInitialSide());
  const [isSwapped, setIsSwapped] = useState<boolean>(false);

  const [phase, setPhase] = useState<
    'POSITION_BRIEF' | 'COUNTDOWN' | 'PLAYING' | 'PAUSED' | 'TIE_PROMPT' | 'FINISHED'
  >('POSITION_BRIEF');
  const [countdownNum, setCountdownNum] = useState<number>(3);
  const [timeLeft, setTimeLeft] = useState<number>(config.durationSeconds);
  const [isOvertime, setIsOvertime] = useState<boolean>(false);

  const leftTeam = isSwapped ? teamB : teamA;
  const rightTeam = isSwapped ? teamA : teamB;

  // Independent lock refs per side so touching Left never blocks Right!
  const leftLockedRef = useRef<boolean>(false);
  const rightLockedRef = useRef<boolean>(false);
  const leftTimeoutRef = useRef<number | null>(null);
  const rightTimeoutRef = useRef<number | null>(null);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (leftTimeoutRef.current) window.clearTimeout(leftTimeoutRef.current);
      if (rightTimeoutRef.current) window.clearTimeout(rightTimeoutRef.current);
    };
  }, []);

  // 3-2-1 Ready Countdown
  useEffect(() => {
    if (phase !== 'COUNTDOWN') return;

    soundEngine.playCountdownBeep(false);
    const timer = window.setInterval(() => {
      setCountdownNum((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          soundEngine.playCountdownBeep(true);
          setPhase('PLAYING');
          return 0;
        }
        soundEngine.playCountdownBeep(false);
        return prev - 1;
      });
    }, 850);

    return () => window.clearInterval(timer);
  }, [phase]);

  // Main Match Timer
  useEffect(() => {
    if (phase !== 'PLAYING') return;

    const interval = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          soundEngine.playTimeUp();
          return 0;
        }
        if (prev <= 11) {
          soundEngine.playLastSecondsTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [phase]);

  // Watch timer reaching 0
  useEffect(() => {
    if (phase === 'PLAYING' && timeLeft === 0) {
      leftLockedRef.current = true;
      rightLockedRef.current = true;
      if (left.score === right.score) {
        setPhase('TIE_PROMPT');
      } else {
        soundEngine.playVictoryFanfare();
        setPhase('FINISHED');
      }
    }
  }, [phase, timeLeft, left.score, right.score]);

  const handleAnswerSide = (side: 'left' | 'right', optionIdx: number) => {
    if (phase !== 'PLAYING' || timeLeft <= 0) return;

    const lockRef = side === 'left' ? leftLockedRef : rightLockedRef;
    const timeoutRef = side === 'left' ? leftTimeoutRef : rightTimeoutRef;
    const setSide = side === 'left' ? setLeft : setRight;

    if (lockRef.current) return;
    lockRef.current = true;

    setSide((prev) => {
      const isCorrect = optionIdx === prev.question.correctIndex;
      const newStreak = isCorrect ? prev.streak + 1 : 0;
      const bonus = isCorrect && newStreak >= 3 ? 5 : 0;
      const pointsAdded = isCorrect ? 10 + bonus : 0;

      // Play neutral relay tap sound so audio never leaks whether a question was right or wrong
      soundEngine.playRelayPass(side);

      return {
        ...prev,
        score: prev.score + pointsAdded,
        correct: prev.correct + (isCorrect ? 1 : 0),
        answered: prev.answered + 1,
        streak: newStreak,
        bestStreak: Math.max(prev.bestStreak, newStreak),
        feedback: {
          type: isCorrect ? 'correct' : 'wrong',
          pointsAdded,
          selectedIdx: optionIdx,
        },
        scoreBumpKey: isCorrect ? prev.scoreBumpKey + 1 : prev.scoreBumpKey,
      };
    });

    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      const nextQ = drawUniqueQuestion(
        config.subject,
        config.level,
        config.gameMode,
        usedQuestionIds.current,
        matchUsedIdsRef.current
      );
      setSide((prev) => ({
        ...prev,
        question: nextQ,
        relayIndex: prev.relayIndex + 1,
        feedback: null,
      }));
      lockRef.current = false;
    }, 280);
  };

  const handleStartOvertime = () => {
    soundEngine.playCountdownBeep(true);
    leftLockedRef.current = false;
    rightLockedRef.current = false;
    setIsOvertime(true);
    setTimeLeft(15);
    setPhase('PLAYING');
  };

  const handleCommitResult = () => {
    const teamAStats = isSwapped ? right : left;
    const teamBStats = isSwapped ? left : right;
    const winnerId = left.score >= right.score ? leftTeam.id : rightTeam.id;
    onFinishMatch({
      scoreA: teamAStats.score,
      scoreB: teamBStats.score,
      correctA: teamAStats.correct,
      correctB: teamBStats.correct,
      answeredA: teamAStats.answered,
      answeredB: teamBStats.answered,
      bestStreakA: teamAStats.bestStreak,
      bestStreakB: teamBStats.bestStreak,
      winnerId,
    });
  };

  const subjectInfo = SUBJECT_LIST.find((s) => s.id === config.subject);
  const levelLabel = config.level === 'all' ? 'Semua Level' : `Level ${config.level}`;
  const totalCombined = left.score + right.score;
  const leftSharePercent =
    totalCombined === 0 ? 50 : Math.max(12, Math.min(88, Math.round((left.score / totalCombined) * 100)));

  const scoreDiff = Math.abs(left.score - right.score);
  const leftRankLabel =
    left.score > right.score
      ? `#1 Memimpin (+${scoreDiff})`
      : left.score < right.score
      ? '#2 Mengejar'
      : 'Posisi Imbang';
  const rightRankLabel =
    right.score > left.score
      ? `#1 Memimpin (+${scoreDiff})`
      : right.score < left.score
      ? '#2 Mengejar'
      : 'Posisi Imbang';

  const formatClock = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const renderPanel = (
    side: 'left' | 'right',
    team: Team,
    state: SideState,
    accent: 'blue' | 'orange'
  ) => {
    const isBlue = accent === 'blue';
    const panelBg = isBlue
      ? 'bg-gradient-to-br from-[#EAF2FF] via-[#F4F8FF] to-[#DFECFF]'
      : 'bg-gradient-to-bl from-[#FFF1E6] via-[#FFF8F2] to-[#FFE7D6]';
    const headerAccent = isBlue ? 'bg-blue-600' : 'bg-orange-600';
    const optionBadgeBg = isBlue ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800';
    const optionHoverBorder = isBlue ? 'hover:border-blue-500 active:bg-blue-50' : 'hover:border-orange-500 active:bg-orange-50';
    const selectedFill = isBlue ? 'bg-blue-600 border-blue-700 text-white' : 'bg-orange-600 border-orange-700 text-white';
    const selectedLetter = isBlue ? 'bg-blue-800 text-white' : 'bg-orange-800 text-white';
    const cardActiveRing = isBlue ? 'border-blue-500 ring-4 ring-blue-200/70' : 'border-orange-500 ring-4 ring-orange-200/70';

    const subjectBadge = SUBJECT_LIST.find((s) => s.id === state.question.subject)?.title || '';

    return (
      <div className={`relative flex flex-col justify-between p-5 lg:p-8 ${panelBg} overflow-hidden ifp-touch-zone`}>
        {/* Team Relay Status Strip */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-10 h-10 rounded-xl ${headerAccent} text-white font-display font-extrabold text-base flex items-center justify-center shrink-0 font-mono-num`}>
              #{state.relayIndex}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-500 truncate">
                Giliran Siswa #{state.relayIndex} · {team.name}
              </div>
              <div className="text-xs font-bold text-slate-800">
                {state.feedback
                  ? 'Bagus! Mundur ke Belakang →'
                  : 'Sentuh jawaban lalu mundur ke belakang'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-xs font-semibold text-slate-600 font-mono-num">
              Terjawab {state.answered} soal
            </div>
          </div>
        </div>

        {/* Question Card - Never reveals answer key */}
        <div
          key={state.question.id}
          className={`flex-1 flex flex-col justify-between glass-panel rounded-[32px] border-2 p-6 lg:p-9 transition-transform animate-relay-slide ${
            state.feedback ? cardActiveRing : 'border-white/90'
          }`}
        >
          {/* Quiet unboxed metadata line */}
          <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-500 pb-3 border-b border-slate-100">
            <span>
              {subjectBadge} · Level {state.question.level}
            </span>
            <span className="font-mono-num">
              {state.question.format === 'tf' ? 'Benar / Salah' : 'Pilihan Ganda'}
            </span>
          </div>

          {/* Question Prompt */}
          <div className="my-auto py-4 flex items-center justify-center text-center">
            <h2 className="font-display text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 leading-snug text-balance">
              {state.question.prompt}
            </h2>
          </div>

          {/* Answer Buttons - Huge IFP Multi-Touch Targets without revealing keys */}
          {state.question.format === 'tf' ? (
            <div className="grid grid-cols-2 gap-4 pt-2">
              {state.question.options.map((opt, idx) => {
                const isSelected = state.feedback?.selectedIdx === idx;
                let btnStyle = `bg-slate-50 border-slate-300 text-slate-900 ${optionHoverBorder} active:scale-[0.97]`;

                if (state.feedback) {
                  btnStyle = isSelected
                    ? `${selectedFill} scale-[0.98]`
                    : 'bg-slate-100 border-slate-200 text-slate-400 opacity-55';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleAnswerSide(side, idx);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleAnswerSide(side, idx);
                      }
                    }}
                    className={`min-h-[112px] lg:min-h-[136px] rounded-2xl border-2 font-display font-extrabold text-2xl lg:text-3xl transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ifp-touch-zone ${btnStyle}`}
                  >
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4 pt-2">
              {state.question.options.map((opt, idx) => {
                const isSelected = state.feedback?.selectedIdx === idx;

                let btnStyle = `bg-slate-50 border-slate-200 text-slate-900 ${optionHoverBorder} active:scale-[0.97]`;
                let letterStyle = optionBadgeBg;

                if (state.feedback) {
                  if (isSelected) {
                    btnStyle = `${selectedFill} scale-[0.98]`;
                    letterStyle = selectedLetter;
                  } else {
                    btnStyle = 'bg-slate-100 border-slate-200 text-slate-400 opacity-55';
                    letterStyle = 'bg-slate-200 text-slate-400';
                  }
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleAnswerSide(side, idx);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleAnswerSide(side, idx);
                      }
                    }}
                    className={`min-h-[76px] lg:min-h-[92px] p-3.5 lg:p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-3.5 cursor-pointer ifp-touch-zone ${btnStyle}`}
                  >
                    <span
                      className={`w-10 h-10 lg:w-11 lg:h-11 rounded-xl font-display font-extrabold text-lg flex items-center justify-center shrink-0 ${letterStyle}`}
                    >
                      {OPTION_LETTERS[idx]}
                    </span>
                    <span className="font-bold text-base sm:text-lg lg:text-xl leading-snug">
                      {opt}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Neutral Confirmation Toast (never leaks answer key!) */}
        {state.feedback && (
          <div
            className={`pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl font-display font-extrabold text-lg lg:text-xl shadow-lg flex items-center gap-2.5 animate-pop-score ${headerAccent} text-white`}
          >
            <Check className="w-6 h-6 stroke-[3]" />
            <span>Jawaban Tercatat · Ganti Pemain!</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-slate-900 ifp-touch-zone">
      {/* Top Broadcast Scoreboard Bar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 px-4 lg:px-8 py-3 shrink-0">
        <div className="grid grid-cols-12 items-center gap-3">
          {/* Left Team Live Score */}
          <div className="col-span-4 flex items-center gap-3 lg:gap-4 min-w-0">
            <div
              key={left.scoreBumpKey}
              className="min-w-[82px] lg:min-w-[100px] py-2 px-3 rounded-2xl bg-blue-600 text-white text-center font-mono-num font-extrabold text-2xl lg:text-4xl animate-pop-score shrink-0"
            >
              {left.score}
            </div>
            <div className="min-w-0">
              <div className="font-display font-extrabold text-base lg:text-xl truncate text-white">
                {leftTeam.name}
              </div>
              <div className="text-xs text-blue-300 font-semibold font-mono-num">
                {leftRankLabel} · Terjawab {left.answered}
              </div>
            </div>
          </div>

          {/* Center Timer & Real-Time Tug-of-War Meter */}
          <div className="col-span-4 flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-xs font-semibold text-slate-400">
                {match.stageLabel} · {subjectInfo?.title} · {levelLabel}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div
                className={`px-5 py-1 rounded-xl font-mono-num font-extrabold text-2xl lg:text-4xl tracking-tight border ${
                  timeLeft <= 10 && phase === 'PLAYING'
                    ? 'bg-rose-600 border-rose-400 text-white animate-pulse'
                    : 'bg-slate-800 border-slate-700 text-white'
                }`}
              >
                {isOvertime ? `EXTRA ${formatClock(timeLeft)}` : formatClock(timeLeft)}
              </div>

              {/* Teacher Quick Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playTap();
                    setPhase((p) => (p === 'PLAYING' ? 'PAUSED' : p === 'PAUSED' ? 'PLAYING' : p));
                  }}
                  aria-label={phase === 'PAUSED' ? 'Lanjutkan' : 'Jeda'}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                >
                  {phase === 'PAUSED' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={onToggleFullscreen}
                  aria-label={isFullscreen ? 'Keluar layar penuh' : 'Layar penuh'}
                  title={isFullscreen ? 'Keluar layar penuh' : 'Layar penuh'}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={onToggleMute}
                  aria-label="Suara"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playTap();
                    onAbortMatch();
                  }}
                  aria-label="Kembali ke papan skor"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-rose-700 text-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Real-time Dual-Team Tug of War Meter */}
            <div className="w-full max-w-md h-2.5 bg-orange-600 rounded-full overflow-hidden flex border border-slate-700">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${leftSharePercent}%` }}
              />
            </div>
          </div>

          {/* Right Team Live Score */}
          <div className="col-span-4 flex items-center justify-end gap-3 lg:gap-4 min-w-0">
            <div className="min-w-0 text-right">
              <div className="font-display font-extrabold text-base lg:text-xl truncate text-white">
                {rightTeam.name}
              </div>
              <div className="text-xs text-orange-300 font-semibold font-mono-num">
                Terjawab {right.answered} · {rightRankLabel}
              </div>
            </div>
            <div
              key={right.scoreBumpKey}
              className="min-w-[82px] lg:min-w-[100px] py-2 px-3 rounded-2xl bg-orange-600 text-white text-center font-mono-num font-extrabold text-2xl lg:text-4xl animate-pop-score shrink-0"
            >
              {right.score}
            </div>
          </div>
        </div>
      </header>

      {/* Dual Split-Screen Independent Arena */}
      <main className="flex-1 grid grid-cols-2 relative min-h-0">
        {renderPanel('left', leftTeam, left, 'blue')}

        {/* Crisp Central Physical Divider */}
        <div className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 bg-slate-300 z-10 flex items-center justify-center">
          <div className="w-11 h-11 rounded-full bg-slate-900 text-white font-display font-extrabold text-xs flex items-center justify-center border-2 border-white shadow-md">
            VS
          </div>
        </div>

        {renderPanel('right', rightTeam, right, 'orange')}
      </main>

      {/* Pre-Match Left/Right Position Briefing Overlay */}
      {phase === 'POSITION_BRIEF' && (
        <div className="fixed inset-0 z-40 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
          <div className="glass-panel rounded-[32px] p-6 sm:p-8 lg:p-10 max-w-4xl w-full space-y-6 sm:space-y-7 shadow-2xl animate-relay-slide">
            <div className="text-center space-y-2">
              <div className="text-xs sm:text-sm font-bold text-blue-700 tracking-wide">
                {match.stageLabel} · {subjectInfo?.title} · {levelLabel}
              </div>
              <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900">
                Pemberitahuan Posisi Barisan Kelompok
              </h2>
              <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
                Pastikan siswa berbaris di sisi layar yang sesuai sebelum hitung mundur dimulai agar posisi tidak tertukar.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Left Side Card */}
              <div className="rounded-3xl border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50/90 p-6 sm:p-7 flex flex-col justify-between gap-4 text-left shadow-sm">
                <div className="flex items-center gap-2.5 text-blue-700 font-display font-extrabold text-sm sm:text-base">
                  <span className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <ArrowLeft className="w-5 h-5" />
                  </span>
                  <span>SISI KIRI LAYAR TV</span>
                </div>
                <div>
                  <div className="font-display text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                    {leftTeam.name}
                  </div>
                  <p className="text-sm font-semibold text-blue-800 mt-1.5">
                    Berbaris rapi di sebelah KIRI layar dan sentuh kotak biru saat bermain.
                  </p>
                </div>
              </div>

              {/* Right Side Card */}
              <div className="rounded-3xl border-2 border-orange-500 bg-gradient-to-bl from-orange-50 to-amber-50/90 p-6 sm:p-7 flex flex-col justify-between gap-4 text-left sm:text-right shadow-sm">
                <div className="flex items-center sm:justify-end gap-2.5 text-orange-700 font-display font-extrabold text-sm sm:text-base">
                  <span className="sm:order-1">SISI KANAN LAYAR TV</span>
                  <span className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center shrink-0 sm:order-2">
                    <ArrowRight className="w-5 h-5" />
                  </span>
                </div>
                <div>
                  <div className="font-display text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                    {rightTeam.name}
                  </div>
                  <p className="text-sm font-semibold text-orange-800 mt-1.5">
                    Berbaris rapi di sebelah KANAN layar dan sentuh kotak oranye saat bermain.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playTap();
                    onAbortMatch();
                  }}
                  className="px-4 py-3.5 rounded-2xl bg-white/80 hover:bg-white border border-slate-200 text-slate-700 font-bold text-sm cursor-pointer transition-colors"
                >
                  Kembali
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playTap();
                    setIsSwapped((prev) => !prev);
                  }}
                  className="flex-1 sm:flex-none px-5 py-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <ArrowLeftRight className="w-4 h-4 text-blue-600" />
                  Tukar Posisi Kiri ↔ Kanan
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCountdownNum(3);
                  setPhase('COUNTDOWN');
                }}
                className="px-7 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-display font-extrabold text-base sm:text-lg flex items-center justify-center gap-2.5 cursor-pointer shadow-lg transition-all"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Posisi Siap · Mulai Hitung Mundur</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Countdown 3-2-1 Overlay */}
      {phase === 'COUNTDOWN' && (
        <div className="fixed inset-0 z-40 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-6">
          <div className="glass-panel rounded-[32px] p-8 lg:p-12 max-w-3xl w-full text-center space-y-6 shadow-2xl">
            <div className="text-sm font-bold text-blue-700 tracking-wide">
              {match.stageLabel} · {subjectInfo?.title} · {levelLabel}
            </div>
            <div className="grid grid-cols-11 items-center gap-2">
              <div className="col-span-5 p-3 rounded-2xl bg-blue-50 border border-blue-200">
                <div className="text-xs font-extrabold text-blue-600">← SISI KIRI</div>
                <div className="text-lg lg:text-2xl font-display font-extrabold text-blue-800 truncate">
                  {leftTeam.name}
                </div>
              </div>
              <div className="col-span-1 text-sm font-extrabold text-slate-400">VS</div>
              <div className="col-span-5 p-3 rounded-2xl bg-orange-50 border border-orange-200">
                <div className="text-xs font-extrabold text-orange-600">SISI KANAN →</div>
                <div className="text-lg lg:text-2xl font-display font-extrabold text-orange-700 truncate">
                  {rightTeam.name}
                </div>
              </div>
            </div>

            <div className="py-4">
              <div className="font-mono-num text-7xl lg:text-8xl font-black text-slate-900">
                {countdownNum}
              </div>
              <p className="text-slate-700 font-semibold mt-3">
                Baris yang rapi sesuai sisi masing-masing! Pemain paling depan bersiap!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pause Overlay */}
      {phase === 'PAUSED' && (
        <div className="fixed inset-0 z-40 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-6">
          <div className="glass-panel rounded-[32px] p-8 max-w-md w-full text-center space-y-6 shadow-2xl">
            <h2 className="font-display text-3xl font-extrabold text-slate-900">
              Pertandingan Dijeda
            </h2>
            <p className="text-sm text-slate-600">
              Waktu berhenti sementara di <span className="font-mono-num font-bold">{formatClock(timeLeft)}</span>.
            </p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playTap();
                  setPhase('PLAYING');
                }}
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg cursor-pointer flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5 fill-current" />
                Lanjutkan Pertandingan
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playTap();
                  onAbortMatch();
                }}
                className="w-full py-3 rounded-2xl bg-white/80 border border-slate-200 hover:bg-white text-slate-700 font-bold cursor-pointer"
              >
                Kembali ke Papan Skor Turnamen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tie-Breaker Prompt Overlay */}
      {phase === 'TIE_PROMPT' && (
        <div className="fixed inset-0 z-40 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-6">
          <div className="glass-panel rounded-[32px] p-8 lg:p-10 max-w-xl w-full text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <RotateCcw className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="font-display text-3xl font-extrabold text-slate-900">
                Skor Imbang {left.score} – {right.score}!
              </h2>
              <p className="text-slate-700 text-base">
                Karena pemenang akan maju ke babak berikutnya, mari lakukan babak tambahan kilat 15 detik untuk menentukan pemenang!
              </p>
            </div>
            <button
              type="button"
              onClick={handleStartOvertime}
              className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-display font-extrabold text-xl cursor-pointer shadow-md"
            >
              Mulai Babak Penentuan 15 Detik!
            </button>
          </div>
        </div>
      )}

      {/* Match Finished Summary Modal */}
      {phase === 'FINISHED' && (
        <div className="fixed inset-0 z-40 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-6">
          <div className="glass-panel rounded-[32px] p-8 lg:p-10 max-w-3xl w-full space-y-7 shadow-2xl animate-relay-slide">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 mb-2">
                <Trophy className="w-9 h-9" />
              </div>
              <div className="text-sm font-bold text-slate-500">{match.stageLabel} Selesai</div>
              <h2 className="font-display text-3xl lg:text-4xl font-extrabold text-slate-900">
                Pemenang: {left.score > right.score ? leftTeam.name : rightTeam.name}!
              </h2>
              <p className="text-sm text-slate-600">
                {match.stage === 'FINAL'
                  ? 'Luar biasa! Juara Turnamen telah ditentukan!'
                  : 'Kelompok pemenang berhak melaju dan bertanding ulang di babak berikutnya!'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Left Team Result */}
              <div
                className={`p-5 rounded-2xl border-2 space-y-3 ${
                  left.score > right.score
                    ? 'border-blue-600 bg-blue-50/70'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-display font-bold text-lg text-slate-900 truncate">
                    {leftTeam.name}
                  </div>
                  {left.score > right.score && (
                    <Award className="w-6 h-6 text-blue-600 shrink-0" />
                  )}
                </div>
                <div className="font-mono-num text-4xl font-black text-blue-700">{left.score}</div>
                <div className="text-xs font-semibold text-slate-600 space-y-1">
                  <div>Benar: {left.correct} dari {left.answered} soal</div>
                  <div>Rekor Beruntun: {left.bestStreak}x · Pemain Estafet: {left.relayIndex}</div>
                </div>
              </div>

              {/* Right Team Result */}
              <div
                className={`p-5 rounded-2xl border-2 space-y-3 ${
                  right.score > left.score
                    ? 'border-orange-600 bg-orange-50/70'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-display font-bold text-lg text-slate-900 truncate">
                    {rightTeam.name}
                  </div>
                  {right.score > left.score && (
                    <Award className="w-6 h-6 text-orange-600 shrink-0" />
                  )}
                </div>
                <div className="font-mono-num text-4xl font-black text-orange-700">{right.score}</div>
                <div className="text-xs font-semibold text-slate-600 space-y-1">
                  <div>Benar: {right.correct} dari {right.answered} soal</div>
                  <div>Rekor Beruntun: {right.bestStreak}x · Pemain Estafet: {right.relayIndex}</div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                soundEngine.playTap();
                handleCommitResult();
              }}
              className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-display font-extrabold text-lg flex items-center justify-center gap-3 cursor-pointer shadow-md"
            >
              <span>
                {match.stage === 'FINAL'
                  ? 'Lihat Podium Juara Turnamen'
                  : 'Perbarui Papan Skor & Lanjut Babak Berikutnya'}
              </span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
