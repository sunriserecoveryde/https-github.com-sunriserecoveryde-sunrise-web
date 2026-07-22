export default function S09BedTracking() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_0%_50%,#1A2A3E_0%,transparent_50%)]" />

      <div className="relative z-10 flex flex-col h-full px-[7vw] pt-[5vh] pb-[3vh]">
        <div className="mb-[2.5vh]">
          <div className="text-primary text-[1.15vw] font-body font-semibold tracking-[0.25em] uppercase mb-[1.2vh]">
            09 · Admissions & Capacity
          </div>
          <h2 className="font-display text-[3.8vw] font-bold text-text leading-tight">
            The Right Patient in the Right Bed — Faster
          </h2>
          <div className="w-[6vw] h-[0.35vh] bg-primary mt-[1.5vh]" />
        </div>

        <div className="flex gap-[4vw] flex-1 min-h-0">
          <div className="w-[28vw] flex flex-col justify-center gap-[2.5vh]">
            <div className="space-y-[1.8vh]">
              <div className="flex items-start gap-[1.5vw]">
                <div className="w-[0.5vw] h-[0.5vw] rounded-full bg-teal mt-[0.9vh] flex-none" />
                <p className="text-[1.55vw] text-[#B8C8D8] font-body leading-snug">
                  Live bed board: status, acuity, LOS, upcoming discharges
                </p>
              </div>
              <div className="flex items-start gap-[1.5vw]">
                <div className="w-[0.5vw] h-[0.5vw] rounded-full bg-teal mt-[0.9vh] flex-none" />
                <p className="text-[1.55vw] text-[#B8C8D8] font-body leading-snug">
                  Referral pipeline: source tracking, ASAM screening, admit workflow
                </p>
              </div>
              <div className="flex items-start gap-[1.5vw]">
                <div className="w-[0.5vw] h-[0.5vw] rounded-full bg-teal mt-[0.9vh] flex-none" />
                <p className="text-[1.55vw] text-[#B8C8D8] font-body leading-snug">
                  Discharge planning integrated with bed availability forecast
                </p>
              </div>
              <div className="flex items-start gap-[1.5vw]">
                <div className="w-[0.5vw] h-[0.5vw] rounded-full bg-teal mt-[0.9vh] flex-none" />
                <p className="text-[1.55vw] text-[#B8C8D8] font-body leading-snug">
                  Capacity alerts when census drops below threshold
                </p>
              </div>
            </div>

            <div className="bg-[#1A3A5E] rounded-xl border border-[#2A4A7E]/50 p-[2.5vh]">
              <div className="text-[1.15vw] text-[#7A96B0] font-body uppercase tracking-[0.15em] mb-[1.5vh]">Acuity legend</div>
              <div className="flex flex-col gap-[1vh]">
                <div className="flex items-center gap-[1.5vw]">
                  <div className="w-[0.6vw] h-[0.6vw] rounded-full bg-teal flex-none" />
                  <span className="text-[1.35vw] text-[#B8C8D8] font-body">Stable — routine monitoring</span>
                </div>
                <div className="flex items-center gap-[1.5vw]">
                  <div className="w-[0.6vw] h-[0.6vw] rounded-full bg-accent flex-none" />
                  <span className="text-[1.35vw] text-[#B8C8D8] font-body">Moderate — elevated checks</span>
                </div>
                <div className="flex items-center gap-[1.5vw]">
                  <div className="w-[0.6vw] h-[0.6vw] rounded-full bg-primary flex-none" />
                  <span className="text-[1.35vw] text-[#B8C8D8] font-body">High — clinical escalation</span>
                </div>
                <div className="flex items-center gap-[1.5vw]">
                  <div className="w-[0.6vw] h-[0.6vw] rounded-full bg-[#2A4A7E] flex-none" />
                  <span className="text-[1.35vw] text-[#B8C8D8] font-body">Available</span>
                </div>
              </div>
            </div>

            <div className="text-[1.2vw] text-[#4A6A8E] font-body">
              [Time-to-admit improvement — PLACEHOLDER pending pilot data]
            </div>
          </div>

          <div className="flex-1 bg-[#0A1F35] rounded-2xl border border-[#2A4A7E]/60 overflow-hidden flex flex-col">
            <div className="bg-[#1A3A5E] px-[2vw] py-[1.2vh] flex items-center justify-between border-b border-[#2A4A7E]/60 flex-none">
              <span className="text-[1.25vw] font-body font-semibold text-text">Live Bed Board — 20 Beds</span>
              <span className="text-[1.1vw] text-teal font-body">20 Occupied · 0 Available</span>
            </div>
            <div className="flex-1 p-[1.5vw] grid grid-cols-4 gap-[1vw] content-start overflow-hidden">
              <div className="bg-[#1A3A5E] rounded-xl p-[1.5vh] border-l-[0.35vw] border-teal">
                <div className="text-[1.05vw] text-[#7A96B0] font-body mb-[0.3vh]">Rm 1A</div>
                <div className="text-[1.3vw] text-text font-body font-semibold leading-tight">Marcus W.</div>
                <div className="text-[1.05vw] text-teal font-body mt-[0.5vh]">LOS 31d</div>
              </div>
              <div className="bg-[#1A3A5E] rounded-xl p-[1.5vh] border-l-[0.35vw] border-accent">
                <div className="text-[1.05vw] text-[#7A96B0] font-body mb-[0.3vh]">Rm 1B</div>
                <div className="text-[1.3vw] text-text font-body font-semibold leading-tight">James T.</div>
                <div className="text-[1.05vw] text-accent font-body mt-[0.5vh]">LOS 14d</div>
              </div>
              <div className="bg-[#1A3A5E] rounded-xl p-[1.5vh] border-l-[0.35vw] border-primary">
                <div className="text-[1.05vw] text-[#7A96B0] font-body mb-[0.3vh]">Rm 1C</div>
                <div className="text-[1.3vw] text-text font-body font-semibold leading-tight">Destiny W.</div>
                <div className="text-[1.05vw] text-primary font-body mt-[0.5vh]">High Acuity</div>
              </div>
              <div className="bg-[#1A3A5E] rounded-xl p-[1.5vh] border-l-[0.35vw] border-teal">
                <div className="text-[1.05vw] text-[#7A96B0] font-body mb-[0.3vh]">Rm 1D</div>
                <div className="text-[1.3vw] text-text font-body font-semibold leading-tight">Robert N.</div>
                <div className="text-[1.05vw] text-teal font-body mt-[0.5vh]">LOS 22d</div>
              </div>
              <div className="bg-[#1A3A5E] rounded-xl p-[1.5vh] border-l-[0.35vw] border-teal">
                <div className="text-[1.05vw] text-[#7A96B0] font-body mb-[0.3vh]">Rm 2A</div>
                <div className="text-[1.3vw] text-text font-body font-semibold leading-tight">Aisha T.</div>
                <div className="text-[1.05vw] text-teal font-body mt-[0.5vh]">LOS 9d</div>
              </div>
              <div className="bg-[#1A3A5E] rounded-xl p-[1.5vh] border-l-[0.35vw] border-accent">
                <div className="text-[1.05vw] text-[#7A96B0] font-body mb-[0.3vh]">Rm 2B</div>
                <div className="text-[1.3vw] text-text font-body font-semibold leading-tight">Travis H.</div>
                <div className="text-[1.05vw] text-accent font-body mt-[0.5vh]">LOS 7d</div>
              </div>
              <div className="bg-[#1A3A5E] rounded-xl p-[1.5vh] border-l-[0.35vw] border-teal">
                <div className="text-[1.05vw] text-[#7A96B0] font-body mb-[0.3vh]">Rm 2C</div>
                <div className="text-[1.3vw] text-text font-body font-semibold leading-tight">Lauren M.</div>
                <div className="text-[1.05vw] text-teal font-body mt-[0.5vh]">LOS 18d</div>
              </div>
              <div className="bg-[#1A3A5E] rounded-xl p-[1.5vh] border-l-[0.35vw] border-primary">
                <div className="text-[1.05vw] text-[#7A96B0] font-body mb-[0.3vh]">Rm 2D</div>
                <div className="text-[1.3vw] text-text font-body font-semibold leading-tight">Kevin A.</div>
                <div className="text-[1.05vw] text-primary font-body mt-[0.5vh]">AMA Risk</div>
              </div>
              <div className="bg-[#1A3A5E] rounded-xl p-[1.5vh] border-l-[0.35vw] border-teal">
                <div className="text-[1.05vw] text-[#7A96B0] font-body mb-[0.3vh]">Rm 3A</div>
                <div className="text-[1.3vw] text-text font-body font-semibold leading-tight">Samantha B.</div>
                <div className="text-[1.05vw] text-teal font-body mt-[0.5vh]">LOS 25d</div>
              </div>
              <div className="bg-[#1A3A5E] rounded-xl p-[1.5vh] border-l-[0.35vw] border-teal">
                <div className="text-[1.05vw] text-[#7A96B0] font-body mb-[0.3vh]">Rm 3B</div>
                <div className="text-[1.3vw] text-text font-body font-semibold leading-tight">Michael R.</div>
                <div className="text-[1.05vw] text-teal font-body mt-[0.5vh]">LOS 11d</div>
              </div>
              <div className="bg-[#1A3A5E] rounded-xl p-[1.5vh] border-l-[0.35vw] border-accent">
                <div className="text-[1.05vw] text-[#7A96B0] font-body mb-[0.3vh]">Rm 3C</div>
                <div className="text-[1.3vw] text-text font-body font-semibold leading-tight">Jennifer L.</div>
                <div className="text-[1.05vw] text-accent font-body mt-[0.5vh]">LOS 4d</div>
              </div>
              <div className="bg-[#1A3A5E] rounded-xl p-[1.5vh] border-l-[0.35vw] border-teal">
                <div className="text-[1.05vw] text-[#7A96B0] font-body mb-[0.3vh]">Rm 3D</div>
                <div className="text-[1.3vw] text-text font-body font-semibold leading-tight">Carlos M.</div>
                <div className="text-[1.05vw] text-teal font-body mt-[0.5vh]">LOS 19d</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-[0.4vh] bg-gradient-to-r from-primary via-accent to-teal" />
    </div>
  );
}
