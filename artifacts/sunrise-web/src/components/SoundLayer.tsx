import { useEffect } from 'react';
import { playPrimary, playSecondary, playNav } from '@/lib/sounds';

/**
 * Mounts a single delegated click listener on the document.
 * Classifies the clicked element and plays the right sound tier.
 * Renders nothing — pure side-effect component.
 */
export function SoundLayer() {
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const el = target.closest('a, button') as HTMLElement | null;
      if (!el) return;

      const classList = el.className ?? '';

      // Primary: orange CTA buttons
      if (
        classList.includes('bg-sunrise-orange') ||
        classList.includes('bg-orange-') ||
        el.getAttribute('data-sound') === 'primary'
      ) {
        playPrimary();
        return;
      }

      // Nav links: inside <header> or <nav>
      if (el.closest('header, nav, footer')) {
        playNav();
        return;
      }

      // Everything else: secondary
      playSecondary();
    }

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return null;
}
