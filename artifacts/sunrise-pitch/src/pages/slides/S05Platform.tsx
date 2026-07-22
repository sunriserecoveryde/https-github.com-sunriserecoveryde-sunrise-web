export default function S05Platform() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_90%_50%,#1A2A3E_0%,transparent_55%)]" />

      <div className="relative z-10 flex flex-col h-full px-[8vw] pt-[5vh] pb-[3vh]">
        <div className="mb-[3vh]">
          <div className="text-primary text-[1.15vw] font-body font-semibold tracking-[0.25em] uppercase mb-[1.2vh]">
            05 · Integrated Platform
          </div>
          <h2 className="font-display text-[4vw] font-bold text-text leading-tight">
            Five Layers. One Source of Truth.
          </h2>
          <div className="w-[6vw] h-[0.35vh] bg-primary mt-[1.5vh]" />
        </div>

        <div className="flex gap-[5vw] flex-1 min-h-0">
          <div className="flex-1 flex flex-col justify-center gap-[1.8vh]">
            <div className="flex items-stretch gap-[2vw]">
              <div className="flex flex-col items-center gap-0">
                <div className="w-[0.35vw] flex-1 bg-gradient-to-b from-transparent to-[#7A96B0]/20 rounded-full" />
                <div className="w-[2.5vw] h-[2.5vw] rounded-full bg-[#1A3A5E] border border-[#2A4A7E] flex items-center justify-center text-[#7A96B0] text-[1.2vw] font-display font-black">1</div>
                <div className="w-[0.35vw] flex-1 bg-gradient-to-b from-[#7A96B0]/20 to-[#7A96B0]/20 rounded-full" />
              </div>
              <div className="flex-1 bg-[#1A3A5E] rounded-xl border border-[#2A4A7E]/50 p-[2vh] flex items-center gap-[2vw]">
                <div className="flex-1">
                  <div className="text-[1.6vw] font-display font-bold text-text mb-[0.4vh]">Clinical EHR</div>
                  <div className="text-[1.3vw] text-[#7A96B0] font-body">Assessments · progress notes · treatment plans · e-signature</div>
                </div>
              </div>
            </div>

            <div className="flex items-stretch gap-[2vw]">
              <div className="flex flex-col items-center gap-0">
                <div className="w-[0.35vw] flex-1 bg-[#7A96B0]/20 rounded-full" />
                <div className="w-[2.5vw] h-[2.5vw] rounded-full bg-[#1A3A5E] border border-[#2A4A7E] flex items-center justify-center text-[#7A96B0] text-[1.2vw] font-display font-black">2</div>
                <div className="w-[0.35vw] flex-1 bg-[#7A96B0]/20 rounded-full" />
              </div>
              <div className="flex-1 bg-[#1A3A5E] rounded-xl border border-[#2A4A7E]/50 p-[2vh] flex items-center gap-[2vw]">
                <div className="flex-1">
                  <div className="text-[1.6vw] font-display font-bold text-text mb-[0.4vh]">Operational Management</div>
                  <div className="text-[1.3vw] text-[#7A96B0] font-body">Census · bed board · scheduling · shift handoffs</div>
                </div>
              </div>
            </div>

            <div className="flex items-stretch gap-[2vw]">
              <div className="flex flex-col items-center gap-0">
                <div className="w-[0.35vw] flex-1 bg-[#7A96B0]/20 rounded-full" />
                <div className="w-[2.5vw] h-[2.5vw] rounded-full bg-[#1A3A5E] border border-[#2A4A7E] flex items-center justify-center text-[#7A96B0] text-[1.2vw] font-display font-black">3</div>
                <div className="w-[0.35vw] flex-1 bg-[#7A96B0]/20 rounded-full" />
              </div>
              <div className="flex-1 bg-[#1A3A5E] rounded-xl border border-[#2A4A7E]/50 p-[2vh] flex items-center gap-[2vw]">
                <div className="flex-1">
                  <div className="text-[1.6vw] font-display font-bold text-text mb-[0.4vh]">Revenue Cycle</div>
                  <div className="text-[1.3vw] text-[#7A96B0] font-body">Billing · claims · authorizations · denial tracking</div>
                </div>
              </div>
            </div>

            <div className="flex items-stretch gap-[2vw]">
              <div className="flex flex-col items-center gap-0">
                <div className="w-[0.35vw] flex-1 bg-[#7A96B0]/20 rounded-full" />
                <div className="w-[2.5vw] h-[2.5vw] rounded-full bg-[#1A3A5E] border border-[#2A4A7E] flex items-center justify-center text-[#7A96B0] text-[1.2vw] font-display font-black">4</div>
                <div className="w-[0.35vw] flex-1 bg-[#7A96B0]/20 rounded-full" />
              </div>
              <div className="flex-1 bg-[#1A3A5E] rounded-xl border border-[#2A4A7E]/50 p-[2vh] flex items-center gap-[2vw]">
                <div className="flex-1">
                  <div className="text-[1.6vw] font-display font-bold text-text mb-[0.4vh]">Compliance Management</div>
                  <div className="text-[1.3vw] text-[#7A96B0] font-body">Credential tracking · audit logs · incident reporting</div>
                </div>
              </div>
            </div>

            <div className="flex items-stretch gap-[2vw]">
              <div className="flex flex-col items-center gap-0">
                <div className="w-[0.35vw] flex-1 bg-[#7A96B0]/20 rounded-full" />
                <div className="w-[2.5vw] h-[2.5vw] rounded-full bg-[#F05A28] border border-[#F05A28] flex items-center justify-center text-white text-[1.2vw] font-display font-black">5</div>
                <div className="w-[0.35vw] flex-1 bg-transparent rounded-full" />
              </div>
              <div className="flex-1 bg-[#1E2E1E] rounded-xl border border-[#F05A28]/40 p-[2vh] flex items-center gap-[2vw]">
                <div className="flex-1">
                  <div className="text-[1.6vw] font-display font-bold text-primary mb-[0.4vh]">AI-Powered Intelligence</div>
                  <div className="text-[1.3vw] text-[#7A96B0] font-body">Real-time alerts · documentation assist · outcome prediction</div>
                </div>
                <div className="text-[1.15vw] text-primary font-body font-semibold uppercase tracking-[0.15em] flex-none">
                  Greatest Emphasis
                </div>
              </div>
            </div>
          </div>

          <div className="w-[28vw] flex flex-col justify-center">
            <div className="bg-[#1A3A5E] rounded-2xl border border-[#2A4A7E]/50 p-[3vh] text-center">
              <div className="text-[1.2vw] text-[#7A96B0] font-body uppercase tracking-[0.2em] mb-[2.5vh]">
                The core promise
              </div>
              <div className="text-[2.2vw] font-display font-bold text-text leading-snug mb-[2.5vh]">
                Data entered once. Shared across every layer instantly.
              </div>
              <div className="w-[5vw] h-[0.3vh] bg-primary mx-auto mb-[2.5vh]" />
              <div className="text-[1.45vw] text-[#B8C8D8] font-body leading-relaxed">
                No re-entry. No sync failures. No version conflicts between systems.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-[0.4vh] bg-gradient-to-r from-primary via-accent to-teal" />
    </div>
  );
}
