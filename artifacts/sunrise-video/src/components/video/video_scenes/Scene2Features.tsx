import { motion } from 'framer-motion';

export function Scene2Features() {
  return (
    <motion.div
      className="absolute inset-0 w-full h-full flex flex-col items-center justify-center overflow-hidden"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, y: '-10vh' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="absolute top-[12vh] w-full text-center z-20">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-[#FBBF24] text-[2vw] font-display font-bold tracking-widest uppercase"
        >
          Core Capabilities
        </motion.h2>
      </div>

      <div className="relative z-10 w-full h-full flex items-center justify-center gap-[3vw] px-[8vw] pt-[8vh]">
        <FeatureCard
          delay={0.8}
          title="AI Clinical Documentation"
          desc="Notes written in seconds, not hours."
          accent="#F97316"
        />
        <FeatureCard
          delay={1.6}
          title="ASAM Treatment Planning"
          desc="6-dimension framework with AI goal suggestions."
          accent="#FBBF24"
        />
        <FeatureCard
          delay={2.4}
          title="Live Census & Bed Board"
          desc="Real-time floor visibility at a glance."
          accent="#2563EB"
        />
        <FeatureCard
          delay={3.2}
          title="Compliance-Ready"
          desc="Audit trails, co-signs, e-signatures built in."
          accent="#10b981"
        />
      </div>
    </motion.div>
  );
}

function FeatureCard({
  delay,
  title,
  desc,
  accent,
}: {
  delay: number;
  title: string;
  desc: string;
  accent: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 80, rotateX: 15 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 1, delay, type: 'spring', stiffness: 90, damping: 20 }}
      className="flex-1 bg-[#1E293B]/80 backdrop-blur-md border border-white/10 rounded-3xl p-[2vw] flex flex-col gap-3 shadow-2xl relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-[3px]" style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }} />
      <h3 className="text-[1.5vw] font-display font-semibold text-white leading-tight">
        {title}
      </h3>
      <p className="text-[1.1vw] text-[#94a3b8] leading-relaxed font-body">
        {desc}
      </p>
    </motion.div>
  );
}
