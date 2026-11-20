import React, { useEffect, useState } from 'react';
import {
  Award,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Play,
  Settings2,
  ShieldCheck,
  Shuffle,
  Trophy,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { SUBJECT_LIST } from '../data/questionBank';
import { Team, TournamentConfig, TournamentMatch } from '../types/game';
import { sortTeamsLeaderboard, TEAM_COLORS } from '../utils/tournament';
import { soundEngine } from '../utils/soundEngine';

interface TournamentHubProps {
  config: TournamentConfig;
  teams: Team[];
  matches: TournamentMatch[];
  usedQuestionCount: number;
  drawTriggerKey: number;
  isMuted: boolean;
  isFullscreen: boolean;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  onReshuffleBracket: () => void;
  onStartMatch: (matchId: string) => void;
  onBackToLobby: () => void;
  onViewChampion: () => void;
}

export const TournamentHub: React.FC<TournamentHubProps> = ({
  config,
  teams,
  matches,
  usedQuestionCount,
  drawTriggerKey,
  isMuted,
  isFullscreen,
  onToggleMute,
  onToggleFullscreen,
  onReshuffleBracket,
  onStartMatch,
  onBackToLobby,
  onViewChampion,
}) => {
  const [isDrawing, setIsDrawing] = useState<boolean>(drawTriggerKey > 0);
  const [roulettePairs, setRoulettePairs] = useState<Array<{ a: string; b: string }>>([]);

  useEffect(() => {
    if (drawTriggerKey <= 0) return;

    setIsDrawing(true);
    let ticks = 0;
    const maxTicks = 16;

    const makeRandomPreview = () => {
      const shuffled = [...teams].sort(() => Math.random() - 0.5);
      const pairs: Array<{ a: string; b: string }> = [];
      for (let i = 0; i < shuffled.length; i += 2) {
        if (shuffled[i + 1]) {
          pairs.push({ a: shuffled[i].name, b: shuffled[i + 1].name });
        } else {
          pairs.push({ a: shuffled[i].name, b: 'Menunggu Lawan (Bye)' });
        }
      }
      return pairs;
    };

    setRoulettePairs(makeRandomPreview());
    soundEngine.playTap();

    const interval = window.setInterval(() => {
      ticks++;
      if (ticks >= maxTicks) {
        window.clearInterval(interval);
        setIsDrawing(false);
        soundEngine.playCountdownBeep(true);
      } else {
        setRoulettePairs(makeRandomPreview());
        soundEngine.playTap();
      }
    }, 95);

    return () => window.clearInterval(interval);
  }, [drawTriggerKey, teams]);

  const leaderboard = sortTeamsLeaderboard(teams);
  const subjectInfo = SUBJECT_LIST.find((s) => s.id === config.subject);
  const levelText = config.level === 'all' ? 'Semua Level' : `Level ${config.level}`;

  const nextReadyMatch = matches.find(
    (m) => m.status === 'pending' && m.teamAId !== null && m.teamBId !== null
  );
  const finalMatch = matches.find((m) => m.stage === 'FINAL');
  const isTournamentDone = finalMatch?.status === 'completed';
  const hasAnyCompletedMatch = matches.some((m) => m.status === 'completed');

  const getTeamById = (id: string | null) => teams.find((t) => t.id === id) || null;

  const stages = Array.from(new Set(matches.map((m) => m.stage)));
  const stageTitles: Record<string, string> = {
    PENYISIHAN: 'Babak Penyisihan',
    PEREMPAT_FINAL: 'Perempat Final',
    SEMIFINAL: 'Babak Semifinal (Pemenang Bertanding Ulang)',
    FINAL: 'Babak Final Perebutan Juara',
  };

  return (
    <div className="min-h-screen arena-canvas text-slate-900 flex flex-col">
      {/* Frosted Glass 3-Zone Top Bar */}
      <header className="glass-panel border-b border-white/80 px-6 lg:px-10 py-4 flex items-center justify-between gap-8 sticky top-0 z-30 rounded-none">
        <div className="font-display text-xl lg:text-2xl font-extrabold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
          Arena Estafet Cerdas
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
          <a href="#klasemen" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
            Papan Skor
          </a>
          <a href="#bagan" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
            Bagan Final
          </a>
          {!hasAnyCompletedMatch && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playTap();
                onReshuffleBracket();
              }}
              className="hover:text-blue-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5"
            >
              <Shuffle className="w-4 h-4" />
              Acak Ulang
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              soundEngine.playTap();
              onBackToLobby();
            }}
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <Settings2 className="w-4 h-4" />
            Pengaturan
          </button>
        </nav>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onToggleFullscreen}
            aria-label={isFullscreen ? 'Keluar layar penuh' : 'Layar penuh'}
            title={isFullscreen ? 'Keluar layar penuh' : 'Layar penuh'}
            className="p-2.5 sm:px-3.5 rounded-xl bg-white/80 hover:bg-white border border-slate-200 text-slate-700 font-semibold text-sm flex items-center gap-2 transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            <span className="hidden lg:inline">
              {isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
            </span>
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            aria-label="Suara"
            className="p-2.5 rounded-xl bg-white/80 hover:bg-white border border-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>

          {isTournamentDone ? (
            <button
              type="button"
              onClick={() => {
                soundEngine.playTap();
                onViewChampion();
              }}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm lg:text-base transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Trophy className="w-4 h-4" />
              Lihat Podium Juara
            </button>
          ) : nextReadyMatch ? (
            <button
              type="button"
              onClick={() => {
                soundEngine.playTap();
                onStartMatch(nextReadyMatch.id);
              }}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm lg:text-base transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer shadow-sm"
            >
              <Play className="w-4 h-4 fill-current" />
              Mulai {nextReadyMatch.stageLabel}
            </button>
          ) : null}
        </div>
      </header>

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 lg:px-10 py-10 space-y-10">
        {/* Dark Frosted Glass Match Callout */}
        <section className="glass-dark text-white rounded-[32px] p-7 lg:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="text-xs sm:text-sm font-semibold text-blue-300">
              {subjectInfo?.title} · {levelText} · {config.durationSeconds} Detik/Sesi · {usedQuestionCount} Soal Unik Terpakai
            </div>
            {isTournamentDone ? (
              <h1 className="font-display text-3xl lg:text-4xl font-extrabold">
                Turnamen Selesai! Pemenang Telah Ditetapkan
              </h1>
            ) : nextReadyMatch ? (
              <>
                <h1 className="font-display text-3xl lg:text-4xl font-extrabold">
                  Berikutnya: {nextReadyMatch.stageLabel}
                </h1>
                <p className="text-slate-300 text-base lg:text-lg">
                  <span className="font-bold text-blue-300">
                    {getTeamById(nextReadyMatch.teamAId)?.name} (Sisi Kiri)
                  </span>{' '}
                  melawan{' '}
                  <span className="font-bold text-orange-300">
                    {getTeamById(nextReadyMatch.teamBId)?.name} (Sisi Kanan)
                  </span>
                  . Siapkan barisan estafet sesuai sisi layar!
                </p>
              </>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {!hasAnyCompletedMatch && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playTap();
                  onReshuffleBracket();
                }}
                className="px-5 py-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-display font-bold text-base flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Shuffle className="w-5 h-5" />
                Acak Kelompok
              </button>
            )}

            {!isTournamentDone && nextReadyMatch && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playTap();
                  onStartMatch(nextReadyMatch.id);
                }}
                className="px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-display font-extrabold text-xl flex items-center justify-center gap-3 cursor-pointer shadow-lg transition-all"
              >
                <Play className="w-6 h-6 fill-current" />
                Mulai Pertandingan
              </button>
            )}
          </div>
        </section>

        {/* Spacious 2-Column Glass Hub */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Papan Skor Otomatis */}
          <section id="klasemen" className="lg:col-span-5 glass-panel rounded-[32px] p-7 space-y-6">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-2xl font-bold text-slate-900">
                  Papan Skor Otomatis
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Posisi tim diperbarui otomatis setelah setiap pertandingan.
                </p>
              </div>
              <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 text-xs font-bold text-slate-500">
                    <th className="py-3 pr-2">#</th>
                    <th className="py-3 px-2">Kelompok</th>
                    <th className="py-3 px-2 text-right">Mng</th>
                    <th className="py-3 px-2 text-right">Akurasi</th>
                    <th className="py-3 pl-2 text-right">Poin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 text-sm">
                  {leaderboard.map((team, index) => {
                    const color = TEAM_COLORS[team.colorIndex % TEAM_COLORS.length];
                    const acc =
                      team.totalAnswered > 0
                        ? Math.round((team.totalCorrect / team.totalAnswered) * 100)
                        : 0;
                    const isChampion = finalMatch?.winnerId === team.id;

                    return (
                      <tr
                        key={team.id}
                        className={`${
                          isChampion
                            ? 'bg-amber-100/60'
                            : index === 0 && team.totalPoints > 0
                            ? 'bg-blue-100/40'
                            : ''
                        }`}
                      >
                        <td className="py-4 pr-2 font-mono-num font-extrabold text-slate-700">
                          {index + 1}
                        </td>
                        <td className="py-4 px-2">
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-3.5 h-3.5 rounded-md ${color.bg} shrink-0`}
                              aria-hidden="true"
                            />
                            <div>
                              <div className="font-bold text-slate-900 leading-tight">
                                {team.name}
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5">
                                {isChampion
                                  ? 'Juara Turnamen'
                                  : team.eliminated
                                  ? 'Selesai Bertanding'
                                  : team.matchesPlayed > 0
                                  ? 'Lolos Babak Berikutnya'
                                  : 'Menunggu Giliran'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-2 text-right font-mono-num font-bold text-slate-700">
                          {team.wins}/{team.matchesPlayed}
                        </td>
                        <td className="py-4 px-2 text-right font-mono-num text-slate-600">
                          {acc}%
                        </td>
                        <td className="py-4 pl-2 text-right font-mono-num font-extrabold text-slate-900">
                          {team.totalPoints}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Bagan Pertandingan Menuju Babak Final */}
          <section id="bagan" className="lg:col-span-7 space-y-6">
            <div>
              <h2 className="font-display text-2xl font-bold text-slate-900">
                Bagan Pertandingan Menuju Final
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Pasangan kelompok diundi secara acak, pemenang bertanding ulang hingga Babak Final.
              </p>
            </div>

            <div className="space-y-6">
              {stages.map((stage) => {
                const stageMatches = matches.filter((m) => m.stage === stage);
                return (
                  <div key={stage} className="space-y-3">
                    <h3 className="font-display text-base font-bold text-slate-800">
                      {stageTitles[stage] || stage}
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {stageMatches.map((m) => {
                        const teamA = getTeamById(m.teamAId);
                        const teamB = getTeamById(m.teamBId);
                        const isReady = m.status === 'pending' && teamA && teamB;
                        const isNext = nextReadyMatch?.id === m.id;
                        const isDone = m.status === 'completed';

                        return (
                          <div
                            key={m.id}
                            className={`glass-panel rounded-3xl p-5 space-y-4 transition-all ${
                              isNext
                                ? 'ring-2 ring-blue-600 bg-white/90'
                                : isDone
                                ? 'bg-white/65'
                                : ''
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs font-bold">
                              <span className="text-slate-500">{m.stageLabel}</span>
                              {isDone ? (
                                <span className="text-emerald-700 flex items-center gap-1">
                                  <CheckCircle2 className="w-4 h-4" /> Selesai
                                </span>
                              ) : isNext ? (
                                <span className="text-blue-600">Siap Dimainkan</span>
                              ) : (
                                <span className="text-slate-400">Menunggu Pemenang</span>
                              )}
                            </div>

                            <div className="space-y-2.5">
                              {/* Team A Row */}
                              <div
                                className={`flex items-center justify-between p-3.5 rounded-2xl border ${
                                  m.winnerId === teamA?.id && isDone
                                    ? 'border-emerald-400 bg-emerald-50/90'
                                    : 'border-slate-200/70 bg-white/80'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="font-bold text-sm text-slate-900 truncate">
                                    {teamA ? teamA.name : 'Menunggu Pemenang...'}
                                  </span>
                                  {teamA && !isDone && (
                                    <span className="text-[11px] font-bold text-blue-600 shrink-0">
                                      ← Kiri
                                    </span>
                                  )}
                                  {m.winnerId === teamA?.id && isDone && (
                                    <Award className="w-4 h-4 text-emerald-600 shrink-0" />
                                  )}
                                </div>
                                <span className="font-mono-num font-extrabold text-base text-slate-900">
                                  {isDone ? m.scoreA : '-'}
                                </span>
                              </div>

                              {/* Team B Row */}
                              <div
                                className={`flex items-center justify-between p-3.5 rounded-2xl border ${
                                  m.winnerId === teamB?.id && isDone
                                    ? 'border-emerald-400 bg-emerald-50/90'
                                    : 'border-slate-200/70 bg-white/80'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="font-bold text-sm text-slate-900 truncate">
                                    {teamB ? teamB.name : 'Menunggu Pemenang...'}
                                  </span>
                                  {teamB && !isDone && (
                                    <span className="text-[11px] font-bold text-orange-600 shrink-0">
                                      Kanan →
                                    </span>
                                  )}
                                  {m.winnerId === teamB?.id && isDone && (
                                    <Award className="w-4 h-4 text-emerald-600 shrink-0" />
                                  )}
                                </div>
                                <span className="font-mono-num font-extrabold text-base text-slate-900">
                                  {isDone ? m.scoreB : '-'}
                                </span>
                              </div>
                            </div>

                            {isReady && (
                              <button
                                type="button"
                                onClick={() => {
                                  soundEngine.playTap();
                                  onStartMatch(m.id);
                                }}
                                className={`w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                                  isNext
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                                }`}
                              >
                                <Play className="w-4 h-4 fill-current" />
                                Mulai Pertandingan Ini
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>

      {/* Frosted Glass Animated Roulette Draw Overlay */}
      {isDrawing && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-6">
          <div className="glass-panel rounded-[32px] p-8 lg:p-10 max-w-2xl w-full space-y-6 shadow-2xl text-center animate-relay-slide">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md">
              <Shuffle className="w-8 h-8 animate-spin" />
            </div>
            <div className="space-y-1">
              <h2 className="font-display text-2xl lg:text-3xl font-extrabold text-slate-900">
                Mengacak Pasangan Kelompok...
              </h2>
              <p className="text-sm text-slate-600">
                Menentukan lawan tanding babak awal secara adil dan acak.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 text-left">
              {roulettePairs.map((pair, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl border border-white bg-white/85 space-y-1.5 shadow-sm"
                >
                  <div className="text-xs font-bold text-blue-700">Laga {idx + 1}</div>
                  <div className="font-display font-bold text-slate-900 truncate">
                    {pair.a}
                  </div>
                  <div className="text-xs font-extrabold text-slate-400">VS</div>
                  <div className="font-display font-bold text-slate-900 truncate">
                    {pair.b}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <footer className="glass-panel border-t border-white/80 rounded-none px-6 lg:px-10 py-4 text-center text-xs text-slate-600">
        Arena Estafet Cerdas IFP · <span className="font-semibold text-slate-800">Afri Dani Saputra</span> · Guru SD Anugerah Abadi 1 Bengalon
      </footer>
    </div>
  );
};
