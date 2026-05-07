import { Shield, Wifi } from 'lucide-react';
import { motion } from 'framer-motion';

const Header = () => {
  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 safe-top"
    >
      <div className="glass border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Shield className="w-6 h-6 text-primary" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-success rounded-full pulse-dot" />
            </div>
            <div>
              <h1 className="font-display text-lg font-semibold text-foreground tracking-wider">
                VDS
              </h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                Violence Detection
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/30">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
              <span className="text-xs font-medium text-success">SYSTEM ONLINE</span>
            </div>
            <Wifi className="w-4 h-4 text-primary" />
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
