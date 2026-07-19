import React, { useState } from 'react';
import { Screen } from '../App';
import { MOCK_PATIENTS } from '../data/mockPatients';
import { MessageSquare, Send, Lock, AlertTriangle, Plus, Search, Bell, Check, CheckCheck } from 'lucide-react';

interface Props { navigate: (s: Screen, patientId?: string) => void; }

type MessageType = 'Patient-Staff' | 'Staff-Staff' | 'Team Alert' | 'Clinical Notification';
type MessageStatus = 'Unread' | 'Read' | 'Acknowledged';
type Urgency = 'Routine' | 'Urgent' | 'Critical';

interface Message {
  id: string;
  threadId: string;
  type: MessageType;
  urgency: Urgency;
  from: string;
  fromRole: string;
  to: string;
  toRole?: string;
  patientId?: string;
  subject: string;
  body: string;
  timestamp: string;
  status: MessageStatus;
  replies?: Message[];
}

const MESSAGES: Message[] = [
  {
    id: 'M-001', threadId: 'T-001', type: 'Staff-Staff', urgency: 'Urgent',
    from: 'Jessica Torres, RN', fromRole: 'Director of Nursing',
    to: 'Dr. Robert Chen, MD', toRole: 'Medical Director',
    patientId: 'p1',
    subject: 'Marcus Webb — Suboxone dose review requested',
    body: 'Dr. Chen — Marcus Webb (p1) is reporting increased cravings and mild withdrawal symptoms at Day 3 of current Suboxone 8mg BID. COWS score 8 this morning. Sarah Jenkins flagged at morning huddle. Requesting medical review of dose adjustment. Available for call if needed.',
    timestamp: '2026-07-19 8:42 AM', status: 'Read',
    replies: [
      {
        id: 'M-001r', threadId: 'T-001', type: 'Staff-Staff', urgency: 'Routine',
        from: 'Dr. Robert Chen, MD', fromRole: 'Medical Director',
        to: 'Jessica Torres, RN', toRole: 'Director of Nursing',
        patientId: 'p1',
        subject: 'RE: Marcus Webb — Suboxone dose review',
        body: 'Thanks Jessica. I\'ll review chart and order dose adjustment if clinically indicated. Can you get updated COWS at 10am and relay to me? Will see him at afternoon rounds.',
        timestamp: '2026-07-19 9:15 AM', status: 'Read',
      },
    ],
  },
  {
    id: 'M-002', threadId: 'T-002', type: 'Clinical Notification', urgency: 'Urgent',
    from: 'System — Automated Risk Alert', fromRole: 'Clinical Decision Support',
    to: 'Sarah Jenkins, LPC', toRole: 'Primary Counselor',
    patientId: 'p1',
    subject: '⚠ High AMA Risk — Marcus Webb',
    body: 'Patient Marcus Webb (p1) has been flagged HIGH for AMA risk based on: (1) expressed desire to leave during morning group, (2) elevated craving score of 9/10, (3) history of early departure in prior treatment episode. Recommended action: 1:1 check-in before lunch. Notify clinical director if AMA risk increases.',
    timestamp: '2026-07-19 8:30 AM', status: 'Acknowledged',
  },
  {
    id: 'M-003', threadId: 'T-003', type: 'Staff-Staff', urgency: 'Routine',
    from: 'David Odom, LMFT', fromRole: 'Primary Counselor',
    to: 'Maria Gonzalez, LSW', toRole: 'Social Worker',
    patientId: 'p5',
    subject: 'Tyler Morrison — DUI court letter',
    body: 'Hi Maria — Tyler Morrison\'s court date is 7/22. Can you generate the compliance letter for the Davidson County Drug Court? Needs: admission date, diagnosis (AUD, Moderate), treatment compliance (excellent), UA results (negative x4). I\'ll co-sign.',
    timestamp: '2026-07-18 4:15 PM', status: 'Read',
    replies: [
      {
        id: 'M-003r', threadId: 'T-003', type: 'Staff-Staff', urgency: 'Routine',
        from: 'Maria Gonzalez, LSW', fromRole: 'Social Worker',
        to: 'David Odom, LMFT', toRole: 'Primary Counselor',
        patientId: 'p5',
        subject: 'RE: Tyler Morrison — DUI court letter',
        body: 'Will have the letter ready by EOD today 7/18. I\'ll email it to you for co-sign. Does Tyler want a copy?',
        timestamp: '2026-07-18 4:45 PM', status: 'Read',
      },
    ],
  },
  {
    id: 'M-004', threadId: 'T-004', type: 'Team Alert', urgency: 'Critical',
    from: 'Dr. James Carter, PhD', fromRole: 'Clinical Director',
    to: 'All Clinical Staff',
    patientId: 'p9',
    subject: '🔴 CRITICAL — Samantha Choi Safety Hold — All Staff Read',
    body: 'All clinical staff — Samantha Choi (p9) is on enhanced 30-minute safety checks effective immediately (7/17 11:30 PM). C-SSRS assessment completed — HIGH risk designation. Psychiatric evaluation ongoing with Dr. Hughes. BHT staff: no unsupervised outdoor access for this patient. Document all interactions. Questions to clinical director or charge nurse.',
    timestamp: '2026-07-17 11:35 PM', status: 'Acknowledged',
  },
  {
    id: 'M-005', threadId: 'T-005', type: 'Staff-Staff', urgency: 'Routine',
    from: 'Kevin Wright, CADC-I', fromRole: 'BHT',
    to: 'Sarah Jenkins, LPC', toRole: 'Primary Counselor',
    patientId: 'p3',
    subject: 'Carlos Rivera — missed peer group again',
    body: 'Sarah — just flagging that Carlos (p3) missed the peer support group again today (3rd time this week). Marcus Thomas (peer specialist) also mentioned Carlos has been sleeping through meals. Thought you should know before your 1:1 with him tomorrow.',
    timestamp: '2026-07-18 2:30 PM', status: 'Unread',
  },
  {
    id: 'M-006', threadId: 'T-006', type: 'Clinical Notification', urgency: 'Routine',
    from: 'System — Lab Integration', fromRole: 'Lab System',
    to: 'Dr. Robert Chen, MD',
    patientId: 'p4',
    subject: '📋 Lab Results Ready — Robert Navarro (p4)',
    body: 'Lab results received and uploaded to chart for Robert Navarro (p4). CMP, CBC, LFTs, UA drug screen, Hepatitis Panel. Notable: AST 68 (H), ALT 81 (H) — mildly elevated LFTs, trending down from admission. Full results available in patient chart → Labs tab.',
    timestamp: '2026-07-19 7:15 AM', status: 'Unread',
  },
  {
    id: 'M-007', threadId: 'T-007', type: 'Staff-Staff', urgency: 'Routine',
    from: 'Aisha Thompson, LCSW-A', fromRole: 'Counselor',
    to: 'Dr. James Carter, PhD', toRole: 'Clinical Director',
    subject: 'Supervision request — case consultation needed',
    body: 'Dr. Carter — I have a complex patient (co-occurring severe PTSD + OUD + domestic violence history) that I\'d like your consultation on before proceeding with treatment planning. She\'s triggered by anything trauma-related in group. Requesting 30 min consultation when you have availability this week.',
    timestamp: '2026-07-17 3:00 PM', status: 'Read',
    replies: [
      {
        id: 'M-007r', threadId: 'T-007', type: 'Staff-Staff', urgency: 'Routine',
        from: 'Dr. James Carter, PhD', fromRole: 'Clinical Director',
        to: 'Aisha Thompson, LCSW-A', toRole: 'Counselor',
        subject: 'RE: Supervision request',
        body: 'Of course Aisha. I have Tuesday at 3pm open — add it to the supervision calendar. Bring the biopsychosocial and any prior trauma history docs you have. We\'ll think through this together.',
        timestamp: '2026-07-17 4:10 PM', status: 'Read',
      },
    ],
  },
];

const URGENCY_STYLE: Record<Urgency, string> = {
  'Routine': '',
  'Urgent':   'border-l-4 border-l-amber-400',
  'Critical': 'border-l-4 border-l-red-600',
};

const URGENCY_BADGE: Record<Urgency, string> = {
  'Routine': '',
  'Urgent':   'bg-amber-100 text-amber-700',
  'Critical': 'bg-red-100 text-red-700',
};

const STATUS_ICON = {
  'Unread':       <div className="w-2.5 h-2.5 bg-orange rounded-full shrink-0" />,
  'Read':         <Check className="w-3.5 h-3.5 text-slate" />,
  'Acknowledged': <CheckCheck className="w-3.5 h-3.5 text-green-500" />,
};

export function SecureMessaging({ navigate }: Props) {
  const [selectedThread, setSelectedThread] = useState<string | null>('T-001');
  const [newMessage, setNewMessage] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const threads = MESSAGES.filter(m => m.id === m.id && !m.id.endsWith('r'));
  const filteredThreads = threads.filter(m =>
    searchQuery === '' ||
    m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.body.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedMessage = threads.find(m => m.threadId === selectedThread);
  const unreadCount = threads.filter(m => m.status === 'Unread').length;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
            <Lock className="w-6 h-6 text-orange" />
            Secure Messaging
            {unreadCount > 0 && <span className="text-sm bg-orange text-white px-2 py-0.5 rounded-full">{unreadCount} new</span>}
          </h1>
          <p className="text-slate text-sm mt-0.5">HIPAA-compliant internal messaging · Clinical alerts · Patient-related communications</p>
        </div>
        <button onClick={() => setShowCompose(true)} className="btn-primary text-sm px-4 py-2 flex items-center gap-2"><Plus className="w-4 h-4" />Compose</button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3 text-sm">
        <Lock className="w-4 h-4 text-amber-600 shrink-0" />
        <span className="text-amber-800"><strong>HIPAA Secure:</strong> All messages containing PHI are encrypted at rest and in transit. Do not use external email, SMS, or unencrypted platforms for patient-related communications.</span>
      </div>

      <div className="grid grid-cols-3 gap-4 h-[calc(100vh-340px)] min-h-[500px]">
        {/* Thread List */}
        <div className="border border-border rounded-xl overflow-hidden flex flex-col">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate" />
              <input className="w-full pl-8 pr-3 py-1.5 text-xs border border-border rounded-lg"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)} />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredThreads.map(msg => {
              const p = msg.patientId ? MOCK_PATIENTS.find(pt => pt.id === msg.patientId) : null;
              const isSelected = selectedThread === msg.threadId;
              return (
                <button key={msg.threadId} onClick={() => setSelectedThread(msg.threadId)}
                  className={`w-full text-left px-3 py-3 border-b border-border transition-colors ${isSelected ? 'bg-navy/5 border-l-2 border-l-orange' : 'hover:bg-gray-50'} ${URGENCY_STYLE[msg.urgency]}`}>
                  <div className="flex items-start gap-2">
                    {STATUS_ICON[msg.status]}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold text-navy truncate">{msg.from.split(',')[0]}</span>
                        {msg.urgency !== 'Routine' && <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${URGENCY_BADGE[msg.urgency]}`}>{msg.urgency}</span>}
                      </div>
                      <div className="text-xs font-medium text-navy truncate mt-0.5">{msg.subject}</div>
                      <div className="text-[10px] text-slate mt-0.5 truncate">{msg.body.slice(0, 60)}...</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate">{msg.timestamp.split(' ').slice(-2).join(' ')}</span>
                        {p && <span className="text-[10px] bg-navy/10 text-navy px-1.5 py-0.5 rounded-full">{p.firstName.slice(0,1)}. {p.lastName}</span>}
                        {msg.replies && <span className="text-[10px] text-slate">{msg.replies.length + 1} msgs</span>}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Message View */}
        <div className="col-span-2 border border-border rounded-xl overflow-hidden flex flex-col">
          {selectedMessage ? (
            <>
              <div className={`px-5 py-4 border-b border-border bg-gray-50 ${selectedMessage.urgency === 'Critical' ? 'bg-red-50 border-red-200' : selectedMessage.urgency === 'Urgent' ? 'bg-amber-50 border-amber-200' : ''}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-navy">{selectedMessage.subject}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-slate">
                      <span><strong>From:</strong> {selectedMessage.from}</span>
                      <span>→</span>
                      <span><strong>To:</strong> {selectedMessage.to}</span>
                      {selectedMessage.patientId && (() => {
                        const p = MOCK_PATIENTS.find(pt => pt.id === selectedMessage.patientId);
                        return p ? (
                          <button onClick={() => navigate('PatientDetail', p.id)} className="bg-navy/10 text-navy px-2 py-0.5 rounded-full hover:bg-orange/10 hover:text-orange transition-colors">
                            Re: {p.firstName} {p.lastName}
                          </button>
                        ) : null;
                      })()}
                      {selectedMessage.urgency !== 'Routine' && <span className={`px-2 py-0.5 rounded-full font-medium ${URGENCY_BADGE[selectedMessage.urgency]}`}>{selectedMessage.urgency}</span>}
                    </div>
                  </div>
                  <span className="text-xs text-slate">{selectedMessage.timestamp}</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="bg-white border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center">{selectedMessage.from.split(' ').filter(w => /^[A-Z]/.test(w)).slice(0,2).map(w=>w[0]).join('')}</div>
                    <div>
                      <div className="text-sm font-semibold text-navy">{selectedMessage.from}</div>
                      <div className="text-xs text-slate">{selectedMessage.timestamp}</div>
                    </div>
                    {STATUS_ICON[selectedMessage.status]}
                  </div>
                  <p className="text-sm text-navy leading-relaxed whitespace-pre-wrap">{selectedMessage.body}</p>
                </div>
                {selectedMessage.replies?.map(reply => (
                  <div key={reply.id} className="bg-navy/5 border border-navy/10 rounded-xl p-4 ml-6">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-full bg-orange text-white text-xs font-bold flex items-center justify-center">{reply.from.split(' ').filter(w => /^[A-Z]/.test(w)).slice(0,2).map(w=>w[0]).join('')}</div>
                      <div>
                        <div className="text-sm font-semibold text-navy">{reply.from}</div>
                        <div className="text-xs text-slate">{reply.timestamp}</div>
                      </div>
                    </div>
                    <p className="text-sm text-navy leading-relaxed">{reply.body}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-border p-3">
                <div className="flex gap-2">
                  <input className="flex-1 border border-border rounded-lg px-3 py-2 text-sm"
                    placeholder="Reply securely..."
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)} />
                  <button className="btn-primary text-sm px-4 py-2 flex items-center gap-2" onClick={() => setNewMessage('')}>
                    <Send className="w-4 h-4" /> Send
                  </button>
                </div>
                <div className="text-[10px] text-slate mt-1.5 flex items-center gap-1"><Lock className="w-3 h-3" />Encrypted end-to-end · HIPAA compliant · Stored in audit log</div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 text-slate/30 mx-auto mb-2" />
                <div>Select a message to read</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCompose && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-navy text-lg flex items-center gap-2"><Lock className="w-5 h-5 text-orange" />New Secure Message</h2>
              <button onClick={() => setShowCompose(false)} className="text-slate hover:text-navy"><span className="text-lg">×</span></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate mb-1">To *</label>
                <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                  {['Dr. James Carter — Clinical Director', 'Dr. Robert Chen — Medical Director', 'Dr. Emma Hughes — Psychiatrist', 'Sarah Jenkins — Primary Counselor', 'Maria Gonzalez — Social Worker', 'Jessica Torres — DON', 'All Clinical Staff (Broadcast)'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate mb-1">Patient (if applicable)</label>
                <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                  <option value="">— No patient context —</option>
                  {MOCK_PATIENTS.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate mb-1">Urgency</label>
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                    <option>Routine</option>
                    <option>Urgent</option>
                    <option>Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate mb-1">Type</label>
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                    <option>Staff-Staff</option>
                    <option>Clinical Notification</option>
                    <option>Team Alert</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate mb-1">Subject *</label>
                <input className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate mb-1">Message *</label>
                <textarea className="w-full border border-border rounded-lg px-3 py-2 text-sm min-h-[100px] resize-none" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowCompose(false)} className="flex-1 border border-border text-slate rounded-lg px-4 py-2 text-sm">Cancel</button>
              <button onClick={() => setShowCompose(false)} className="flex-1 btn-primary text-sm flex items-center justify-center gap-2"><Send className="w-4 h-4" />Send Secure Message</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
