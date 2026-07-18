import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function CustomButtons({ onInsert }: { onInsert: (text: string) => void }) {
  const categories = [
    {
      name: 'Behavior/Presentation',
      items: [
        "Client denied SI/HI",
        "Client presented sober and cooperative",
        "Client showed signs of withdrawal",
        "Client refused to participate",
        "Client engaged actively",
        "Client was tearful/emotional"
      ]
    },
    {
      name: 'Interventions',
      items: [
        "MI techniques applied",
        "CBT skills practiced",
        "Relapse prevention planning",
        "Safety planning completed",
        "Family session conducted",
        "12-step facilitation"
      ]
    },
    {
      name: 'ASAM References',
      items: [
        "ASAM Dim. 1: Stable",
        "ASAM Dim. 3: Moderate concern",
        "ASAM Dim. 4: Low motivation noted",
        "ASAM Dim. 5: High relapse risk"
      ]
    },
    {
      name: 'Compliance',
      items: [
        "UA collected per protocol",
        "Medication administered as ordered",
        "Treatment plan reviewed with client",
        "Release of information obtained"
      ]
    }
  ];

  return (
    <div className="bg-slate-50 border border-border rounded-md p-3 max-h-[500px] overflow-y-auto custom-scrollbar">
      <h3 className="font-semibold text-sm mb-3 text-navy">Quick Insert Phrases</h3>
      <div className="space-y-4">
        {categories.map(cat => (
          <div key={cat.name}>
            <div className="text-xs font-semibold text-slate mb-2 uppercase tracking-wider">{cat.name}</div>
            <div className="flex flex-wrap gap-1.5">
              {cat.items.map(item => (
                <button
                  key={item}
                  onClick={() => onInsert(item + " ")}
                  className="text-left text-xs bg-white border border-border hover:border-sunrise-blue hover:text-sunrise-blue transition-colors px-2 py-1 rounded"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
