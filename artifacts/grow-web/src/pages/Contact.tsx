import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { HeroSection } from '@/components/HeroSection';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin, Phone, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const contactSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  organization: z.string().optional(),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  reason: z.string().min(1, "Please select a contact reason"),
  message: z.string().min(20, "Message must be at least 20 characters"),
  consent: z.literal(true, {
    errorMap: () => ({ message: "You must agree to the privacy policy" })
  })
});

type ContactFormValues = z.infer<typeof contactSchema>;

const contactReasons = [
  "General Inquiry",
  "Partnership Opportunities",
  "Media & Press Inquiries",
  "Professional Training",
  "Course or Content Question",
  "SunriseOS Platform Interest",
  "Publishing Submission",
  "Speaking Engagement Request",
  "Employment Opportunities",
  "Donor / Foundation Inquiry"
];

export function Contact() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      organization: "",
      email: "",
      phone: "",
      reason: "",
      message: "",
    }
  });

  const onSubmit = async (data: ContactFormValues) => {
    setStatus('submitting');
    // Simulate network delay
    setTimeout(() => {
      // Simulate 10% error rate for demonstration
      if (Math.random() > 0.9) {
        setStatus('error');
      } else {
        setStatus('success');
      }
    }, 1500);
  };

  return (
    <Layout>
      <HeroSection 
        headline="Get in Touch"
        subheadline="Whether you're looking to partner, ask a question about our resources, or request a demo, our team is here to help."
        minHeight="min-h-[40vh]"
      />

      <section className="py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col lg:flex-row gap-16">
            
            {/* Form Section */}
            <div className="w-full lg:w-2/3">
              {status === 'success' ? (
                <div className="glass-card rounded-2xl p-12 text-center border-primary/20">
                  <CheckCircle className="w-16 h-16 text-primary mx-auto mb-6" />
                  <h3 className="text-3xl font-heading font-bold mb-4">Thank you for reaching out!</h3>
                  <p className="text-muted-foreground text-lg mb-8">
                    Your message has been received. Our team will review your inquiry and respond within 2 business days.
                  </p>
                  <button 
                    onClick={() => { form.reset(); setStatus('idle'); }}
                    className="text-primary font-medium hover:underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <div className="bg-card border border-border rounded-2xl p-8">
                  {status === 'error' && (
                    <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3 text-destructive">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold">Submission Failed</h4>
                        <p className="text-sm opacity-90">There was a network error sending your message. Please try again.</p>
                      </div>
                    </div>
                  )}

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name *</FormLabel>
                              <FormControl>
                                <input {...field} className="w-full bg-background border border-input rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name *</FormLabel>
                              <FormControl>
                                <input {...field} className="w-full bg-background border border-input rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address *</FormLabel>
                              <FormControl>
                                <input type="email" {...field} className="w-full bg-background border border-input rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <input type="tel" {...field} className="w-full bg-background border border-input rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="organization"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Organization (Optional)</FormLabel>
                            <FormControl>
                              <input {...field} className="w-full bg-background border border-input rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="reason"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Reason *</FormLabel>
                            <FormControl>
                              <select 
                                {...field} 
                                className="w-full bg-background border border-input rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary appearance-none text-foreground"
                              >
                                <option value="" disabled>Select a reason...</option>
                                {contactReasons.map(r => <option key={r} value={r}>{r}</option>)}
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Message *</FormLabel>
                            <FormControl>
                              <textarea 
                                {...field} 
                                rows={5}
                                className="w-full bg-background border border-input rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary resize-y" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="consent"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border border-border rounded-lg bg-background/50">
                            <FormControl>
                              <input 
                                type="checkbox"
                                checked={field.value === true}
                                onChange={(e) => field.onChange(e.target.checked)}
                                className="mt-1 w-4 h-4 rounded border-input text-primary focus:ring-primary accent-primary" 
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-sm font-normal text-muted-foreground">
                                I agree to the privacy policy and consent to be contacted regarding my inquiry.
                              </FormLabel>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />

                      <button 
                        type="submit" 
                        disabled={status === 'submitting'}
                        className="w-full py-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                      >
                        {status === 'submitting' ? 'Sending Message...' : 'Send Message'}
                      </button>
                      
                      <p className="text-xs text-muted-foreground text-center">
                        Your personal information is handled in accordance with our Privacy Policy. We will never sell or share your information.
                      </p>
                    </form>
                  </Form>
                </div>
              )}
            </div>

            {/* Sidebar Details */}
            <div className="w-full lg:w-1/3">
              <div className="sticky top-28 space-y-8">
                <div>
                  <h3 className="font-heading font-semibold text-xl mb-6">Contact Information</h3>
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Mail className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Email</p>
                        <a href="mailto:info@growmotivational.com" className="text-muted-foreground hover:text-primary transition-colors">info@growmotivational.com</a>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Phone className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Phone</p>
                        <a href="tel:301-555-0192" className="text-muted-foreground hover:text-primary transition-colors">(301) 555-0192</a>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <MapPin className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Headquarters</p>
                        <p className="text-muted-foreground">100 Recovery Way, Suite 200<br/>Rockville, MD 20850</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-border">
                  <h3 className="font-heading font-semibold mb-4">Connect With Us</h3>
                  <div className="flex gap-4">
                    {/* Placeholder for social icons since we used standard lucide ones in footer but lucide lacks facebook/youtube */}
                    <a href="#" className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-foreground hover:text-primary hover:border-primary transition-colors">
                      <span className="font-bold text-sm">in</span>
                    </a>
                    <a href="#" className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-foreground hover:text-primary hover:border-primary transition-colors">
                      <span className="font-bold text-sm">ig</span>
                    </a>
                    <a href="#" className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-foreground hover:text-primary hover:border-primary transition-colors">
                      <span className="font-bold text-sm">fb</span>
                    </a>
                    <a href="#" className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-foreground hover:text-primary hover:border-primary transition-colors">
                      <span className="font-bold text-sm">yt</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </Layout>
  );
}
