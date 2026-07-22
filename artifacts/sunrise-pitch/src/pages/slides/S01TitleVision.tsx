const base = import.meta.env.BASE_URL;

export default function S01TitleVision() {
  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <img
        src={`${base}hero-sunrise.jpg`}
        crossOrigin="anonymous"
        className="absolute inset-0 w-full h-full object-cover"
        alt=""
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#070F1A] via-[#0C2238]/88 to-[#0F2B4B]/30" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0C2238]/40 to-transparent" />

      <div className="absolute top-[4vh] left-[6vw] right-[6vw] flex justify-between items-center z-10">
        <span className="text-primary text-[1.2vw] font-body font-semibold tracking-[0.3em] uppercase">Sunrise OS</span>
        <span className="text-[#7A96B0] text-[1.2vw] font-body">Investor Presentation · 2026</span>
      </div>

      <div className="absolute z-10 left-[7vw] right-[18vw]" style={{ bottom: '10vh' }}>
        <div className="text-[#7A96B0] text-[1.3vw] font-body uppercase tracking-[0.25em] mb-[2.5vh]">
          Behavioral Health Technology
        </div>
        <h1 className="font-display text-[8vw] font-black text-text leading-none tracking-tight">
          Sunrise OS
        </h1>
        <div className="flex items-center gap-[2.5vw] mt-[2.5vh] mb-[3.5vh]">
          <div className="h-[0.4vh] w-[10vw] bg-gradient-to-r from-primary to-accent flex-none" />
          <p className="text-[2.2vw] font-display text-text leading-tight font-bold" style={{ textWrap: 'balance' }}>
            The Operating System for Behavioral Healthcare
          </p>
        </div>
        <p className="text-[1.7vw] text-[#B8C8D8] font-body font-light leading-relaxed max-w-[48vw]">
          One platform. Every clinical decision. Every operational workflow. Every patient outcome.
        </p>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-[0.55vh] bg-gradient-to-r from-primary via-accent to-teal" />
    </div>
  );
}
