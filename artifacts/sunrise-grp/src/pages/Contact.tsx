import React from 'react';
import PageWrapper, { FadeIn, Reveal } from '@/components/animations';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, MapPin } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  company: z.string().optional(),
  inquiryType: z.string().min(1, 'Please select an inquiry type'),
  message: z.string().min(10, 'Message must be at least 10 characters')
});

export default function Contact() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      company: '',
      inquiryType: 'general',
      message: ''
    }
  });

  return (
    <PageWrapper>
      <div className="pt-40 pb-20 bg-background border-b border-border">
        <div className="container mx-auto px-6 md:px-12">
          <div className="max-w-4xl">
            <Reveal>
              <h1 className="text-5xl md:text-7xl font-serif mb-6">Contact Us</h1>
            </Reveal>
            <FadeIn delay={0.2}>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Direct all corporate inquiries, investor relations correspondence, and partnership proposals to our headquarters.
              </p>
            </FadeIn>
          </div>
        </div>
      </div>

      <div className="py-24 bg-card">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            
            <FadeIn>
              <div className="space-y-12">
                <div>
                  <h3 className="text-sm font-medium tracking-widest uppercase text-muted-foreground mb-4">Corporate Headquarters</h3>
                  <div className="flex items-start gap-4 text-foreground">
                    <MapPin className="mt-1 text-primary" size={20} />
                    <p className="text-lg leading-relaxed">
                      The Sunrise Grp., Inc.<br />
                      Delaware, United States<br />
                      <span className="text-sm text-muted-foreground mt-2 block">(Full address provided upon request)</span>
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium tracking-widest uppercase text-muted-foreground mb-4">Direct Communication</h3>
                  <div className="flex items-center gap-4 text-foreground">
                    <Mail className="text-primary" size={20} />
                    <a href="mailto:info@thesunrisegrp.com" className="text-lg hover:text-primary transition-colors">
                      info@thesunrisegrp.com
                    </a>
                  </div>
                </div>

                <div className="p-8 border border-border bg-background mt-8">
                  <h4 className="font-serif text-xl mb-2">Investor Relations</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                    For inquiries regarding capital allocation, M&A opportunities, or enterprise partnerships, please specify "Investor Relations" in your correspondence.
                  </p>
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="bg-background border border-border p-8 md:p-10 shadow-sm">
                <h3 className="text-2xl font-serif mb-8">Send an Inquiry</h3>
                
                <Form {...form}>
                  <form 
                    action="https://formsubmit.co/info@thesunrisegrp.com" 
                    method="POST" 
                    className="space-y-6"
                  >
                    {/* FormSubmit Configuration */}
                    <input type="hidden" name="_subject" value="New Corporate Inquiry - The Sunrise Grp." />
                    <input type="hidden" name="_next" value={window.location.href} />
                    <input type="hidden" name="_captcha" value="false" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="uppercase text-xs tracking-widest text-muted-foreground">Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" {...field} className="bg-card border-border rounded-sm h-12" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="uppercase text-xs tracking-widest text-muted-foreground">Email Address</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="john@company.com" {...field} className="bg-card border-border rounded-sm h-12" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="company"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="uppercase text-xs tracking-widest text-muted-foreground">Company / Organization</FormLabel>
                            <FormControl>
                              <Input placeholder="Acme Corp" {...field} className="bg-card border-border rounded-sm h-12" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="inquiryType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="uppercase text-xs tracking-widest text-muted-foreground">Inquiry Type</FormLabel>
                            <FormControl>
                              <select 
                                {...field} 
                                className="flex h-12 w-full rounded-sm border border-border bg-card px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <option value="general">General Inquiry</option>
                                <option value="investor">Investor Relations</option>
                                <option value="partnership">Partnership Proposal</option>
                                <option value="media">Media / Press</option>
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="uppercase text-xs tracking-widest text-muted-foreground">Message</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="How can we assist you?" 
                              className="min-h-[150px] bg-card border-border rounded-sm resize-y"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <button
                      type="submit"
                      className="w-full bg-primary text-primary-foreground h-12 uppercase tracking-widest text-sm font-medium rounded-sm hover:bg-primary/90 transition-colors"
                    >
                      Submit Inquiry
                    </button>
                  </form>
                </Form>
              </div>
            </FadeIn>

          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
