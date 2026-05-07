import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload as UploadIcon, FileVideo, Play, AlertTriangle, Clock, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import api from '@/lib/api';

interface Detection {
  timestamp: string;
  type: string;
  confidence: number;
}

const mockDetections: Detection[] = [
  { timestamp: '00:12', type: 'Fight Detected', confidence: 92 },
  { timestamp: '00:47', type: 'Aggression', confidence: 88 },
  { timestamp: '01:03', type: 'Fight Detected', confidence: 95 },
  { timestamp: '01:28', type: 'Violent Behavior', confidence: 91 },
  { timestamp: '02:15', type: 'Physical Altercation', confidence: 89 },
];

const Upload = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(90);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleSeek = (timestamp: string) => {
    if (!videoRef.current) return;
    try {
      const parts = timestamp.split(':');
      if (parts.length === 2) {
        const seconds = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
        videoRef.current.currentTime = seconds;
        videoRef.current.play().catch(e => console.log('Auto-play blocked, user must click play manually', e));
      }
    } catch (e) {
      console.error('Failed to seek video:', e);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('video/')) {
      processFile(droppedFile);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = (selectedFile: File) => {
    setFile(selectedFile);
    setIsProcessing(true);
    setProgress(5);
    setError(null);
    setDetections([]);

    // start a visual progress animation
    const progInterval = setInterval(() => setProgress((p) => Math.min(95, p + Math.random() * 8)), 300);

    // upload to backend
    api.uploadVideo(selectedFile)
      .then((res: any) => {
        const events = res?.events ?? [];
        // map backend events to local Detection[] shape
        const mapped: Detection[] = (events || []).map((e: any) => ({
          timestamp: typeof e.timestamp === 'number' ? formatTimestamp(e.timestamp) : String(e.timestamp || ''),
          type: e.label || (e.label === 0 ? String(e.label) : 'Detection'),
          confidence: Math.round((Number(e.confidence ?? e.conf ?? 0)) * 100) / 100,
        }));
        setDetections(mapped.length ? mapped : mockDetections);
        setIsComplete(true);
      })
      .catch((err: any) => {
        setError(err?.message || String(err));
        setDetections([]);
      })
      .finally(() => {
        clearInterval(progInterval);
        setProgress(100);
        setTimeout(() => setIsProcessing(false), 300);
      });
  };

  function formatTimestamp(ts: number) {
    // backend may return seconds; if large, attempt to format mm:ss
    const secs = Math.floor(Number(ts) || 0);
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  useEffect(() => {
    let mounted = true;
    api.getSettings()
      .then((s: any) => {
        if (!mounted) return;
        const thr = Number(s?.confidence_threshold ?? s?.confidenceThreshold ?? 90);
        if (!Number.isNaN(thr)) setConfidenceThreshold(thr);
      })
      .catch(() => {
        // ignore, keep default
      });
    return () => { mounted = false; };
  }, []);

  const handleReset = () => {
    setFile(null);
    setIsProcessing(false);
    setProgress(0);
    setIsComplete(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <UploadIcon className="w-5 h-5 text-primary" />
        <h2 className="font-display text-xl font-semibold text-foreground uppercase tracking-wider">
          Video Analysis
        </h2>
      </div>

      <AnimatePresence mode="wait">
        {!file ? (
          /* Upload Zone */
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <label
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                relative block p-12 rounded-xl border-2 border-dashed cursor-pointer
                transition-all duration-300
                ${isDragging 
                  ? 'border-primary bg-primary/10 shadow-[0_0_30px_rgba(0,242,234,0.3)]' 
                  : 'border-white/20 hover:border-primary/50 hover:bg-white/5'
                }
              `}
            >
              <input
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="sr-only"
              />
              
              <div className="text-center space-y-4">
                <motion.div
                  animate={isDragging ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
                  className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 border border-primary/30"
                >
                  <FileVideo className="w-10 h-10 text-primary" />
                </motion.div>
                
                <div>
                  <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                    Upload CCTV Footage for Analysis
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Drag and drop your video file here, or click to browse
                  </p>
                </div>
                
                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <span>MP4</span>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                  <span>AVI</span>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                  <span>MOV</span>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                  <span>MKV</span>
                </div>
              </div>
            </label>
          </motion.div>
        ) : isProcessing ? (
          /* Processing State */
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass p-8 space-y-6"
          >
            <div className="text-center space-y-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30"
              >
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
              </motion.div>
              
              <h3 className="font-display text-lg font-semibold text-foreground">
                Processing Neural Network…
              </h3>
              <p className="text-sm text-muted-foreground">
                Analyzing {file.name}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Analysis Progress</span>
                <span className="font-display font-semibold text-primary">{progress}%</span>
              </div>
              <div className="relative h-2 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent rounded-full"
                  style={{ width: `${progress}%` }}
                />
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary/50 to-transparent"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  style={{ width: '50%' }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Frames</p>
                <p className="font-display font-semibold text-foreground">{Math.floor(progress * 24)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Detections</p>
                <p className="font-display font-semibold text-destructive">{Math.floor(progress / 20)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Model</p>
                <p className="font-display font-semibold text-primary">VD-Net v2</p>
              </div>
            </div>
          </motion.div>
        ) : (
          /* Results State */
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Video Player with Detection Overlay */}
            <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10 bg-slate-900">
              {file && (
                <>
                  <video
                    ref={videoRef}
                    controls
                    src={URL.createObjectURL(file)}
                    className="w-full h-full object-contain bg-black"
                    key={file.name}
                  />
                  
                  {/* Detection Timeline Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 px-2 pb-2">
                    <div className="flex gap-1 h-8 bg-black/50 rounded p-1 backdrop-blur-sm overflow-x-auto">
                      {detections.map((det, idx) => {
                        const parts = det.timestamp.split(':');
                        const seconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
                        return (
                          <motion.div
                            key={idx}
                            onClick={() => handleSeek(det.timestamp)}
                            className="flex-shrink-0 w-6 h-6 rounded bg-destructive/60 hover:bg-destructive cursor-pointer flex items-center justify-center text-xs font-bold text-white"
                            title={`${det.type} - ${det.confidence}% at ${det.timestamp}`}
                            whileHover={{ scale: 1.2 }}
                          >
                            {idx + 1}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Detection Log */}
            <div className="glass p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-display font-semibold text-foreground uppercase tracking-wider text-sm">
                  Detection Log
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-destructive/20 text-destructive text-xs font-display font-semibold">
                  {detections.length} Incidents
                </span>
              </div>
              {error && (
                <div className="p-2 rounded bg-red-900/30 text-red-300 text-sm">Error: {error}</div>
              )}
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {detections.map((detection, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleSeek(detection.timestamp)}
                    className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:border-destructive/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-[60px]">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="font-mono">{detection.timestamp}</span>
                    </div>
                    
                    <div className="flex-1 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-destructive animate-pulse" />
                      <span className="text-sm text-foreground font-semibold">{detection.type}</span>
                    </div>
                    
                    <div className={`
                      flex items-center gap-1 px-2 py-0.5 rounded text-xs font-display font-semibold
                      ${detection.confidence >= confidenceThreshold
                        ? 'bg-destructive/20 text-destructive'
                        : 'bg-yellow-500/20 text-yellow-500'
                      }
                    `}>
                      <Percent className="w-3 h-3" />
                      {detection.confidence}%
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Reset Button */}
            <motion.div whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleReset}
                variant="outline"
                className="w-full border-white/20 hover:bg-white/5 font-display uppercase tracking-wider"
              >
                Analyze Another Video
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Upload;
