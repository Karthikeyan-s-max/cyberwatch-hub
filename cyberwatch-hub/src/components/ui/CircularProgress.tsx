import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  label: string;
  color?: 'primary' | 'accent' | 'success' | 'warning' | 'destructive';
}

const colorMap = {
  primary: 'text-primary',
  accent: 'text-accent',
  success: 'text-success',
  warning: 'text-warning',
  destructive: 'text-destructive',
};

const CircularProgress = ({
  value,
  size = 80,
  strokeWidth = 6,
  label,
  color = 'primary',
}: CircularProgressProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background circle */}
        <svg
          className="transform -rotate-90"
          width={size}
          height={size}
        >
          <circle
            className="text-secondary"
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          <motion.circle
            className={cn(colorMap[color])}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{
              strokeDasharray: circumference,
            }}
          />
        </svg>
        
        {/* Value display */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("text-lg font-bold font-display", colorMap[color])}>
            {value}%
          </span>
        </div>
      </div>
      
      <span className="text-xs text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
};

export default CircularProgress;
