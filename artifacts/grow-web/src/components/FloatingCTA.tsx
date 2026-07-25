import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function FloatingCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 500);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          className="fixed bottom-6 right-6 z-[150]"
        >
          <Link
            href="/contact"
            className="flex items-center gap-2 px-5 py-3 rounded-full bg-primary text-primary-foreground font-medium shadow-lg hover:bg-primary/90 transition-colors text-sm"
          >
            <Phone className="w-4 h-4" />
            Book a Call
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
