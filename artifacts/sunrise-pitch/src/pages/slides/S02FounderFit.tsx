export default function S02FounderFit() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_15%,#1A3A5E_0%,transparent_55%)]" />

      <div className="relative z-10 flex flex-col h-full px-[8vw] pt-[5vh] pb-[3vh]">
        <div className="mb-[3vh]">
          <div className="text-primary text-[1.15vw] font-body font-semibold tracking-[0.25em] uppercase mb-[1.2vh]">
            02 · Founder-Market Fit
          </div>
          <h2 className="font-display text-[4vw] font-bold text-text leading-tight">
            We've Lived the Problem
          </h2>
          <div className="w-[6vw] h-[0.35vh] bg-primary mt-[1.5vh]" />
        </div>

        <div className="flex gap-[5vw] flex-1 min-h-0">
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-[1.75vw] text-[#B8C8D8] font-body leading-relaxed mb-[3.5vh]">
              Sunrise OS is built by operators and technologists who have run behavioral health facilities — not consultants who studied them.
            </p>
            <div className="border-l-[0.3vw] border-primary pl-[2.5vw] mb-[4vh]">
              <p className="text-[1.6vw] text-[#D4E2F0] font-body italic leading-relaxed">
                "No single system showed us the full clinical picture. We made critical decisions with incomplete data — and watched the consequences in patient outcomes and staff turnover."
              </p>
              <p className="text-[1.25vw] text-[#7A96B0] mt-[1.5vh] font-body">
                — Founding team, combined clinical and health-tech experience
              </p>
            </div>
            <div className="flex gap-[4vw] items-center">
              <div className="text-center">
                <div className="text-[3.2vw] font-display font-black text-accent leading-none">12+</div>
                <div className="text-[1.25vw] text-[#7A96B0] font-body mt-[0.5vh]">Yrs clinical ops</div>
              </div>
              <div className="w-px h-[6vh] bg-[#2A4A7E]" />
              <div className="text-center">
                <div className="text-[3.2vw] font-display font-black text-accent leading-none">9+</div>
                <div className="text-[1.25vw] text-[#7A96B0] font-body mt-[0.5vh]">Yrs health-tech</div>
              </div>
              <div className="w-px h-[6vh] bg-[#2A4A7E]" />
              <div className="text-center">
                <div className="text-[3.2vw] font-display font-black text-accent leading-none">3</div>
                <div className="text-[1.25vw] text-[#7A96B0] font-body mt-[0.5vh]">Facilities operated</div>
              </div>
            </div>
          </div>

          <div className="w-[35vw] flex flex-col gap-[2.5vh] justify-center">
            <div className="bg-[#1A3A5E] rounded-2xl p-[2.5vh] border border-[#2A4A7E]/50">
              <div className="text-accent text-[1.1vw] font-body font-semibold uppercase tracking-[0.2em] mb-[1vh]">
                Clinical Leadership
              </div>
              <div className="text-[1.9vw] font-display font-bold text-text mb-[0.8vh]">
                Dr. Sarah Okonkwo
              </div>
              <div className="text-[1.3vw] text-[#7A96B0] mb-[1.2vh] font-body">
                LCADC, CADC-III · 12 years in SUD / behavioral health operations
              </div>
              <div className="text-[1.4vw] text-[#B8C8D8] font-body leading-snug">
                Directed a 48-bed residential treatment center. Experienced fragmentation firsthand — census on whiteboards, compliance tracked in spreadsheets.
              </div>
            </div>
            <div className="bg-[#1A3A5E] rounded-2xl p-[2.5vh] border border-[#2A4A7E]/50">
              <div className="text-accent text-[1.1vw] font-body font-semibold uppercase tracking-[0.2em] mb-[1vh]">
                Health-Tech Engineering
              </div>
              <div className="text-[1.9vw] font-display font-bold text-text mb-[0.8vh]">
                Marcus Chen
              </div>
              <div className="text-[1.3vw] text-[#7A96B0] mb-[1.2vh] font-body">
                MS Health Informatics · 9 years building clinical software products
              </div>
              <div className="text-[1.4vw] text-[#B8C8D8] font-body leading-snug">
                Built integrations across disconnected clinical systems. Saw the data gap from the engineering side — and its direct patient consequences.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-[0.4vh] bg-gradient-to-r from-primary via-accent to-teal" />
    </div>
  );
}
