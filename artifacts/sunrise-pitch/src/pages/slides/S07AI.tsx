export default function S07AI() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_10%_50%,#1A2E1A_0%,transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_90%_20%,#1A2A3E_0%,transparent_50%)]" />

      <div className="relative z-10 flex flex-col h-full px-[8vw] pt-[5vh] pb-[3vh]">
        <div className="mb-[3vh]">
          <div className="text-primary text-[1.15vw] font-body font-semibold tracking-[0.25em] uppercase mb-[1.2vh]">
            07 · AI Capabilities
          </div>
          <h2 className="font-display text-[4vw] font-bold text-text leading-tight">
            AI That Amplifies Clinicians — Never Replaces Them
          </h2>
          <div className="w-[6vw] h-[0.35vh] bg-primary mt-[1.5vh]" />
        </div>

        <div className="flex gap-[5vw] flex-1 min-h-0">
          <div className="flex-1 flex flex-col justify-center gap-[2.5vh]">
            <div className="text-[1.5vw] text-[#7A96B0] font-body mb-[0.5vh]">AI as decision support. Human review at every step.</div>

            <div className="flex items-start gap-[2vw]">
              <div className="w-[2.5vw] h-[2.5vw] rounded-full bg-[#1A3A5E] border border-teal flex items-center justify-center flex-none">
                <div className="w-[1vw] h-[1vw] rounded-full bg-teal" />
              </div>
              <div>
                <div className="text-[1.65vw] font-body font-semibold text-text mb-[0.4vh]">Early Warning Detection</div>
                <div className="text-[1.4vw] text-[#B8C8D8] font-body">Flag patients trending toward AMA, SI, or withdrawal threshold — before the crisis, not after</div>
              </div>
            </div>

            <div className="flex items-start gap-[2vw]">
              <div className="w-[2.5vw] h-[2.5vw] rounded-full bg-[#1A3A5E] border border-teal flex items-center justify-center flex-none">
                <div className="w-[1vw] h-[1vw] rounded-full bg-teal" />
              </div>
              <div>
                <div className="text-[1.65vw] font-body font-semibold text-text mb-[0.4vh]">Documentation Assist</div>
                <div className="text-[1.4vw] text-[#B8C8D8] font-body">Structured note scaffolding from session cues — clinician reviews and signs, never auto-submits</div>
              </div>
            </div>

            <div className="flex items-start gap-[2vw]">
              <div className="w-[2.5vw] h-[2.5vw] rounded-full bg-[#1A3A5E] border border-teal flex items-center justify-center flex-none">
                <div className="w-[1vw] h-[1vw] rounded-full bg-teal" />
              </div>
              <div>
                <div className="text-[1.65vw] font-body font-semibold text-text mb-[0.4vh]">Outcome Prediction</div>
                <div className="text-[1.4vw] text-[#B8C8D8] font-body">Flag high-risk patients for supervisor review — risk score surfaces immediately, diagnosis stays with the clinician</div>
              </div>
            </div>

            <div className="flex items-start gap-[2vw]">
              <div className="w-[2.5vw] h-[2.5vw] rounded-full bg-[#1A3A5E] border border-teal flex items-center justify-center flex-none">
                <div className="w-[1vw] h-[1vw] rounded-full bg-teal" />
              </div>
              <div>
                <div className="text-[1.65vw] font-body font-semibold text-text mb-[0.4vh]">Audit Intelligence</div>
                <div className="text-[1.4vw] text-[#B8C8D8] font-body">Surface documentation gaps before they become compliance failures — proactive, not reactive</div>
              </div>
            </div>

            <div className="bg-[#1E1A0A] border border-accent/40 rounded-xl p-[2vh] mt-[0.5vh]">
              <div className="text-[1.5vw] font-body font-semibold text-accent mb-[0.5vh]">Human Oversight Guarantee</div>
              <div className="text-[1.35vw] text-[#B8C8D8] font-body leading-snug">
                AI does not diagnose. AI does not approve clinical decisions. Every AI output requires clinician review and documented sign-off before any action is taken.
              </div>
              <div className="text-[1.1vw] text-[#4A6A8E] font-body mt-[1vh]">
                [PLACEHOLDER — specific AI accuracy or detection claims require clinical pilot validation before investor presentation]
              </div>
            </div>
          </div>

          <div className="w-[32vw] flex flex-col justify-center gap-[2vh]">
            <div className="bg-[#0A1F35] rounded-2xl border border-[#2A4A7E]/60 overflow-hidden">
              <div className="bg-[#1A3A5E] px-[2vw] py-[1.2vh] border-b border-[#2A4A7E]/60">
                <span className="text-[1.2vw] font-body font-semibold text-text">AI Clinical Alert</span>
              </div>
              <div className="p-[2vw]">
                <div className="bg-[#1E1A0A] border border-accent/50 rounded-xl p-[1.8vh] mb-[1.5vh]">
                  <div className="text-[1.1vw] text-accent font-body font-semibold uppercase tracking-[0.15em] mb-[1vh]">
                    AMA Risk Flag
                  </div>
                  <div className="text-[1.3vw] text-text font-body font-semibold mb-[0.5vh]">Marcus Webb · Room 1A</div>
                  <div className="text-[1.2vw] text-[#B8C8D8] font-body mb-[1.2vh]">
                    Risk score elevated (78/100). Behavioral pattern change detected over past 24h. Recommend immediate 1:1 session.
                  </div>
                  <div className="text-[1.05vw] text-[#7A96B0] font-body">
                    AI-generated · Clinician review required
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-[1vw] mb-[1.5vh]">
                  <div className="bg-[#1A3A5E] rounded-lg p-[1.5vh] text-center">
                    <div className="text-[1.5vw] font-display font-bold text-primary">78</div>
                    <div className="text-[1.05vw] text-[#7A96B0] font-body">Risk score</div>
                  </div>
                  <div className="bg-[#1A3A5E] rounded-lg p-[1.5vh] text-center">
                    <div className="text-[1.5vw] font-display font-bold text-accent">24h</div>
                    <div className="text-[1.05vw] text-[#7A96B0] font-body">Pattern window</div>
                  </div>
                </div>

                <div className="bg-[#F05A28]/15 border border-[#F05A28]/40 rounded-lg p-[1.5vh] mb-[1vh]">
                  <div className="text-[1.3vw] text-primary font-body font-semibold">Review Required</div>
                  <div className="text-[1.1vw] text-[#B8C8D8] font-body mt-[0.3vh]">Clinician sign-off needed before escalation</div>
                </div>

                <div className="bg-teal/10 border border-teal/30 rounded-lg p-[1.5vh]">
                  <div className="text-[1.2vw] text-teal font-body font-semibold">Supervisor Notified</div>
                  <div className="text-[1.05vw] text-[#7A96B0] font-body mt-[0.3vh]">S. Jenkins, LPC — pending clinician action</div>
                </div>
              </div>
            </div>
            <div className="text-center text-[1.2vw] text-[#7A96B0] font-body">Development Build · Prototype Interface</div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-[0.4vh] bg-gradient-to-r from-primary via-accent to-teal" />
    </div>
  );
}
