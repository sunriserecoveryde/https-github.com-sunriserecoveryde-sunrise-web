export default function S12Market() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_90%_90%,#1A2A3E_0%,transparent_50%)]" />

      <div className="relative z-10 flex flex-col h-full px-[8vw] pt-[5vh] pb-[3vh]">
        <div className="mb-[3vh]">
          <div className="text-primary text-[1.15vw] font-body font-semibold tracking-[0.25em] uppercase mb-[1.2vh]">
            12 · Market Opportunity
          </div>
          <h2 className="font-display text-[4vw] font-bold text-text leading-tight">
            A Large, Underserved Market — With a Clear Expansion Path
          </h2>
          <div className="w-[6vw] h-[0.35vh] bg-primary mt-[1.5vh]" />
        </div>

        <div className="flex gap-[5vw] flex-1 min-h-0">
          <div className="flex-1 flex flex-col justify-center">
            <div className="text-[1.2vw] text-[#7A96B0] font-body uppercase tracking-[0.2em] mb-[1.5vh]">Beachhead market</div>
            <div className="text-[1.7vw] font-body font-semibold text-text mb-[2.5vh]">
              SUD residential, PHP, and IOP treatment facilities
            </div>

            <div className="grid grid-cols-2 gap-[2vw] mb-[3vh]">
              <div className="bg-[#1A3A5E] rounded-xl border border-[#2A4A7E]/50 p-[2.5vh] text-center">
                <div className="text-[4vw] font-display font-black text-accent leading-none">[X,XXX]</div>
                <div className="text-[1.2vw] text-[#7A96B0] font-body mt-[0.8vh]">Licensed SUD facilities in the U.S.</div>
                <div className="text-[1vw] text-[#4A6A8E] font-body mt-[0.5vh]">[STAT — VERIFY via SAMHSA NSSATS]</div>
              </div>
              <div className="bg-[#1A3A5E] rounded-xl border border-[#2A4A7E]/50 p-[2.5vh] text-center">
                <div className="text-[4vw] font-display font-black text-accent leading-none">$[X]B</div>
                <div className="text-[1.2vw] text-[#7A96B0] font-body mt-[0.8vh]">SUD treatment software market</div>
                <div className="text-[1vw] text-[#4A6A8E] font-body mt-[0.5vh]">[STAT — VERIFY: IBIS World / Grand View]</div>
              </div>
            </div>

            <div className="bg-[#1A3A5E] rounded-xl border border-[#2A4A7E]/50 p-[2.5vh]">
              <div className="text-[1.2vw] text-[#7A96B0] font-body uppercase tracking-[0.15em] mb-[1.2vh]">Typical facility profile</div>
              <div className="flex gap-[3vw]">
                <div>
                  <div className="text-[2.2vw] font-display font-bold text-text">20–100</div>
                  <div className="text-[1.2vw] text-[#7A96B0] font-body">beds per facility</div>
                </div>
                <div className="w-px bg-[#2A4A7E]" />
                <div>
                  <div className="text-[2.2vw] font-display font-bold text-text">3–8</div>
                  <div className="text-[1.2vw] text-[#7A96B0] font-body">clinical staff</div>
                </div>
                <div className="w-px bg-[#2A4A7E]" />
                <div>
                  <div className="text-[2.2vw] font-display font-bold text-text">5–8</div>
                  <div className="text-[1.2vw] text-[#7A96B0] font-body">software systems today</div>
                </div>
              </div>
              <div className="text-[1.1vw] text-[#4A6A8E] font-body mt-[1.2vh]">
                [STAT — VERIFY all figures before investor presentation]
              </div>
            </div>
          </div>

          <div className="w-[30vw] flex flex-col justify-center gap-[2vh]">
            <div className="text-[1.2vw] text-[#7A96B0] font-body uppercase tracking-[0.2em] mb-[0.5vh]">Expansion path</div>

            <div className="relative flex flex-col gap-0">
              <div className="flex items-center gap-[2vw]">
                <div className="w-[1vw] h-[1vw] rounded-full bg-primary flex-none" />
                <div className="flex-1 bg-primary/15 border border-primary/40 rounded-xl p-[1.8vh]">
                  <div className="text-[1.4vw] font-body font-semibold text-primary">Now — SUD Residential / PHP / IOP</div>
                  <div className="text-[1.2vw] text-[#B8C8D8] font-body mt-[0.3vh]">Highest fragmentation. Fastest adoption.</div>
                </div>
              </div>
              <div className="w-[0.15vw] h-[2vh] bg-[#2A4A7E] ml-[0.43vw]" />

              <div className="flex items-center gap-[2vw]">
                <div className="w-[1vw] h-[1vw] rounded-full bg-accent flex-none" />
                <div className="flex-1 bg-[#1A3A5E] border border-[#2A4A7E]/50 rounded-xl p-[1.8vh]">
                  <div className="text-[1.4vw] font-body font-semibold text-accent">Dual-Diagnosis Programs</div>
                  <div className="text-[1.2vw] text-[#B8C8D8] font-body mt-[0.3vh]">Co-occurring disorder, integrated care</div>
                </div>
              </div>
              <div className="w-[0.15vw] h-[2vh] bg-[#2A4A7E] ml-[0.43vw]" />

              <div className="flex items-center gap-[2vw]">
                <div className="w-[1vw] h-[1vw] rounded-full bg-teal flex-none" />
                <div className="flex-1 bg-[#1A3A5E] border border-[#2A4A7E]/50 rounded-xl p-[1.8vh]">
                  <div className="text-[1.4vw] font-body font-semibold text-teal">Mental Health Residential</div>
                  <div className="text-[1.2vw] text-[#B8C8D8] font-body mt-[0.3vh]">Inpatient, outpatient, step-down</div>
                </div>
              </div>
              <div className="w-[0.15vw] h-[2vh] bg-[#2A4A7E] ml-[0.43vw]" />

              <div className="flex items-center gap-[2vw]">
                <div className="w-[1vw] h-[1vw] rounded-full bg-[#7A96B0] flex-none" />
                <div className="flex-1 bg-[#1A3A5E] border border-[#2A4A7E]/50 rounded-xl p-[1.8vh]">
                  <div className="text-[1.4vw] font-body font-semibold text-[#B8C8D8]">Broader Behavioral Health</div>
                  <div className="text-[1.2vw] text-[#7A96B0] font-body mt-[0.3vh]">Adolescent, multi-site, payer-agnostic</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-[0.4vh] bg-gradient-to-r from-primary via-accent to-teal" />
    </div>
  );
}
