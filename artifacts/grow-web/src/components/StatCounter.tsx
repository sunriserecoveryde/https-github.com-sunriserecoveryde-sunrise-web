import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

interface StatItem {
  value: number;
  suffix: string;
  label: string;
  prefix?: string;
}

const stats: StatItem[] = [
  { value: 21, suffix: '+', label: 'Free CEU Courses' },
  { value: 500, suffix: '+', label: 'Professionals Trained' },
  { value: 17, suffix: '+', label: 'Partner Organizations' },
  { value: 988, suffix: '', label: 'Crisis Lifeline', prefix: 'Call ' },
];

function Counter({ value, suffix, prefix }: { value: number; suffix: string; prefix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1400;
    const step = 16;
    const increment = value / (duration / step);
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(start));
      }
    }, step);
    return () => clearInterval(timer);
  }, [inView, value]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}{display}{suffix}
    </span>
  );
}

export function StatCounter() {
  return (
    <section className="py-16 border-y border-white/5 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat, i) => (
            <div key={i} className="space-y-1">
              <div className="text-4xl md:text-5xl font-heading font-bold text-primary">
                <Counter value={stat.value} suffix={stat.suffix} prefix={stat.prefix} />
              </div>
              <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
