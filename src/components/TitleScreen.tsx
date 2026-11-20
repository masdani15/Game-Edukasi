import React, { useState } from 'react';
import {
  Award,
  BookOpen,
  Calculator,
  FlaskConical,
  Globe,
  HelpCircle,
  Languages,
  Maximize2,
  Minimize2,
  Play,
  ShieldCheck,
  Trophy,
  Users,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';

interface TitleScreenProps {
  isMuted: boolean;
  isFullscreen: boolean;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  onEnterSetup: () => void;
  children?: React.ReactNode;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  isMuted,
  isFullscreen,
  onToggleMute,
  onToggleFullscreen,
  onEnterSetup,
  children,
}) => {
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  return (
    <div className="min-h-screen arena-dark-canvas text-white flex flex-col justify-between relative overflow-hidden">
      {/* Minimal Top Utility Bar */}
      <header className="relative z-10 max-w-[1400px] w-full mx-auto px-6 lg:px-12 py-6 flex items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <span className="font-display font-bold text-lg text-slate-200 whitespace-nowrap">
            SD Anugerah Abadi 1 Bengalon
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              soundEngine.playTap();
              setShowHowToPlay(true);
            }}
            className="px-4 py-2.5 rounded-xl glass-dark hover:bg-slate-800/80 text-slate-200 font-semibold text-sm flex items-center gap-2 cursor-pointer transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            Cara Bermain
          </button>
          <button
            type="button"
            onClick={onToggleFullscreen}
            aria-label={isFullscreen ? 'Keluar layar penuh' : 'Layar penuh'}
            className="px-4 py-2.5 rounded-xl glass-dark hover:bg-slate-800/80 text-slate-200 font-semibold text-sm flex items-center gap-2 cursor-pointer transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden sm:inline">
              {isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
            </span>
          </button>
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={isMuted ? 'Aktifkan suara' : 'Matikan suara'}
            className="p-2.5 rounded-xl glass-dark hover:bg-slate-800/80 text-slate-200 cursor-pointer transition-colors"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Center Stage Hero */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 lg:px-12 py-8">
        <div className="max-w-5xl w-full text-center space-y-10">
          <div className="space-y-5">
            <div className="text-sm lg:text-base font-semibold text-blue-300 tracking-wide">
              Kompetisi Layar Sentuh IFP · Estafet Dual-Screen Real-Time
            </div>

            <h1 className="font-display text-5xl sm:text-6xl lg:text-8xl font-black tracking-tight text-white leading-[1.04] text-balance">
              Arena Estafet Cerdas
            </h1>

            <p className="text-slate-300 text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed">
              Permainan adu cepat kelompok untuk siswa SD. Jawab soal di depan layar secara bergantian, kumpulkan poin tertinggi, dan menangkan Babak Final!
            </p>
          </div>

          {/* Primary Professional Play Button */}
          <div className="flex flex-col items-center gap-5">
            <button
              type="button"
              onClick={() => {
                onEnterSetup();
                soundEngine.playCountdownBeep(true);
              }}
              className="group px-12 py-6 rounded-3xl bg-gradient-to-r from-blue-600 via-blue-500 to-sky-500 hover:from-blue-500 hover:to-sky-400 active:scale-[0.98] text-white font-display font-black text-2xl lg:text-3xl tracking-wide shadow-[0_20px_50px_rgba(37,99,235,0.45)] transition-all flex items-center gap-4 cursor-pointer"
            >
              <span className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Play className="w-7 h-7 fill-current ml-0.5" />
              </span>
              <span>MULAI BERMAIN</span>
            </button>

            <div className="text-xs lg:text-sm font-medium text-slate-400">
              6 Mata Pelajaran SD · 3 Level Tantangan · Mode 2–8 Kelompok
            </div>
          </div>

          {/* Frosted Glass Feature Strip */}
          <div className="grid sm:grid-cols-3 gap-5 pt-4 text-left">
            <div className="glass-dark rounded-3xl p-6 space-y-2.5">
              <div className="w-11 h-11 rounded-2xl bg-blue-500/20 text-blue-300 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div className="font-display text-lg font-bold text-white">
                2 Layar Independen
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                Sisi kiri dan kanan merespons sentuhan secara bersamaan tanpa saling mengganggu.
              </p>
            </div>

            <div className="glass-dark rounded-3xl p-6 space-y-2.5">
              <div className="w-11 h-11 rounded-2xl bg-orange-500/20 text-orange-300 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="font-display text-lg font-bold text-white">
                Soal Acak &amp; Anti-Curang
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                Tiap kelompok mendapat soal berbeda dan kunci jawaban tidak ditampilkan di layar.
              </p>
            </div>

            <div className="glass-dark rounded-3xl p-6 space-y-2.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
              <div className="font-display text-lg font-bold text-white">
                Turnamen Menuju Final
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                Pemenang setiap laga diundi dan ditandingkan ulang hingga merebut juara.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Quiet Subject Icons & Teacher Attribution Footer */}
      <footer className="relative z-10 max-w-[1400px] w-full mx-auto px-6 lg:px-12 py-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-slate-400">
          <Calculator className="w-4 h-4" />
          <FlaskConical className="w-4 h-4" />
          <BookOpen className="w-4 h-4" />
          <Languages className="w-4 h-4" />
          <Globe className="w-4 h-4" />
          <span className="text-xs font-medium text-slate-300">
            700+ Soal Kurasi SD &amp; Generator Matematika
          </span>
        </div>

        <div className="text-sm text-slate-300 font-medium">
          Karya <span className="font-bold text-white">Afri Dani Saputra</span> · Guru SD Anugerah Abadi 1 Bengalon
        </div>
      </footer>

      {/* How To Play Glass Modal */}
      {showHowToPlay && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="glass-dark rounded-3xl p-8 lg:p-10 max-w-2xl w-full space-y-6 animate-relay-slide">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl lg:text-3xl font-extrabold text-white">
                Cara Bermain Estafet di Layar IFP
              </h2>
              <button
                type="button"
                onClick={() => setShowHowToPlay(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-slate-200 text-sm lg:text-base leading-relaxed">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <span className="font-bold text-blue-300">1. Atur Permainan:</span> Pilih mata pelajaran, level tantangan, mode soal, durasi (default 1 menit), dan jumlah kelompok (2–8).
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <span className="font-bold text-orange-300">2. Baris Estafet:</span> Dua kelompok berbaris memanjang di sisi Kiri dan Kanan layar IFP. Siswa terdepan menjawab satu soal lalu langsung mundur ke barisan paling belakang.
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <span className="font-bold text-emerald-300">3. Tanding Ulang ke Final:</span> Kelompok dengan poin tertinggi memenangkan laga dan melaju ke babak berikutnya hingga Babak Final!
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                soundEngine.playTap();
                setShowHowToPlay(false);
              }}
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-display font-bold text-lg cursor-pointer"
            >
              Siap, Mengerti!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
