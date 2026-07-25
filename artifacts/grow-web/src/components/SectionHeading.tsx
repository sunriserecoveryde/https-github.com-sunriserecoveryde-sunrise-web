import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface SectionHeadingProps {
  title: string;
  subtitle?: string | ReactNode;
  align?: 'left' | 'center';
  badge?: string;
}

export function SectionHeading({ title, subtitle, align = 'left', badge }: SectionHeadingProps) {
  const isCentered = align === 'center';
  
  return (
    <div className={`mb-12 ${isCentered ? 'text-center mx-auto' : 'max-w-3xl'}`}>
      {badge && (
        <span className="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
          {badge}
        </span>
      )}
      <h2 className="text-3xl md:text-4xl font-heading font-bold tracking-tight mb-4 text-foreground">
        {title}
      </h2>
      {subtitle && (
        <p className="text-lg text-muted-foreground leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
