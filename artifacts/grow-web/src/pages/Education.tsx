import { useState, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { PageMeta } from '@/components/PageMeta';
import { HeroSection } from '@/components/HeroSection';
import { ResourceCard } from '@/components/ResourceCard';
import { CourseCard } from '@/components/CourseCard';
import { SectionHeading } from '@/components/SectionHeading';
import { resources } from '@/data/resources';
import { courses } from '@/data/courses';
import { Search, Filter, X } from 'lucide-react';

const CATEGORIES = [
  "All",
  "Addiction Recovery",
  "Mental Health",
  "Family Support",
  "Co-Occurring Disorders",
  "Trauma & PTSD",
  "Medication-Assisted Treatment",
  "Mindfulness & Wellness",
  "Professional Development",
  "CIWA Protocol",
  "COWS Assessment",
  "Withdrawal Management",
  "Cultural Competency",
  "Peer Support Specialist Training",
  "Leadership in Recovery"
];

export function Education() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredResources = useMemo(() => {
    return resources.filter(resource => {
      const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            resource.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || resource.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <Layout>
      <PageMeta
        title="Education & Courses | Grow Motivational"
        description="Browse our library of behavioral health courses, resources, and tools for addiction recovery, mental health, family support, and professional development."
        ogUrl="https://www.growmotivational.com/education"
      />
      <HeroSection 
        headline="Learn. Grow. Recover."
        subheadline="Explore our comprehensive library of courses, workbooks, guides, and tools designed for every stage of the recovery journey."
        minHeight="min-h-[50vh]"
      />

      {/* Featured Courses Row */}
      <section className="py-12 bg-card/30 border-y border-white/5">
        <div className="container mx-auto px-4">
          <SectionHeading 
            title="Featured Courses" 
            subtitle="Deep-dive curriculums led by industry experts."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.slice(0, 3).map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      </section>

      {/* Library Filter Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <SectionHeading 
            title="Resource Library" 
          />
          
          <div className="flex flex-col lg:flex-row gap-8 mb-12">
            <div className="w-full lg:w-1/4 shrink-0">
              <div className="sticky top-28 space-y-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search resources..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-4 text-sm font-medium text-muted-foreground">
                    <Filter className="w-4 h-4" /> Categories
                  </div>
                  <div className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
                    {CATEGORIES.map(category => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`text-left px-3 py-2 rounded-md text-sm transition-colors ${
                          selectedCategory === category 
                            ? 'bg-primary/10 text-primary font-medium' 
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-3/4">
              <div className="mb-4 text-sm text-muted-foreground">
                Showing {filteredResources.length} result{filteredResources.length !== 1 && 's'}
              </div>
              
              {filteredResources.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredResources.map(resource => (
                    <ResourceCard key={resource.id} resource={resource} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-card/30 rounded-xl border border-dashed border-border">
                  <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-heading font-medium mb-2">No resources found</h3>
                  <p className="text-muted-foreground mb-4">Try adjusting your search or selected category.</p>
                  <button 
                    onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                    className="text-primary hover:underline text-sm"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Coming Soon Stub */}
      <section className="py-24 bg-muted/20 border-t border-border text-center">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="w-16 h-16 rounded-full bg-card border border-border flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">🚀</span>
          </div>
          <h2 className="text-2xl font-heading font-bold mb-4">Expanding Our Catalog</h2>
          <p className="text-muted-foreground">
            We're constantly working with clinicians and educators to develop new materials. Our full interactive digital learning platform is launching soon.
          </p>
        </div>
      </section>
    </Layout>
  );
}
