export default function S15Roadmap() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,#1A2A3E_0%,transparent_55%)]" />

      <div className="relative z-10 flex flex-col h-full px-[7vw] pt-[5vh] pb-[3vh]">
        <div className="mb-[4vh]">
          <div className="text-primary text-[1.15vw] font-body font-semibold tracking-[0.25em] uppercase mb-[1.2vh]">
            15 · Roadmap
          </div>
          <h2 className="font-display text-[4vw] font-bold text-text leading-tight">
            From Pilot to Platform
          </h2>
          <div className="w-[6vw] h-[0.35vh] bg-primary mt-[1.5vh]" />
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="relative flex items-center mb-[4vh]">
            <div className="absolute left-0 right-0 h-[0.3vh] bg-[#2A4A7E] top-1/2 -translate-y-1/2" />
            <div className="flex justify-between w-full relative z-10">
              <div className="w-[1.5vw] h-[1.5vw] rounded-full bg-primary border-[0.2vw] border-bg flex items-center justify-center">
                <div className="w-[0.6vw] h-[0.6vw] rounded-full bg-bg" />
              </div>
              <div className="w-[1.5vw] h-[1.5vw] rounded-full bg-accent border-[0.2vw] border-bg flex items-center justify-center">
                <div className="w-[0.6vw] h-[0.6vw] rounded-full bg-bg" />
              </div>
              <div className="w-[1.5vw] h-[1.5vw] rounded-full bg-teal border-[0.2vw] border-bg flex items-center justify-center">
                <div className="w-[0.6vw] h-[0.6vw] rounded-full bg-bg" />
              </div>
              <div className="w-[1.5vw] h-[1.5vw] rounded-full bg-[#7A96B0] border-[0.2vw] border-bg flex items-center justify-center">
                <div className="w-[0.6vw] h-[0.6vw] rounded-full bg-bg" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-[2vw] flex-1 min-h-0">
            <div className="bg-[#1A2A0F] border border-primary/40 rounded-2xl p-[2.5vh] flex flex-col">
              <div className="text-primary text-[1.15vw] font-body font-black uppercase tracking-[0.15em] mb-[0.8vh]">Phase 1</div>
              <div className="text-[1.6vw] font-display font-bold text-text mb-[0.5vh]">Foundation</div>
              <div className="text-[1.25vw] text-[#7A96B0] font-body mb-[2vh]">
                [Q[X] 20XX — PLACEHOLDER]
              </div>
              <div className="space-y-[1.5vh] flex-1">
                <div className="flex items-start gap-[1vw]">
                  <div className="w-[0.4vw] h-[0.4vw] rounded-full bg-primary mt-[0.8vh] flex-none" />
                  <p className="text-[1.35vw] text-[#B8C8D8] font-body leading-snug">Complete core clinical EHR module</p>
                </div>
                <div className="flex items-start gap-[1vw]">
                  <div className="w-[0.4vw] h-[0.4vw] rounded-full bg-primary mt-[0.8vh] flex-none" />
                  <p className="text-[1.35vw] text-[#B8C8D8] font-body leading-snug">Pilot with [X] facilities [PLACEHOLDER]</p>
                </div>
                <div className="flex items-start gap-[1vw]">
                  <div className="w-[0.4vw] h-[0.4vw] rounded-full bg-primary mt-[0.8vh] flex-none" />
                  <p className="text-[1.35vw] text-[#B8C8D8] font-body leading-snug">Sunrise Staff mobile v1 launched</p>
                </div>
              </div>
            </div>

            <div className="bg-[#1E1A0A] border border-accent/40 rounded-2xl p-[2.5vh] flex flex-col">
              <div className="text-accent text-[1.15vw] font-body font-black uppercase tracking-[0.15em] mb-[0.8vh]">Phase 2</div>
              <div className="text-[1.6vw] font-display font-bold text-text mb-[0.5vh]">Validation</div>
              <div className="text-[1.25vw] text-[#7A96B0] font-body mb-[2vh]">
                [Q[X] 20XX — PLACEHOLDER]
              </div>
              <div className="space-y-[1.5vh] flex-1">
                <div className="flex items-start gap-[1vw]">
                  <div className="w-[0.4vw] h-[0.4vw] rounded-full bg-accent mt-[0.8vh] flex-none" />
                  <p className="text-[1.35vw] text-[#B8C8D8] font-body leading-snug">Pilot outcomes documented</p>
                </div>
                <div className="flex items-start gap-[1vw]">
                  <div className="w-[0.4vw] h-[0.4vw] rounded-full bg-accent mt-[0.8vh] flex-none" />
                  <p className="text-[1.35vw] text-[#B8C8D8] font-body leading-snug">Revenue cycle module live</p>
                </div>
                <div className="flex items-start gap-[1vw]">
                  <div className="w-[0.4vw] h-[0.4vw] rounded-full bg-accent mt-[0.8vh] flex-none" />
                  <p className="text-[1.35vw] text-[#B8C8D8] font-body leading-snug">Seek applicable regulatory clearances [PLACEHOLDER]</p>
                </div>
              </div>
            </div>

            <div className="bg-[#0A1E1E] border border-teal/40 rounded-2xl p-[2.5vh] flex flex-col">
              <div className="text-teal text-[1.15vw] font-body font-black uppercase tracking-[0.15em] mb-[0.8vh]">Phase 3</div>
              <div className="text-[1.6vw] font-display font-bold text-text mb-[0.5vh]">Scale</div>
              <div className="text-[1.25vw] text-[#7A96B0] font-body mb-[2vh]">
                [Q[X] 20XX — PLACEHOLDER]
              </div>
              <div className="space-y-[1.5vh] flex-1">
                <div className="flex items-start gap-[1vw]">
                  <div className="w-[0.4vw] h-[0.4vw] rounded-full bg-teal mt-[0.8vh] flex-none" />
                  <p className="text-[1.35vw] text-[#B8C8D8] font-body leading-snug">[X] facilities contracted [PLACEHOLDER]</p>
                </div>
                <div className="flex items-start gap-[1vw]">
                  <div className="w-[0.4vw] h-[0.4vw] rounded-full bg-teal mt-[0.8vh] flex-none" />
                  <p className="text-[1.35vw] text-[#B8C8D8] font-body leading-snug">AI module in beta</p>
                </div>
                <div className="flex items-start gap-[1vw]">
                  <div className="w-[0.4vw] h-[0.4vw] rounded-full bg-teal mt-[0.8vh] flex-none" />
                  <p className="text-[1.35vw] text-[#B8C8D8] font-body leading-snug">Regional sales team deployed</p>
                </div>
              </div>
            </div>

            <div className="bg-[#1A3A5E] border border-[#2A4A7E]/60 rounded-2xl p-[2.5vh] flex flex-col">
              <div className="text-[#7A96B0] text-[1.15vw] font-body font-black uppercase tracking-[0.15em] mb-[0.8vh]">Phase 4</div>
              <div className="text-[1.6vw] font-display font-bold text-text mb-[0.5vh]">Expansion</div>
              <div className="text-[1.25vw] text-[#7A96B0] font-body mb-[2vh]">
                [Q[X] 20XX — PLACEHOLDER]
              </div>
              <div className="space-y-[1.5vh] flex-1">
                <div className="flex items-start gap-[1vw]">
                  <div className="w-[0.4vw] h-[0.4vw] rounded-full bg-[#7A96B0] mt-[0.8vh] flex-none" />
                  <p className="text-[1.35vw] text-[#B8C8D8] font-body leading-snug">Full AI and interoperability suite</p>
                </div>
                <div className="flex items-start gap-[1vw]">
                  <div className="w-[0.4vw] h-[0.4vw] rounded-full bg-[#7A96B0] mt-[0.8vh] flex-none" />
                  <p className="text-[1.35vw] text-[#B8C8D8] font-body leading-snug">Market expansion into mental health and dual-diagnosis</p>
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
