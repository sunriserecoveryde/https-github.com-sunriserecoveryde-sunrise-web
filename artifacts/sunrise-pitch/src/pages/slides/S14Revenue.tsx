export default function S14Revenue() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_80%,#1A2A3E_0%,transparent_50%)]" />

      <div className="relative z-10 flex flex-col h-full px-[8vw] pt-[5vh] pb-[3vh]">
        <div className="mb-[3vh]">
          <div className="text-primary text-[1.15vw] font-body font-semibold tracking-[0.25em] uppercase mb-[1.2vh]">
            14 · Revenue Model
          </div>
          <h2 className="font-display text-[4vw] font-bold text-text leading-tight">
            Recurring Revenue Built on Clinical Dependency
          </h2>
          <div className="w-[6vw] h-[0.35vh] bg-primary mt-[1.5vh]" />
        </div>

        <div className="flex gap-[4vw] flex-1 min-h-0">
          <div className="flex-1 flex flex-col gap-[2.5vh]">
            <div className="text-[1.4vw] text-[#7A96B0] font-body mb-[0.5vh]">SaaS model with strong retention mechanics</div>

            <div className="bg-[#1A3A5E] rounded-2xl border-l-[0.4vw] border-primary p-[2.5vh]">
              <div className="text-[1.2vw] text-primary font-body font-semibold uppercase tracking-[0.15em] mb-[0.8vh]">Core Platform</div>
              <div className="text-[1.7vw] font-body font-semibold text-text mb-[0.5vh]">Per-bed annual subscription</div>
              <div className="text-[1.4vw] text-[#B8C8D8] font-body">$1,800 / bed / year · scales with census</div>
            </div>

            <div className="bg-[#1A3A5E] rounded-2xl border-l-[0.4vw] border-accent p-[2.5vh]">
              <div className="text-[1.2vw] text-accent font-body font-semibold uppercase tracking-[0.15em] mb-[0.8vh]">Premium AI Module</div>
              <div className="text-[1.7vw] font-body font-semibold text-text mb-[0.5vh]">Add-on analytics and documentation tier</div>
              <div className="text-[1.4vw] text-[#B8C8D8] font-body">Predictive alerts + documentation assist + outcome tracking</div>
            </div>

            <div className="bg-[#1A3A5E] rounded-2xl border-l-[0.4vw] border-teal p-[2.5vh]">
              <div className="text-[1.2vw] text-teal font-body font-semibold uppercase tracking-[0.15em] mb-[0.8vh]">API & Interoperability Tier</div>
              <div className="text-[1.7vw] font-body font-semibold text-text mb-[0.5vh]">Health systems and multi-site operators</div>
              <div className="text-[1.4vw] text-[#B8C8D8] font-body">Open API access + partner data feeds + enterprise SLAs</div>
            </div>

            <div className="bg-[#1A3A5E] rounded-xl border border-[#2A4A7E]/50 p-[2vh]">
              <div className="text-[1.1vw] text-[#7A96B0] font-body uppercase tracking-[0.15em] mb-[0.8vh]">Implementation services</div>
              <div className="text-[1.4vw] text-[#B8C8D8] font-body">One-time onboarding and data migration — professional services fee</div>
            </div>
          </div>

          <div className="w-[34vw] flex flex-col gap-[2.5vh] justify-center">
            <div className="bg-[#0A1F35] rounded-2xl border border-[#2A4A7E]/60 p-[3vh]">
              <div className="text-[1.2vw] text-[#7A96B0] font-body uppercase tracking-[0.15em] mb-[2vh]">Retention drivers</div>
              <div className="space-y-[1.5vh]">
                <div className="flex items-start gap-[1.5vw]">
                  <div className="w-[0.45vw] h-[0.45vw] rounded-full bg-primary mt-[0.8vh] flex-none" />
                  <p className="text-[1.45vw] text-[#B8C8D8] font-body leading-snug">Daily clinical workflow dependency — staff can't work without it</p>
                </div>
                <div className="flex items-start gap-[1.5vw]">
                  <div className="w-[0.45vw] h-[0.45vw] rounded-full bg-primary mt-[0.8vh] flex-none" />
                  <p className="text-[1.45vw] text-[#B8C8D8] font-body leading-snug">Compliance record-keeping — years of chart data stored in platform</p>
                </div>
                <div className="flex items-start gap-[1.5vw]">
                  <div className="w-[0.45vw] h-[0.45vw] rounded-full bg-primary mt-[0.8vh] flex-none" />
                  <p className="text-[1.45vw] text-[#B8C8D8] font-body leading-snug">Staff onboarding integrated — switching costs are high</p>
                </div>
              </div>
            </div>

            <div className="bg-[#0A1F35] rounded-2xl border border-[#2A4A7E]/60 p-[3vh]">
              <div className="text-[1.2vw] text-[#7A96B0] font-body uppercase tracking-[0.15em] mb-[2vh]">Unit economics</div>
              <div className="grid grid-cols-1 gap-[1.5vh]">
                <div className="flex justify-between items-center">
                  <span className="text-[1.35vw] text-[#B8C8D8] font-body">ACV per facility (40-bed avg)</span>
                  <span className="text-[1.5vw] font-display font-bold text-accent">$72,000</span>
                </div>
                <div className="w-full h-px bg-[#2A4A7E]/50" />
                <div className="flex justify-between items-center">
                  <span className="text-[1.35vw] text-[#B8C8D8] font-body">Gross margin target</span>
                  <span className="text-[1.5vw] font-display font-bold text-accent">78%</span>
                </div>
                <div className="w-full h-px bg-[#2A4A7E]/50" />
                <div className="flex justify-between items-center">
                  <span className="text-[1.35vw] text-[#B8C8D8] font-body">Payback period</span>
                  <span className="text-[1.5vw] font-display font-bold text-accent">14 months</span>
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
