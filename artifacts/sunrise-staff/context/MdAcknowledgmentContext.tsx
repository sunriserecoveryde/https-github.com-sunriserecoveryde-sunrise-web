import React, { createContext, useCallback, useContext, useState } from 'react';

export interface MdAcknowledgment {
  patientId: string;
  /** ISO timestamp when the nurse acknowledged */
  acknowledgedAt: string;
  /** Formatted display time, e.g. "14:32" */
  displayTime: string;
}

interface MdAcknowledgmentContextType {
  acknowledgments: Record<string, MdAcknowledgment>;
  acknowledge: (patientId: string) => void;
  isAcknowledged: (patientId: string) => boolean;
}

const MdAcknowledgmentContext = createContext<MdAcknowledgmentContextType>({
  acknowledgments: {},
  acknowledge: () => {},
  isAcknowledged: () => false,
});

export function MdAcknowledgmentProvider({ children }: { children: React.ReactNode }) {
  const [acknowledgments, setAcknowledgments] = useState<Record<string, MdAcknowledgment>>({});

  const acknowledge = useCallback((patientId: string) => {
    const now = new Date();
    const displayTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    setAcknowledgments(prev => ({
      ...prev,
      [patientId]: {
        patientId,
        acknowledgedAt: now.toISOString(),
        displayTime,
      },
    }));
  }, []);

  const isAcknowledged = useCallback(
    (patientId: string) => patientId in acknowledgments,
    [acknowledgments],
  );

  return (
    <MdAcknowledgmentContext.Provider value={{ acknowledgments, acknowledge, isAcknowledged }}>
      {children}
    </MdAcknowledgmentContext.Provider>
  );
}

export function useMdAcknowledgment() {
  return useContext(MdAcknowledgmentContext);
}
