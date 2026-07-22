export default function S06ProductScreens() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,#1A2A3E_0%,transparent_55%)]" />

      <div className="relative z-10 flex flex-col h-full px-[6vw] pt-[5vh] pb-[3vh]">
        <div className="flex items-start justify-between mb-[2.5vh]">
          <div>
            <div className="text-primary text-[1.15vw] font-body font-semibold tracking-[0.25em] uppercase mb-[1.2vh]">
              06 · Product Screens
            </div>
            <h2 className="font-display text-[3.5vw] font-bold text-text leading-tight">
              Purpose-Built for Addiction Treatment Workflows
            </h2>
            <div className="w-[6vw] h-[0.35vh] bg-primary mt-[1.5vh]" />
          </div>
          <div className="bg-[#F05A28]/15 border border-[#F05A28]/40 rounded-lg px-[1.5vw] py-[0.8vh] flex-none">
            <span className="text-primary text-[1.1vw] font-body font-semibold">Development Build</span>
          </div>
        </div>

        <div className="flex gap-[2vw] flex-1 min-h-0">
          <div className="flex-1 flex flex-col gap-[1.5vh]">
            <div className="text-[1.25vw] font-body font-semibold text-teal uppercase tracking-[0.15em]">Census / Bed Board</div>
            <div className="flex-1 bg-[#0A1F35] rounded-xl border border-[#2A4A7E]/60 overflow-hidden flex flex-col">
              <div className="bg-[#1A3A5E] px-[1.5vw] py-[1vh] flex items-center justify-between border-b border-[#2A4A7E]/60">
                <span className="text-[1.25vw] text-text font-body font-semibold">Bed Management</span>
                <span className="text-[1.1vw] text-teal font-body">20/20 Occupied</span>
              </div>
              <div className="flex-1 p-[1.5vw] grid grid-cols-4 gap-[0.8vw] content-start">
                <div className="bg-[#1A3A5E] rounded-lg p-[1vh] border-l-[0.3vw] border-teal">
                  <div className="text-[1.1vw] text-[#7A96B0] font-body">1A</div>
                  <div className="text-[1.2vw] text-text font-body font-semibold">M. Webb</div>
                  <div className="text-[1vw] text-teal font-body">LOS 31d</div>
                </div>
                <div className="bg-[#1A3A5E] rounded-lg p-[1vh] border-l-[0.3vw] border-accent">
                  <div className="text-[1.1vw] text-[#7A96B0] font-body">1B</div>
                  <div className="text-[1.2vw] text-text font-body font-semibold">J. Thornton</div>
                  <div className="text-[1vw] text-accent font-body">LOS 14d</div>
                </div>
                <div className="bg-[#1A3A5E] rounded-lg p-[1vh] border-l-[0.3vw] border-primary">
                  <div className="text-[1.1vw] text-[#7A96B0] font-body">1C</div>
                  <div className="text-[1.2vw] text-text font-body font-semibold">D. Williams</div>
                  <div className="text-[1vw] text-primary font-body">High Acuity</div>
                </div>
                <div className="bg-[#1A3A5E] rounded-lg p-[1vh] border-l-[0.3vw] border-teal">
                  <div className="text-[1.1vw] text-[#7A96B0] font-body">1D</div>
                  <div className="text-[1.2vw] text-text font-body font-semibold">R. Navarro</div>
                  <div className="text-[1vw] text-teal font-body">LOS 22d</div>
                </div>
                <div className="bg-[#1A3A5E] rounded-lg p-[1vh] border-l-[0.3vw] border-teal">
                  <div className="text-[1.1vw] text-[#7A96B0] font-body">2A</div>
                  <div className="text-[1.2vw] text-text font-body font-semibold">A. Thompson</div>
                  <div className="text-[1vw] text-teal font-body">LOS 9d</div>
                </div>
                <div className="bg-[#1A3A5E] rounded-lg p-[1vh] border-l-[0.3vw] border-accent">
                  <div className="text-[1.1vw] text-[#7A96B0] font-body">2B</div>
                  <div className="text-[1.2vw] text-text font-body font-semibold">T. Holden</div>
                  <div className="text-[1vw] text-accent font-body">LOS 7d</div>
                </div>
                <div className="bg-[#1A3A5E] rounded-lg p-[1vh] border-l-[0.3vw] border-teal">
                  <div className="text-[1.1vw] text-[#7A96B0] font-body">2C</div>
                  <div className="text-[1.2vw] text-text font-body font-semibold">L. Martinez</div>
                  <div className="text-[1vw] text-teal font-body">LOS 18d</div>
                </div>
                <div className="bg-[#1A3A5E] rounded-lg p-[1vh] border-l-[0.3vw] border-primary">
                  <div className="text-[1.1vw] text-[#7A96B0] font-body">2D</div>
                  <div className="text-[1.2vw] text-text font-body font-semibold">K. Anderson</div>
                  <div className="text-[1vw] text-primary font-body">AMA Risk</div>
                </div>
              </div>
            </div>
            <div className="text-[1.25vw] text-[#7A96B0] font-body">Real-time bed status, LOS, acuity flags</div>
          </div>

          <div className="flex-1 flex flex-col gap-[1.5vh]">
            <div className="text-[1.25vw] font-body font-semibold text-teal uppercase tracking-[0.15em]">Withdrawal Monitor (CIWA)</div>
            <div className="flex-1 bg-[#0A1F35] rounded-xl border border-[#2A4A7E]/60 overflow-hidden flex flex-col">
              <div className="bg-[#1A3A5E] px-[1.5vw] py-[1vh] flex items-center justify-between border-b border-[#2A4A7E]/60">
                <span className="text-[1.25vw] text-text font-body font-semibold">CIWA-Ar Protocol</span>
                <span className="text-[1.1vw] text-primary font-body">3 Active</span>
              </div>
              <div className="flex-1 p-[1.5vw] flex flex-col gap-[1vh]">
                <div className="bg-[#1A3A5E] rounded-lg p-[1.2vh]">
                  <div className="flex justify-between items-center mb-[0.8vh]">
                    <span className="text-[1.2vw] text-text font-body font-semibold">M. Webb · 1A</span>
                    <span className="text-[1.3vw] font-body font-bold text-primary">Score: 12</span>
                  </div>
                  <div className="flex gap-[0.5vw]">
                    <div className="h-[0.8vh] flex-1 rounded bg-teal" />
                    <div className="h-[0.8vh] flex-1 rounded bg-teal" />
                    <div className="h-[0.8vh] flex-1 rounded bg-accent" />
                    <div className="h-[0.8vh] flex-1 rounded bg-primary" />
                    <div className="h-[0.8vh] flex-1 rounded bg-[#2A4A7E]" />
                  </div>
                  <div className="text-[1vw] text-primary font-body mt-[0.5vh]">Moderate — protocol escalation recommended</div>
                </div>
                <div className="bg-[#1A3A5E] rounded-lg p-[1.2vh]">
                  <div className="flex justify-between items-center mb-[0.8vh]">
                    <span className="text-[1.2vw] text-text font-body font-semibold">D. Williams · 1C</span>
                    <span className="text-[1.3vw] font-body font-bold text-teal">Score: 4</span>
                  </div>
                  <div className="flex gap-[0.5vw]">
                    <div className="h-[0.8vh] flex-1 rounded bg-teal" />
                    <div className="h-[0.8vh] flex-1 rounded bg-[#2A4A7E]" />
                    <div className="h-[0.8vh] flex-1 rounded bg-[#2A4A7E]" />
                    <div className="h-[0.8vh] flex-1 rounded bg-[#2A4A7E]" />
                    <div className="h-[0.8vh] flex-1 rounded bg-[#2A4A7E]" />
                  </div>
                  <div className="text-[1vw] text-teal font-body mt-[0.5vh]">Mild — continue monitoring Q4h</div>
                </div>
                <div className="bg-[#1A3A5E] rounded-lg p-[1.2vh]">
                  <div className="flex justify-between items-center mb-[0.8vh]">
                    <span className="text-[1.2vw] text-text font-body font-semibold">T. Holden · 2B</span>
                    <span className="text-[1.3vw] font-body font-bold text-teal">Score: 2</span>
                  </div>
                  <div className="flex gap-[0.5vw]">
                    <div className="h-[0.8vh] flex-1 rounded bg-teal" />
                    <div className="h-[0.8vh] flex-1 rounded bg-[#2A4A7E]" />
                    <div className="h-[0.8vh] flex-1 rounded bg-[#2A4A7E]" />
                    <div className="h-[0.8vh] flex-1 rounded bg-[#2A4A7E]" />
                    <div className="h-[0.8vh] flex-1 rounded bg-[#2A4A7E]" />
                  </div>
                  <div className="text-[1vw] text-teal font-body mt-[0.5vh]">Minimal — continue Q8h</div>
                </div>
              </div>
            </div>
            <div className="text-[1.25vw] text-[#7A96B0] font-body">CIWA / COWS scoring with threshold alerts</div>
          </div>

          <div className="flex-1 flex flex-col gap-[1.5vh]">
            <div className="text-[1.25vw] font-body font-semibold text-teal uppercase tracking-[0.15em]">MAR — Medication Admin</div>
            <div className="flex-1 bg-[#0A1F35] rounded-xl border border-[#2A4A7E]/60 overflow-hidden flex flex-col">
              <div className="bg-[#1A3A5E] px-[1.5vw] py-[1vh] flex items-center justify-between border-b border-[#2A4A7E]/60">
                <span className="text-[1.25vw] text-text font-body font-semibold">Morning Round — 0800</span>
                <span className="text-[1.1vw] text-accent font-body">7 Pending</span>
              </div>
              <div className="flex-1 p-[1.5vw] flex flex-col gap-[0.8vh]">
                <div className="bg-[#1A3A5E] rounded-lg p-[1.2vh] flex items-center justify-between">
                  <div>
                    <div className="text-[1.2vw] text-text font-body font-semibold">Buprenorphine 8mg</div>
                    <div className="text-[1vw] text-[#7A96B0] font-body">M. Webb · 1A</div>
                  </div>
                  <div className="bg-teal/20 text-teal text-[1.05vw] font-body font-semibold px-[1vw] py-[0.4vh] rounded-lg">Given 08:04</div>
                </div>
                <div className="bg-[#1A3A5E] rounded-lg p-[1.2vh] flex items-center justify-between">
                  <div>
                    <div className="text-[1.2vw] text-text font-body font-semibold">Naltrexone 50mg</div>
                    <div className="text-[1vw] text-[#7A96B0] font-body">J. Thornton · 1B</div>
                  </div>
                  <div className="bg-accent/20 text-accent text-[1.05vw] font-body font-semibold px-[1vw] py-[0.4vh] rounded-lg">Pending</div>
                </div>
                <div className="bg-[#1A3A5E] rounded-lg p-[1.2vh] flex items-center justify-between">
                  <div>
                    <div className="text-[1.2vw] text-text font-body font-semibold">Clonidine 0.1mg</div>
                    <div className="text-[1vw] text-[#7A96B0] font-body">D. Williams · 1C</div>
                  </div>
                  <div className="bg-teal/20 text-teal text-[1.05vw] font-body font-semibold px-[1vw] py-[0.4vh] rounded-lg">Given 08:11</div>
                </div>
                <div className="bg-[#1A3A5E] rounded-lg p-[1.2vh] flex items-center justify-between">
                  <div>
                    <div className="text-[1.2vw] text-text font-body font-semibold">Methadone 80mg</div>
                    <div className="text-[1vw] text-[#7A96B0] font-body">R. Navarro · 1D</div>
                  </div>
                  <div className="bg-accent/20 text-accent text-[1.05vw] font-body font-semibold px-[1vw] py-[0.4vh] rounded-lg">Pending</div>
                </div>
              </div>
            </div>
            <div className="text-[1.25vw] text-[#7A96B0] font-body">MAR with controlled substance log</div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-[0.4vh] bg-gradient-to-r from-primary via-accent to-teal" />
    </div>
  );
}
