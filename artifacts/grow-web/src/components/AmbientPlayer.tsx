import { useEffect, useRef, useState } from 'react';
import { Music, Pause, Play, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function createAmbientSound(ctx: AudioContext): () => void {
  const nodes: AudioNode[] = [];
  const gainMaster = ctx.createGain();
  gainMaster.gain.setValueAtTime(0, ctx.currentTime);
  gainMaster.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 2);
  gainMaster.connect(ctx.destination);

  // Soft pad — two detuned oscillators
  const freqs = [220, 277.18, 329.63, 440];
  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    g.gain.value = 0.25 / freqs.length;
    osc.connect(g);
    g.connect(gainMaster);
    osc.start();
    nodes.push(osc, g);

    // Slow tremolo
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.1 + i * 0.03;
    lfoGain.gain.value = 0.008;
    lfo.connect(lfoGain);
    lfoGain.connect(g.gain);
    lfo.start();
    nodes.push(lfo, lfoGain);
  });

  return () => {
    gainMaster.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
    setTimeout(() => {
      nodes.forEach(n => { try { (n as OscillatorNode).stop?.(); } catch {} });
      try { gainMaster.disconnect(); } catch {}
    }, 1600);
  };
}

export function AmbientPlayer() {
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const stopRef = useRef<(() => void) | null>(null);

  function togglePlay() {
    if (playing) {
      stopRef.current?.();
      stopRef.current = null;
      setPlaying(false);
    } else {
      if (!ctxRef.current || ctxRef.current.state === 'closed') {
        ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (ctxRef.current.state === 'suspended') ctxRef.current.resume();
      stopRef.current = createAmbientSound(ctxRef.current);
      setPlaying(true);
    }
  }

  useEffect(() => {
    return () => { stopRef.current?.(); };
  }, []);

  if (dismissed) return null;

  return (
    <div className="fixed bottom-6 left-6 z-[150]">
      <AnimatePresence>
        {!open ? (
          <motion.button
            key="fab"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setOpen(true)}
            className="w-12 h-12 rounded-full bg-card border border-border shadow-lg flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
            aria-label="Open ambient sound player"
          >
            <Music className="w-5 h-5" />
          </motion.button>
        ) : (
          <motion.div
            key="player"
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            className="bg-card border border-border rounded-2xl shadow-xl p-4 w-56"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-foreground">Ambient Sound</span>
              <button
                onClick={() => { stopRef.current?.(); setPlaying(false); setOpen(false); setDismissed(true); }}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close player"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${playing ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-primary/20'}`}
                aria-label={playing ? 'Pause ambient sound' : 'Play ambient sound'}
              >
                {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <div>
                <p className="text-xs font-medium text-foreground">Calm Focus</p>
                <p className="text-xs text-muted-foreground">{playing ? 'Playing…' : 'Tap to play'}</p>
              </div>
              {playing && (
                <div className="ml-auto flex gap-0.5 items-end h-5">
                  {[3, 5, 4, 6, 3].map((h, i) => (
                    <motion.div
                      key={i}
                      className="w-1 bg-primary rounded-full"
                      animate={{ height: [`${h * 2}px`, `${h * 4}px`, `${h * 2}px`] }}
                      transition={{ repeat: Infinity, duration: 0.8 + i * 0.15, ease: 'easeInOut' }}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
