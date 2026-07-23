export default function S04Cost() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,#1A2A3E_0%,transparent_60%)]" />

      <div className="relative z-10 flex flex-col h-full px-[7vw] pt-[5vh] pb-[3vh]">
        <div className="mb-[3vh]">
          <div className="text-primary text-[1.15vw] font-body font-semibold tracking-[0.25em] uppercase mb-[1.2vh]">
            04 · The Cost of Fragmentation
          </div>
          <h2 className="font-display text-[3.8vw] font-bold text-text leading-tight">
            Fragmentation Has a Price — Paid in Dollars and Patient Outcomes
          </h2>
          <div className="w-[6vw] h-[0.35vh] bg-primary mt-[1.5vh]" />
        </div>

        <div className="flex gap-[2vw] flex-1 min-h-0">
          <div className="flex-1 bg-[#1A3A5E] rounded-2xl border border-[#2A4A7E]/50 p-[3vh] flex flex-col">
            <div className="text-teal text-[1.1vw] font-body font-semibold uppercase tracking-[0.2em] mb-[1.5vh]">
              Clinical Cost
            </div>
            <div className="text-[4vw] font-display font-black text-accent leading-none mb-[0.5vh]">
              70%
            </div>
            <div className="text-[1.2vw] text-[#7A96B0] font-body mb-[2.5vh]">
              of sentinel events linked to communication failures — Joint Commission
            </div>
            <div className="space-y-[1.8vh] flex-1">
              <div className="flex items-start gap-[1vw]">
                <div className="w-[0.4vw] h-[0.4vw] rounded-full bg-teal mt-[0.9vh] flex-none" />
                <p className="text-[1.5vw] text-[#B8C8D8] font-body leading-snug">
                  Documentation gaps lead to missed clinical escalations
                </p>
              </div>
              <div className="flex items-start gap-[1vw]">
                <div className="w-[0.4vw] h-[0.4vw] rounded-full bg-teal mt-[0.9vh] flex-none" />
                <p className="text-[1.5vw] text-[#B8C8D8] font-body leading-snug">
                  Delayed admissions when bed status is unknown
                </p>
              </div>
              <div className="flex items-start gap-[1vw]">
                <div className="w-[0.4vw] h-[0.4vw] rounded-full bg-teal mt-[0.9vh] flex-none" />
                <p className="text-[1.5vw] text-[#B8C8D8] font-body leading-snug">
                  Incomplete handoffs create medication administration risk
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 bg-[#1A3A5E] rounded-2xl border border-[#2A4A7E]/50 p-[3vh] flex flex-col">
            <div className="text-accent text-[1.1vw] font-body font-semibold uppercase tracking-[0.2em] mb-[1.5vh]">
              Financial Cost
            </div>
            <div className="text-[4vw] font-display font-black text-accent leading-none mb-[0.5vh]">
              15%
            </div>
            <div className="text-[1.2vw] text-[#7A96B0] font-body mb-[2.5vh]">
              average billing denial rate in behavioral health — MGMA 2024
            </div>
            <div className="space-y-[1.8vh] flex-1">
              <div className="flex items-start gap-[1vw]">
                <div className="w-[0.4vw] h-[0.4vw] rounded-full bg-accent mt-[0.9vh] flex-none" />
                <p className="text-[1.5vw] text-[#B8C8D8] font-body leading-snug">
                  Revenue leakage: ~$4,200 per bed per year in denied claims
                </p>
              </div>
              <div className="flex items-start gap-[1vw]">
                <div className="w-[0.4vw] h-[0.4vw] rounded-full bg-accent mt-[0.9vh] flex-none" />
                <p className="text-[1.5vw] text-[#B8C8D8] font-body leading-snug">
                  Under-utilized census from slow intake workflows
                </p>
              </div>
              <div className="flex items-start gap-[1vw]">
                <div className="w-[0.4vw] h-[0.4vw] rounded-full bg-accent mt-[0.9vh] flex-none" />
                <p className="text-[1.5vw] text-[#B8C8D8] font-body leading-snug">
                  Manual billing reconciliation consumes clinical administrator time
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 bg-[#1A3A5E] rounded-2xl border border-[#2A4A7E]/50 p-[3vh] flex flex-col">
            <div className="text-primary text-[1.1vw] font-body font-semibold uppercase tracking-[0.2em] mb-[1.5vh]">
              Operational Cost
            </div>
            <div className="text-[4vw] font-display font-black text-accent leading-none mb-[0.5vh]">
              42%
            </div>
            <div className="text-[1.2vw] text-[#7A96B0] font-body mb-[2.5vh]">
              annual counselor turnover rate in SUD treatment — SAMHSA BHWRC
            </div>
            <div className="space-y-[1.8vh] flex-1">
              <div className="flex items-start gap-[1vw]">
                <div className="w-[0.4vw] h-[0.4vw] rounded-full bg-primary mt-[0.9vh] flex-none" />
                <p className="text-[1.5vw] text-[#B8C8D8] font-body leading-snug">
                  Staff turnover driven by documentation overhead
                </p>
              </div>
              <div className="flex items-start gap-[1vw]">
                <div className="w-[0.4vw] h-[0.4vw] rounded-full bg-primary mt-[0.9vh] flex-none" />
                <p className="text-[1.5vw] text-[#B8C8D8] font-body leading-snug">
                  Compliance failures from manual audit processes
                </p>
              </div>
              <div className="flex items-start gap-[1vw]">
                <div className="w-[0.4vw] h-[0.4vw] rounded-full bg-primary mt-[0.9vh] flex-none" />
                <p className="text-[1.5vw] text-[#B8C8D8] font-body leading-snug">
                  Leadership operates without real-time facility visibility
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-[0.4vh] bg-gradient-to-r from-primary via-accent to-teal" />
    </div>
  );
}
