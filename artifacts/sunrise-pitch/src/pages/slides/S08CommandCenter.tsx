export default function S08CommandCenter() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,#1A2A3E_0%,transparent_55%)]" />

      <div className="relative z-10 flex flex-col h-full px-[6vw] pt-[5vh] pb-[3vh]">
        <div className="flex items-start justify-between mb-[2vh]">
          <div>
            <div className="text-primary text-[1.15vw] font-body font-semibold tracking-[0.25em] uppercase mb-[1.2vh]">
              08 · Command Center
            </div>
            <h2 className="font-display text-[3.5vw] font-bold text-text leading-tight">
              Real-Time Command Center — The Floor at a Glance
            </h2>
            <div className="w-[6vw] h-[0.35vh] bg-primary mt-[1.5vh]" />
          </div>
          <div className="text-right">
            <div className="bg-[#F05A28]/15 border border-[#F05A28]/40 rounded-lg px-[1.5vw] py-[0.8vh] flex-none">
              <span className="text-primary text-[1.1vw] font-body font-semibold">Development Build</span>
            </div>
          </div>
        </div>

        <div className="bg-[#070F1A] rounded-2xl border border-[#2A4A7E]/60 flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="bg-[#0F2340] px-[2vw] py-[1.2vh] flex items-center justify-between border-b border-[#2A4A7E]/60 flex-none">
            <span className="text-[1.3vw] font-body font-semibold text-text">Sunrise Wellness Center — Command Center</span>
            <span className="text-[1.1vw] text-teal font-body">Wed Jul 22, 2026 · Morning Shift</span>
          </div>

          <div className="flex-1 p-[2vw] grid grid-cols-3 grid-rows-2 gap-[1.5vw]">
            <div className="bg-[#0F2340] rounded-xl border border-[#2A4A7E]/60 p-[2vh] flex flex-col justify-between">
              <div className="text-[1.1vw] text-[#7A96B0] font-body uppercase tracking-[0.15em]">Census</div>
              <div>
                <div className="text-[4vw] font-display font-black text-text leading-none">20<span className="text-[2vw] text-[#7A96B0]">/20</span></div>
                <div className="flex items-center gap-[0.8vw] mt-[0.8vh]">
                  <div className="h-[0.6vh] flex-1 rounded bg-teal" />
                  <span className="text-[1.2vw] text-teal font-body font-semibold">100%</span>
                </div>
              </div>
              <div className="text-[1.1vw] text-[#7A96B0] font-body">Beds occupied</div>
            </div>

            <div className="bg-[#0F2340] rounded-xl border border-[#2A4A7E]/60 p-[2vh] flex flex-col justify-between">
              <div className="text-[1.1vw] text-[#7A96B0] font-body uppercase tracking-[0.15em]">Group Attendance</div>
              <div>
                <div className="text-[4vw] font-display font-black text-accent leading-none">85<span className="text-[2vw] text-[#7A96B0]">%</span></div>
                <div className="flex gap-[0.3vw] mt-[0.8vh]">
                  <div className="h-[0.6vh] flex-[17] rounded bg-accent" />
                  <div className="h-[0.6vh] flex-[3] rounded bg-[#2A4A7E]" />
                </div>
              </div>
              <div className="text-[1.1vw] text-[#7A96B0] font-body">17/20 attended AM groups</div>
            </div>

            <div className="bg-[#0F2340] rounded-xl border border-[#2A4A7E]/60 p-[2vh] flex flex-col justify-between">
              <div className="text-[1.1vw] text-[#7A96B0] font-body uppercase tracking-[0.15em]">MAR Completion</div>
              <div>
                <div className="text-[4vw] font-display font-black text-teal leading-none">92<span className="text-[2vw] text-[#7A96B0]">%</span></div>
                <div className="flex gap-[0.3vw] mt-[0.8vh]">
                  <div className="h-[0.6vh] flex-[23] rounded bg-teal" />
                  <div className="h-[0.6vh] flex-[2] rounded bg-[#2A4A7E]" />
                </div>
              </div>
              <div className="text-[1.1vw] text-[#7A96B0] font-body">18.4/20 med rounds completed</div>
            </div>

            <div className="bg-[#0F2340] rounded-xl border border-[#2A4A7E]/60 p-[2vh] flex flex-col justify-between">
              <div className="text-[1.1vw] text-[#7A96B0] font-body uppercase tracking-[0.15em]">Open Safety Alerts</div>
              <div>
                <div className="text-[4vw] font-display font-black text-primary leading-none">3</div>
                <div className="text-[1.2vw] text-primary font-body mt-[0.8vh]">Requires attention</div>
              </div>
              <div className="text-[1.1vw] text-[#7A96B0] font-body">2 CIWA · 1 AMA risk flag</div>
            </div>

            <div className="bg-[#0F2340] rounded-xl border border-[#2A4A7E]/60 p-[2vh] flex flex-col justify-between">
              <div className="text-[1.1vw] text-[#7A96B0] font-body uppercase tracking-[0.15em]">UA Compliance</div>
              <div>
                <div className="text-[4vw] font-display font-black text-accent leading-none">88<span className="text-[2vw] text-[#7A96B0]">%</span></div>
                <div className="flex gap-[0.3vw] mt-[0.8vh]">
                  <div className="h-[0.6vh] flex-[22] rounded bg-accent" />
                  <div className="h-[0.6vh] flex-[3] rounded bg-[#2A4A7E]" />
                </div>
              </div>
              <div className="text-[1.1vw] text-[#7A96B0] font-body">Testing schedule this week</div>
            </div>

            <div className="bg-[#0F2340] rounded-xl border border-[#2A4A7E]/60 p-[2vh] flex flex-col justify-between">
              <div className="text-[1.1vw] text-[#7A96B0] font-body uppercase tracking-[0.15em]">Co-sign Queue</div>
              <div>
                <div className="text-[4vw] font-display font-black text-accent leading-none">7</div>
                <div className="text-[1.2vw] text-accent font-body mt-[0.8vh]">Pending signatures</div>
              </div>
              <div className="text-[1.1vw] text-[#7A96B0] font-body">3 past 24h deadline</div>
            </div>
          </div>
        </div>

        <div className="text-[1.2vw] text-[#7A96B0] font-body text-center mt-[1.5vh]">
          Shift-level and facility-level views. No report run required.
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-[0.4vh] bg-gradient-to-r from-primary via-accent to-teal" />
    </div>
  );
}
