export default function S11API() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,#1A2A3E_0%,transparent_60%)]" />

      <div className="relative z-10 flex flex-col h-full px-[7vw] pt-[5vh] pb-[3vh]">
        <div className="mb-[2.5vh]">
          <div className="text-primary text-[1.15vw] font-body font-semibold tracking-[0.25em] uppercase mb-[1.2vh]">
            11 · Interoperability
          </div>
          <h2 className="font-display text-[4vw] font-bold text-text leading-tight">
            API-First: Sunrise OS Works With What You Already Have
          </h2>
          <div className="w-[6vw] h-[0.35vh] bg-primary mt-[1.5vh]" />
        </div>

        <div className="flex gap-[4vw] flex-1 min-h-0">
          <div className="w-[30vw] flex flex-col justify-center gap-[2.5vh]">
            <p className="text-[1.65vw] text-[#B8C8D8] font-body leading-relaxed">
              Interoperability is not an afterthought — it is the architecture. Sunrise OS is designed to integrate, not to isolate.
            </p>
            <div className="space-y-[1.8vh]">
              <div className="flex items-start gap-[1.5vw]">
                <div className="w-[0.5vw] h-[0.5vw] rounded-full bg-teal mt-[0.9vh] flex-none" />
                <p className="text-[1.5vw] text-[#B8C8D8] font-body leading-snug">
                  HL7 FHIR-aligned data model for healthcare interoperability
                </p>
              </div>
              <div className="flex items-start gap-[1.5vw]">
                <div className="w-[0.5vw] h-[0.5vw] rounded-full bg-teal mt-[0.9vh] flex-none" />
                <p className="text-[1.5vw] text-[#B8C8D8] font-body leading-snug">
                  Open API layer for EHR data portability and partner integrations
                </p>
              </div>
              <div className="flex items-start gap-[1.5vw]">
                <div className="w-[0.5vw] h-[0.5vw] rounded-full bg-teal mt-[0.9vh] flex-none" />
                <p className="text-[1.5vw] text-[#B8C8D8] font-body leading-snug">
                  Planned connections: lab, pharmacy, state SUD reporting, clearinghouses
                </p>
              </div>
              <div className="flex items-start gap-[1.5vw]">
                <div className="w-[0.5vw] h-[0.5vw] rounded-full bg-teal mt-[0.9vh] flex-none" />
                <p className="text-[1.5vw] text-[#B8C8D8] font-body leading-snug">
                  Webhook architecture for real-time data push to third-party systems
                </p>
              </div>
            </div>
            <div className="bg-[#1A2E1A] border border-teal/30 rounded-xl p-[2vh]">
              <div className="text-[1.1vw] text-teal font-body font-semibold uppercase tracking-[0.15em] mb-[0.8vh]">Certification status</div>
              <div className="text-[1.35vw] text-[#B8C8D8] font-body leading-snug">
                ONC certification — PLACEHOLDER. Not yet certified as of this presentation. State reporting integrations to expand as partnerships confirmed.
              </div>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[2px] h-full bg-teal/10 absolute left-1/2" />
              <div className="h-[2px] w-full bg-teal/10 absolute top-1/2" />
            </div>

            <div className="relative w-full h-full flex items-center justify-center">
              <div className="absolute w-[14vw] h-[14vw] rounded-full bg-[#1A3A5E] border-[0.25vw] border-[#F05A28] flex flex-col items-center justify-center text-center z-10">
                <div className="text-[1.6vw] font-display font-black text-text leading-tight">Sunrise OS</div>
                <div className="w-[5vw] h-[0.25vh] bg-primary my-[0.8vh]" />
                <div className="text-[1.05vw] text-primary font-body font-semibold uppercase tracking-[0.1em]">API Layer</div>
              </div>

              <div className="absolute" style={{top: '8%', left: '50%', transform: 'translateX(-50%)'}}>
                <div className="h-[3vh] w-[0.15vw] bg-teal mx-auto mb-[0.5vh]" />
                <div className="bg-[#1A3A5E] border border-teal/60 rounded-xl px-[1.5vw] py-[1vh] text-center">
                  <div className="text-[1.2vw] text-teal font-body font-semibold">State Registry</div>
                  <div className="text-[1vw] text-[#7A96B0] font-body">SUD reporting</div>
                </div>
              </div>

              <div className="absolute" style={{bottom: '8%', left: '50%', transform: 'translateX(-50%)'}}>
                <div className="bg-[#1A3A5E] border border-teal/60 rounded-xl px-[1.5vw] py-[1vh] text-center mb-[0.5vh]">
                  <div className="text-[1.2vw] text-teal font-body font-semibold">Mobile App</div>
                  <div className="text-[1vw] text-[#7A96B0] font-body">Sunrise Staff</div>
                </div>
                <div className="h-[3vh] w-[0.15vw] bg-teal mx-auto mt-[0.5vh]" />
              </div>

              <div className="absolute" style={{left: '3%', top: '25%'}}>
                <div className="bg-[#1A3A5E] border border-teal/60 rounded-xl px-[1.5vw] py-[1vh] text-center">
                  <div className="text-[1.2vw] text-teal font-body font-semibold">Laboratory</div>
                  <div className="text-[1vw] text-[#7A96B0] font-body">Results & orders</div>
                </div>
                <div className="h-[0.15vw] bg-teal mt-[1vh]" style={{width: '4vw', marginLeft: '100%', marginTop: '-3vh', position: 'absolute', top: '50%'}} />
              </div>

              <div className="absolute" style={{right: '3%', top: '25%'}}>
                <div className="bg-[#1A3A5E] border border-teal/60 rounded-xl px-[1.5vw] py-[1vh] text-center">
                  <div className="text-[1.2vw] text-teal font-body font-semibold">Pharmacy</div>
                  <div className="text-[1vw] text-[#7A96B0] font-body">e-prescribing</div>
                </div>
              </div>

              <div className="absolute" style={{left: '3%', bottom: '25%'}}>
                <div className="bg-[#1A3A5E] border border-teal/60 rounded-xl px-[1.5vw] py-[1vh] text-center">
                  <div className="text-[1.2vw] text-teal font-body font-semibold">Clearinghouse</div>
                  <div className="text-[1vw] text-[#7A96B0] font-body">Claims & billing</div>
                </div>
              </div>

              <div className="absolute" style={{right: '3%', bottom: '25%'}}>
                <div className="bg-[#1A3A5E] border border-teal/60 rounded-xl px-[1.5vw] py-[1vh] text-center">
                  <div className="text-[1.2vw] text-teal font-body font-semibold">Partner EHR</div>
                  <div className="text-[1vw] text-[#7A96B0] font-body">Data portability</div>
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
