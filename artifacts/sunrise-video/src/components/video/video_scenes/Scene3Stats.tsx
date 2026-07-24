import { motion } from 'framer-motion';

export function Scene3Stats() {
  return (
    <motion.div
      className="absolute inset-0 w-full h-full flex flex-col items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'linear-gradient(#F97316 1px, transparent 1px), linear-gradient(90deg, #F97316 1px, transparent 1px)',
          backgroundSize: '4vw 4vw',
        }}
      />

      <div className="relative z-10 w-full h-full flex flex-col justify-center gap-[6vh] px-[15vw]">
        <StatRow value="90 min" label="saved per shift" delay={0.4} />
        <StatRow value="40% → 8%" label="documentation time" delay={1.2} color="text-[#FBBF24]" />
        <StatRow value="$150" label="per bed / month" delay={2.0} color="text-[#10b981]" />
      </div>
    </motion.div>
  );
}

function StatRow({
  value,
  label,
  delay,
  color = 'text-white',
}: {
  value: string;
  label: string;
  delay: number;
  color?: string;
}) {
  return (
    <div className="flex items-end gap-[3vw] border-b border-white/10 pb-[2vh]">
      <div className="overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay, type: 'spring', stiffness: 80, damping: 20 }}
          className={`text-[8vw] leading-none font-display font-bold tracking-tighter ${color}`}
        >
          {value}
        </motion.div>
      </div>
      <div className="overflow-hidden mb-[1vw]">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: delay + 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="text-[2.5vw] text-[#94a3b8] font-body"
        >
          {label}
        </motion.div>
      </div>
    </div>
  );
}
