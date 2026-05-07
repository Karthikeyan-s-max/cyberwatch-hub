import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Filter, AlertTriangle } from 'lucide-react';
import AlertCard from '@/components/alerts/AlertCard';
import { cn } from '@/lib/utils';
import { useAlerts } from '@/context/AlertsContext';
import api from '@/lib/api';

type FilterType = 'all' | 'critical' | 'warning';

const Alerts = () => {
  const [filter, setFilter] = useState<FilterType>('all');
  const { alerts, refreshAlerts } = useAlerts();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [threshold, setThreshold] = useState<number>(90);
  const [alertsList, setAlertsList] = useState(alerts);

  useEffect(() => {
    setAlertsList(alerts);
  }, [alerts]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        await refreshAlerts();
        const s = await api.getSettings();
        const thr = Number(s?.confidence_threshold ?? s?.confidenceThreshold ?? 90);
        if (!Number.isNaN(thr)) setThreshold(thr);
      } catch (e: any) {
        setError(e?.message || String(e));
      } finally {
        setLoading(false);
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = (alertId: string) => {
    setAlertsList(alertsList.filter(a => a.id !== alertId));
  };

  const filteredAlerts = alertsList.filter((alert) => {
    if (filter === 'all') return true;
    if (filter === 'critical') return alert.confidence >= threshold;
    return alert.confidence < threshold;
  });

  const criticalCount = alertsList.filter((a) => a.confidence >= threshold).length;
  const warningCount = alertsList.filter((a) => a.confidence < threshold).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          <h2 className="font-display text-xl font-semibold text-foreground uppercase tracking-wider">
            Alerts & Evidence
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          <span>{criticalCount} critical</span>
        </div>
      </div>

      {/* Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-4 flex items-center justify-around"
      >
        <div className="text-center">
          <p className="text-2xl font-bold font-display text-foreground">
            {alerts.length}
          </p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Total
          </p>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="text-center">
          <p className="text-2xl font-bold font-display text-destructive">
            {criticalCount}
          </p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Critical
          </p>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="text-center">
          <p className="text-2xl font-bold font-display text-warning">
            {warningCount}
          </p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Warning
          </p>
        </div>
      </motion.div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <div className="flex gap-2">
          {(['all', 'critical', 'warning'] as FilterType[]).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wider transition-all duration-300",
                filter === type
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-secondary/50 text-muted-foreground hover:text-foreground"
              )}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Alert List */}
      <div className="space-y-3">
        {loading && (
          <div className="glass p-4 text-center">Loading alerts…</div>
        )}
        {error && (
          <div className="glass p-4 text-center text-red-300">Error loading alerts: {error}</div>
        )}
        {!loading && !error && filteredAlerts.map((alert, index) => (
          <AlertCard key={alert.id} alert={alert} index={index} threshold={threshold} onDelete={handleDelete} />
        ))}
      </div>

      {!loading && filteredAlerts.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass p-8 text-center"
        >
          <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No alerts match the current filter</p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Alerts;
