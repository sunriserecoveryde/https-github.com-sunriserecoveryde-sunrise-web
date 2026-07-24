import { motion } from 'framer-motion';

export function Scene1Problem() {
  return (
    <motion.div
      className="absolute inset-0 w-full h-full flex flex-col items-center justify-center overflow-hidden bg-[#0F172A]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: '-5vw' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        className="absolute inset-0 w-full h-full"
        initial={{ opacity: 0, filter: 'blur(20px)' }}
        animate={{ opacity: 0.2, filter: 'blur(10px)' }}
        transition={{ duration: 2, ease: 'easeOut' }}
      >
        <img
          src={`${import.meta.env.BASE_URL}bg-clinical.jpg`}
          alt="Clinical Background"
          className="w-full h-full object-cover mix-blend-overlay grayscale"
        />
        <div className="absolute inset-0 bg-[#0F172A]/80" />
      </motion.div>

      <motion.div
        className="absolute w-[40vw] h-[40vw] rounded-full bg-red-500/10 blur-[100px]"
        initial={{ x: '10vw', y: '10vh' }}
        animate={{ x: '-10vw', y: '-10vh' }}
        transition={{ duration: 5, ease: 'linear' }}
      />

      <div className="relative z-10 w-full px-[15vw] flex flex-col gap-6">
        <motion.p
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-[3vw] text-[#94a3b8] font-display font-medium"
        >
          The status quo is broken.
        </motion.p>

        <div className="flex flex-col gap-2">
          <RevealText text="Fragmented tools." delay={0.8} />
          <RevealText text="2+ hours of documentation per shift." delay={1.4} />
          <RevealText text="Staff burnout." delay={2.0} color="text-[#ef4444]" />
        </div>
      </div>
    </motion.div>
  );
}

function RevealText({ text, delay, color = 'text-white' }: { text: string; delay: number; color?: string }) {
  return (
    <div className="overflow-hidden">
      <motion.h2
        initial={{ opacity: 0, y: 50, rotateX: -20 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
        className={`text-[5vw] leading-[1.1] font-display font-semibold tracking-tight ${color}`}
      >
        {text}
      </motion.h2>
    </div>
  );
}
