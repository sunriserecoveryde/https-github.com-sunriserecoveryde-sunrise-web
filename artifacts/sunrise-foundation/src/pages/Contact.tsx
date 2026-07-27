import React, { useState } from 'react';
import { FadeIn } from '@/components/ui/fade-in';
import { Mail, MapPin, Phone, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ContactPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "Message Sent",
        description: "Thank you for reaching out to The Sunrise Foundation. A member of our team will respond shortly.",
      });
      (e.target as HTMLFormElement).reset();
    }, 1000);
  };

  return (
    <div className="w-full bg-background min-h-screen pb-24">
      {/* Header */}
      <div className="bg-foreground text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <h1 className="text-4xl md:text-5xl font-serif mb-4">Contact Us</h1>
            <p className="text-lg text-gray-300 max-w-2xl font-light">
              Whether you are inquiring about a grant, seeking partnership, or looking to make a major gift—we are here to connect.
            </p>
          </FadeIn>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Info Column */}
          <div className="lg:col-span-1 space-y-8">
            <FadeIn>
              <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Mail className="text-primary" size={20} />
                </div>
                <h3 className="font-bold text-lg mb-1">Email Us</h3>
                <p className="text-muted-foreground text-sm mb-2">For general inquiries and partnerships:</p>
                <a href="mailto:hello@sunrisefoundation.org" className="text-primary font-medium hover:underline">
                  hello@sunrisefoundation.org
                </a>
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
                <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
                  <MapPin className="text-secondary" size={20} />
                </div>
                <h3 className="font-bold text-lg mb-1">Headquarters</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  The Sunrise Foundation<br/>
                  123 Recovery Way, Suite 400<br/>
                  Baltimore, MD 21202
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
                <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center mb-4">
                  <MessageSquare className="text-accent-foreground" size={20} />
                </div>
                <h3 className="font-bold text-lg mb-1">Grant Inquiries</h3>
                <p className="text-muted-foreground text-sm">
                  Please use the contact form to initiate a grant inquiry. Case managers review inquiries daily.
                </p>
              </div>
            </FadeIn>
          </div>

          {/* Form Column */}
          <div className="lg:col-span-2">
            <FadeIn delay={0.3}>
              <div className="bg-card border border-border rounded-xl shadow-sm p-8">
                <h2 className="text-2xl font-bold mb-6 text-foreground">Send a Message</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-foreground mb-1">First Name</label>
                      <input 
                        type="text" 
                        id="firstName" 
                        required 
                        className="w-full p-3 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" 
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-foreground mb-1">Last Name</label>
                      <input 
                        type="text" 
                        id="lastName" 
                        required 
                        className="w-full p-3 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">Email Address</label>
                      <input 
                        type="email" 
                        id="email" 
                        required 
                        className="w-full p-3 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" 
                      />
                    </div>
                    <div>
                      <label htmlFor="inquiryType" className="block text-sm font-medium text-foreground mb-1">Inquiry Type</label>
                      <select 
                        id="inquiryType" 
                        required 
                        className="w-full p-3 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                      >
                        <option value="">Select a topic...</option>
                        <option value="grant">Applying for a Grant/Scholarship</option>
                        <option value="donate">Making a Donation / Major Gift</option>
                        <option value="partner">Becoming a Provider Partner</option>
                        <option value="press">Press / Media</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-foreground mb-1">Message</label>
                    <textarea 
                      id="message" 
                      required 
                      rows={5}
                      className="w-full p-3 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all resize-none" 
                      placeholder="How can we help you?"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full md:w-auto px-8 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </button>

                </form>
              </div>
            </FadeIn>
          </div>

        </div>
      </div>
    </div>
  );
}
