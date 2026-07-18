import { ReactNode } from "react";

export type Acuity = "Critical" | "High" | "Moderate" | "Routine";
export type Status = "Active" | "On Hold" | "Discharged" | "Admitted";

export interface Patient {
  id: string;
  name: string;
  initials: string;
  mrn: string;
  age: number;
  dob: string;
  gender: string;
  room: string;
  unit: string;
  acuity: Acuity;
  diagnosis: string;
  los: number; // Length of stay
  provider: string;
  lastVitals: string;
  ordersPending: number;
  alerts: number;
  status: Status;
}

export const patients: Patient[] = [
  { id: "P1", name: "Arthur Pendelton", initials: "AP", mrn: "MRN-83921", age: 68, dob: "1955-04-12", gender: "M", room: "ICU-01", unit: "3-North ICU", acuity: "Critical", diagnosis: "Acute Myocardial Infarction", los: 3.2, provider: "Dr. S. Patel", lastVitals: "10m ago", ordersPending: 2, alerts: 3, status: "Active" },
  { id: "P2", name: "Maria Gonzalez", initials: "MG", mrn: "MRN-74829", age: 45, dob: "1978-08-22", gender: "F", room: "ICU-02", unit: "3-North ICU", acuity: "High", diagnosis: "Sepsis sec. to Pneumonia", los: 5.1, provider: "Dr. K. Lee", lastVitals: "25m ago", ordersPending: 1, alerts: 1, status: "Active" },
  { id: "P3", name: "James Wilson", initials: "JW", mrn: "MRN-92104", age: 72, dob: "1951-11-05", gender: "M", room: "ICU-03", unit: "3-North ICU", acuity: "High", diagnosis: "Post-op CABG", los: 1.5, provider: "Dr. S. Patel", lastVitals: "5m ago", ordersPending: 0, alerts: 2, status: "Active" },
  { id: "P4", name: "Linda Smith", initials: "LS", mrn: "MRN-48291", age: 59, dob: "1964-02-14", gender: "F", room: "ICU-04", unit: "3-North ICU", acuity: "Moderate", diagnosis: "DKA", los: 2.8, provider: "Dr. J. Chen", lastVitals: "45m ago", ordersPending: 4, alerts: 0, status: "Active" },
  { id: "P5", name: "Robert Taylor", initials: "RT", mrn: "MRN-10482", age: 81, dob: "1942-09-30", gender: "M", room: "ICU-05", unit: "3-North ICU", acuity: "Routine", diagnosis: "COPD Exacerbation", los: 4.0, provider: "Dr. K. Lee", lastVitals: "1h ago", ordersPending: 0, alerts: 0, status: "On Hold" },
  { id: "P6", name: "Sarah Johnson", initials: "SJ", mrn: "MRN-59302", age: 34, dob: "1989-07-19", gender: "F", room: "ICU-06", unit: "3-North ICU", acuity: "Moderate", diagnosis: "Acute Pancreatitis", los: 1.2, provider: "Dr. J. Chen", lastVitals: "15m ago", ordersPending: 2, alerts: 1, status: "Active" },
  { id: "P7", name: "William Davis", initials: "WD", mrn: "MRN-29485", age: 63, dob: "1960-12-08", gender: "M", room: "ICU-07", unit: "3-North ICU", acuity: "Routine", diagnosis: "GI Bleed", los: 6.5, provider: "Dr. S. Patel", lastVitals: "2h ago", ordersPending: 1, alerts: 0, status: "Active" },
  { id: "P8", name: "Elizabeth Brown", initials: "EB", mrn: "MRN-84920", age: 77, dob: "1946-03-25", gender: "F", room: "ICU-08", unit: "3-North ICU", acuity: "High", diagnosis: "CVA (Stroke)", los: 2.1, provider: "Dr. K. Lee", lastVitals: "20m ago", ordersPending: 3, alerts: 2, status: "Active" },
  { id: "P9", name: "Michael Miller", initials: "MM", mrn: "MRN-39201", age: 52, dob: "1971-05-11", gender: "M", room: "PCU-01", unit: "4-South PCU", acuity: "Moderate", diagnosis: "Heart Failure", los: 3.5, provider: "Dr. A. Gupta", lastVitals: "30m ago", ordersPending: 1, alerts: 0, status: "Active" },
  { id: "P10", name: "Jennifer Moore", initials: "JM", mrn: "MRN-68392", age: 41, dob: "1982-10-04", gender: "F", room: "PCU-02", unit: "4-South PCU", acuity: "Routine", diagnosis: "Cellulitis", los: 2.0, provider: "Dr. A. Gupta", lastVitals: "1h ago", ordersPending: 0, alerts: 0, status: "Active" },
];

export const alerts = [
  { id: 1, severity: "critical", type: "Vitals", message: "Patient AP (ICU-01) sustained V-Tach for > 15s", time: "2m ago" },
  { id: 2, severity: "high", type: "Lab Result", message: "Critical Potassium 2.8 mmol/L for MG (ICU-02)", time: "14m ago" },
  { id: 3, severity: "moderate", type: "Order", message: "STAT CT Head pending > 45m for EB (ICU-08)", time: "22m ago" },
  { id: 4, severity: "routine", type: "System", message: "Scheduled maintenance for Pyxis on 3-North at 02:00", time: "1h ago" }
];

export const deadlines = [
  { id: 1, color: "red", task: "Administer IV Antibiotics (MG)", due: "10:00 AM", status: "urg" },
  { id: 2, color: "orange", task: "Cosign verbal orders (3)", due: "11:30 AM", status: "soon" },
  { id: 3, color: "amber", task: "Shift assessments complete", due: "12:00 PM", status: "normal" },
  { id: 4, color: "blue", task: "Discharge planning huddle", due: "14:00 PM", status: "normal" }
];

export const incidents = [
  { id: "INC-921", severity: "High", location: "Med-Surg 2", time: "08:14", status: "Open", desc: "Patient fall, unassisted, no apparent injury" },
  { id: "INC-922", severity: "Critical", location: "ED", time: "09:05", status: "Investigating", desc: "Code Blue - ROSC achieved, transferring to ICU" },
  { id: "INC-923", severity: "Moderate", location: "Pharmacy", time: "10:30", status: "Resolved", desc: "Pyxis inventory discrepancy - resolved" },
  { id: "INC-924", severity: "Routine", location: "3-North", time: "11:15", status: "Open", desc: "IV pump malfunction, engineering notified" }
];

export const staffAssignments = [
  { name: "S. Jenkins, RN", role: "ICU Nurse", patients: ["AP (ICU-01)", "MG (ICU-02)"], load: "100%" },
  { name: "T. Rivera, RN", role: "ICU Nurse", patients: ["JW (ICU-03)", "LS (ICU-04)"], load: "100%" },
  { name: "M. Foster, RN", role: "ICU Nurse", patients: ["RT (ICU-05)", "SJ (ICU-06)"], load: "100%" },
  { name: "C. Bennett, RN", role: "ICU Nurse", patients: ["WD (ICU-07)", "EB (ICU-08)"], load: "100%" }
];
