import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const quotes = [
  { text: "Recovery is not a race. You don't have to feel guilty if it takes you longer than you thought it would.", author: "Unknown" },
  { text: "Every day is a new beginning. Take a deep breath, smile, and start again.", author: "Unknown" },
  { text: "The first step towards getting somewhere is to decide you're not going to stay where you are.", author: "J.P. Morgan" },
  { text: "You don't have to see the whole staircase, just take the first step.", author: "Martin Luther King Jr." },
  { text: "Hardships often prepare ordinary people for an extraordinary destiny.", author: "C.S. Lewis" },
  { text: "Rock bottom became the solid foundation on which I rebuilt my life.", author: "J.K. Rowling" },
  { text: "No matter how dark the moment, love and hope are always possible.", author: "George Chakiris" },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
];

export function QuoteRotator() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(i => (i + 1) % quotes.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const quote = quotes[index];

  return (
    <section className="py-16 bg-card/40 border-y border-white/5 overflow-hidden">
      <div className="container mx-auto px-4 max-w-3xl text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-xl md:text-2xl font-heading italic text-foreground/90 leading-relaxed mb-4">
              "{quote.text}"
            </p>
            <p className="text-sm text-muted-foreground font-medium tracking-wide uppercase">
              — {quote.author}
            </p>
          </motion.div>
        </AnimatePresence>
        <div className="flex justify-center gap-2 mt-6">
          {quotes.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === index ? 'bg-primary scale-125' : 'bg-muted-foreground/30'}`}
              aria-label={`Quote ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
