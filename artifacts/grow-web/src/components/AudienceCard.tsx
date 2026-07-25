import { ArrowRight, LucideIcon } from 'lucide-react';

interface AudienceCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function AudienceCard({ icon: Icon, title, description }: AudienceCardProps) {
  return (
    <div className="p-6 rounded-xl border border-border bg-card/30 hover:bg-card hover:border-primary/50 transition-all group cursor-pointer">
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-heading font-semibold mb-3 text-foreground group-hover:text-primary transition-colors">
        {title}
      </h3>
      <p className="text-muted-foreground mb-6">
        {description}
      </p>
      <div className="flex items-center gap-2 text-sm font-medium text-primary opacity-80 group-hover:opacity-100 transition-opacity">
        Learn More <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
}
