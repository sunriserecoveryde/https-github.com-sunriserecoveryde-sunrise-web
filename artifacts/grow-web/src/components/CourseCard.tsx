import { Course } from '@/data/courses';
import { Clock, Book, User, ArrowRight } from 'lucide-react';

export function CourseCard({ course }: { course: Course }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col h-full hover-elevate transition-all group">
      <div className="h-48 bg-muted relative overflow-hidden">
        {/* Placeholder gradient mimicking a course cover */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-card opacity-80" />
        <div className="absolute top-4 left-4">
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-background/80 backdrop-blur-sm border border-white/10 text-foreground">
            {course.category}
          </span>
        </div>
      </div>
      
      <div className="p-6 flex flex-col flex-1">
        <h3 className="text-xl font-heading font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
          {course.title}
        </h3>
        
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {course.description}
        </p>
        
        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="w-4 h-4 text-primary" />
            <span>{course.instructor}</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-sky" />
              <span>{course.duration}</span>
            </div>
            <div className="flex items-center gap-1">
              <Book className="w-4 h-4 text-gold" />
              <span>{course.modulesCount} Modules</span>
            </div>
          </div>
        </div>
        
        <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
          <span className="text-sm font-medium">{course.level}</span>
          <button className="text-primary hover:text-gold transition-colors flex items-center gap-1 text-sm font-medium">
            Start Course <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
