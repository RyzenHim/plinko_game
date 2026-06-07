"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { roundsService } from "../services/api.service";
import PlinkoBoard from "../components/PlinkoBoard";
import Controls from "../components/Controls";
import HeroSection from "../components/HeroSection";
import FairnessPanel from "../components/FairnessPanel";
import RecentResults from "../components/RecentResults";
import BackgroundEffects from "../components/BackgroundEffects";
import { PAYOUTS } from "../utils/plinkoCoords";

export default function HomePage() {
  const [currentRound, setCurrentRound] = useState(null);
  const [outcome, setOutcome] = useState(null);
  const [isDropping, setIsDropping] = useState(false);
  const [betAmount, setBetAmount] = useState(1.0);
  const [clientSeed, setClientSeed] = useState("lucky-seed");
  const [dropColumn, setDropColumn] = useState(6);
  const [isTilt, setIsTilt] = useState(false);
  const [isDebug, setIsDebug] = useState(false);
  const [isDungeon, setIsDungeon] = useState(false);
  const [dungeonRoundsLeft, setDungeonRoundsLeft] = useState(0);
  const [recentResults, setRecentResults] = useState([]);
  const [revealedSeed, setRevealedSeed] = useState(null);
  const [landingHistory, setLandingHistory] = useState([]);
  const secretBufferRef = useRef("");

  const isGolden = landingHistory.length >= 3 && landingHistory.slice(-3).every((b) => b === 6);

  const initRound = async () => {
    try {
      const round = await roundsService.commit();
      setCurrentRound(round);
      setOutcome(null);
      setRevealedSeed(null);
    } catch (error) {
      console.error("Failed to init round", error);
    }
  };

  useEffect(() => {
    initRound();
  }, []);

  const handleDrop = useCallback(async () => {
    if (isDropping || !currentRound) return;

    setIsDropping(true);
    try {
      const result = await roundsService.start(currentRound.roundId, {
        clientSeed,
        betCents: Math.round(betAmount * 100),
        dropColumn,
      });

      const fullDetails = await roundsService.get(currentRound.roundId);

      setOutcome({
        ...result,
        path: fullDetails.pathJson,
        betCents: Math.round(betAmount * 100),
        dropColumn: dropColumn,
      });
    } catch (error) {
      console.error("Drop failed", error);
      setIsDropping(false);
    }
  }, [isDropping, currentRound, clientSeed, betAmount, dropColumn]);

  const onLanding = useCallback(({ binIndex, multiplier }) => {
    const payout = betAmount * multiplier;
    setLandingHistory((prev) => [...prev.slice(-9), binIndex]);
    setRecentResults((prev) => [
      {
        id: `${currentRound?.roundId}-${Date.now()}`,
        roundId: currentRound?.roundId,
        binIndex,
        multiplier,
        payout,
      },
      ...prev.slice(0, 19),
    ]);
  }, [betAmount, currentRound]);

  const onAnimationComplete = async () => {
    setIsDropping(false);

    if (dungeonRoundsLeft > 0) {
      setDungeonRoundsLeft((prev) => prev - 1);
      if (dungeonRoundsLeft <= 1) setIsDungeon(false);
    }

    try {
      const reveal = await roundsService.reveal(currentRound.roundId);
      setRevealedSeed(reveal.serverSeed);
      setTimeout(initRound, 2500);
    } catch (error) {
      console.error("Reveal failed", error);
    }
  };

  // Keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isDropping) return;

      if (e.key === "ArrowLeft") {
        setDropColumn((prev) => Math.max(0, prev - 1));
      } else if (e.key === "ArrowRight") {
        setDropColumn((prev) => Math.min(12, prev + 1));
      } else if (e.key === " ") {
        e.preventDefault();
        handleDrop();
      }

      if (e.key.toLowerCase() === "t") {
        setIsTilt((prev) => !prev);
      } else if (e.key.toLowerCase() === "g") {
        setIsDebug((prev) => !prev);
      }

      // Secret theme: "open sesame"
      if (e.key.length === 1) {
        const target = "open sesame";
        secretBufferRef.current = (secretBufferRef.current + e.key.toLowerCase()).slice(-target.length);
        if (secretBufferRef.current === target) {
          setIsDungeon(true);
          setDungeonRoundsLeft(1);
          secretBufferRef.current = "";
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDropping, handleDrop]);

  return (
    <div className="min-h-screen relative">
      <BackgroundEffects />

      <div className="relative z-10 px-4 md:px-8 py-6 md:py-10 max-w-[1400px] mx-auto">
        <HeroSection />

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6 items-start">
          {/* Controls — left (comes first on mobile, order-1) */}
          <div className="lg:col-span-3 order-1 lg:order-1">
            <Controls
              betAmount={betAmount}
              setBetAmount={setBetAmount}
              clientSeed={clientSeed}
              setClientSeed={setClientSeed}
              dropColumn={dropColumn}
              setDropColumn={setDropColumn}
              onDrop={handleDrop}
              isDropping={isDropping}
              roundId={currentRound?.roundId}
              commitHex={currentRound?.commitHex}
            />
          </div>

          {/* Board — center (comes second on mobile, order-2) */}
          <div className="lg:col-span-6 order-2 lg:order-2">
            <div className="glass-panel rounded-3xl p-3 md:p-6 relative overflow-hidden">
              {/* Board rim lighting */}
              <div className="absolute inset-0 rounded-3xl pointer-events-none border border-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

              <PlinkoBoard
                outcome={outcome}
                onAnimationComplete={onAnimationComplete}
                isDropping={isDropping}
                isTilt={isTilt}
                isDebug={isDebug}
                isGolden={isGolden}
                isDungeon={isDungeon}
                onLanding={onLanding}
              />

              {/* Paytable strip */}
              <div className="mt-2 flex justify-center gap-1 flex-wrap px-2">
                {PAYOUTS.map((m, i) => (
                  <span
                    key={i}
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                      m >= 5
                        ? "text-amber-400/80 bg-amber-500/10"
                        : m >= 2
                        ? "text-violet-400/70 bg-violet-500/10"
                        : "text-zinc-600 bg-white/[0.02]"
                    }`}
                  >
                    {m}x
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Side panel — right (comes third on mobile, order-3) */}
          <div className="lg:col-span-3 order-3 lg:order-3 flex flex-col gap-5">
            <FairnessPanel
              roundId={currentRound?.roundId}
              commitHex={currentRound?.commitHex}
              nonce={currentRound?.nonce}
              serverSeed={revealedSeed}
              status={revealedSeed ? "REVEALED" : "committed"}
            />
            <RecentResults results={recentResults} />
          </div>
        </div>

        <footer className="mt-12 flex flex-col sm:flex-row justify-between items-center gap-4 text-zinc-600 text-xs">
          <span>Daphnis Labs — Full-Stack Assignment</span>
          <div className="flex gap-6">
            <a href="/verify" className="hover:text-cyan-400 transition-colors">
              Verifier
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
