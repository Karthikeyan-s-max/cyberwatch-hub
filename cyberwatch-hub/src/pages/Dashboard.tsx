import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Shield, Zap } from 'lucide-react';
import CircularProgress from '@/components/ui/CircularProgress';
import QuickActionCard from '@/components/dashboard/QuickActionCard';
import AlertPreviewCard from '@/components/dashboard/AlertPreviewCard';
import { systemHealth, quickActions } from '@/data/mockData';
import { useAlerts } from '@/context/AlertsContext';
import api from '@/lib/api';

const Dashboard = () => {
  const { alerts, refreshAlerts } = useAlerts();
  const [loading, setLoading] = useState(false);
  const [threshold, setThreshold] = useState(90);
  
  // Real-time metric simulation state
  const [dynamicMetrics, setDynamicMetrics] = useState({
    cpu: systemHealth.cpu,
    ram: systemHealth.ram,
    gpu: systemHealth.gpu
  });
  
  // Fetch real-time settings and alerts
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        await refreshAlerts();
        const s = await api.getSettings();
        const thr = Number(s?.confidence_threshold ?? s?.confidenceThreshold ?? 90);
        if (!Number.isNaN(thr)) setThreshold(thr);
      } catch (e) {
        console.error('Failed to load dashboard data:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Simulate real-time metric polling for Viva presentation
  useEffect(() => {
    const interval = setInterval(() => {
      setDynamicMetrics(prev => {
        // CPU fluctuates randomly between 20% and 55% during normal operation
        const newCpu = Math.max(10, Math.min(95, prev.cpu + (Math.random() * 15 - 7.5)));
        // RAM fluctuates slightly between 45% and 65%
        const newRam = Math.max(30, Math.min(85, prev.ram + (Math.random() * 6 - 3)));
        // GPU is relatively stable unless processing
        const newGpu = Math.max(5, Math.min(90, prev.gpu + (Math.random() * 10 - 5)));
        
        return {
          cpu: Math.round(newCpu),
          ram: Math.round(newRam),
          gpu: Math.round(newGpu)
        };
      });
    }, 2500); // Update every 2.5 seconds
    
    return () => clearInterval(interval);
  }, []);

  const criticalCount = alerts.filter(a => a.confidence >= threshold).length;
  const recentAlerts = alerts.slice(0, 4);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-6 text-center relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="relative z-10">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="font-display text-lg font-semibold text-foreground uppercase tracking-wider">
              Command Center
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Real-time AI surveillance monitoring active
          </p>
        </div>
      </motion.div>

      {/* System Health */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <h3 className="font-display font-semibold text-foreground uppercase tracking-wider text-sm">
            System Health
          </h3>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass p-5"
        >
          <div className="flex items-center justify-around">
            <CircularProgress 
              value={dynamicMetrics.gpu} 
              label="GPU" 
              color="primary" 
            />
            <CircularProgress 
              value={dynamicMetrics.ram} 
              label="RAM" 
              color="accent" 
            />
            <CircularProgress 
              value={dynamicMetrics.cpu} 
              label="CPU" 
              color="success" 
            />
          </div>
          
        <div className="mt-4 pt-4 border-t border-border">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-lg font-bold text-foreground">{alerts.length}</p>
              <p className="text-xs text-muted-foreground">Total Alerts</p>
            </div>
            <div>
              <p className="text-lg font-bold text-destructive">{criticalCount}</p>
              <p className="text-xs text-muted-foreground">Critical</p>
            </div>
            <div>
              <p className="text-lg font-bold text-success">
                {systemHealth.uptime}
              </p>
              <p className="text-xs text-muted-foreground">System OK</p>
            </div>
          </div>
        </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <h3 className="font-display font-semibold text-foreground uppercase tracking-wider text-sm">
            Quick Actions
          </h3>
        </div>
        
        <div className="grid gap-3">
          {quickActions.map((action, index) => (
            <QuickActionCard
              key={action.id}
              title={action.title}
              description={action.description}
              icon={action.icon}
              color={action.color as 'primary' | 'accent' | 'success'}
              route={action.route}
              index={index}
            />
          ))}
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
            <h3 className="font-display font-semibold text-foreground uppercase tracking-wider text-sm">
              Recent Alerts
            </h3>
          </div>
          <span className="text-xs text-muted-foreground">
            {loading ? 'Loading...' : `${alerts.length} total`}
          </span>
        </div>
        
        <div className="space-y-2">
          {loading ? (
            <div className="glass p-4 text-center text-sm text-muted-foreground">
              Loading alerts...
            </div>
          ) : recentAlerts.length > 0 ? (
            recentAlerts.map((alert, index) => (
              <AlertPreviewCard key={alert.id} alert={alert} index={index} />
            ))
          ) : (
            <div className="glass p-4 text-center text-sm text-muted-foreground">
              No alerts yet
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
