/**
 * Programmatic UI sound synthesis via Web Audio API.
 * No external files — fully self-contained.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  // Resume if suspended (browser autoplay policy)
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/** Primary CTA — confident, clean "thock". Warm sine body + crisp transient. */
export function playPrimary() {
  const ac = getCtx();
  const now = ac.currentTime;

  // Sine body: pitch drops quickly for a "weighted" feel
  const osc = ac.createOscillator();
  const oscEnv = ac.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(700, now);
  osc.frequency.exponentialRampToValueAtTime(180, now + 0.07);
  oscEnv.gain.setValueAtTime(0.28, now);
  oscEnv.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
  osc.connect(oscEnv);
  oscEnv.connect(ac.destination);
  osc.start(now);
  osc.stop(now + 0.09);

  // Transient: short filtered noise burst — the "click" edge
  const clickBuf = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.018), ac.sampleRate);
  const clickData = clickBuf.getChannelData(0);
  for (let i = 0; i < clickData.length; i++) {
    clickData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / clickData.length, 2);
  }
  const click = ac.createBufferSource();
  click.buffer = clickBuf;

  const hpf = ac.createBiquadFilter();
  hpf.type = 'highpass';
  hpf.frequency.value = 2800;

  const clickEnv = ac.createGain();
  clickEnv.gain.setValueAtTime(0.18, now);
  clickEnv.gain.exponentialRampToValueAtTime(0.0001, now + 0.018);

  click.connect(hpf);
  hpf.connect(clickEnv);
  clickEnv.connect(ac.destination);
  click.start(now);
}

/** Secondary button — lighter, shorter tap. Same shape, dialed back. */
export function playSecondary() {
  const ac = getCtx();
  const now = ac.currentTime;

  const osc = ac.createOscillator();
  const oscEnv = ac.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(520, now);
  osc.frequency.exponentialRampToValueAtTime(160, now + 0.055);
  oscEnv.gain.setValueAtTime(0.18, now);
  oscEnv.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
  osc.connect(oscEnv);
  oscEnv.connect(ac.destination);
  osc.start(now);
  osc.stop(now + 0.07);

  const clickBuf = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.012), ac.sampleRate);
  const clickData = clickBuf.getChannelData(0);
  for (let i = 0; i < clickData.length; i++) {
    clickData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / clickData.length, 2);
  }
  const click = ac.createBufferSource();
  click.buffer = clickBuf;

  const hpf = ac.createBiquadFilter();
  hpf.type = 'highpass';
  hpf.frequency.value = 3500;

  const clickEnv = ac.createGain();
  clickEnv.gain.setValueAtTime(0.1, now);
  clickEnv.gain.exponentialRampToValueAtTime(0.0001, now + 0.012);

  click.connect(hpf);
  hpf.connect(clickEnv);
  clickEnv.connect(ac.destination);
  click.start(now);
}

/** Nav link — barely-there, high tick. Presence without distraction. */
export function playNav() {
  const ac = getCtx();
  const now = ac.currentTime;

  const osc = ac.createOscillator();
  const env = ac.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(1100, now);
  osc.frequency.exponentialRampToValueAtTime(600, now + 0.03);
  env.gain.setValueAtTime(0.07, now);
  env.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
  osc.connect(env);
  env.connect(ac.destination);
  osc.start(now);
  osc.stop(now + 0.04);
}
