import { useEffect } from 'react';

function playClick() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(1200, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.04);

    gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.06);

    oscillator.onended = () => ctx.close();
  } catch {
    // silently ignore if AudioContext is unavailable
  }
}

export function useClickSound() {
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const clickable = target.closest('button, a, [role="button"], input[type="submit"], input[type="button"]');
      if (clickable) playClick();
    }

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);
}
