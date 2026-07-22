export default function S10Mobile() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,#1A2A3E_0%,transparent_55%)]" />

      <div className="relative z-10 flex flex-col h-full px-[8vw] pt-[5vh] pb-[3vh]">
        <div className="mb-[2.5vh]">
          <div className="text-primary text-[1.15vw] font-body font-semibold tracking-[0.25em] uppercase mb-[1.2vh]">
            10 · Mobile Application
          </div>
          <h2 className="font-display text-[4vw] font-bold text-text leading-tight">
            Clinical Workflows That Follow the Staff
          </h2>
          <div className="w-[6vw] h-[0.35vh] bg-primary mt-[1.5vh]" />
        </div>

        <div className="flex gap-[5vw] flex-1 min-h-0">
          <div className="flex-1 flex flex-col justify-center gap-[2vh]">
            <div className="text-[1.55vw] text-[#7A96B0] font-body mb-[0.5vh]">
              Sunrise Staff — iOS and Android. Designed for nurses, BHTs, and counselors.
            </div>
            <div className="space-y-[1.8vh]">
              <div className="flex items-start gap-[1.5vw]">
                <div className="w-[0.5vw] h-[0.5vw] rounded-full bg-teal mt-[0.9vh] flex-none" />
                <p className="text-[1.6vw] text-[#B8C8D8] font-body leading-snug">
                  Shift handoff notes: structured, timestamped, mobile-native
                </p>
              </div>
              <div className="flex items-start gap-[1.5vw]">
                <div className="w-[0.5vw] h-[0.5vw] rounded-full bg-teal mt-[0.9vh] flex-none" />
                <p className="text-[1.6vw] text-[#B8C8D8] font-body leading-snug">
                  Patient alerts pushed to phone — withdrawal threshold, AMA risk, urgent tasks
                </p>
              </div>
              <div className="flex items-start gap-[1.5vw]">
                <div className="w-[0.5vw] h-[0.5vw] rounded-full bg-teal mt-[0.9vh] flex-none" />
                <p className="text-[1.6vw] text-[#B8C8D8] font-body leading-snug">
                  Census view and bed board accessible on the floor
                </p>
              </div>
              <div className="flex items-start gap-[1.5vw]">
                <div className="w-[0.5vw] h-[0.5vw] rounded-full bg-teal mt-[0.9vh] flex-none" />
                <p className="text-[1.6vw] text-[#B8C8D8] font-body leading-snug">
                  Secure HIPAA-compliant messaging between clinical staff
                </p>
              </div>
              <div className="flex items-start gap-[1.5vw]">
                <div className="w-[0.5vw] h-[0.5vw] rounded-full bg-teal mt-[0.9vh] flex-none" />
                <p className="text-[1.6vw] text-[#B8C8D8] font-body leading-snug">
                  Withdrawal scores (CIWA / COWS) logged directly from the bedside
                </p>
              </div>
            </div>
            <div className="bg-[#1A3A5E] rounded-xl border border-[#2A4A7E]/50 p-[2vh] mt-[1vh]">
              <div className="text-[1.25vw] text-[#7A96B0] font-body uppercase tracking-[0.15em] mb-[0.8vh]">Design principle</div>
              <div className="text-[1.5vw] text-text font-body">
                Every workflow built for one-handed use on the floor — not adapted from a desktop interface.
              </div>
            </div>
          </div>

          <div className="flex gap-[3vw] items-center justify-center">
            <div className="flex flex-col items-center gap-[1.5vh]">
              <div className="w-[14vw] bg-[#0A1F35] rounded-[2.5vw] border-[0.4vw] border-[#2A4A7E] overflow-hidden flex flex-col" style={{height: '58vh'}}>
                <div className="bg-[#0A1F35] h-[2.5vh] flex items-center justify-center flex-none">
                  <div className="w-[4vw] h-[0.5vh] bg-[#2A4A7E] rounded-full" />
                </div>
                <div className="flex-1 bg-[#0F2B4B] flex flex-col overflow-hidden">
                  <div className="bg-[#1A3A5E] px-[1.5vw] py-[1.2vh] border-b border-[#2A4A7E]/60">
                    <div className="text-[1.1vw] font-body font-semibold text-text">Shift Handoff</div>
                    <div className="text-[0.9vw] text-teal font-body">Wed Jul 22 · 1900</div>
                  </div>
                  <div className="flex-1 p-[1.2vw] flex flex-col gap-[1vh] overflow-hidden">
                    <div className="bg-[#1A3A5E] rounded-lg p-[1vh]">
                      <div className="text-[0.95vw] text-text font-body font-semibold mb-[0.3vh]">Marcus Webb · 1A</div>
                      <div className="text-[0.85vw] text-[#B8C8D8] font-body leading-snug">CIWA score 12. AMA risk elevated. 1:1 with Jenkins completed 1600. Clonidine administered 1800.</div>
                    </div>
                    <div className="bg-[#1A3A5E] rounded-lg p-[1vh]">
                      <div className="text-[0.95vw] text-text font-body font-semibold mb-[0.3vh]">Destiny Williams · 1C</div>
                      <div className="text-[0.85vw] text-[#B8C8D8] font-body leading-snug">Stable. CIWA 4. Participated in all groups today.</div>
                    </div>
                    <div className="bg-[#1A3A5E] rounded-lg p-[1vh]">
                      <div className="text-[0.95vw] text-text font-body font-semibold mb-[0.3vh]">Travis Holden · 2B</div>
                      <div className="text-[0.85vw] text-[#B8C8D8] font-body leading-snug">Day 7. Assessment pending. Buprenorphine induction ongoing.</div>
                    </div>
                    <div className="mt-auto bg-[#F05A28]/15 border border-[#F05A28]/40 rounded-lg p-[1vh] text-center">
                      <div className="text-[1vw] text-primary font-body font-semibold">Complete Handoff</div>
                    </div>
                  </div>
                </div>
                <div className="h-[2vh] bg-[#0A1F35] flex-none" />
              </div>
              <div className="text-[1.2vw] text-[#7A96B0] font-body text-center">Shift Handoff</div>
            </div>

            <div className="flex flex-col items-center gap-[1.5vh]">
              <div className="w-[14vw] bg-[#0A1F35] rounded-[2.5vw] border-[0.4vw] border-[#2A4A7E] overflow-hidden flex flex-col" style={{height: '58vh'}}>
                <div className="bg-[#0A1F35] h-[2.5vh] flex items-center justify-center flex-none">
                  <div className="w-[4vw] h-[0.5vh] bg-[#2A4A7E] rounded-full" />
                </div>
                <div className="flex-1 bg-[#0F2B4B] flex flex-col overflow-hidden">
                  <div className="bg-[#1A3A5E] px-[1.5vw] py-[1.2vh] border-b border-[#2A4A7E]/60">
                    <div className="text-[1.1vw] font-body font-semibold text-text">Alerts</div>
                    <div className="text-[0.9vw] text-primary font-body">3 Active</div>
                  </div>
                  <div className="flex-1 p-[1.2vw] flex flex-col gap-[1vh] overflow-hidden">
                    <div className="bg-[#1E1A0A] border border-accent/50 rounded-lg p-[1.2vh]">
                      <div className="flex justify-between items-center mb-[0.5vh]">
                        <div className="text-[0.95vw] text-accent font-body font-semibold uppercase">AMA Risk</div>
                        <div className="text-[0.85vw] text-accent font-body">Score: 78</div>
                      </div>
                      <div className="text-[0.95vw] text-text font-body font-semibold">Marcus Webb</div>
                      <div className="text-[0.85vw] text-[#B8C8D8] font-body">Behavioral change — review required</div>
                    </div>
                    <div className="bg-[#1E1818] border border-primary/40 rounded-lg p-[1.2vh]">
                      <div className="flex justify-between items-center mb-[0.5vh]">
                        <div className="text-[0.95vw] text-primary font-body font-semibold uppercase">CIWA Alert</div>
                        <div className="text-[0.85vw] text-primary font-body">Score: 12</div>
                      </div>
                      <div className="text-[0.95vw] text-text font-body font-semibold">Marcus Webb</div>
                      <div className="text-[0.85vw] text-[#B8C8D8] font-body">Moderate — protocol check</div>
                    </div>
                    <div className="bg-[#1A3A5E] border border-[#2A4A7E]/50 rounded-lg p-[1.2vh]">
                      <div className="flex justify-between items-center mb-[0.5vh]">
                        <div className="text-[0.95vw] text-[#7A96B0] font-body font-semibold uppercase">Co-sign Due</div>
                        <div className="text-[0.85vw] text-[#7A96B0] font-body">24h window</div>
                      </div>
                      <div className="text-[0.95vw] text-text font-body font-semibold">Destiny Williams</div>
                      <div className="text-[0.85vw] text-[#B8C8D8] font-body">BHT note — needs signature</div>
                    </div>
                    <div className="mt-auto bg-[#1A3A5E] rounded-lg p-[1vh] text-center">
                      <div className="text-[1vw] text-[#7A96B0] font-body">Census · MAR · Messages</div>
                    </div>
                  </div>
                </div>
                <div className="h-[2vh] bg-[#0A1F35] flex-none" />
              </div>
              <div className="text-[1.2vw] text-[#7A96B0] font-body text-center">Patient Alerts</div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-[0.4vh] bg-gradient-to-r from-primary via-accent to-teal" />
    </div>
  );
}
