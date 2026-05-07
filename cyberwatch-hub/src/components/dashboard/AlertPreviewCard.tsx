import { motion } from 'framer-motion';
import { AlertTriangle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Alert } from '@/data/mockData';

interface AlertPreviewCardProps {
  alert: Alert;
  index: number;
}

const AlertPreviewCard = ({ alert, index }: AlertPreviewCardProps) => {
  const isCritical = alert.confidence >= 90;
  const time = new Date(alert.timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "glass p-3 flex items-center gap-3 transition-all duration-300",
        isCritical 
          ? "border-destructive/50 hover:border-destructive" 
          : "border-warning/30 hover:border-warning/50"
      )}
    >
      {/* Thumbnail */}
      <div className="relative w-14 h-10 rounded-md overflow-hidden flex-shrink-0">
        <img 
          src={alert.thumbnail} 
          alt="Alert thumbnail"
          className="w-full h-full object-cover"
        />
        <div className={cn(
          "absolute inset-0",
          isCritical ? "bg-destructive/20" : "bg-warning/20"
        )} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={cn(
            "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
            isCritical 
              ? "bg-destructive/20 text-destructive" 
              : "bg-warning/20 text-warning"
          )}>
            {isCritical ? 'CRITICAL' : 'WARNING'}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {alert.camera}
          </span>
        </div>
        <p className="text-xs text-foreground truncate">
          {alert.location}
        </p>
      </div>

      {/* Confidence & Time */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className={cn(
          "text-sm font-bold font-display",
          isCritical ? "text-destructive" : "text-warning"
        )}>
          {alert.confidence}%
        </span>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span className="text-[10px]">{time}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default AlertPreviewCard;
