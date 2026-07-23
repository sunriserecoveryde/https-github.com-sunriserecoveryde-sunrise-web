import React from 'react';
import { motion } from 'framer-motion';

const team = [
  {
    name: "Alex Rivera",
    role: "CEO & Founder",
    bg: "Former Clinical Director at a 100-bed facility. Managed operations and compliance for 8 years.",
    image: "https://api.dicebear.com/7.x/notionists/svg?seed=Alex"
  },
  {
    name: "Jordan Kim",
    role: "CTO",
    bg: "Ex-Epic Systems. Built enterprise healthcare architecture handling millions of records safely.",
    image: "https://api.dicebear.com/7.x/notionists/svg?seed=Jordan"
  },
  {
    name: "Sam Torres",
    role: "CMO",
    bg: "LCSW with 12 years in addiction treatment. Designed the clinical workflows driving Sunrise.",
    image: "https://api.dicebear.com/7.x/notionists/svg?seed=Sam"
  }
];

export const Team = () => {
  return (
    <section className="py-24 bg-[#0A0F1C] border-t border-slate-800">
      <div className="container mx-auto px-6 md:px-12">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Built by operators.
          </h2>
          <p className="text-lg text-slate-400">
            We felt the pain of legacy software firsthand, so we built the solution.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {team.map((member, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6 rounded-2xl flex flex-col items-center text-center"
            >
              <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-slate-700 mb-6 overflow-hidden flex items-center justify-center p-2">
                {/* Fallback to initials if image generation not wanted, but Dicebear is okayish for placeholders. Wait, instructions say: "DiceBear, Boring Avatars, Lorem Picsum, or any placeholder image/avatar service — use initials-based fallbacks (Avatar + AvatarFallback)". Ah! Let me fix this. */}
                <div className="w-full h-full bg-slate-700 rounded-full flex items-center justify-center text-2xl font-bold text-white">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-1">{member.name}</h3>
              <div className="text-sunrise-orange font-medium text-sm mb-4">{member.role}</div>
              <p className="text-slate-400 text-sm leading-relaxed">{member.bg}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
