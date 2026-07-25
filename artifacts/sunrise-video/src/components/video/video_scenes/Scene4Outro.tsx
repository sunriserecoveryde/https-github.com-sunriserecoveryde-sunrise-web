import { motion } from 'framer-motion';

export function Scene4Outro() {
  return (
    <motion.div
      className="absolute inset-0 w-full h-full flex flex-col items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="relative z-10 flex flex-col items-center gap-[5vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="drop-shadow-[0_0_40px_rgba(249,115,22,0.5)]"
        >
          <img
            src={`${import.meta.env.BASE_URL}sunrise-logo.png`}
            alt="Sunrise OS"
            className="w-64 h-auto object-contain"
          />
        </motion.div>

        <div className="text-center overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0, ease: [0.16, 1, 0.3, 1] }}
            className="text-[3vw] font-display font-medium text-white tracking-tight"
          >
            Built by clinicians.{' '}
            <span className="text-[#F97316]">Trusted by operators.</span>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.8 }}
          className="mt-[2vh]"
        >
          <div className="px-[3vw] py-[1.5vh] rounded-full border border-white/20 bg-white/5 backdrop-blur-md">
            <span className="text-[1.8vw] font-mono text-[#FBBF24]">getsunriseos.com</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
