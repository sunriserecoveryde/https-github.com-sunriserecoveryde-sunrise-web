import { Patient, BedStatus } from '@/data/mockData';

// ─── Base URL ─────────────────────────────────────────────────────────────────
// On web (Replit proxy) we can use window.location.origin + '/api'.
// On native we fall back to EXPO_PUBLIC_API_URL or a localhost default.

function getApiBase(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/api`;
  }
  return process.env['EXPO_PUBLIC_API_URL'] ?? 'http://localhost:3001/api';
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Bed {
  id: string;
  status: BedStatus;
}

export interface CensusResponse {
  beds: Bed[];
  patients: Patient[];
  stats: {
    occupied: number;
    available: number;
    cleaning: number;
    wdAlerts: number;
  };
}

// ─── Fetch census ─────────────────────────────────────────────────────────────

export async function fetchCensus(): Promise<CensusResponse> {
  const res = await fetch(`${getApiBase()}/census`);
  if (!res.ok) {
    throw new Error(`Census fetch failed: ${res.status}`);
  }
  return res.json() as Promise<CensusResponse>;
}
