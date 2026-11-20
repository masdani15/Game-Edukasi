import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calculator,
  CheckCircle2,
  Clock,
  FlaskConical,
  Globe,
  Languages,
  Layers,
  Play,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import {
  GAME_MODE_OPTIONS,
  getSubjectQuestionCount,
  LEVEL_OPTIONS,
  SUBJECT_LIST,
} from '../data/questionBank';
import { GameMode, QuestionLevel, SubjectId, TournamentConfig } from '../types/game';
import { DEFAULT_TEAM_PRESETS, TEAM_COLORS } from '../utils/tournament';
import { soundEngine } from '../utils/soundEngine';

interface LobbyScreenProps {
  initialConfig: TournamentConfig;
  initialTeamNames: string[];
  onClose: () => void;
  onStartTournament: (config: TournamentConfig, teamNames: string[]) => void;
}

const SUBJECT_ICONS: Record<SubjectId, React.ReactNode> = {
  matematika: <Calculator className="w-6 h-6" />,
  ipas: <FlaskConical className="w-6 h-6" />,
  bahasa_indonesia: <BookOpen className="w-6 h-6" />,
  bahasa_inggris: <Languages className="w-6 h-6" />,
  pengetahuan_umum: <Globe className="w-6 h-6" />,
  ppkn_budaya: <ShieldCheck className="w-6 h-6" />,
  campuran: <Layers className="w-6 h-6" />,
};

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  initialConfig,
  initialTeamNames,
  onClose,
  onStartTournament,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [subject, setSubject] = useState<SubjectId>(initialConfig.subject);
  const [level, setLevel] = useState<QuestionLevel | 'all'>(initialConfig.level);
  const [gameMode, setGameMode] = useState<GameMode>(initialConfig.gameMode);
  const [teamCount, setTeamCount] = useState<number>(initialConfig.teamCount);
  const [durationSeconds, setDurationSeconds] = useState<number>(initialConfig.durationSeconds);
  const [teamNames, setTeamNames] = useState<string[]>(() =>
    Array.from({ length: 8 }, (_, i) => initialTeamNames[i] || DEFAULT_TEAM_PRESETS[i].name)
  );

  const selectedSubjectInfo = SUBJECT_LIST.find((s) => s.id === subject)!;
  const availableQuestions = getSubjectQuestionCount(subject, level);

  const handleSelectSubject = (id: SubjectId) => {
    soundEngine.playTap();
    setSubject(id);
  };

  const handleSelectLevel = (lvl: QuestionLevel | 'all') => {
    soundEngine.playTap();
    setLevel(lvl);
  };

  const handleSelectMode = (mode: GameMode) => {
    soundEngine.playTap();
    setGameMode(mode);
  };

  const handleSelectTeamCount = (count: number) => {
    soundEngine.playTap();
    setTeamCount(count);
  };

  const handleSelectDuration = (sec: number) => {
    soundEngine.playTap();
    setDurationSeconds(sec);
  };

  const handleTeamNameChange = (idx: number, val: string) => {
    setTeamNames((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };

  const handleStart = () => {
    soundEngine.playCountdownBeep(true);
    onStartTournament(
      {
        subject,
        level,
        gameMode,
        teamCount,
        durationSeconds,
      },
      teamNames.slice(0, teamCount)
    );
  };

  const getBracketSummary = (count: number) => {
    if (count === 2) return 'Langsung Babak Final (1 Pertandingan)';
    if (count === 3) return 'Semifinal + Babak Final (2 Pertandingan)';
    if (count === 4) return '2 Semifinal → Pemenang tanding ulang di Babak Final';
    if (count === 5) return 'Penyisihan → 2 Semifinal → Babak Final';
    if (count === 6) return '3 Penyisihan → 2 Semifinal → Babak Final';
    if (count === 7) return '3 Perempat Final → 2 Semifinal → Babak Final';
    return '4 Perempat Final → 2 Semifinal → Babak Final';
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 lg:p-10 overflow-y-auto">
      <div className="glass-panel w-full max-w-6xl rounded-[32px] p-6 sm:p-8 lg:p-10 space-y-8 animate-relay-slide my-auto">
        {/* Pop-up Header + Step Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200/80">
          <div>
            <div className="text-xs font-bold text-blue-700 tracking-wide">
              Pengaturan Kompetisi · {selectedSubjectInfo.title} · {level === 'all' ? 'Semua Level' : `Level ${level}`}
            </div>
            <h2 className="font-display text-2xl lg:text-3xl font-extrabold text-slate-900 mt-0.5">
              {step === 1 && 'Pilih Mata Pelajaran'}
              {step === 2 && 'Pilih Level & Mode Permainan'}
              {step === 3 && 'Atur Kelompok & Waktu Sesi'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Interactive Step Tabs */}
            <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-200/70 backdrop-blur-sm">
              {[
                { num: 1 as const, label: '1. Mapel' },
                { num: 2 as const, label: '2. Level & Mode' },
                { num: 3 as const, label: '3. Kelompok' },
              ].map((t) => (
                <button
                  key={t.num}
                  type="button"
                  onClick={() => {
                    soundEngine.playTap();
                    setStep(t.num);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                    step === t.num
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                soundEngine.playTap();
                onClose();
              }}
              aria-label="Tutup pengaturan"
              className="p-3 rounded-2xl bg-white/80 hover:bg-white border border-slate-200 text-slate-700 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* STEP 1: PILIH MAPEL */}
        {step === 1 && (
          <div className="space-y-6 animate-relay-slide">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {SUBJECT_LIST.map((item) => {
                const active = subject === item.id;
                const countForAllLevels = getSubjectQuestionCount(item.id, 'all');
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      handleSelectSubject(item.id);
                    }}
                    className={`text-left p-5 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-4 min-h-[164px] ${
                      active
                        ? 'bg-white border-blue-600 shadow-lg ring-4 ring-blue-100/80'
                        : 'bg-white/75 border-white hover:bg-white hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${item.lightBg} ${item.textColor}`}
                      >
                        {SUBJECT_ICONS[item.id]}
                      </div>
                      {active && <CheckCircle2 className="w-6 h-6 text-blue-600 shrink-0" />}
                    </div>

                    <div className="space-y-1">
                      <div className="font-display text-lg font-extrabold text-slate-900">
                        {item.title}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{item.subtitle}</p>
                    </div>

                    <div className="text-xs font-semibold text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="truncate pr-2">{item.sampleTopics}</span>
                      <span className="font-mono-num text-slate-800 shrink-0">{countForAllLevels}+ soal</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: PILIH LEVEL & MODE */}
        {step === 2 && (
          <div className="space-y-7 animate-relay-slide">
            {/* Level Selection (Tanpa keterangan kelas) */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-display text-lg font-bold text-slate-900">
                  Pilih Level Soal ({selectedSubjectInfo.title})
                </div>
                <div className="text-xs font-semibold text-blue-700 font-mono-num">
                  {availableQuestions}+ soal unik tersedia
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {LEVEL_OPTIONS.map((opt) => {
                  const active = level === opt.value;
                  const qCount = getSubjectQuestionCount(subject, opt.value);
                  return (
                    <button
                      key={String(opt.value)}
                      type="button"
                      onClick={() => handleSelectLevel(opt.value)}
                      className={`p-5 rounded-3xl border-2 text-left transition-all cursor-pointer flex items-center gap-4 ${
                        active
                          ? 'border-blue-600 bg-white shadow-md ring-4 ring-blue-100/80'
                          : 'border-white bg-white/75 hover:bg-white hover:border-slate-200'
                      }`}
                    >
                      <div
                        className={`w-14 h-14 rounded-2xl font-display font-extrabold text-xl flex items-center justify-center shrink-0 ${
                          active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {opt.badge}
                      </div>
                      <div className="min-w-0">
                        <div className="font-display text-lg font-bold text-slate-900">{opt.title}</div>
                        <div className="text-xs text-slate-600">{opt.subtitle}</div>
                        <div className="text-xs font-semibold text-blue-700 mt-1 font-mono-num">
                          {qCount} soal kurasi
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Game Mode + Session Duration */}
            <div className="grid lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-center gap-2 font-display text-lg font-bold text-slate-900">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <span>Pilih Mode Permainan</span>
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  {GAME_MODE_OPTIONS.map((m) => {
                    const active = gameMode === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleSelectMode(m.id)}
                        className={`text-left p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                          active
                            ? 'border-blue-600 bg-white shadow-sm ring-2 ring-blue-100'
                            : 'border-white bg-white/75 hover:bg-white hover:border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-bold text-sm text-slate-900">{m.title}</div>
                          {active && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />}
                        </div>
                        <div className="text-xs text-slate-600 leading-relaxed">{m.subtitle}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="lg:col-span-5 space-y-3">
                <div className="flex items-center gap-2 font-display text-lg font-bold text-slate-900">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span>Durasi Per Sesi</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[60, 90, 120].map((sec) => {
                    const active = durationSeconds === sec;
                    return (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => handleSelectDuration(sec)}
                        className={`py-5 px-3 rounded-2xl border-2 font-display font-extrabold text-base transition-all cursor-pointer font-mono-num ${
                          active
                            ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                            : 'border-white bg-white/75 text-slate-800 hover:bg-white'
                        }`}
                      >
                        {sec === 60 ? '1 Menit' : sec === 90 ? '1,5 Menit' : '2 Menit'}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: ATUR KELOMPOK */}
        {step === 3 && (
          <div className="space-y-6 animate-relay-slide">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="font-display text-lg font-bold text-slate-900">
                  Jumlah Kelompok Bermain
                </span>
              </div>
              <span className="text-xs sm:text-sm font-semibold text-blue-700">
                {getBracketSummary(teamCount)}
              </span>
            </div>

            <div className="grid grid-cols-7 gap-2.5">
              {[2, 3, 4, 5, 6, 7, 8].map((cnt) => {
                const active = teamCount === cnt;
                return (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => handleSelectTeamCount(cnt)}
                    className={`py-4 rounded-2xl border-2 font-display font-extrabold text-xl transition-all cursor-pointer font-mono-num ${
                      active
                        ? 'border-blue-600 bg-blue-600 text-white shadow-md'
                        : 'border-white bg-white/75 text-slate-800 hover:bg-white'
                    }`}
                  >
                    {cnt}
                  </button>
                );
              })}
            </div>

            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-600">
                Nama Kelompok Peserta (ketuk untuk mengubah nama):
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {Array.from({ length: teamCount }, (_, idx) => {
                  const color = TEAM_COLORS[idx % TEAM_COLORS.length];
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 rounded-2xl border border-white bg-white/85 focus-within:border-blue-500 focus-within:bg-white transition-colors shadow-sm"
                    >
                      <div
                        className={`w-9 h-9 rounded-xl ${color.bg} text-white font-display font-bold text-sm flex items-center justify-center shrink-0 font-mono-num`}
                      >
                        {idx + 1}
                      </div>
                      <input
                        type="text"
                        value={teamNames[idx]}
                        onChange={(e) => handleTeamNameChange(idx, e.target.value)}
                        maxLength={24}
                        placeholder={DEFAULT_TEAM_PRESETS[idx].name}
                        className="w-full bg-transparent text-sm font-bold text-slate-900 focus:outline-none"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Pop-up Footer Navigation */}
        <div className="pt-5 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-slate-600">
            Soal diacak otomatis &amp; berbeda di setiap kelompok · Kunci jawaban disembunyikan saat bermain
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {step > 1 && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playTap();
                  setStep((s) => (s === 3 ? 2 : 1));
                }}
                className="px-5 py-3.5 rounded-2xl bg-white/80 hover:bg-white border border-slate-200 text-slate-800 font-bold text-sm flex items-center gap-2 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playTap();
                  setStep((s) => (s === 1 ? 2 : 3));
                }}
                className="px-7 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-display font-bold text-base flex items-center gap-2 cursor-pointer shadow-md transition-all"
              >
                <span>Lanjut Pengaturan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStart}
                className="px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-display font-extrabold text-lg flex items-center gap-3 cursor-pointer shadow-lg transition-all"
              >
                <Play className="w-5 h-5 fill-current" />
                Acak Kelompok &amp; Mulai
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
