import { Layout } from '@/components/Layout';
import { PageMeta } from '@/components/PageMeta';
import { HeroSection } from '@/components/HeroSection';
import { EcosystemDiagram } from '@/components/EcosystemDiagram';
import { Activity, BrainCircuit, BookOpen, HeartHandshake, ArrowRight } from 'lucide-react';
import { Link } from 'wouter';

export function TheSunriseGroup() {
  const entities = [
    {
      id: "recovery",
      icon: Activity,
      title: "Sunrise Recovery",
      color: "text-sky",
      bg: "bg-sky/10",
      border: "border-sky/20",
      desc: "The clinical foundation of our ecosystem. Sunrise Recovery provides evidence-based, compassionate behavioral health treatment across multiple levels of care in Maryland and Delaware.",
      services: ["Residential Treatment", "Partial Hospitalization (PHP)", "Intensive Outpatient (IOP)", "Outpatient Services (OP)", "Medical Withdrawal Management"],
      cta: "Visit Clinical Site",
      href: "#"
    },
    {
      id: "os",
      icon: BrainCircuit,
      title: "SunriseOS",
      color: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/20",
      desc: "The technological engine driving our operations. SunriseOS is a purpose-built platform that reduces administrative burden so clinicians can focus on patient care.",
      services: ["AI-Assisted Documentation", "Integrated EHR", "Compliance Readiness", "Outcomes Analytics", "Staff Scheduling"],
      cta: "Explore the Platform",
      href: "/sunriseos"
    },
    {
      id: "grow",
      icon: BookOpen,
      title: "Grow Motivational",
      color: "text-gold",
      bg: "bg-gold/10",
      border: "border-gold/20",
      desc: "The educational division translating clinical expertise into accessible learning. We equip patients, families, and professionals with the knowledge to sustain recovery.",
      services: ["Digital Courses", "Clinical Workbooks", "Professional Training & CEUs", "Podcasts & Media", "Publishing"],
      cta: "View Resources",
      href: "/education"
    },
    {
      id: "foundation",
      icon: HeartHandshake,
      title: "The Sunrise Foundation",
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      border: "border-emerald-400/20",
      desc: "The philanthropic arm dedicated to removing barriers to care. We believe financial constraints should never prevent someone from accessing life-saving treatment.",
      services: ["Treatment Scholarships", "Sober Living Grants", "Community Education", "Advocacy Initiatives", "Research Funding"],
      cta: "Learn About Our Impact",
      href: "#"
    }
  ];

  return (
    <Layout>
      <PageMeta
        title="The Sunrise Grp., Inc. | Behavioral Health Ecosystem"
        description="The Sunrise Grp., Inc. is an integrated family of organizations tackling behavioral health from every angle — clinical care, technology (SunriseOS), education (Grow Motivational), and philanthropy."
        ogUrl="https://www.growmotivational.com/the-sunrise-group"
      />
      <HeroSection 
        headline={
          <>
            A Family of Organizations <br/>
            Transforming <span className="text-gradient">Behavioral Health</span>
          </>
        }
        subheadline="The Sunrise Grp., Inc. is an integrated ecosystem designed to tackle the addiction crisis from every angle: clinical care, empowering technology, accessible education, and philanthropic support."
        minHeight="min-h-[60vh]"
      />

      {/* Parent company logo lockup */}
      <section className="py-14 border-b border-white/5 bg-muted/10">
        <div className="container mx-auto px-4 flex flex-col items-center gap-4 text-center">
          <img
            src="/sunrise-grp-logo.png"
            alt="The Sunrise Grp., Inc."
            className="h-28 w-auto object-contain"
          />
          <p className="text-sm text-muted-foreground max-w-xl">
            The Sunrise Grp., Inc. is the parent holding company for Sunrise Recovery, SunriseOS, Grow Motivational, and The Sunrise Foundation.
          </p>
        </div>
      </section>

      <section className="py-16 bg-muted/20 border-y border-white/5">
        <div className="container mx-auto px-4">
          <EcosystemDiagram />
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="space-y-24">
            {entities.map((entity, i) => (
              <div key={entity.id} className={`flex flex-col md:flex-row gap-10 items-center ${i % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}>
                <div className="w-full md:w-1/3 flex justify-center">
                  <div className={`w-40 h-40 rounded-3xl ${entity.bg} ${entity.border} border-2 flex items-center justify-center`}>
                    <entity.icon className={`w-20 h-20 ${entity.color}`} />
                  </div>
                </div>
                <div className="w-full md:w-2/3">
                  <h2 className="text-3xl font-heading font-bold mb-4">{entity.title}</h2>
                  <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                    {entity.desc}
                  </p>
                  <div className="mb-8">
                    <h4 className="font-semibold text-sm uppercase tracking-wider text-foreground mb-3">Key Focus Areas</h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {entity.services.map(s => (
                        <li key={s} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className={`w-1.5 h-1.5 rounded-full ${entity.color.replace('text-', 'bg-')}`} />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Link href={entity.href} className={`inline-flex items-center gap-2 font-medium ${entity.color} hover:opacity-80 transition-opacity`}>
                    {entity.cta} <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-card/40 border-t border-border">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-8">How We Work Together</h2>
          <div className="prose prose-invert prose-lg mx-auto text-muted-foreground">
            <p>
              The power of The Sunrise Grp., Inc. lies in the synergy between its divisions. Our clinical team at Sunrise Recovery identifies the most pressing challenges patients face daily. This insight flows directly to Grow Motivational, which develops targeted educational resources to address those exact needs.
            </p>
            <p>
              Those resources are then seamlessly delivered to patients and staff through SunriseOS, our proprietary technology platform, which tracks engagement and correlates it with clinical outcomes. 
            </p>
            <p>
              When gaps in access are identified, The Sunrise Foundation steps in to provide funding, ensuring that the best care and education remain available to those who need it most, regardless of their ability to pay. It is a continuous loop of learning, building, treating, and giving.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
