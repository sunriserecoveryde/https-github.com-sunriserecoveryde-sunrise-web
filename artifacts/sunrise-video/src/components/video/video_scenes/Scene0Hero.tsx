import { motion } from 'framer-motion';

export function Scene0Hero() {
  return (
    <motion.div
      className="absolute inset-0 w-full h-full flex flex-col items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-[10vw]">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8 overflow-hidden rounded-2xl shadow-2xl"
        >
          <img
            src={`${import.meta.env.BASE_URL}og.jpg`}
            alt="Sunrise OS"
            className="w-48 h-auto object-contain"
          />
        </motion.div>

        <div className="overflow-hidden">
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-[4.5vw] leading-[1.1] font-display font-semibold text-white tracking-tight"
          >
            The operating system built for
            <br />
            <span className="text-[#F97316]">behavioral healthcare</span>
          </motion.h1>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 0.6, y: 0 }}
          transition={{ duration: 0.8, delay: 1.6, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 text-[1.6vw] text-[#94a3b8] font-body"
        >
          Purpose-built for SUD &amp; behavioral health organizations
        </motion.p>
      </div>
    </motion.div>
  );
}
