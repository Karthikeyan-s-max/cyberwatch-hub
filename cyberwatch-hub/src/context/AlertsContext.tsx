import React, { createContext, useContext, useState, ReactNode } from 'react';
import { mockAlerts, Alert } from '@/data/mockData';
import api from '@/lib/api';

interface AlertsContextType {
  alerts: Alert[];
  addAlert: (alert: Omit<Alert, 'id'>) => void;
  clearAlerts: () => void;
  refreshAlerts: () => Promise<void>;
}

const AlertsContext = createContext<AlertsContextType | undefined>(undefined);

export const AlertsProvider = ({ children }: { children: ReactNode }) => {
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);

  const refreshAlerts = async () => {
    try {
      const res = await api.getAlerts({ limit: 200 });
      const items = res?.alerts ?? res ?? [];
      const mapped: Alert[] = (items || []).map((r: any) => {
        const rawConf = Number(r.confidence ?? 0);
        const conf = rawConf <= 1 ? Math.round(rawConf * 100) : Math.round(rawConf);
        const label = String(r.label ?? r.type ?? 'violence').toLowerCase();
        const type: any = label.includes('weapon') ? 'weapon' : label.includes('violence') || label.includes('fight') ? 'violence' : 'suspicious';
        const thumbnail = r.image_base64 ? `data:image/jpeg;base64,${r.image_base64}` : (r.thumbnail ?? '');
        return {
          id: String(r.id ?? `alert-${Date.now()}`),
          timestamp: r.timestamp ?? r.created_at ?? new Date().toISOString(),
          camera: r.camera ?? (r.rtsp_url ?? 'Unknown'),
          location: r.camera ?? r.rtsp_url ?? 'Unknown',
          confidence: conf,
          type,
          thumbnail,
          status: 'new',
        } as Alert;
      });
      setAlerts(mapped);
    } catch (e) {
      // leave existing alerts on error
      console.warn('Failed to refresh alerts', e);
    }
  };

  const addAlert = (alertData: Omit<Alert, 'id'>) => {
    const newAlert: Alert = {
      ...alertData,
      id: `alert-${Date.now()}`,
    };
    setAlerts(prev => [newAlert, ...prev]);
  };

  const clearAlerts = () => {
    setAlerts([]);
  };

  // load remote alerts on mount
  React.useEffect(() => {
    refreshAlerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AlertsContext.Provider value={{ alerts, addAlert, clearAlerts, refreshAlerts }}>
      {children}
    </AlertsContext.Provider>
  );
};

export const useAlerts = () => {
  const context = useContext(AlertsContext);
  if (!context) {
    throw new Error('useAlerts must be used within an AlertsProvider');
  }
  return context;
};

