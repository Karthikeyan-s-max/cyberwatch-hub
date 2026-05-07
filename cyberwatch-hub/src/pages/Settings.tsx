import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Bell, Mail, Smartphone, MessageSquare, Server, Gauge, Info, Save } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { useSettings } from '@/context/SettingsContext';
import { toast } from 'sonner';

const Settings = () => {
  const { settings, loading, error, updateNotifications, updateTwilio, updateSmtp, updateConfidenceThreshold, saveSettings } = useSettings();
  
  const [notifications, setNotifications] = useState(settings.notifications);
  const [twilio, setTwilio] = useState(settings.twilio);
  const [smtp, setSmtp] = useState(settings.smtp);
  const [threshold, setThreshold] = useState([settings.confidenceThreshold]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNotifications(settings.notifications);
    setTwilio(settings.twilio);
    setSmtp(settings.smtp);
    setThreshold([settings.confidenceThreshold]);
  }, [settings]);

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await saveSettings({
        notifications,
        twilio,
        smtp,
        confidenceThreshold: threshold[0],
      });
      updateNotifications(notifications);
      updateTwilio(twilio);
      updateSmtp(smtp);
      updateConfidenceThreshold(threshold[0]);
      toast.success('All settings saved successfully');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex items-center justify-center py-12"
      >
        <p className="text-muted-foreground">Loading settings…</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6 pb-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-primary" />
          <h2 className="font-display text-xl font-semibold text-foreground uppercase tracking-wider">
            Settings
          </h2>
        </div>
        {error && (
          <div className="text-xs text-destructive bg-destructive/10 px-3 py-1 rounded">
            {error}
          </div>
        )}
      </div>

      {/* Section 1: Notification Channels */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass p-4 space-y-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-primary" />
          <h3 className="font-display text-sm font-semibold text-foreground uppercase tracking-wider">
            Notification Channels
          </h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              <Label htmlFor="sms" className="text-sm text-foreground">SMS Alerts</Label>
            </div>
            <Switch
              id="sms"
              checked={notifications.sms}
              onCheckedChange={(checked) => setNotifications({ ...notifications, sms: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <Label htmlFor="email" className="text-sm text-foreground">Email Alerts</Label>
            </div>
            <Switch
              id="email"
              checked={notifications.email}
              onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-muted-foreground" />
              <Label htmlFor="push" className="text-sm text-foreground">Push Notifications</Label>
            </div>
            <Switch
              id="push"
              checked={notifications.push}
              onCheckedChange={(checked) => setNotifications({ ...notifications, push: checked })}
            />
          </div>
        </div>
      </motion.div>

      {/* Section 2: Twilio SMS Configuration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass p-4 space-y-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-4 h-4 text-primary" />
          <h3 className="font-display text-sm font-semibold text-foreground uppercase tracking-wider">
            Twilio SMS Configuration
          </h3>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="twilio-sid" className="text-xs text-muted-foreground uppercase">Account SID</Label>
            <Input
              id="twilio-sid"
              type="password"
              placeholder="AC..."
              value={twilio.sid}
              onChange={(e) => setTwilio({ ...twilio, sid: e.target.value })}
              className="bg-background/50 border-border/50 focus:border-primary focus:ring-primary/20"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="twilio-token" className="text-xs text-muted-foreground uppercase">Auth Token</Label>
            <Input
              id="twilio-token"
              type="password"
              placeholder="••••••••"
              value={twilio.authToken}
              onChange={(e) => setTwilio({ ...twilio, authToken: e.target.value })}
              className="bg-background/50 border-border/50 focus:border-primary focus:ring-primary/20"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="twilio-phone" className="text-xs text-muted-foreground uppercase">Sender Phone</Label>
            <Input
              id="twilio-phone"
              type="tel"
              placeholder="+1234567890"
              value={twilio.senderPhone}
              onChange={(e) => setTwilio({ ...twilio, senderPhone: e.target.value })}
              className="bg-background/50 border-border/50 focus:border-primary focus:ring-primary/20"
            />
          </div>
          
          <div className="space-y-1 pt-2 border-t border-border/20">
            <Label htmlFor="twilio-recipient" className="text-xs text-muted-foreground uppercase">Alert Phone Number (Yours)</Label>
            <Input
              id="twilio-recipient"
              type="tel"
              placeholder="+911234567890"
              value={twilio.recipientPhone}
              onChange={(e) => setTwilio({ ...twilio, recipientPhone: e.target.value })}
              className="bg-background/50 border-border/50 focus:border-primary focus:ring-primary/20"
            />
            <p className="text-[10px] text-muted-foreground">The number that will receive the SMS alerts.</p>
          </div>
        </div>
      </motion.div>

      {/* Section 3: SMTP Configuration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass p-4 space-y-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-4 h-4 text-primary" />
          <h3 className="font-display text-sm font-semibold text-foreground uppercase tracking-wider">
            Email (SMTP) Configuration
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="smtp-host" className="text-xs text-muted-foreground uppercase">SMTP Host</Label>
            <Input
              id="smtp-host"
              placeholder="smtp.example.com"
              value={smtp.host}
              onChange={(e) => setSmtp({ ...smtp, host: e.target.value })}
              className="bg-background/50 border-border/50 focus:border-primary focus:ring-primary/20"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="smtp-port" className="text-xs text-muted-foreground uppercase">Port</Label>
            <Input
              id="smtp-port"
              placeholder="587"
              value={smtp.port}
              onChange={(e) => setSmtp({ ...smtp, port: e.target.value })}
              className="bg-background/50 border-border/50 focus:border-primary focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="smtp-email" className="text-xs text-muted-foreground uppercase">Sender Email</Label>
          <Input
            id="smtp-email"
            type="email"
            placeholder="alerts@example.com"
            value={smtp.senderEmail}
            onChange={(e) => setSmtp({ ...smtp, senderEmail: e.target.value })}
            className="bg-background/50 border-border/50 focus:border-primary focus:ring-primary/20"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="smtp-password" className="text-xs text-muted-foreground uppercase">Password</Label>
          <Input
            id="smtp-password"
            type="password"
            placeholder="••••••••"
            value={smtp.password}
            onChange={(e) => setSmtp({ ...smtp, password: e.target.value })}
            className="bg-background/50 border-border/50 focus:border-primary focus:ring-primary/20"
          />
        </div>
      </motion.div>

      {/* Section 4: Confidence Threshold */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass p-4 space-y-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <Gauge className="w-4 h-4 text-primary" />
          <h3 className="font-display text-sm font-semibold text-foreground uppercase tracking-wider">
            Confidence Threshold
          </h3>
        </div>

        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Minimum detection accuracy for critical alerts
          </p>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>50%</span>
              <span className="text-primary font-display font-bold text-lg">{threshold[0]}%</span>
              <span>100%</span>
            </div>
            <Slider
              value={threshold}
              onValueChange={setThreshold}
              min={50}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
        </div>
      </motion.div>

      {/* Section 5: System Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass p-4 space-y-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-4 h-4 text-primary" />
          <h3 className="font-display text-sm font-semibold text-foreground uppercase tracking-wider">
            System Information
          </h3>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between py-2 border-b border-border/30">
            <span className="text-xs text-muted-foreground uppercase">App Version</span>
            <span className="text-xs text-foreground font-mono">v1.0.0-beta</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border/30">
            <span className="text-xs text-muted-foreground uppercase">Environment</span>
            <span className="text-xs text-foreground font-mono">Development</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-xs text-muted-foreground uppercase">Last Updated</span>
            <span className="text-xs text-foreground font-mono">Dec 8, 2025</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Server className="w-3 h-3 text-success" />
          <span className="text-xs text-success">All systems operational</span>
        </div>
      </motion.div>

      {/* Unified Save Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex gap-3"
      >
        <Button
          onClick={handleSaveAll}
          disabled={saving || loading}
          className="flex-1 bg-primary/20 border border-primary/50 text-primary hover:bg-primary/30 hover:shadow-[0_0_15px_rgba(0,242,234,0.3)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          size="sm"
        >
          <Save className="w-3 h-3 mr-2" />
          <span className="text-xs uppercase tracking-wider">
            {saving ? 'Saving…' : 'Save All Settings'}
          </span>
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default Settings;
