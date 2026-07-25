import { Layout } from '@/components/Layout';
import { Link } from 'wouter';
import { Hammer } from 'lucide-react';

export function ComingSoon() {
  return (
    <Layout>
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-24">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-8">
          <Hammer className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">
          Coming Soon
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          We are currently building out this section of the Grow Motivational platform. 
          Check back soon for new content, resources, and tools.
        </p>
        <Link 
          href="/" 
          className="px-8 py-4 bg-card border border-border rounded-lg font-medium hover:bg-muted/50 transition-colors"
        >
          Return to Home
        </Link>
      </div>
    </Layout>
  );
}
