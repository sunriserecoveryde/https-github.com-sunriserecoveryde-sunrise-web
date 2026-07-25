import { Resource } from '@/data/resources';
import { BookOpen, Headphones, Play, FileText, FileSearch, ArrowRight } from 'lucide-react';
import { Link } from 'wouter';

const formatIconMap = {
  'Course': Play,
  'Workbook': BookOpen,
  'Guide': FileText,
  'Podcast': Headphones,
  'Video': Play,
  'Assessment Tool': FileSearch,
};

export function ResourceCard({ resource }: { resource: Resource }) {
  const Icon = formatIconMap[resource.format] || FileText;

  return (
    <div className="glass-card rounded-xl p-6 flex flex-col h-full hover-elevate transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-muted rounded-lg text-primary group-hover:scale-110 transition-transform">
          <Icon className="w-6 h-6" />
        </div>
        {resource.level && (
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-background border border-border text-muted-foreground">
            {resource.level}
          </span>
        )}
      </div>
      
      <div className="flex gap-2 mb-3">
        <span className="text-xs font-medium text-sky">{resource.category}</span>
        <span className="text-xs text-muted-foreground">•</span>
        <span className="text-xs text-muted-foreground">{resource.audience}</span>
      </div>
      
      <h3 className="text-xl font-heading font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
        {resource.title}
      </h3>
      
      <p className="text-muted-foreground text-sm flex-1 mb-6 line-clamp-3">
        {resource.description}
      </p>
      
      <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
        <span className="text-xs font-medium text-muted-foreground">
          {resource.format} {resource.duration && `· ${resource.duration}`}
        </span>
        <Link href={`/education?id=${resource.id}`} className="text-primary hover:text-gold transition-colors flex items-center gap-1 text-sm font-medium">
          View <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
