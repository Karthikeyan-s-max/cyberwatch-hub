import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Wifi, Camera, Radio, Cpu, Activity } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import useInterval from '@/hooks/use-interval';

const Live = () => {
  const [rtspUrl, setRtspUrl] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [detection, setDetection] = useState<{
    violence: boolean;
    confidence: number;
    bbox?: [number, number, number, number];
    label?: string | null;
    timestamp?: string | number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleConnect = async () => {
    if (!rtspUrl.trim()) return;
    setError(null);
    setIsConnecting(true);
    setLoading(true);
    try {
      const resp = await api.connectLive({ rtsp_url: rtspUrl });
      // backend returns { result: {...}, timestamp }
      const res = resp && (resp.result ? resp.result : resp);
      const vio = res?.violence ?? false;
      const conf = Number(res?.confidence ?? 0);
      const bbox = res?.bbox ?? res?.box ?? undefined;

      setDetection({ violence: !!vio, confidence: conf, bbox, label: res?.label, timestamp: resp?.timestamp ?? Date.now() });
      setIsConnected(true);
    } catch (err: any) {
      setError(err?.message || String(err));
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setDetection(null);
    setRtspUrl('');
    setError(null);
  };

  // Poll backend while connected
  useInterval(async () => {
    if (!isConnected) return;
    try {
      const resp = await api.connectLive({ rtsp_url: rtspUrl });
      const res = resp && (resp.result ? resp.result : resp);
      const vio = res?.violence ?? false;
      const conf = Number(res?.confidence ?? 0);
      const bbox = res?.bbox ?? res?.box ?? undefined;
      setDetection({ violence: !!vio, confidence: conf, bbox, label: res?.label, timestamp: resp?.timestamp ?? Date.now() });
      setError(null);
    } catch (err: any) {
      setError(err?.message || String(err));
    }
  }, 1500, isConnected);

  useEffect(() => {
    return () => {
      // cleanup on unmount
      setIsConnected(false);
    };
  }, []);

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
          <Video className="w-5 h-5 text-primary" />
          <h2 className="font-display text-xl font-semibold text-foreground uppercase tracking-wider">
            Live Surveillance
          </h2>
        </div>
        
        {isConnected && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/20 border border-destructive/50"
          >
            <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
            <span className="text-xs font-display font-semibold text-destructive uppercase tracking-wider">
              Live Analysis: Active
            </span>
          </motion.div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!isConnected ? (
          /* Initial State - RTSP Input */
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass p-8 space-y-6"
          >
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 mb-4">
                <Camera className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground">
                Connect RTSP Stream
              </h3>
              <p className="text-sm text-muted-foreground">
                Enter your camera's RTSP URL to begin live violence detection
              </p>
            </div>

            <div className="space-y-4">
              <Input
                type="text"
                placeholder="rtsp://your-camera-stream"
                value={rtspUrl}
                onChange={(e) => setRtspUrl(e.target.value)}
                className="bg-background/50 border-white/10 focus:border-primary focus:ring-2 focus:ring-primary/30 font-mono text-sm"
              />
              
              <motion.div whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={handleConnect}
                  disabled={!rtspUrl.trim() || isConnecting}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-display uppercase tracking-wider"
                >
                  {isConnecting ? (
                    <span className="flex items-center gap-2">
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Radio className="w-4 h-4" />
                      </motion.span>
                      Connecting...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Wifi className="w-4 h-4" />
                      Connect Stream
                    </span>
                  )}
                </Button>
              </motion.div>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-4 border-t border-white/5">
              <Camera className="w-4 h-4" />
              <span>No signal. Connect a stream to begin analysis.</span>
            </div>
          </motion.div>
        ) : (
          /* Connected State - Simulated Feed */
          <motion.div
            key="feed"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-4"
          >
            {/* Video Feed Container */}
            <div ref={containerRef} className="relative aspect-video rounded-xl overflow-hidden border border-white/10">
              {/* Simulated CCTV Feed Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                {/* Simulated camera view with noise effect */}
                <div className="absolute inset-0 opacity-30">
                  <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIvPjwvc3ZnPg==')]" />
                </div>
                
                {/* Grid overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,242,234,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,242,234,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />
                
                {/* Scan line effect */}
                <motion.div
                  className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent"
                  animate={{ top: ['0%', '100%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                />
              </div>

              {/* Dynamic Detection Bounding Box (from backend) */}
              {detection?.bbox && (
                (() => {
                  try {
                    const bbox = detection.bbox as [number, number, number, number];
                    const container = containerRef.current;
                    const cw = container?.clientWidth || 640;
                    const ch = container?.clientHeight || 360;

                    // bbox format: [x, y, width, height]
                    const [bx, by, bw, bh] = bbox;
                    const isNormalized = Math.max(bx, by, bw, bh) <= 1;

                    const leftPct = isNormalized ? (bx * 100) : ((bx / cw) * 100);
                    const topPct = isNormalized ? (by * 100) : ((by / ch) * 100);
                    const widthPct = isNormalized ? (bw * 100) : ((bw / cw) * 100);
                    const heightPct = isNormalized ? (bh * 100) : ((bh / ch) * 100);

                    return (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="absolute border-2 border-destructive rounded-lg"
                        style={{ left: `${leftPct}%`, top: `${topPct}%`, width: `${widthPct}%`, height: `${heightPct}%` }}
                      >
                        <div className="absolute -top-8 left-0 px-2 py-1 bg-destructive/90 rounded text-xs font-display font-bold text-white uppercase tracking-wider">
                          {detection.label ?? 'Violence'} {Math.round((detection.confidence ?? 0) * 100)}%
                        </div>
                      </motion.div>
                    );
                  } catch (e) {
                    return null;
                  }
                })()
              )}

              {/* Timestamp overlay */}
              <div className="absolute top-4 left-4 px-2 py-1 bg-black/50 rounded text-xs font-mono text-white/80">
                {new Date().toLocaleTimeString()} • CAM-01
              </div>

              {/* Recording indicator */}
              <div className="absolute top-4 right-4 flex items-center gap-2 px-2 py-1 bg-destructive/80 rounded">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="text-xs font-display font-bold text-white uppercase">REC</span>
              </div>
            </div>

            {/* Status Indicators */}
            <div className="glass p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs text-muted-foreground">Connected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                    <span className="text-xs text-muted-foreground">Stable</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
                    <span className="text-xs text-muted-foreground">Model Active</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Cpu className="w-3.5 h-3.5 text-primary" />
                    <span>GPU: 92%</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Activity className="w-3.5 h-3.5 text-primary" />
                    <span>30 FPS</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Disconnect Button */}
            <motion.div whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleDisconnect}
                variant="outline"
                className="w-full border-destructive/50 text-destructive hover:bg-destructive/10 font-display uppercase tracking-wider"
              >
                Disconnect Stream
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Live;
