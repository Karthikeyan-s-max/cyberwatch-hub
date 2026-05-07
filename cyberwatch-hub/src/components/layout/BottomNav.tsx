import { Home, Video, Bell, BarChart3, Settings } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/dashboard', icon: Home, label: 'Home' },
  { path: '/live', icon: Video, label: 'Live' },
  { path: '/alerts', icon: Bell, label: 'Alerts', badge: 3 },
  { path: '/reports', icon: BarChart3, label: 'Reports' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

const BottomNav = () => {
  const location = useLocation();

  return (
    <motion.nav 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-0 left-0 right-0 z-50 safe-bottom"
    >
      <div className="glass border-t border-white/10">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className="relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-300"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary/10 rounded-xl border border-primary/30"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                
                <div className="relative">
                  <Icon 
                    className={cn(
                      "w-5 h-5 transition-colors duration-300",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )} 
                  />
                  {item.badge && (
                    <span className="absolute -top-1 -right-2 w-4 h-4 bg-destructive text-[10px] font-bold text-destructive-foreground rounded-full flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>
                
                <span 
                  className={cn(
                    "text-[10px] font-medium uppercase tracking-wider transition-colors duration-300",
                    isActive ? "text-primary text-glow-cyan" : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
};

export default BottomNav;
