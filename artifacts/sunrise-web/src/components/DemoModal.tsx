import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';

interface DemoModalProps {
  open: boolean;
  onClose: () => void;
  defaultPlan?: string;
}

interface FormState {
  name: string;
  email: string;
  facility: string;
  bedCount: string;
  message: string;
}

type Status = 'idle' | 'submitting' | 'success' | 'error';

const BED_OPTIONS = ['< 10', '10–20', '21–40', '41–75', '75+'];

export const DemoModal: React.FC<DemoModalProps> = ({ open, onClose, defaultPlan = '' }) => {
  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    facility: '',
    bedCount: '',
    message: '',
  });
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, plan: defaultPlan }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as any)?.error ?? `Server error ${res.status}`);
      }

      setStatus('success');
    } catch (err: any) {
      setErrorMsg(err?.message ?? 'Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  const handleClose = () => {
    // Allow close at any time; reset on next open
    onClose();
    // Delay reset so animation finishes
    setTimeout(() => {
      setStatus('idle');
      setErrorMsg('');
      setForm({ name: '', email: '', facility: '', bedCount: '', message: '' });
    }, 300);
  };

  const inputCls =
    'w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sunrise-orange/60 focus:ring-1 focus:ring-sunrise-orange/30 transition-all';

  const labelCls = 'block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider';

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="relative w-full max-w-lg bg-[#0B1220] border border-slate-700/60 rounded-2xl shadow-[0_48px_120px_rgba(0,0,0,0.8)] pointer-events-auto overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Header glow strip */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sunrise-orange/40 to-transparent" />

              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-1.5 text-slate-500 hover:text-white rounded-lg hover:bg-slate-700/50 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="p-8">
                {status === 'success' ? (
                  <SuccessView onClose={handleClose} />
                ) : (
                  <>
                    <div className="mb-6">
                      <div className="text-xs font-bold tracking-[0.2em] uppercase text-sunrise-orange mb-2">
                        Book a Demo
                      </div>
                      <h2 className="text-2xl font-black text-white leading-tight">
                        See Sunrise OS in 30 minutes.
                      </h2>
                      <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                        We'll walk through your facility's workflow and show you exactly what changes on day one.
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={labelCls}>Your name *</label>
                          <input
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            required
                            placeholder="Jane Smith"
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Work email *</label>
                          <input
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                            placeholder="jane@facility.com"
                            className={inputCls}
                          />
                        </div>
                      </div>

                      <div>
                        <label className={labelCls}>Facility name *</label>
                        <input
                          name="facility"
                          value={form.facility}
                          onChange={handleChange}
                          required
                          placeholder="Sunrise Recovery Center"
                          className={inputCls}
                        />
                      </div>

                      <div>
                        <label className={labelCls}>Bed count</label>
                        <select
                          name="bedCount"
                          value={form.bedCount}
                          onChange={handleChange}
                          className={inputCls + ' appearance-none cursor-pointer'}
                        >
                          <option value="">Select range…</option>
                          {BED_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt} beds</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className={labelCls}>Anything specific you'd like to see?</label>
                        <textarea
                          name="message"
                          value={form.message}
                          onChange={handleChange}
                          rows={3}
                          placeholder="e.g. CIWA scoring, MAR workflow, shift handoff notes…"
                          className={inputCls + ' resize-none'}
                        />
                      </div>

                      {status === 'error' && (
                        <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
                          {errorMsg}
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={status === 'submitting'}
                        className="flex items-center justify-center w-full gap-2 px-6 py-3.5 text-sm font-bold text-white bg-sunrise-orange hover:bg-orange-500 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl transition-all shadow-[0_0_32px_rgba(249,115,22,0.25)] hover:shadow-[0_0_48px_rgba(249,115,22,0.4)] group"
                      >
                        {status === 'submitting' ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Sending…
                          </>
                        ) : (
                          <>
                            Request My Demo
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                          </>
                        )}
                      </button>

                      <p className="text-center text-xs text-slate-600">
                        No spam. We'll reach out within one business day.
                      </p>
                    </form>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const SuccessView: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="text-center py-4">
    <div className="flex justify-center mb-5">
      <div className="w-14 h-14 rounded-full bg-sunrise-orange/15 border border-sunrise-orange/30 flex items-center justify-center">
        <CheckCircle className="w-7 h-7 text-sunrise-orange" />
      </div>
    </div>
    <h2 className="text-2xl font-black text-white mb-2">You're on the list!</h2>
    <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto mb-8">
      We'll reach out within one business day to schedule your personalized demo.
    </p>
    <button
      onClick={onClose}
      className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors"
    >
      Close
    </button>
  </div>
);
