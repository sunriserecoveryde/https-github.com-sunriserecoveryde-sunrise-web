import React from 'react';
import { motion } from 'framer-motion';
import { Award, Clock, Heart, Mail } from 'lucide-react';

const credentials = [
  { icon: <Clock className="w-4 h-4" />, text: '20+ years personal & professional experience' },
  { icon: <Award className="w-4 h-4" />, text: 'Clinical Supervisor & Entrepreneur' },
  { icon: <Heart className="w-4 h-4" />, text: 'Person in long-term recovery' },
];

export const Team = () => {
  return (
    <section id="team" className="py-28 border-t border-slate-800/50">
      <div className="container mx-auto px-5 md:px-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-bold tracking-[0.2em] uppercase text-sunrise-orange mb-5"
          >
            Leadership
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
            className="text-4xl md:text-5xl font-black text-white mb-4 leading-[1.08]"
          >
            Built by an operator.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-400 max-w-xl mx-auto"
          >
            We didn't enter behavioral health from the outside. We lived the problem — then built the solution.
          </motion.p>
        </div>

        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-[#0B1220] border border-slate-800 rounded-2xl p-8 md:p-10 flex flex-col md:flex-row items-center md:items-start gap-8"
          >
            {/* Avatar */}
            <div className="shrink-0">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-sunrise-orange/20 to-slate-800 border border-slate-700 flex items-center justify-center text-2xl font-black text-white tracking-tight">
                JC
              </div>
            </div>

            {/* Bio */}
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-black text-white mb-1">Jim Collins</h3>
              <div className="text-sunrise-orange text-xs font-bold tracking-[0.18em] uppercase mb-1">Founder & CEO</div>
              <a href="mailto:jim@getsunriseos.com" className="text-xs text-slate-500 hover:text-sunrise-orange transition-colors mb-5 inline-block">jim@getsunriseos.com</a>

              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Jim is an addiction treatment professional, clinical supervisor, entrepreneur, and person in long-term recovery with more than two decades of personal and professional experience. His work combines clinical knowledge, lived experience, ethical leadership, and a genuine commitment to helping people rebuild their lives.
              </p>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Throughout his career, Jim has supported individuals and families affected by substance use disorders while helping clinical teams provide structured, accountable, and compassionate care. He believes treatment should go beyond stabilization — helping people develop honesty, responsibility, consistency, practical life skills, and a sustainable foundation for long-term recovery.
              </p>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Known for being dependable, direct, supportive, and genuine, Jim believes people should never be permanently defined by their past. As a husband and father, he considers time his most valuable asset — and his goal is to serve the recovery community, create security for his family, and build a legacy that continues helping others for generations.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start mb-6">
                {credentials.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-500">
                    <div className="text-sunrise-orange/70">{c.icon}</div>
                    {c.text}
                  </div>
                ))}
              </div>

              <a
                href="mailto:jim@getsunriseos.com"
                className="inline-flex items-center gap-2 bg-sunrise-orange hover:bg-sunrise-orange/90 text-white text-sm font-bold px-5 py-2.5 rounded-full transition-colors"
              >
                <Mail className="w-4 h-4" />
                Contact Jim
              </a>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};
