import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, FileText, AlertTriangle, TrendingUp, Download, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAlerts } from '@/context/AlertsContext';
import { useSettings } from '@/context/SettingsContext';
import api from '@/lib/api';

interface DailyAggregation {
  day: string;
  date: string;
  alerts: number;
  critical: number;
}

const Reports = () => {
  const { alerts } = useAlerts();
  const { settings } = useSettings();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [generating, setGenerating] = useState(false);
  const [chartData, setChartData] = useState<DailyAggregation[]>([]);

  // Build chart data from alerts
  useEffect(() => {
    const aggregated: { [key: string]: { alerts: number; critical: number } } = {};
    
    alerts.forEach((alert) => {
      const date = new Date(alert.timestamp);
      const dayKey = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      const dateStr = date.toISOString().split('T')[0];

      // Apply date range filter if set
      if (dateFrom && dateStr < dateFrom) return;
      if (dateTo && dateStr > dateTo) return;

      if (!aggregated[dayKey]) {
        aggregated[dayKey] = { alerts: 0, critical: 0 };
      }
      aggregated[dayKey].alerts += 1;
      if (alert.confidence >= settings.confidenceThreshold) {
        aggregated[dayKey].critical += 1;
      }
    });

    // Convert to array and sort
    const data: DailyAggregation[] = Object.entries(aggregated).map(([day, { alerts: count, critical }]) => ({
      day,
      date: new Date(day).toISOString().split('T')[0],
      alerts: count,
      critical,
    }));

    setChartData(data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
  }, [alerts, dateFrom, dateTo, settings.confidenceThreshold]);

  // Calculate summary stats
  const filteredAlerts = alerts.filter((alert) => {
    const dateStr = new Date(alert.timestamp).toISOString().split('T')[0];
    if (dateFrom && dateStr < dateFrom) return false;
    if (dateTo && dateStr > dateTo) return false;
    return true;
  });

  const totalEvents = filteredAlerts.length;
  const criticalAlerts = filteredAlerts.filter((a) => a.confidence >= settings.confidenceThreshold).length;
  const avgConfidence = filteredAlerts.length > 0
    ? (filteredAlerts.reduce((sum, a) => sum + a.confidence, 0) / filteredAlerts.length).toFixed(1)
    : '0.0';

  const handleGeneratePDF = async () => {
    setGenerating(true);
    try {
      const minConf = settings.confidenceThreshold;
      const data = await api.generateReport({
        min_confidence: minConf,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });

      // Handle PDF download
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `report_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      toast.success('PDF Report Downloaded', {
        description: link.download,
      });
    } catch (e: any) {
      toast.error('Failed to generate PDF', {
        description: e?.message || String(e),
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h2 className="font-display text-xl font-semibold text-foreground uppercase tracking-wider">
            Intelligence Reports
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Analysis of Violence Events
        </p>
      </div>

      {/* Date Range Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-primary" />
          <Label className="font-display text-xs font-semibold text-foreground uppercase tracking-wider">
            Date Range (Optional)
          </Label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="date-from" className="text-xs text-muted-foreground">From</Label>
            <Input
              id="date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-background/50 border-border/50 focus:border-primary focus:ring-primary/20"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="date-to" className="text-xs text-muted-foreground">To</Label>
            <Input
              id="date-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-background/50 border-border/50 focus:border-primary focus:ring-primary/20"
            />
          </div>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass p-4 text-center"
        >
          <TrendingUp className="w-5 h-5 text-primary mx-auto mb-2" />
          <p className="text-2xl font-display font-bold text-foreground">
            {totalEvents}
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Total Events
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass p-4 text-center"
        >
          <AlertTriangle className="w-5 h-5 text-destructive mx-auto mb-2" />
          <p className="text-2xl font-display font-bold text-destructive">
            {criticalAlerts}
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Critical (≥{settings.confidenceThreshold}%)
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass p-4 text-center"
        >
          <FileText className="w-5 h-5 text-accent mx-auto mb-2" />
          <p className="text-2xl font-display font-bold text-foreground">
            {avgConfidence}%
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Avg Confidence
          </p>
        </motion.div>
      </div>

      {/* Bar Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass p-4"
      >
        <h3 className="font-display text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
          Violence Events Per Day
        </h3>
        {chartData.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="hsl(var(--muted-foreground))" 
                  opacity={0.1} 
                  vertical={false}
                />
                <XAxis 
                  dataKey="day" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--primary))',
                    borderRadius: '8px',
                    boxShadow: '0 0 20px rgba(0, 242, 234, 0.3)',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  itemStyle={{ color: 'hsl(var(--primary))' }}
                  formatter={(value) => [`${value} events`, 'Total']}
                />
                <Bar 
                  dataKey="alerts" 
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                  className="drop-shadow-[0_0_8px_rgba(0,242,234,0.5)]"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center">
            <p className="text-muted-foreground">No alert data for selected date range</p>
          </div>
        )}
      </motion.div>

      {/* Generate PDF Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Button
          onClick={handleGeneratePDF}
          disabled={generating}
          className="w-full bg-primary/20 border border-primary/50 text-primary hover:bg-primary/30 hover:shadow-[0_0_20px_rgba(0,242,234,0.4)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4 mr-2" />
          <span className="font-display uppercase tracking-wider">
            {generating ? 'Generating…' : 'Generate PDF Report'}
          </span>
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default Reports;
