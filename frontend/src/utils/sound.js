/**
 * Web Audio API based sound generator — subtle, premium game feel.
 */

let audioCtx = null;
let isMuted = false;

if (typeof window !== "undefined") {
  isMuted = localStorage.getItem("plinko-muted") === "true";
}

const getCtx = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
};

export const soundService = {
  getMute: () => isMuted,
  setMute: (val) => {
    isMuted = val;
    localStorage.setItem("plinko-muted", val.toString());
  },

  playTick: () => {
    if (isMuted) return;
    const ctx = getCtx();
    const now = ctx.currentTime;

    // Layer 1: High frequency transient metal "tink"
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(1900 + Math.random() * 100, now);
    osc1.frequency.exponentialRampToValueAtTime(1000, now + 0.025);
    gain1.gain.setValueAtTime(0.015, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    // Layer 2: Mid resonant pin vibration
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(1350 + Math.random() * 50, now);
    osc2.frequency.exponentialRampToValueAtTime(700, now + 0.04);
    gain2.gain.setValueAtTime(0.012, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    // Layer 3: Low metallic peg body ring
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = "sine";
    osc3.frequency.setValueAtTime(850, now);
    gain3.gain.setValueAtTime(0.008, now);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);

    // Start all
    osc1.start(now);
    osc2.start(now);
    osc3.start(now);

    osc1.stop(now + 0.03);
    osc2.stop(now + 0.05);
    osc3.stop(now + 0.09);
  },

  playLanding: () => {
    if (isMuted) return;
    const ctx = getCtx();
    const now = ctx.currentTime;

    // Layer 1: Low frequency impact thump
    const oscLow = ctx.createOscillator();
    const gainLow = ctx.createGain();
    oscLow.type = "sine";
    oscLow.frequency.setValueAtTime(105, now);
    oscLow.frequency.exponentialRampToValueAtTime(45, now + 0.16);
    gainLow.gain.setValueAtTime(0.08, now);
    gainLow.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    oscLow.connect(gainLow);
    gainLow.connect(ctx.destination);

    // Layer 2: Muted mid thud
    const oscMid = ctx.createOscillator();
    const gainMid = ctx.createGain();
    oscMid.type = "triangle";
    oscMid.frequency.setValueAtTime(160, now);
    oscMid.frequency.exponentialRampToValueAtTime(60, now + 0.09);
    gainMid.gain.setValueAtTime(0.04, now);
    gainMid.gain.exponentialRampToValueAtTime(0.001, now + 0.10);
    oscMid.connect(gainMid);
    gainMid.connect(ctx.destination);

    // Layer 3: Metallic slot resonance ring
    const oscRing = ctx.createOscillator();
    const gainRing = ctx.createGain();
    oscRing.type = "sine";
    oscRing.frequency.setValueAtTime(320, now);
    oscRing.frequency.exponentialRampToValueAtTime(120, now + 0.06);
    gainRing.gain.setValueAtTime(0.025, now);
    gainRing.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    oscRing.connect(gainRing);
    gainRing.connect(ctx.destination);

    // Start all
    oscLow.start(now);
    oscMid.start(now);
    oscRing.start(now);

    oscLow.stop(now + 0.20);
    oscMid.stop(now + 0.11);
    oscRing.stop(now + 0.08);
  },

  playWin: (multiplier = 1) => {
    if (isMuted) return;
    const ctx = getCtx();
    const now = ctx.currentTime;

    const playChimeNote = (freq, startTime, duration, vol = 0.05) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      // Use triangle for a soft, premium organic chime feel (Apple UI sounds style)
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, startTime);
      
      // Clean smooth volume envelope with soft rise and decay
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(vol, startTime + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const baseVol = 0.04;

    if (multiplier >= 5) {
      // Enhanced Celebration Chime: Lush, arpeggiated C major 9th chord
      // Notes: C5 (523.25), E5 (659.25), G5 (783.99), B5 (987.77), D6 (1174.66), G6 (1567.98)
      const chord = [523.25, 659.25, 783.99, 987.77, 1174.66, 1567.98];
      const startTimes = [0, 0.04, 0.08, 0.12, 0.16, 0.20];
      chord.forEach((freq, idx) => {
        playChimeNote(freq, now + startTimes[idx], 0.35 - idx * 0.02, baseVol * 0.7);
      });
    } else if (multiplier >= 2) {
      // Medium Multiplier: Warm arpeggiated major triad
      // Notes: C5 (523.25), E5 (659.25), G5 (783.99), C6 (1046.50)
      const chord = [523.25, 659.25, 783.99, 1046.50];
      const startTimes = [0, 0.05, 0.10, 0.15];
      chord.forEach((freq, idx) => {
        playChimeNote(freq, now + startTimes[idx], 0.25, baseVol * 0.75);
      });
    } else {
      // Low Multiplier: Warm, elegant UI confirmation chime (E5 -> G5)
      // Notes: E5 (659.25), G5 (783.99)
      playChimeNote(659.25, now, 0.20, baseVol * 0.6);
      playChimeNote(783.99, now + 0.06, 0.25, baseVol * 0.6);
    }
  },
};
