import { motion } from 'framer-motion';
import { AlertTriangle, Clock, MapPin, Camera, ChevronRight, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { deleteAlert } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import type { Alert } from '@/data/mockData';

interface AlertCardProps {
  alert: Alert;
  index: number;
  threshold?: number;
  onDelete?: (alertId: string) => void;
}

const typeLabels = {
  violence: 'Violence Detected',
  suspicious: 'Suspicious Activity',
  weapon: 'Weapon Detected',
};

const AlertCard = ({ alert, index, threshold = 90, onDelete }: AlertCardProps) => {
  const { toast } = useToast();
  const isCritical = alert.confidence >= threshold;
  const date = new Date(alert.timestamp);
  const time = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const numericId = Number(alert.id);
      if (Number.isFinite(numericId)) {
        await deleteAlert(numericId);
      }
      toast({
        description: "Alert deleted successfully",
      });
      onDelete?.(alert.id);
    } catch (error) {
      toast({
        variant: "destructive",
        description: "Failed to delete alert",
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      whileHover={{ scale: 1.01 }}
      className={cn(
        "glass p-4 cursor-pointer transition-all duration-300",
        isCritical 
          ? "border-destructive/50 hover:border-destructive hover:glow-red" 
          : "border-warning/30 hover:border-warning/50 hover:glow-yellow"
      )}
    >
      <div className="flex gap-4">
        {/* Thumbnail */}
        <div className="relative w-24 h-16 rounded-lg overflow-hidden flex-shrink-0">
          <img 
            src={alert.thumbnail} 
            alt="Alert evidence"
            className="w-full h-full object-cover"
          />
          <div className={cn(
            "absolute inset-0 border-2 rounded-lg",
            isCritical ? "border-destructive" : "border-warning"
          )} />
          {isCritical && (
            <div className="absolute top-1 left-1">
              <AlertTriangle className="w-4 h-4 text-destructive animate-pulse" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={cn(
                  "text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded",
                  isCritical 
                    ? "bg-destructive/20 text-destructive" 
                    : "bg-warning/20 text-warning"
                )}>
                  {isCritical ? 'CRITICAL' : 'WARNING'}
                </span>
                <span className="text-xs text-muted-foreground">
                  #{alert.id}
                </span>
              </div>
              <h3 className="font-display font-semibold text-foreground text-sm">
                {typeLabels[alert.type]}
              </h3>
            </div>
            
            <div className="flex flex-col items-end">
              <span className={cn(
                "text-xl font-bold font-display",
                isCritical ? "text-destructive text-glow-red" : "text-warning"
              )}>
                {alert.confidence}%
              </span>
              <span className="text-[10px] text-muted-foreground uppercase">
                Confidence
              </span>
            </div>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Camera className="w-3 h-3" />
              <span>{alert.camera}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>{alert.location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{time} · {dateStr}</span>
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            title="Delete alert"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>
      </div>
    </motion.div>
  );
};

export default AlertCard;
