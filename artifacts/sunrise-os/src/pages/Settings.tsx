import React, { useState } from 'react';
import { Screen } from '../App';

interface Props { navigate: (s: Screen, patientId?: string) => void; }

export function Settings({ navigate }: Props) {
  const [activeTab, setActiveTab] = useState<'Facility' | 'Clinical' | 'Users & Roles' | 'Notifications' | 'System'>('Facility');
  const [saved, setSaved] = useState(false);

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Settings</h1>
          <p className="text-slate text-sm mt-0.5">Facility configuration, clinical defaults, and system preferences</p>
        </div>
        <button onClick={save} className={`btn-primary text-sm px-5 py-2 transition-all ${saved ? 'bg-green-600' : ''}`}>
          {saved ? '✓ Saved' : 'Save Changes'}
        </button>
      </div>

      <div className="flex gap-1 border-b border-border">
        {(['Facility', 'Clinical', 'Users & Roles', 'Notifications', 'System'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === t ? 'border-orange text-orange' : 'border-transparent text-slate hover:text-navy'}`}>{t}</button>
        ))}
      </div>

      {activeTab === 'Facility' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-base font-semibold text-navy mb-4">Facility Information</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Facility Name', value: 'Sunrise Recovery Center', full: true },
                { label: 'License Number', value: 'TN-BHSL-2019-04821' },
                { label: 'NPI Number', value: '1234567890' },
                { label: 'Tax ID (EIN)', value: '47-1234567' },
                { label: 'Primary Phone', value: '(615) 882-4400' },
                { label: 'Fax', value: '(615) 882-4401' },
                { label: 'Address Line 1', value: '4201 Medical Center Drive', full: true },
                { label: 'City', value: 'Nashville' },
                { label: 'State', value: 'TN' },
                { label: 'ZIP', value: '37209' },
              ].map(f => (
                <div key={f.label} className={f.full ? 'col-span-2' : ''}>
                  <label className="block text-xs font-semibold text-slate uppercase tracking-wide mb-1">{f.label}</label>
                  <input defaultValue={f.value} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange/50" />
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="text-base font-semibold text-navy mb-4">Program Configuration</h2>
            <div className="space-y-3">
              {[
                { program: 'Residential (Res)', beds: 10, los: 30, active: true },
                { program: 'Partial Hospitalization (PHP)', beds: 6, los: 21, active: true },
                { program: 'Intensive Outpatient (IOP)', beds: 6, los: 28, active: true },
                { program: 'Outpatient (OP)', beds: null, los: null, active: false },
              ].map(p => (
                <div key={p.program} className={`flex items-center justify-between p-3 rounded-lg border ${p.active ? 'border-border bg-white' : 'border-border bg-gray-50'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${p.active ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="font-medium text-navy text-sm">{p.program}</span>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-slate">
                    {p.beds !== null && <span>Capacity: <span className="font-medium text-navy">{p.beds}</span></span>}
                    {p.los !== null && <span>Avg LOS: <span className="font-medium text-navy">{p.los}d</span></span>}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" defaultChecked={p.active} className="accent-orange" />
                      <span className="text-xs">{p.active ? 'Active' : 'Inactive'}</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="text-base font-semibold text-navy mb-4">Accreditation & Licensing</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'CARF Accreditation', value: 'Active — Expires 2027-03-15', status: 'ok' },
                { label: 'Joint Commission', value: 'Not Accredited', status: 'na' },
                { label: 'State License (TDMHSAS)', value: 'Active — Renewal 2026-12-31', status: 'ok' },
                { label: 'DEA Registration', value: 'Active — Expires 2027-06-30', status: 'ok' },
              ].map(a => (
                <div key={a.label} className="flex items-start gap-2">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${a.status === 'ok' ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <div>
                    <div className="text-xs font-semibold text-slate">{a.label}</div>
                    <div className="text-sm text-navy">{a.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Clinical' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-base font-semibold text-navy mb-4">Documentation Defaults</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate uppercase tracking-wide mb-1">Default Progress Note Format</label>
                <div className="flex gap-3">
                  {['BIRP', 'DAP', 'SOAP', 'Free Text'].map(f => (
                    <label key={f} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="radio" name="noteFormat" defaultChecked={f === 'BIRP'} className="accent-orange" />
                      {f}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate uppercase tracking-wide mb-1">Note Frequency Requirement</label>
                <select className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange/50">
                  <option>Daily (Residential)</option>
                  <option>Every Visit (PHP/IOP)</option>
                  <option>Weekly (OP)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate uppercase tracking-wide mb-1">Co-sign Requirement</label>
                <div className="space-y-2">
                  {[
                    { label: 'Require co-sign for all intern/associate notes', checked: true },
                    { label: 'Require co-sign for progress notes (licensed staff)', checked: false },
                    { label: 'Require physician co-sign for MAT orders', checked: true },
                    { label: 'Require co-sign for discharge summaries', checked: true },
                  ].map(item => (
                    <label key={item.label} className="flex items-center gap-3 text-sm cursor-pointer">
                      <input type="checkbox" defaultChecked={item.checked} className="accent-orange w-4 h-4" />
                      {item.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-base font-semibold text-navy mb-4">ASAM Assessment Settings</h2>
            <div className="space-y-3">
              {[
                { label: 'ASAM assessment required within 24 hours of admission', checked: true },
                { label: 'ASAM reassessment required every 7 days', checked: true },
                { label: 'Enable ASAM-to-level-of-care recommendation engine', checked: true },
                { label: 'Flag incomplete ASAM assessments in Chart Review', checked: true },
              ].map(item => (
                <label key={item.label} className="flex items-center gap-3 text-sm cursor-pointer">
                  <input type="checkbox" defaultChecked={item.checked} className="accent-orange w-4 h-4" />
                  {item.label}
                </label>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="text-base font-semibold text-navy mb-4">42 CFR Part 2 Compliance</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 mb-4">
              <strong>Federal Confidentiality Rule:</strong> These settings govern the handling of substance use disorder records under 42 CFR Part 2. Changes should be reviewed by your compliance officer.
            </div>
            <div className="space-y-3">
              {[
                { label: 'Require consent form before any record disclosure', checked: true },
                { label: 'Log all record access and disclosures', checked: true },
                { label: 'Restrict access to SUD records to treating providers only', checked: true },
                { label: 'Require re-consent for each disclosure (not general consent)', checked: true },
                { label: 'Enable automatic redaction of SUD records in integrated HIE', checked: false },
              ].map(item => (
                <label key={item.label} className="flex items-center gap-3 text-sm cursor-pointer">
                  <input type="checkbox" defaultChecked={item.checked} className="accent-orange w-4 h-4" />
                  {item.label}
                </label>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="text-base font-semibold text-navy mb-4">Vital Signs & Withdrawal Monitoring</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate uppercase tracking-wide mb-1">COWS Monitoring Frequency</label>
                <select className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange/50">
                  <option>Every 4 hours (active withdrawal)</option>
                  <option>Every 8 hours (stable)</option>
                  <option>Daily (maintenance)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate uppercase tracking-wide mb-1">CIWA-Ar Monitoring Frequency</label>
                <select className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange/50">
                  <option>Every 4 hours (active withdrawal)</option>
                  <option>Every 8 hours (stable)</option>
                  <option>Daily (maintenance)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate uppercase tracking-wide mb-1">Critical COWS Alert Threshold</label>
                <input type="number" defaultValue={13} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange/50" />
                <p className="text-xs text-slate mt-1">Score ≥13 triggers automatic physician notification</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate uppercase tracking-wide mb-1">Critical CIWA-Ar Alert Threshold</label>
                <input type="number" defaultValue={15} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange/50" />
                <p className="text-xs text-slate mt-1">Score ≥15 triggers mandatory physician response</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Users & Roles' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate">Manage system users, roles, and permissions.</p>
            <button className="btn-primary text-sm px-4 py-2">+ Add User</button>
          </div>
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase">Department</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase">Access Level</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'James Carter', role: 'Clinical Director', dept: 'Administration', access: 'Admin', active: true },
                  { name: 'Dr. Robert Chen', role: 'Attending Physician', dept: 'Medical', access: 'Physician', active: true },
                  { name: 'Dr. Emily Stone', role: 'Medical Director', dept: 'Medical', access: 'Physician', active: true },
                  { name: 'Dr. Allen Hughes', role: 'Psychiatrist', dept: 'Medical', access: 'Physician', active: true },
                  { name: 'Sarah Jenkins, LPC', role: 'Primary Counselor', dept: 'Clinical', access: 'Clinician', active: true },
                  { name: 'David Odom, LMFT', role: 'Primary Counselor', dept: 'Clinical', access: 'Clinician', active: true },
                  { name: 'Maria Gonzales, LCSW', role: 'Primary Counselor', dept: 'Clinical', access: 'Clinician', active: true },
                  { name: 'Jessica Torres, RN', role: 'Charge Nurse', dept: 'Nursing', access: 'Nursing', active: true },
                  { name: 'Michael Boyd, RN', role: 'Nurse', dept: 'Nursing', access: 'Nursing', active: true },
                  { name: 'Amanda Lewis', role: 'Intake Coordinator', dept: 'Admissions', access: 'Coordinator', active: true },
                  { name: 'Kevin Wright', role: 'BHT Supervisor', dept: 'Operations', access: 'BHT', active: true },
                  { name: 'Linda Vance', role: 'Utilization Review', dept: 'Billing', access: 'Billing', active: true },
                ].map((u, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-navy">{u.name}</td>
                    <td className="px-4 py-3 text-slate">{u.role}</td>
                    <td className="px-4 py-3 text-slate">{u.dept}</td>
                    <td className="px-4 py-3"><span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{u.access}</span></td>
                    <td className="px-4 py-3"><span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span></td>
                    <td className="px-4 py-3 flex gap-2">
                      <button className="text-xs text-orange hover:underline">Edit</button>
                      <button className="text-xs text-slate hover:text-red-600">Deactivate</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'Notifications' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-base font-semibold text-navy mb-4">Clinical Alerts</h2>
            <div className="space-y-3">
              {[
                { label: 'AMA risk escalation (Low → Med → High)', checked: true },
                { label: 'COWS/CIWA score exceeds critical threshold', checked: true },
                { label: 'UA positive result — immediate notification to physician and counselor', checked: true },
                { label: 'Missed group attendance (2+ consecutive sessions)', checked: true },
                { label: 'Mood score ≤3 or craving score ≥8', checked: true },
                { label: 'Lab critical values (flag from lab interface)', checked: true },
              ].map(item => (
                <label key={item.label} className="flex items-center gap-3 text-sm cursor-pointer">
                  <input type="checkbox" defaultChecked={item.checked} className="accent-orange w-4 h-4" />
                  {item.label}
                </label>
              ))}
            </div>
          </div>
          <div className="card">
            <h2 className="text-base font-semibold text-navy mb-4">Administrative Alerts</h2>
            <div className="space-y-3">
              {[
                { label: 'Insurance authorization expiring within 3 days', checked: true },
                { label: 'Chart deficiency overdue >48 hours', checked: true },
                { label: 'Co-sign request pending >24 hours', checked: true },
                { label: 'Patient discharge within 48 hours with incomplete plan', checked: true },
                { label: 'Staff certification expiring within 60 days', checked: true },
                { label: 'Claim denied — billing alert', checked: false },
              ].map(item => (
                <label key={item.label} className="flex items-center gap-3 text-sm cursor-pointer">
                  <input type="checkbox" defaultChecked={item.checked} className="accent-orange w-4 h-4" />
                  {item.label}
                </label>
              ))}
            </div>
          </div>
          <div className="card">
            <h2 className="text-base font-semibold text-navy mb-4">Notification Delivery</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate uppercase tracking-wide mb-1">Delivery Method</label>
                <div className="space-y-2">
                  {['In-app (Dashboard + Command Center)', 'Email notification', 'SMS / Text message', 'Push notification (mobile app)'].map(m => (
                    <label key={m} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" defaultChecked={m.includes('In-app') || m.includes('Email')} className="accent-orange" />
                      {m}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate uppercase tracking-wide mb-1">Quiet Hours</label>
                <div className="flex gap-3 items-center">
                  <input type="time" defaultValue="22:00" className="border border-border rounded px-2 py-1 text-sm" />
                  <span className="text-slate">to</span>
                  <input type="time" defaultValue="06:00" className="border border-border rounded px-2 py-1 text-sm" />
                </div>
                <p className="text-xs text-slate mt-2">Non-urgent notifications suppressed during quiet hours</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'System' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-base font-semibold text-navy mb-1">Demo Mode</h2>
            <p className="text-sm text-slate mb-4">Sunrise OS is currently running in demo mode with fictitious patient data. No real PHI is stored or transmitted.</p>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-center justify-between">
              <div>
                <div className="font-semibold text-purple-800">Demo Mode Active</div>
                <div className="text-xs text-purple-700">Fictitious data only · Not for clinical use</div>
              </div>
              <span className="text-xs bg-purple-200 text-purple-800 px-3 py-1 rounded-full font-medium">Demo</span>
            </div>
          </div>

          <div className="card">
            <h2 className="text-base font-semibold text-navy mb-4">EHR Integrations</h2>
            <div className="space-y-3">
              {[
                { name: 'HL7 FHIR Interface', status: 'Not Configured', description: 'Connect to hospital systems via FHIR R4 API' },
                { name: 'Lab Interface (Quest / LabCorp)', status: 'Not Configured', description: 'Automatic lab result import and critical value alerts' },
                { name: 'Pharmacy Interface', status: 'Not Configured', description: 'eRx and medication reconciliation' },
                { name: 'Insurance Eligibility (Availity)', status: 'Not Configured', description: 'Real-time eligibility verification and authorization' },
                { name: 'HIE (Tennessee CRISP)', status: 'Not Configured', description: 'Health Information Exchange — ADT notifications and records' },
              ].map(int => (
                <div key={int.name} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <div className="font-medium text-navy text-sm">{int.name}</div>
                    <div className="text-xs text-slate">{int.description}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs bg-gray-100 text-slate px-2 py-0.5 rounded-full">{int.status}</span>
                    <button className="text-xs text-orange hover:underline font-medium">Configure</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="text-base font-semibold text-navy mb-4">Data & Privacy</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-border">
                <div>
                  <div className="font-medium text-navy">Audit Log Retention</div>
                  <div className="text-xs text-slate">All record access and changes are logged</div>
                </div>
                <select className="border border-border rounded px-2 py-1 text-xs">
                  <option>7 years (federal requirement)</option>
                  <option>10 years</option>
                </select>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-border">
                <div>
                  <div className="font-medium text-navy">Session Timeout</div>
                  <div className="text-xs text-slate">Automatic logout after inactivity</div>
                </div>
                <select className="border border-border rounded px-2 py-1 text-xs">
                  <option>15 minutes</option>
                  <option>30 minutes</option>
                  <option>60 minutes</option>
                </select>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-border">
                <div>
                  <div className="font-medium text-navy">Two-Factor Authentication</div>
                  <div className="text-xs text-slate">Require MFA for all user logins</div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="accent-orange" />
                  <span className="text-xs font-medium text-navy">Required</span>
                </label>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-base font-semibold text-navy mb-2">Application Version</h2>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div><span className="text-slate">Version:</span> <span className="font-mono font-medium text-navy">1.0.0-demo</span></div>
              <div><span className="text-slate">Build:</span> <span className="font-mono text-navy">2026.07.18</span></div>
              <div><span className="text-slate">Environment:</span> <span className="text-purple-700 font-medium">Demo</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
