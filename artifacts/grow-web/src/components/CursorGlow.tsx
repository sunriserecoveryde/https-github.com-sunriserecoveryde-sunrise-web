import { useEffect, useRef } from 'react';

export function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only on desktop
    if (window.matchMedia('(pointer: coarse)').matches) return;

    let raf: number;
    let mouseX = -200, mouseY = -200;
    let curX = -200, curY = -200;

    function onMove(e: MouseEvent) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }

    function animate() {
      curX += (mouseX - curX) * 0.12;
      curY += (mouseY - curY) * 0.12;
      if (glowRef.current) {
        glowRef.current.style.transform = `translate(${curX - 150}px, ${curY - 150}px)`;
      }
      raf = requestAnimationFrame(animate);
    }

    window.addEventListener('mousemove', onMove, { passive: true });
    raf = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={glowRef}
      className="pointer-events-none fixed top-0 left-0 z-[5] w-[300px] h-[300px] rounded-full"
      style={{
        background: 'radial-gradient(circle, hsla(var(--primary) / 0.07) 0%, transparent 70%)',
        willChange: 'transform',
      }}
    />
  );
}
