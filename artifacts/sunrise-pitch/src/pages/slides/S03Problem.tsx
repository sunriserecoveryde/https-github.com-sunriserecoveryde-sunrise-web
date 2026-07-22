export default function S03Problem() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_80%,#1A2A3E_0%,transparent_50%)]" />

      <div className="relative z-10 flex flex-col h-full px-[8vw] pt-[5vh] pb-[3vh]">
        <div className="mb-[2.5vh]">
          <div className="text-primary text-[1.15vw] font-body font-semibold tracking-[0.25em] uppercase mb-[1.2vh]">
            03 · The Problem
          </div>
          <h2 className="font-display text-[3.8vw] font-bold text-text leading-tight">
            Behavioral Health Runs on Digital Duct Tape
          </h2>
          <div className="w-[6vw] h-[0.35vh] bg-primary mt-[1.5vh]" />
        </div>

        <div className="flex gap-[4vw] flex-1 min-h-0">
          <div className="flex-1 flex flex-col justify-center">
            <div className="text-[1.55vw] text-[#7A96B0] font-body mb-[2vh]">
              The average treatment facility operates across:
            </div>
            <div className="text-[5vw] font-display font-black text-accent leading-none mb-[0.5vh]">
              5–8
            </div>
            <div className="text-[2vw] font-display font-bold text-text mb-[3vh]">
              Disconnected Software Systems
            </div>
            <div className="text-[1.2vw] text-[#4A6A8E] font-body mb-[3.5vh]">
              [STAT — verify via HIMSS or industry survey before investor presentation]
            </div>

            <div className="space-y-[1.5vh]">
              <div className="flex items-start gap-[1.5vw]">
                <div className="w-[0.5vw] h-[0.5vw] rounded-full bg-primary mt-[0.8vh] flex-none" />
                <p className="text-[1.6vw] text-[#B8C8D8] font-body leading-snug">
                  Real-time census and acuity data exist in no single place
                </p>
              </div>
              <div className="flex items-start gap-[1.5vw]">
                <div className="w-[0.5vw] h-[0.5vw] rounded-full bg-primary mt-[0.8vh] flex-none" />
                <p className="text-[1.6vw] text-[#B8C8D8] font-body leading-snug">
                  Clinical staff spend significant shift time on documentation, not patients
                </p>
              </div>
              <div className="flex items-start gap-[1.5vw]">
                <div className="w-[0.5vw] h-[0.5vw] rounded-full bg-primary mt-[0.8vh] flex-none" />
                <p className="text-[1.6vw] text-[#B8C8D8] font-body leading-snug">
                  Handoffs happen via paper, whiteboards, and memory
                </p>
              </div>
            </div>
          </div>

          <div className="w-[46vw] flex flex-col justify-center gap-[1.8vh]">
            <div className="text-[1.15vw] text-[#7A96B0] font-body uppercase tracking-[0.2em] mb-[0.5vh]">
              Six isolated systems — zero integration
            </div>
            <div className="grid grid-cols-3 gap-[1.5vw]">
              <div className="bg-[#1A3A5E] border border-[#2A4A7E]/60 rounded-xl p-[2vh] text-center">
                <div className="text-[1.9vw] font-body font-semibold text-[#7A96B0] mb-[0.5vh]">EHR</div>
                <div className="text-[1.25vw] text-[#4A6A8E] font-body">Clinical notes</div>
                <div className="w-[3vw] h-[0.25vh] bg-[#F05A28]/30 mx-auto mt-[1.5vh]" />
                <div className="text-[1.1vw] text-[#F05A28]/60 font-body mt-[0.8vh]">No connection</div>
              </div>
              <div className="bg-[#1A3A5E] border border-[#2A4A7E]/60 rounded-xl p-[2vh] text-center">
                <div className="text-[1.9vw] font-body font-semibold text-[#7A96B0] mb-[0.5vh]">Billing</div>
                <div className="text-[1.25vw] text-[#4A6A8E] font-body">Claims & RCM</div>
                <div className="w-[3vw] h-[0.25vh] bg-[#F05A28]/30 mx-auto mt-[1.5vh]" />
                <div className="text-[1.1vw] text-[#F05A28]/60 font-body mt-[0.8vh]">No connection</div>
              </div>
              <div className="bg-[#1A3A5E] border border-[#2A4A7E]/60 rounded-xl p-[2vh] text-center">
                <div className="text-[1.9vw] font-body font-semibold text-[#7A96B0] mb-[0.5vh]">Scheduling</div>
                <div className="text-[1.25vw] text-[#4A6A8E] font-body">Groups & staff</div>
                <div className="w-[3vw] h-[0.25vh] bg-[#F05A28]/30 mx-auto mt-[1.5vh]" />
                <div className="text-[1.1vw] text-[#F05A28]/60 font-body mt-[0.8vh]">No connection</div>
              </div>
              <div className="bg-[#1A3A5E] border border-[#2A4A7E]/60 rounded-xl p-[2vh] text-center">
                <div className="text-[1.9vw] font-body font-semibold text-[#7A96B0] mb-[0.5vh]">HR / Payroll</div>
                <div className="text-[1.25vw] text-[#4A6A8E] font-body">Staff records</div>
                <div className="w-[3vw] h-[0.25vh] bg-[#F05A28]/30 mx-auto mt-[1.5vh]" />
                <div className="text-[1.1vw] text-[#F05A28]/60 font-body mt-[0.8vh]">No connection</div>
              </div>
              <div className="bg-[#1A3A5E] border border-[#2A4A7E]/60 rounded-xl p-[2vh] text-center">
                <div className="text-[1.9vw] font-body font-semibold text-[#7A96B0] mb-[0.5vh]">Compliance</div>
                <div className="text-[1.25vw] text-[#4A6A8E] font-body">Audit & creds</div>
                <div className="w-[3vw] h-[0.25vh] bg-[#F05A28]/30 mx-auto mt-[1.5vh]" />
                <div className="text-[1.1vw] text-[#F05A28]/60 font-body mt-[0.8vh]">No connection</div>
              </div>
              <div className="bg-[#1A3A5E] border border-[#2A4A7E]/60 rounded-xl p-[2vh] text-center">
                <div className="text-[1.9vw] font-body font-semibold text-[#7A96B0] mb-[0.5vh]">Lab / Rx</div>
                <div className="text-[1.25vw] text-[#4A6A8E] font-body">Results & MAR</div>
                <div className="w-[3vw] h-[0.25vh] bg-[#F05A28]/30 mx-auto mt-[1.5vh]" />
                <div className="text-[1.1vw] text-[#F05A28]/60 font-body mt-[0.8vh]">No connection</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-[0.4vh] bg-gradient-to-r from-primary via-accent to-teal" />
    </div>
  );
}
