import { motion } from 'framer-motion';

const NeuralBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden bg-background">
      {/* Animated grid */}
      <div className="absolute inset-0 neural-grid opacity-50" />
      
      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-accent/5" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/3 to-transparent" />
      
      {/* Animated orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/10 blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-accent/10 blur-3xl"
      />
      
      {/* Scan line */}
      <motion.div
        animate={{
          top: ['0%', '100%'],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
      />
      
      {/* Corner decorations */}
      <svg className="absolute top-4 left-4 w-12 h-12 text-primary/30">
        <path d="M0 12 L0 0 L12 0" fill="none" stroke="currentColor" strokeWidth="1" />
      </svg>
      <svg className="absolute top-4 right-4 w-12 h-12 text-primary/30">
        <path d="M12 0 L24 0 L24 12" fill="none" stroke="currentColor" strokeWidth="1" transform="translate(-12, 0)" />
      </svg>
      <svg className="absolute bottom-4 left-4 w-12 h-12 text-primary/30">
        <path d="M0 0 L0 12 L12 12" fill="none" stroke="currentColor" strokeWidth="1" transform="translate(0, -0)" />
      </svg>
      <svg className="absolute bottom-4 right-4 w-12 h-12 text-primary/30">
        <path d="M0 12 L12 12 L12 0" fill="none" stroke="currentColor" strokeWidth="1" transform="translate(0, 0)" />
      </svg>
    </div>
  );
};

export default NeuralBackground;
