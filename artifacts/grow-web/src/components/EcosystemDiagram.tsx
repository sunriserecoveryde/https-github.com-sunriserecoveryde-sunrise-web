import { motion } from 'framer-motion';
import { Activity, BrainCircuit, BookOpen, HeartHandshake } from 'lucide-react';

export function EcosystemDiagram() {
  const nodes = [
    {
      id: 'recovery',
      title: 'Sunrise Recovery',
      subtitle: 'Clinical Care',
      icon: Activity,
      color: 'text-sky',
      bg: 'bg-sky/10',
      border: 'border-sky/20',
      position: 'md:col-start-1 md:row-start-2'
    },
    {
      id: 'os',
      title: 'SunriseOS',
      subtitle: 'Technology Platform',
      icon: BrainCircuit,
      color: 'text-primary',
      bg: 'bg-primary/10',
      border: 'border-primary/20',
      position: 'md:col-start-2 md:row-start-1'
    },
    {
      id: 'grow',
      title: 'Grow Motivational',
      subtitle: 'Education & Media',
      icon: BookOpen,
      color: 'text-gold',
      bg: 'bg-gold/10',
      border: 'border-gold/20',
      position: 'md:col-start-3 md:row-start-2'
    },
    {
      id: 'foundation',
      title: 'The Sunrise Foundation',
      subtitle: 'Nonprofit Advocacy',
      icon: HeartHandshake,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
      border: 'border-emerald-400/20',
      position: 'md:col-start-2 md:row-start-3'
    }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto py-12 relative">
      {/* Connecting Lines for Desktop */}
      <div className="hidden md:block absolute inset-0 pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="none" style={{ zIndex: 0 }}>
          {/* Diamond connecting lines: left–top, top–right, right–bottom, bottom–left, plus diagonals */}
          <path d="M 200 300 L 400 150 L 600 300 L 400 450 Z" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2" strokeDasharray="6 6" />
          <path d="M 400 150 L 400 450" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" strokeDasharray="6 6" />
          <path d="M 200 300 L 600 300" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" strokeDasharray="6 6" />
        </svg>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-3 gap-6 md:gap-0 relative z-10">
        {nodes.map((node, index) => (
          <motion.div
            key={node.id}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.15, duration: 0.5 }}
            className={`flex flex-col items-center justify-center p-6 glass-card rounded-2xl border-2 ${node.border} text-center hover:scale-105 transition-transform ${node.position}`}
          >
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${node.bg} ${node.color}`}>
              <node.icon className="w-8 h-8" />
            </div>
            <h3 className="font-heading font-bold text-lg mb-1">{node.title}</h3>
            <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">{node.subtitle}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
