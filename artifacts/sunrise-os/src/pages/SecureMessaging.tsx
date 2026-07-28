import React, { useState } from 'react';
import { Screen } from '../App';
import { MOCK_PATIENTS } from '../data/mockPatients';
import { MessageSquare, Send, Lock, AlertTriangle, Plus, Search, Bell, Check, CheckCheck } from 'lucide-react';
import { LockedButton } from '../components/common/LockedButton';

interface Props { navigate: (s: Screen, patientId?: string) => void; readOnly?: boolean; }

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
    to: 'Sarah Jenkins, LCPC', toRole: 'Primary Counselor',
    patientId: 'p1',
    subject: '⚠ High AMA Risk — Marcus Webb',
    body: 'Patient Marcus Webb (p1) has been flagged HIGH for AMA risk based on: (1) expressed desire to leave during morning group, (2) elevated craving score of 9/10, (3) history of early departure in prior treatment episode. Recommended action: 1:1 check-in before lunch. Notify clinical director if AMA risk increases.',
    timestamp: '2026-07-19 8:30 AM', status: 'Acknowledged',
  },
  {
    id: 'M-003', threadId: 'T-003', type: 'Staff-Staff', urgency: 'Routine',
    from: 'David Odom, LCADC', fromRole: 'Primary Counselor',
    to: 'Maria Gonzalez, CPA', toRole: 'Staff Accountant',
    patientId: 'p5',
    subject: 'Tyler Morrison — DUI court letter',
    body: 'Hi Maria — Tyler Morrison\'s court date is 7/22. Can you generate the compliance letter for the Davidson County Drug Court? Needs: admission date, diagnosis (AUD, Moderate), treatment compliance (excellent), UA results (negative x4). I\'ll co-sign.',
    timestamp: '2026-07-18 4:15 PM', status: 'Read',
    replies: [
      {
        id: 'M-003r', threadId: 'T-003', type: 'Staff-Staff', urgency: 'Routine',
        from: 'Maria Gonzalez, CPA', fromRole: 'Staff Accountant',
        to: 'David Odom, LCADC', toRole: 'Primary Counselor',
        patientId: 'p5',
        subject: 'RE: Tyler Morrison — DUI court letter',
        body: 'Will have the letter ready by EOD today 7/18. I\'ll email it to you for co-sign. Does Tyler want a copy?',
        timestamp: '2026-07-18 4:45 PM', status: 'Read',
      },
    ],
  },
  {
    id: 'M-004', threadId: 'T-004', type: 'Team Alert', urgency: 'Critical',
    from: 'James S. Collins III, CAC-AD', fromRole: 'Clinical Supervisor',
    to: 'All Clinical Staff',
    patientId: 'p9',
    subject: '🔴 CRITICAL — Samantha Choi Safety Hold — All Staff Read',
    body: 'All clinical staff — Samantha Choi (p9) is on enhanced 30-minute safety checks effective immediately (7/17 11:30 PM). C-SSRS assessment completed — HIGH risk designation. Psychiatric evaluation ongoing with Dr. Hughes. BHT staff: no unsupervised outdoor access for this patient. Document all interactions. Questions to clinical director or charge nurse.',
    timestamp: '2026-07-17 11:35 PM', status: 'Acknowledged',
  },
  {
    id: 'M-005', threadId: 'T-005', type: 'Staff-Staff', urgency: 'Routine',
    from: '__DE_CAC-AD_WRIGHT_I__', fromRole: 'BHT',
    to: 'Sarah Jenkins, LCPC', toRole: 'Primary Counselor',
    patientId: 'p3',
    subject: 'Carlos Rivera — missed peer group again',
    body: 'Sarah — just flagging that Carlos (p3) missed the peer support group again today (3rd time this week). Marcus Thomas (peer specialist) also mentioned Carlos has been sleeping through meals. Thought you should know before your 1:1 with him tomorrow.',
    timestamp: '2026-07-18 2:30 PM', status: 'Read',
  },
  {
    id: 'M-006', threadId: 'T-006', type: 'Clinical Notification', urgency: 'Routine',
    from: 'System — Lab Integration', fromRole: 'Lab System',
    to: 'Dr. Robert Chen, MD',
    patientId: 'p4',
    subject: '📋 Lab Results Ready — Robert Navarro (p4)',
    body: 'Lab results received and uploaded to chart for Robert Navarro (p4). CMP, CBC, LFTs, UA drug screen, Hepatitis Panel. Notable: AST 68 (H), ALT 81 (H) — mildly elevated LFTs, trending down from admission. Full results available in patient chart → Labs tab.',
    timestamp: '2026-07-19 7:15 AM', status: 'Read',
  },
  {
    id: 'M-007', threadId: 'T-007', type: 'Staff-Staff', urgency: 'Routine',
    from: 'Aisha Thompson, CSC-AD', fromRole: 'Counselor',
    to: 'James S. Collins III, CAC-AD', toRole: 'Clinical Supervisor',
    subject: 'Supervision request — case consultation needed',
    body: 'Collins — I have a complex patient (co-occurring severe PTSD + OUD + domestic violence history) that I\'d like your consultation on before proceeding with treatment planning. She\'s triggered by anything trauma-related in group. Requesting 30 min consultation when you have availability this week.',
    timestamp: '2026-07-17 3:00 PM', status: 'Read',
    replies: [
      {
        id: 'M-007r', threadId: 'T-007', type: 'Staff-Staff', urgency: 'Routine',
        from: 'James S. Collins III, CAC-AD', fromRole: 'Clinical Supervisor',
        to: 'Aisha Thompson, CSC-AD', toRole: 'Counselor',
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

export function SecureMessaging({ navigate, readOnly }: Props) {
  const [selectedThread, setSelectedThread] = useState<string | null>('T-001');
  const [newMessage, setNewMessage] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [msgTab, setMsgTab] = useState<'Inbox' | 'Announcements' | 'Notifications' | 'Quick Templates' | 'Message Analytics' | 'Compliance Log'>('Inbox');

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
        <LockedButton locked={readOnly} onClick={() => !readOnly && setShowCompose(true)} className="btn-primary text-sm px-4 py-2 flex items-center gap-2"><Plus className="w-4 h-4" />Compose</LockedButton>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3 text-sm">
        <Lock className="w-4 h-4 text-amber-600 shrink-0" />
        <span className="text-amber-800"><strong>HIPAA Secure:</strong> All messages containing PHI are encrypted at rest and in transit. Do not use external email, SMS, or unencrypted platforms for patient-related communications.</span>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border">
        {(['Inbox', 'Announcements', 'Notifications', 'Quick Templates', 'Message Analytics', 'Compliance Log'] as const).map(t => (
          <button key={t} onClick={() => setMsgTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${msgTab === t ? 'border-orange text-orange' : 'border-transparent text-slate hover:text-navy'}`}>{t}</button>
        ))}
      </div>

      {msgTab === 'Announcements' && (
        <div className="space-y-4">
          {[
            {
              id: 'ann-1', priority: 'urgent', icon: '🚨',
              title: 'Joint Commission Survey — Preparedness Reminder',
              from: 'Quality Improvement Team', date: '2026-07-19 08:00',
              body: 'Reminder that our Joint Commission triennial survey window opens September 1, 2026. All staff must review and attest to updated policies by August 15. Key focus areas: medication safety, suicide risk screening (SLMS/Columbia), and ligature risk mitigation. Please review the Mock Survey findings posted on the QI shared drive and complete attestation in the Training module.',
              tag: 'Compliance',
            },
            {
              id: 'ann-2', priority: 'normal', icon: '📋',
              title: 'New BHT Morning Check-In Form — Effective July 20',
              from: 'Dr. Robert Chen, MD (Medical Director)', date: '2026-07-18 14:30',
              body: 'Effective July 20, 2026, the BHT morning check-in form has been updated to include a standardized mood rating (1–10) and brief craving screen. This data will feed directly into the clinical dashboard and alert nursing when scores cross thresholds. Training materials are available in the Training module. Please reach out to your BHT supervisor with questions.',
              tag: 'Operations',
            },
            {
              id: 'ann-3', priority: 'normal', icon: '💊',
              title: 'Vivitrol Shipment Delay — Action Required for Pending Orders',
              from: 'Pharmacy Liaison', date: '2026-07-17 11:00',
              body: 'We have been notified by AmerisourceBergen of a 5–7 day delay in Vivitrol (naltrexone extended-release) shipments due to supply chain disruption. For any patient with a Vivitrol injection scheduled in the next 7 days: please contact Dr. Chen to discuss bridging options (oral naltrexone 50mg daily). Do not delay discharge planning — document the delay in the MAR and physician orders. We anticipate restocking by July 25.',
              tag: 'Pharmacy',
            },
            {
              id: 'ann-4', priority: 'normal', icon: '📅',
              title: 'Staff Appreciation Luncheon — Friday July 25',
              from: 'Program Director', date: '2026-07-16 09:00',
              body: 'Please join us for our quarterly staff appreciation luncheon on Friday, July 25 from 12:00–1:30 PM in the conference room. Lunch will be provided. This is a non-mandatory event but we strongly encourage all staff to attend. We will recognize staff milestones and announce the Q2 Star Award recipients. BHT coverage during the luncheon will be provided by the float pool — coordinate with your supervisor if you plan to attend.',
              tag: 'Staff',
            },
          ].map(ann => (
            <div key={ann.id} className={`card border-l-4 ${ann.priority === 'urgent' ? 'border-l-critical' : 'border-l-navy'}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{ann.icon}</span>
                  <div>
                    <div className="font-semibold text-navy text-sm">{ann.title}</div>
                    <div className="text-xs text-slate mt-0.5">{ann.from} · {ann.date}</div>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${ann.priority === 'urgent' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{ann.tag}</span>
              </div>
              <p className="text-xs text-slate leading-relaxed">{ann.body}</p>
            </div>
          ))}
        </div>
      )}

      {msgTab === 'Notifications' && (
        <div className="space-y-3">
          <div className="text-xs text-slate mb-2">System-generated clinical notifications — last 24 hours</div>
          {[
            { time: '08:14 AM', icon: '🚨', type: 'AMA Risk Alert', msg: 'Marcus Webb (MRN-83921) verbalized AMA intent. BHT check-in protocol activated.', level: 'critical' },
            { time: '07:52 AM', icon: '⚠️', type: 'Psychiatry Consult', msg: 'Consult order placed for Samantha Choi (MRN-74563) by Dr. Stone. Dietary restriction active.', level: 'warning' },
            { time: '07:30 AM', icon: '💊', type: 'MAR Alert', msg: 'Medication administration window open: 7:00 AM–8:00 AM. 3 patients have morning medications due.', level: 'info' },
            { time: '06:18 AM', icon: '📊', type: 'Withdrawal Score Alert', msg: 'James Thornton (MRN-62841): COWS score increased from 6 → 9. Review MAT protocol.', level: 'warning' },
            { time: '06:00 AM', icon: '🔔', type: 'Vitals Reminder', msg: 'Morning vitals due for all residential patients. 8 patients pending 06:00 assessment.', level: 'info' },
            { time: '12:01 AM', icon: 'ℹ️', type: 'Shift Change', msg: 'Night shift handoff completed. 18 active patients. No critical incidents during night shift.', level: 'info' },
            { time: 'Yesterday 10:30 PM', icon: '📋', type: 'Note Co-sign Due', msg: '4 progress notes awaiting co-sign are approaching 24-hour SLA deadline.', level: 'warning' },
            { time: 'Yesterday 8:15 PM', icon: '🛡️', type: 'UA Chain of Custody', msg: 'UA chain-of-custody form missing for Destiny Williams (MRN-55129). Lab retest scheduled.', level: 'warning' },
          ].map((n, i) => (
            <div key={i} className={`flex gap-3 border rounded-lg px-4 py-3 ${n.level === 'critical' ? 'bg-red-50 border-red-200' : n.level === 'warning' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
              <span className="text-lg shrink-0">{n.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-[10px] font-bold ${n.level === 'critical' ? 'text-red-700' : n.level === 'warning' ? 'text-amber-700' : 'text-blue-700'}`}>{n.type}</span>
                  <span className="text-[10px] text-slate">{n.time}</span>
                </div>
                <p className="text-xs text-slate">{n.msg}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {msgTab === 'Inbox' && (
      <div className="grid grid-cols-3 gap-4 h-[calc(100vh-400px)] min-h-[450px]">
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
                  <LockedButton locked={readOnly} onClick={() => { if (!readOnly && newMessage.trim()) setNewMessage(''); }} className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
                    <Send className="w-4 h-4" /> Send
                  </LockedButton>
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
      )}

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
                  {['James S. Collins III — Clinical Supervisor', 'Dr. Robert Chen — Medical Director', 'Dr. Emma Hughes — Psychiatrist', 'Sarah Jenkins — Primary Counselor', 'Maria Gonzalez — Staff Accountant', 'Jessica Torres — DON', 'All Clinical Staff (Broadcast)'].map(s => <option key={s}>{s}</option>)}
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

      {msgTab === 'Quick Templates' && (
        <div className="space-y-4">
          <div className="text-sm text-slate">Pre-built message templates for common clinical communications — saves time and ensures consistent, HIPAA-compliant language.</div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { category: 'Clinical Handoff', templates: [
                'Patient [NAME] — status update: stable. No acute concerns this shift. Awaiting [TEST/CONSULT]. Continue current orders.',
                '[NAME] showing withdrawal symptoms escalating — CIWA score [X]. Physician notified. PRN administered at [TIME]. Please monitor q2h.',
                'Psych consult requested for [NAME] — SI ideation disclosed in session. Columbia protocol initiated. Safety plan attached.',
              ]},
              { category: 'Patient Communication', templates: [
                'Reminder: You have an appointment with [PROVIDER] on [DATE] at [TIME]. Please arrive 10 minutes early.',
                'Your lab results are available for review. Please contact the nursing station or your care coordinator at your earliest convenience.',
                'Family session scheduled for [DATE] at [TIME]. Your family member [NAME] has confirmed attendance.',
              ]},
              { category: 'Care Team Coordination', templates: [
                '[NAME] medically cleared for discharge pending final physician sign-off. Aftercare plan attached for review.',
                'Urgent: co-sign required for [PATIENT] progress note before end of shift. Note contains time-sensitive clinical information.',
                'Treatment plan review due: [NAME] — 30-day review overdue. Please complete by end of business [DATE].',
              ]},
              { category: 'Compliance / Admin', templates: [
                'Incident report filed for [PATIENT] at [TIME]. Event summary attached. No patient injury sustained.',
                'Reminder: mandatory training "[MODULE]" is due by [DATE]. Compliance rate for your team is currently [X]%.',
                'Authorization expiring: [NAME] — current auth ends [DATE]. UR team has submitted renewal; approval pending.',
              ]},
            ].map(cat => (
              <div key={cat.category} className="card">
                <h3 className="font-semibold text-navy text-sm mb-3">{cat.category}</h3>
                <div className="space-y-2">
                  {cat.templates.map((t, i) => (
                    <div key={i} className="group border border-border rounded-lg p-2.5 hover:border-orange/40 hover:bg-orange/5 transition-colors cursor-pointer">
                      <div className="text-xs text-slate leading-relaxed">{t}</div>
                      <button onClick={() => setNewMessage(t)} className="text-[9px] font-bold text-orange mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">Use Template →</button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {msgTab === 'Message Analytics' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Secure messaging volume, response times, and communication pattern analytics — helps identify care coordination bottlenecks and workload distribution.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Messages Sent (30d)', value: 312, color: 'text-navy', sub: 'All staff, all categories' },
              { label: 'Avg Response Time', value: '22 min', color: 'text-green-600', sub: 'To non-urgent messages' },
              { label: 'Urgent Msg Avg Response', value: '4.8 min', color: 'text-teal-600', sub: 'Target ≤5 min' },
              { label: 'Unread >4h (Today)', value: 3, color: 'text-amber-600', sub: 'Flagged for supervisor review' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">Message Volume by Category (30d)</h3>
              <div className="space-y-2.5 text-xs">
                {[
                  { cat: 'Clinical / Care Coordination', n: 118, pct: 38, color: 'bg-blue-500' },
                  { cat: 'Medication / Nursing', n: 76, pct: 24, color: 'bg-teal-500' },
                  { cat: 'Admissions / Discharge', n: 52, pct: 17, color: 'bg-purple-500' },
                  { cat: 'Administrative', n: 38, pct: 12, color: 'bg-gray-400' },
                  { cat: 'Urgent / Safety', n: 18, pct: 6, color: 'bg-red-500' },
                  { cat: 'Other', n: 10, pct: 3, color: 'bg-amber-400' },
                ].map(c => (
                  <div key={c.cat}>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-slate">{c.cat}</span>
                      <span className="font-semibold text-navy">{c.n} ({c.pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full">
                      <div className={`h-1.5 rounded-full ${c.color}`} style={{ width: `${c.pct * 2.4}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">Top Senders by Volume (30d)</h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-gray-50 text-slate">
                    {['Staff', 'Role', 'Sent', 'Avg Response', 'Unread'].map(h => (
                      <th key={h} className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { name: 'K. Santos, RN', role: 'Charge Nurse', sent: 62, resp: '18 min', unread: 0 },
                    { name: 'A. Brooks, LCPC', role: 'Counselor', sent: 48, resp: '31 min', unread: 1 },
                    { name: 'Dr. M. Chen', role: 'Medical Director', sent: 41, resp: '12 min', unread: 0 },
                    { name: 'T. Jackson, CAC-AD', role: 'Counselor', sent: 37, resp: '44 min', unread: 2 },
                    { name: 'L. Nguyen, CM', role: 'Case Manager', sent: 34, resp: '26 min', unread: 0 },
                  ].map(r => (
                    <tr key={r.name} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-navy">{r.name}</td>
                      <td className="px-3 py-2 text-slate">{r.role}</td>
                      <td className="px-3 py-2 text-center text-navy">{r.sent}</td>
                      <td className="px-3 py-2 text-center text-slate">{r.resp}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={r.unread > 0 ? 'text-amber-600 font-bold' : 'text-green-600'}>{r.unread}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {msgTab === 'Compliance Log' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Audit trail of all secure messages — 42 CFR Part 2 compliance, message retention, and PHI transmission log.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Messages (30d)', value: 847, color: 'text-navy', sub: 'Total sent/received' },
              { label: 'PHI Transmissions', value: 112, color: 'text-amber-600', sub: 'Encrypted; logged for audit' },
              { label: 'Retention Policy', value: '7 Years', color: 'text-navy', sub: '42 CFR Part 2 minimum' },
              { label: 'Compliance Status', value: 'Current', color: 'text-green-600', sub: 'All records archived' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-2xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">PHI Transmission Log — Last 30 Days (Sample)</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-gray-50">
                  {['Date', 'From', 'To', 'Message Type', 'PHI Category', 'Encryption', '42 CFR Consent', 'Status'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { date: 'Jul 19', from: 'J. Torres, RN', to: 'Dr. Chen, MD', type: 'Clinical Alert', phi: 'Vital signs + CIWA score', enc: 'TLS 1.3', consent: 'Internal — N/A', status: 'Delivered' },
                  { date: 'Jul 19', from: 'S. Jenkins, LCPC', to: 'D. Reyes (Probation)', type: 'Compliance Letter', phi: 'Treatment participation', enc: 'TLS 1.3', consent: '42 CFR consent on file', status: 'Delivered' },
                  { date: 'Jul 18', from: 'Billing — B. Hughes', to: 'BCBS Claims', type: 'Auth Documentation', phi: 'Diagnosis + treatment dates', enc: 'TLS 1.3', consent: 'Insurance exemption', status: 'Delivered' },
                  { date: 'Jul 18', from: 'M. Gonzales, CPA', to: 'Primary Care — Dr. Lee', type: 'Discharge Summary', phi: 'Full discharge summary', enc: 'TLS 1.3', consent: '42 CFR consent on file', status: 'Read Confirmed' },
                  { date: 'Jul 17', from: 'Admissions', to: 'Drug Court Coordinator', type: 'Admission Notification', phi: 'Admission date + program', enc: 'TLS 1.3', consent: '42 CFR consent on file', status: 'Delivered' },
                ].map(r => (
                  <tr key={r.date + r.from + r.to} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-slate font-mono">{r.date}</td>
                    <td className="px-3 py-2 text-slate">{r.from}</td>
                    <td className="px-3 py-2 text-slate">{r.to}</td>
                    <td className="px-3 py-2 font-medium text-navy">{r.type}</td>
                    <td className="px-3 py-2 text-slate">{r.phi}</td>
                    <td className="px-3 py-2 text-teal-700 font-mono text-[10px]">{r.enc}</td>
                    <td className="px-3 py-2 text-slate">{r.consent}</td>
                    <td className="px-3 py-2"><span className="text-[9px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
