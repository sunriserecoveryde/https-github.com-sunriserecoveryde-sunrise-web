/**
 * TopicPicker.tsx
 *
 * Searchable, role-aware session-topic picker for the AI Draft Assistant.
 * Selecting a topic immediately fires onSelect — the parent generates the
 * full note draft without requiring any additional button press.
 */

import React, { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { TOPIC_CATEGORIES, ALL_TOPICS, getTopicsForStaff, TopicTemplate } from '../../lib/topicLibrary';

interface Props {
  /** Staff title string from mockStaff (used to rank topics) */
  staffTitle?: string;
  /** Currently selected topic id, or null */
  selectedId: string | null;
  /** Fired immediately when a topic chip is clicked */
  onSelect: (topicId: string) => void;
  /** Optional: clear the selection */
  onClear?: () => void;
}

export function TopicPicker({ staffTitle, selectedId, onSelect, onClear }: Props) {
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState<string | null>(null);

  // Ordered topic list respecting staff role relevance
  const orderedTopics = useMemo(
    () => getTopicsForStaff(staffTitle ?? ''),
    [staffTitle],
  );

  // Build display list: filtered by search + optional category
  const displayed: TopicTemplate[] = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orderedTopics.filter(t => {
      const matchesCat = !activeCat || t.category === activeCat;
      const matchesSearch = !q
        || t.label.toLowerCase().includes(q)
        || t.description.toLowerCase().includes(q)
        || t.category.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [orderedTopics, search, activeCat]);

  // Group displayed topics back into their categories for rendering
  const grouped = useMemo(() => {
    const map = new Map<string, { catLabel: string; emoji: string; topics: TopicTemplate[] }>();
    displayed.forEach(t => {
      const cat = TOPIC_CATEGORIES.find(c => c.label === t.category);
      if (!map.has(t.category)) {
        map.set(t.category, { catLabel: t.category, emoji: cat?.emoji ?? '📁', topics: [] });
      }
      map.get(t.category)!.topics.push(t);
    });
    return Array.from(map.values());
  }, [displayed]);

  const selectedTopic = selectedId ? ALL_TOPICS.find(t => t.id === selectedId) : null;

  return (
    <div className="space-y-2">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold text-teal-800 tracking-wide">
          Select Session Topic — auto-fills note fields instantly
        </div>
        {selectedTopic && onClear && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-[10px] text-teal-600 hover:text-teal-800 font-semibold"
          >
            <X className="w-3 h-3" /> Clear topic
          </button>
        )}
      </div>

      {/* Selected badge */}
      {selectedTopic && (
        <div className="flex items-center gap-2 px-3 py-2 bg-teal-600 text-white rounded-lg text-xs font-semibold">
          <span>{selectedTopic.emoji}</span>
          <span>{selectedTopic.label}</span>
          <span className="ml-auto text-teal-200 font-normal">{selectedTopic.category}</span>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setActiveCat(null); }}
          placeholder="Search topics…"
          className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-border rounded-lg focus:outline-none focus:border-teal-400"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Category filter pills */}
      {!search && (
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveCat(null)}
            className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
              !activeCat ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate border-border hover:border-teal-300'
            }`}
          >
            All
          </button>
          {TOPIC_CATEGORIES.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCat(prev => prev === c.label ? null : c.label)}
              className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                activeCat === c.label
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-white text-slate border-border hover:border-teal-300'
              }`}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      )}

      {/* Topic grid */}
      <div className="max-h-52 overflow-y-auto rounded-lg border border-teal-100 bg-white p-2 space-y-3">
        {grouped.length === 0 && (
          <div className="text-xs text-slate text-center py-4">No topics match your search.</div>
        )}
        {grouped.map(({ catLabel, emoji, topics }) => (
          <div key={catLabel}>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 px-1">
              {emoji} {catLabel}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {topics.map(t => (
                <button
                  key={t.id}
                  onClick={() => onSelect(t.id)}
                  title={t.description}
                  className={`flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all ${
                    selectedId === t.id
                      ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                      : 'bg-teal-50/60 text-teal-800 border-teal-200 hover:bg-teal-100 hover:border-teal-400'
                  }`}
                >
                  <span>{t.emoji}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="text-[9px] text-slate-400 text-center">
        {ALL_TOPICS.length} topics across {TOPIC_CATEGORIES.length} categories · click any chip to auto-fill the note
      </div>
    </div>
  );
}
