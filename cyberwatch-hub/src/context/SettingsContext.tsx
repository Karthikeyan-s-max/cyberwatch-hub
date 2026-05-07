import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import api from '@/lib/api';

interface NotificationSettings {
  sms: boolean;
  email: boolean;
  push: boolean;
}

interface TwilioConfig {
  sid: string;
  authToken: string;
  senderPhone: string;
  recipientPhone: string;
}

interface SmtpConfig {
  host: string;
  port: string;
  senderEmail: string;
  password: string;
}

interface SettingsState {
  notifications: NotificationSettings;
  twilio: TwilioConfig;
  smtp: SmtpConfig;
  confidenceThreshold: number;
}

interface SettingsContextType {
  settings: SettingsState;
  loading: boolean;
  error: string | null;
  updateNotifications: (notifications: NotificationSettings) => void;
  updateTwilio: (twilio: TwilioConfig) => void;
  updateSmtp: (smtp: SmtpConfig) => void;
  updateConfidenceThreshold: (threshold: number) => void;
  saveSettings: (overrides?: Partial<SettingsState>) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const defaultSettings: SettingsState = {
  notifications: {
    sms: false,
    email: true,
    push: true,
  },
  twilio: {
    sid: '',
    authToken: '',
    senderPhone: '',
    recipientPhone: '',
  },
  smtp: {
    host: '',
    port: '587',
    senderEmail: '',
    password: '',
  },
  confidenceThreshold: 90,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getSettings();
      if (res) {
        // map backend response to local state
        const mapped: SettingsState = {
          notifications: {
            sms: res.notifications?.sms ?? res.notify_sms ?? false,
            email: res.notifications?.email ?? res.notify_email ?? true,
            push: res.notifications?.push ?? res.notify_push ?? true,
          },
          twilio: {
            sid: res.twilio?.sid ?? res.twilio_sid ?? '',
            authToken: res.twilio?.authToken ?? res.twilio_auth_token ?? '',
            senderPhone: res.twilio?.senderPhone ?? res.twilio_phone ?? '',
            recipientPhone: Array.isArray(res.sms_recipients) && res.sms_recipients.length > 0 ? res.sms_recipients[0] : '',
          },
          smtp: {
            host: res.smtp?.host ?? res.smtp_host ?? '',
            port: res.smtp?.port ?? res.smtp_port ?? '587',
            senderEmail: res.smtp?.senderEmail ?? res.smtp_sender_email ?? '',
            password: res.smtp?.password ?? res.smtp_password ?? '',
          },
          confidenceThreshold: Number(res.confidence_threshold ?? res.confidenceThreshold ?? 90),
        };
        setSettings(mapped);
      }
    } catch (e: any) {
      setError(e?.message || String(e));
      console.warn('Failed to load settings:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  const saveSettings = async (overrides?: Partial<SettingsState>) => {
    setLoading(true);
    setError(null);
    try {
      const toSave = overrides ? { ...settings, ...overrides } : settings;
      const payload = {
        confidence_threshold: toSave.confidenceThreshold,
        notify_sms: toSave.notifications.sms,
        notify_email: toSave.notifications.email,
        notify_push: toSave.notifications.push,
        twilio_sid: toSave.twilio.sid,
        twilio_auth_token: toSave.twilio.authToken,
        twilio_phone: toSave.twilio.senderPhone,
        sms_recipients: toSave.twilio.recipientPhone ? [toSave.twilio.recipientPhone] : [],
        smtp_host: toSave.smtp.host,
        smtp_port: toSave.smtp.port,
        smtp_sender_email: toSave.smtp.senderEmail,
        smtp_password: toSave.smtp.password,
      };
      await api.saveSettings(payload);
      setSettings(toSave);
    } catch (e: any) {
      const msg = e?.message || String(e);
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const updateNotifications = (notifications: NotificationSettings) => {
    setSettings(prev => ({ ...prev, notifications }));
  };

  const updateTwilio = (twilio: TwilioConfig) => {
    setSettings(prev => ({ ...prev, twilio }));
  };

  const updateSmtp = (smtp: SmtpConfig) => {
    setSettings(prev => ({ ...prev, smtp }));
  };

  const updateConfidenceThreshold = (threshold: number) => {
    setSettings(prev => ({ ...prev, confidenceThreshold: threshold }));
  };

  return (
    <SettingsContext.Provider value={{
      settings,
      loading,
      error,
      updateNotifications,
      updateTwilio,
      updateSmtp,
      updateConfidenceThreshold,
      saveSettings,
      refreshSettings,
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
