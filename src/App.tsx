import { useEffect, useRef, useState } from 'react';
import { DualArena } from './components/DualArena';
import { GrandChampionScreen } from './components/GrandChampionScreen';
import { LobbyScreen } from './components/LobbyScreen';
import { TitleScreen } from './components/TitleScreen';
import { TournamentHub } from './components/TournamentHub';
import { AppScreen, Team, TournamentConfig, TournamentMatch } from './types/game';
import { soundEngine } from './utils/soundEngine';
import {
  createTeams,
  createTournamentMatches,
  DEFAULT_TEAM_PRESETS,
} from './utils/tournament';

const INITIAL_CONFIG: TournamentConfig = {
  subject: 'matematika',
  level: 1,
  gameMode: 'pilihan_ganda',
  teamCount: 4,
  durationSeconds: 60,
};

function shuffleTeams(list: Team[]): Team[] {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('TITLE');
  const [showSetupModal, setShowSetupModal] = useState<boolean>(false);
  const [config, setConfig] = useState<TournamentConfig>(INITIAL_CONFIG);
  const [teamNames, setTeamNames] = useState<string[]>(
    DEFAULT_TEAM_PRESETS.map((p) => p.name)
  );
  const [teams, setTeams] = useState<Team[]>(() => createTeams(INITIAL_CONFIG.teamCount));
  const [matches, setMatches] = useState<TournamentMatch[]>(() =>
    createTournamentMatches(createTeams(INITIAL_CONFIG.teamCount))
  );
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [championId, setChampionId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [drawTriggerKey, setDrawTriggerKey] = useState<number>(0);

  // Global anti-cheat tracker: ensures no two groups ever receive the same question during the tournament
  const usedQuestionIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const syncFullscreen = () => {
      const doc = document as Document & {
        webkitFullscreenElement?: Element | null;
      };
      setIsFullscreen(Boolean(document.fullscreenElement || doc.webkitFullscreenElement));
    };

    syncFullscreen();
    document.addEventListener('fullscreenchange', syncFullscreen);
    document.addEventListener('webkitfullscreenchange', syncFullscreen);
    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreen);
      document.removeEventListener('webkitfullscreenchange', syncFullscreen);
    };
  }, []);

  const handleToggleFullscreen = async () => {
    soundEngine.playTap();
    try {
      const doc = document as Document & {
        webkitFullscreenElement?: Element | null;
        webkitExitFullscreen?: () => Promise<void> | void;
      };
      const el = document.documentElement as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void> | void;
      };

      const active = Boolean(document.fullscreenElement || doc.webkitFullscreenElement);
      if (!active) {
        if (el.requestFullscreen) {
          await el.requestFullscreen();
        } else if (el.webkitRequestFullscreen) {
          await el.webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        }
      }
    } catch {
      // Ignore if browser or iframe blocks fullscreen API
    }
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundEngine.setMuted(nextMuted);
  };

  const handleStartTournament = (newConfig: TournamentConfig, names: string[]) => {
    usedQuestionIdsRef.current = new Set();
    const freshTeams = shuffleTeams(createTeams(newConfig.teamCount, names));
    const freshMatches = createTournamentMatches(freshTeams);

    setConfig(newConfig);
    setTeamNames((prev) => {
      const merged = [...prev];
      names.forEach((n, i) => {
        merged[i] = n;
      });
      return merged;
    });
    setTeams(freshTeams);
    setMatches(freshMatches);
    setChampionId(null);
    setActiveMatchId(null);
    setShowSetupModal(false);
    setDrawTriggerKey((k) => k + 1);
    setScreen('HUB');
  };

  const handleReshuffleBracket = () => {
    const hasStarted = matches.some((m) => m.status === 'completed');
    if (hasStarted) return;

    const reshuffled = shuffleTeams(
      teams.map((t) => ({
        ...t,
        totalPoints: 0,
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        totalCorrect: 0,
        totalAnswered: 0,
        bestStreak: 0,
        eliminated: false,
      }))
    );
    setTeams(reshuffled);
    setMatches(createTournamentMatches(reshuffled));
    setDrawTriggerKey((k) => k + 1);
  };

  const handleStartMatch = (matchId: string) => {
    setActiveMatchId(matchId);
    setScreen('ARENA');
  };

  const handleFinishMatch = (result: {
    scoreA: number;
    scoreB: number;
    correctA: number;
    correctB: number;
    answeredA: number;
    answeredB: number;
    bestStreakA: number;
    bestStreakB: number;
    winnerId: string;
  }) => {
    if (!activeMatchId) return;

    const currentMatch = matches.find((m) => m.id === activeMatchId);
    if (!currentMatch || !currentMatch.teamAId || !currentMatch.teamBId) return;

    const updatedTeams = teams.map((t) => {
      if (t.id === currentMatch.teamAId) {
        const won = result.winnerId === t.id;
        return {
          ...t,
          totalPoints: t.totalPoints + result.scoreA,
          matchesPlayed: t.matchesPlayed + 1,
          wins: t.wins + (won ? 1 : 0),
          losses: t.losses + (won ? 0 : 1),
          totalCorrect: t.totalCorrect + result.correctA,
          totalAnswered: t.totalAnswered + result.answeredA,
          bestStreak: Math.max(t.bestStreak, result.bestStreakA),
          eliminated: !won,
        };
      }
      if (t.id === currentMatch.teamBId) {
        const won = result.winnerId === t.id;
        return {
          ...t,
          totalPoints: t.totalPoints + result.scoreB,
          matchesPlayed: t.matchesPlayed + 1,
          wins: t.wins + (won ? 1 : 0),
          losses: t.losses + (won ? 0 : 1),
          totalCorrect: t.totalCorrect + result.correctB,
          totalAnswered: t.totalAnswered + result.answeredB,
          bestStreak: Math.max(t.bestStreak, result.bestStreakB),
          eliminated: !won,
        };
      }
      return t;
    });

    let updatedMatches = matches.map((m) => {
      if (m.id === currentMatch.id) {
        return {
          ...m,
          scoreA: result.scoreA,
          scoreB: result.scoreB,
          correctA: result.correctA,
          correctB: result.correctB,
          answeredA: result.answeredA,
          answeredB: result.answeredB,
          winnerId: result.winnerId,
          isDraw: false,
          status: 'completed' as const,
        };
      }
      return m;
    });

    if (currentMatch.nextMatchId && currentMatch.nextSlot) {
      updatedMatches = updatedMatches.map((m) => {
        if (m.id === currentMatch.nextMatchId) {
          return {
            ...m,
            teamAId: currentMatch.nextSlot === 'A' ? result.winnerId : m.teamAId,
            teamBId: currentMatch.nextSlot === 'B' ? result.winnerId : m.teamBId,
          };
        }
        return m;
      });
    }

    if (teams.length === 6) {
      const penMatches = updatedMatches.filter((m) => m.stage === 'PENYISIHAN');
      const allPenDone = penMatches.every((m) => m.status === 'completed');
      const semi2 = updatedMatches.find((m) => m.id === 'semi-2');
      if (allPenDone && semi2 && !semi2.teamBId) {
        const runnerUps = penMatches
          .map((m) => {
            const lId = m.winnerId === m.teamAId ? m.teamBId : m.teamAId;
            const lScore = m.winnerId === m.teamAId ? m.scoreB : m.scoreA;
            const lCorrect = m.winnerId === m.teamAId ? m.correctB : m.correctA;
            return { id: lId, score: lScore, correct: lCorrect };
          })
          .filter((r): r is { id: string; score: number; correct: number } => r.id !== null)
          .sort((a, b) => (b.score !== a.score ? b.score - a.score : b.correct - a.correct));

        if (runnerUps[0]) {
          const bestRunnerUpId = runnerUps[0].id;
          updatedMatches = updatedMatches.map((m) =>
            m.id === 'semi-2' ? { ...m, teamBId: bestRunnerUpId } : m
          );
          for (let i = 0; i < updatedTeams.length; i++) {
            if (updatedTeams[i].id === bestRunnerUpId) {
              updatedTeams[i] = { ...updatedTeams[i], eliminated: false };
            }
          }
        }
      }
    }

    setTeams(updatedTeams);
    setMatches(updatedMatches);
    setActiveMatchId(null);

    if (currentMatch.stage === 'FINAL') {
      setChampionId(result.winnerId);
      soundEngine.playVictoryFanfare();
      setScreen('CHAMPION');
    } else {
      setScreen('HUB');
    }
  };

  const handlePlayAgainSameTeams = () => {
    usedQuestionIdsRef.current = new Set();
    const freshTeams = shuffleTeams(createTeams(config.teamCount, teams.map((t) => t.name)));
    const freshMatches = createTournamentMatches(freshTeams);
    setTeams(freshTeams);
    setMatches(freshMatches);
    setChampionId(null);
    setActiveMatchId(null);
    setDrawTriggerKey((k) => k + 1);
    setScreen('HUB');
  };

  const activeMatch = matches.find((m) => m.id === activeMatchId) || null;
  const activeTeamA = activeMatch ? teams.find((t) => t.id === activeMatch.teamAId) || null : null;
  const activeTeamB = activeMatch ? teams.find((t) => t.id === activeMatch.teamBId) || null : null;

  if (screen === 'ARENA' && activeMatch && activeTeamA && activeTeamB) {
    return (
      <DualArena
        match={activeMatch}
        teamA={activeTeamA}
        teamB={activeTeamB}
        config={config}
        usedQuestionIds={usedQuestionIdsRef}
        isMuted={isMuted}
        isFullscreen={isFullscreen}
        onToggleMute={handleToggleMute}
        onToggleFullscreen={handleToggleFullscreen}
        onFinishMatch={handleFinishMatch}
        onAbortMatch={() => {
          setActiveMatchId(null);
          setScreen('HUB');
        }}
      />
    );
  }

  if (screen === 'CHAMPION') {
    return (
      <GrandChampionScreen
        config={config}
        teams={teams}
        championId={championId}
        usedQuestionCount={usedQuestionIdsRef.current.size}
        isMuted={isMuted}
        isFullscreen={isFullscreen}
        onToggleMute={handleToggleMute}
        onToggleFullscreen={handleToggleFullscreen}
        onPlayAgainSameTeams={handlePlayAgainSameTeams}
        onBackToLobby={() => {
          setScreen('TITLE');
          setShowSetupModal(true);
        }}
      />
    );
  }

  if (screen === 'HUB') {
    return (
      <>
        <TournamentHub
          config={config}
          teams={teams}
          matches={matches}
          usedQuestionCount={usedQuestionIdsRef.current.size}
          drawTriggerKey={drawTriggerKey}
          isMuted={isMuted}
          isFullscreen={isFullscreen}
          onToggleMute={handleToggleMute}
          onToggleFullscreen={handleToggleFullscreen}
          onReshuffleBracket={handleReshuffleBracket}
          onStartMatch={handleStartMatch}
          onBackToLobby={() => setShowSetupModal(true)}
          onViewChampion={() => setScreen('CHAMPION')}
        />
        {showSetupModal && (
          <LobbyScreen
            initialConfig={config}
            initialTeamNames={teamNames}
            onClose={() => setShowSetupModal(false)}
            onStartTournament={handleStartTournament}
          />
        )}
      </>
    );
  }

  return (
    <>
      <TitleScreen
        isMuted={isMuted}
        isFullscreen={isFullscreen}
        onToggleMute={handleToggleMute}
        onToggleFullscreen={handleToggleFullscreen}
        onEnterSetup={() => setShowSetupModal(true)}
      />
      {showSetupModal && (
        <LobbyScreen
          initialConfig={config}
          initialTeamNames={teamNames}
          onClose={() => setShowSetupModal(false)}
          onStartTournament={handleStartTournament}
        />
      )}
    </>
  );
}
