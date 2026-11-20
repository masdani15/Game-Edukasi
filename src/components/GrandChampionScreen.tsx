import React from 'react';
import { Award, Medal, RotateCcw, Trophy } from 'lucide-react';
import { SUBJECT_LIST } from '../data/questionBank';
import { Team, TournamentConfig } from '../types/game';
import { sortTeamsLeaderboard } from '../utils/tournament';
import { soundEngine } from '../utils/soundEngine';

interface GrandChampionScreenProps {
  config: TournamentConfig;
  teams: Team[];
  championId: string | null;
  usedQuestionCount: number;
  onPlayAgainSameTeams: () => void;
  onBackToLobby: () => void;
}

export const GrandChampionScreen: React.FC<GrandChampionScreenProps> = ({
  config,
  teams,
  championId,
  usedQuestionCount,
  onPlayAgainSameTeams,
  onBackToLobby,
}) => {
  const ranked = sortTeamsLeaderboard(teams);
  const champion = teams.find((t) => t.id === championId) || ranked[0];
  const others = ranked.filter((t) => t.id !== champion.id);
  const runnerUp = others[0];
  const thirdPlace = others[1];

  const subjectInfo = SUBJECT_LIST.find((s) => s.id === config.subject);
  const levelText = config.level === 'all' ? 'Semua Level' : `Level ${config.level}`;

  return (
    <div className="min-h-screen arena-dark-canvas text-white flex flex-col justify-between p-6 lg:p-12">
      <div className="max-w-5xl w-full mx-auto space-y-10 my-auto">
        {/* Champion Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-amber-500 text-slate-950 shadow-xl">
            <Trophy className="w-12 h-12" />
          </div>
          <div className="text-sm font-bold text-amber-300 tracking-wide">
            Juara Turnamen Estafet Cerdas · {subjectInfo?.title} · {levelText}
          </div>
          <h1 className="font-display text-4xl lg:text-6xl font-black tracking-tight text-white">
            Selamat kepada {champion.name}!
          </h1>
          <p className="text-slate-300 text-base lg:text-lg max-w-2xl mx-auto">
            Berhasil menjuarai Babak Final dengan total{' '}
            <span className="font-mono-num font-bold text-amber-300">{champion.totalPoints} poin</span>{' '}
            dan akurasi{' '}
            <span className="font-mono-num font-bold text-emerald-300">
              {champion.totalAnswered > 0
                ? Math.round((champion.totalCorrect / champion.totalAnswered) * 100)
                : 0}
              %
            </span>
            !
          </p>
        </div>

        {/* Podium Cards */}
        <div className="grid md:grid-cols-3 gap-5 items-end">
          {/* Juara 2 */}
          {runnerUp && (
            <div className="order-2 md:order-1 glass-dark rounded-3xl p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 text-slate-200 flex items-center justify-center mx-auto">
                <Medal className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold text-slate-400">Juara 2 / Finalis</div>
              <div className="font-display text-2xl font-extrabold text-white">{runnerUp.name}</div>
              <div className="font-mono-num text-3xl font-black text-blue-400">
                {runnerUp.totalPoints} poin
              </div>
              <div className="text-xs text-slate-400 font-mono-num">
                {runnerUp.totalCorrect} jawaban benar · Rekor {runnerUp.bestStreak}x
              </div>
            </div>
          )}

          {/* Juara 1 */}
          <div className="order-1 md:order-2 bg-gradient-to-b from-amber-400 to-amber-500 text-slate-950 rounded-3xl p-8 text-center space-y-3 shadow-[0_24px_60px_rgba(245,158,11,0.35)]">
            <div className="w-14 h-14 rounded-2xl bg-slate-950 text-amber-400 flex items-center justify-center mx-auto">
              <Award className="w-8 h-8" />
            </div>
            <div className="text-xs font-extrabold tracking-wide text-slate-900">JUARA 1 TURNAMEN</div>
            <div className="font-display text-3xl font-black text-slate-950">{champion.name}</div>
            <div className="font-mono-num text-5xl font-black text-slate-950">
              {champion.totalPoints}
            </div>
            <div className="text-sm font-bold text-slate-900 font-mono-num">
              {champion.totalCorrect} benar · Rekor beruntun {champion.bestStreak}x
            </div>
          </div>

          {/* Juara 3 */}
          {thirdPlace ? (
            <div className="order-3 glass-dark rounded-3xl p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 text-amber-400 flex items-center justify-center mx-auto">
                <Medal className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold text-slate-400">Peringkat 3</div>
              <div className="font-display text-2xl font-extrabold text-white">{thirdPlace.name}</div>
              <div className="font-mono-num text-3xl font-black text-emerald-400">
                {thirdPlace.totalPoints} poin
              </div>
              <div className="text-xs text-slate-400 font-mono-num">
                {thirdPlace.totalCorrect} jawaban benar · Rekor {thirdPlace.bestStreak}x
              </div>
            </div>
          ) : (
            <div className="order-3 glass-dark rounded-3xl p-6 text-center space-y-2">
              <div className="text-xs font-bold text-slate-400">Statistik Kompetisi</div>
              <div className="font-mono-num text-3xl font-extrabold text-white">
                {usedQuestionCount}
              </div>
              <div className="text-sm text-slate-400">
                Soal unik dimainkan tanpa pengulangan
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            type="button"
            onClick={() => {
              soundEngine.playTap();
              onPlayAgainSameTeams();
            }}
            className="px-7 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-display font-extrabold text-lg flex items-center gap-2.5 cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            Tanding Ulang Kelompok Ini
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playTap();
              onBackToLobby();
            }}
            className="px-7 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-display font-bold text-lg cursor-pointer"
          >
            Pilih Mapel / Level Lain
          </button>
        </div>
      </div>

      <footer className="text-center text-xs text-slate-400 pt-6 border-t border-slate-800/80 max-w-4xl w-full mx-auto">
        Arena Estafet Cerdas IFP · Guru Pemandu: <span className="font-bold text-white">Afri Dani Saputra</span> · Guru SD Anugerah Abadi 1 Bengalon
      </footer>
    </div>
  );
};
