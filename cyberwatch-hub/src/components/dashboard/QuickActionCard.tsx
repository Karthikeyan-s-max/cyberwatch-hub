import { motion } from 'framer-motion';
import { Upload, Video, Camera, LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: string;
  color: 'primary' | 'accent' | 'success';
  route?: string;
  onClick?: () => void;
  index: number;
}

const iconMap: Record<string, LucideIcon> = {
  Upload,
  Video,
  Camera,
};

const colorMap = {
  primary: {
    bg: 'hover:border-primary/50',
    icon: 'text-primary',
    glow: 'group-hover:glow-cyan',
  },
  accent: {
    bg: 'hover:border-accent/50',
    icon: 'text-accent',
    glow: 'group-hover:glow-purple',
  },
  success: {
    bg: 'hover:border-success/50',
    icon: 'text-success',
    glow: 'group-hover:shadow-[0_0_20px_hsl(142_76%_45%/0.4)]',
  },
};

const QuickActionCard = ({
  title,
  description,
  icon,
  color,
  route,
  onClick,
  index,
}: QuickActionCardProps) => {
  const navigate = useNavigate();
  const Icon = iconMap[icon] || Upload;
  const colors = colorMap[color];

  const handleClick = () => {
    if (route) {
      navigate(route);
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className={cn(
        "group glass-hover p-4 text-left w-full transition-all duration-300",
        colors.bg,
        colors.glow
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "p-2.5 rounded-lg bg-secondary/50 transition-all duration-300",
          "group-hover:bg-secondary"
        )}>
          <Icon className={cn("w-5 h-5", colors.icon)} />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-foreground text-sm mb-0.5">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
    </motion.button>
  );
};

export default QuickActionCard;
