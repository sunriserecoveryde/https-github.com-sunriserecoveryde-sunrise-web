import { MediaItem } from '@/data/mediaItems';
import { PlayCircle, Headphones, ArrowRight, Clock } from 'lucide-react';

export function MediaCard({ item }: { item: MediaItem }) {
  const isPodcast = item.type === 'Podcast';
  const Icon = isPodcast ? Headphones : PlayCircle;
  
  return (
    <div className="group flex flex-col sm:flex-row gap-6 p-4 rounded-xl border border-transparent hover:border-border hover:bg-card/50 transition-all">
      <div className="w-full sm:w-48 h-48 sm:h-auto rounded-lg bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
        <Icon className="w-12 h-12 text-primary opacity-80 group-hover:scale-110 transition-transform" />
      </div>
      
      <div className="flex-1 flex flex-col justify-center py-2">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs font-semibold tracking-wider uppercase text-primary">
            {item.type}
          </span>
          {item.episodeInfo && (
            <>
              <span className="w-1 h-1 rounded-full bg-muted-foreground" />
              <span className="text-xs text-muted-foreground">{item.episodeInfo}</span>
            </>
          )}
        </div>
        
        <h3 className="text-xl font-heading font-semibold mb-3 group-hover:text-primary transition-colors">
          {item.title}
        </h3>
        
        <p className="text-muted-foreground mb-4 line-clamp-2">
          {item.description}
        </p>
        
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{item.duration}</span>
          </div>
          <button className="text-primary hover:text-gold transition-colors flex items-center gap-1 text-sm font-medium">
            {isPodcast ? 'Listen Now' : 'Watch Now'} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
