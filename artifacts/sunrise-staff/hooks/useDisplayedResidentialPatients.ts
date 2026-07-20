import { useMemo } from 'react';
import { usePatients } from '@/context/PatientContext';

/**
 * Returns the residential patient list with the pending-discharge patient
 * re-inserted at the top (if they've already been removed from the active
 * roster). Both MARView and ChecksView use this so the logic stays in one
 * place and future changes propagate automatically.
 */
export function useDisplayedResidentialPatients() {
  const { residentialPatients, pendingDischarge } = usePatients();

  return useMemo(() => {
    if (!pendingDischarge) return residentialPatients;
    const pd = pendingDischarge.patient;
    if (pd.program !== 'Residential') return residentialPatients;
    if (residentialPatients.some(p => p.id === pd.id)) return residentialPatients;
    return [pd, ...residentialPatients];
  }, [residentialPatients, pendingDischarge]);
}
