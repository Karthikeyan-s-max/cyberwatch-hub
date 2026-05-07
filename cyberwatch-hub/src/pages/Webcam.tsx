import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, AlertTriangle, Shield, Scan, Video, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAlerts } from '@/context/AlertsContext';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';

const Webcam = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [detection, setDetection] = useState<{
    violence: boolean;
    confidence: number;
    bbox?: [number, number, number, number] | null;
    label?: string | null;
  } | null>(null);
  
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(85);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { addAlert } = useAlerts();
  const { toast } = useToast();
  const lastAlertAt = useRef<number>(0);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  
  // Initialize camera
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout | undefined;

    const initCamera = async () => {
      try {
        console.log('🎥 Requesting camera access...');
        
        const constraints = {
          video: true,  // Simple constraint first
          audio: false
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (!isMounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        
        console.log('✅ Camera stream attached successfully');
        setHasPermission(true);
        setError(null);
        
        // Wait one tick for React to render the video element since it's guarded by hasPermission
        setTimeout(() => {
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        }, 100);
      } catch (err: any) {
        if (!isMounted) return;
        
        console.error('❌ Camera error:', err?.name, err?.message);
        setHasPermission(false);
        
        // Provide specific error messages
        let errorMsg = 'Camera not available';
        if (err?.name === 'NotAllowedError') {
          errorMsg = 'Permission denied - Allow camera in browser settings';
        } else if (err?.name === 'NotFoundError') {
          errorMsg = 'No camera device found on this system';
        } else if (err?.name === 'NotReadableError') {
          errorMsg = 'Camera is in use by another application';
        } else if (err?.name === 'OverconstrainedError') {
          errorMsg = 'Try closing other apps using the camera';
        } else if (err?.name === 'PermissionDeniedError') {
          errorMsg = 'Camera permission blocked by OS settings';
        }
        
        setError(errorMsg);
      }
    };

    initCamera();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => {
          track.stop();
        });
        videoRef.current.srcObject = null;
      }
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, []);

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await api.getSettings();
        const threshold = settings?.confidence_threshold ?? 85;
        setConfidenceThreshold(Number(threshold));
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    };
    loadSettings();
  }, []);

  // Start/Stop scanning
  useEffect(() => {
    if (!isScanning || !hasPermission || !videoRef.current) {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      return;
    }

    const performDetection = async () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;

      try {
        setLoading(true);
        const canvas = canvasRef.current || document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const base64 = dataUrl.split(',')[1];

        // Send to backend
        const response = await api.detectWebcam(base64);
        const res = response?.result || response;
        
        if (res) {
          const conf = Number(res.confidence ?? 0);
          const vio = !!res.violence;
          const label = res.label || 'violence';
          // Force bbox to null if violence was rejected by ViT to prevent ghost boxes
          const bbox = vio ? (res.bbox || null) : null;
          
          setDetection({ 
            violence: vio, 
            confidence: conf, 
            bbox, 
            label 
          });
          setError(null);

          // Trigger alert if high confidence
          if (vio && conf >= (confidenceThreshold / 100)) {
            const now = Date.now();
            if (now - lastAlertAt.current > 30000) {
              lastAlertAt.current = now;
              try {
                await api.postAlert({
                  timestamp: new Date().toISOString(),
                  camera: 'Webcam',
                  confidence: conf,
                  label: label || 'violence',
                  image_base64: base64,
                  rtsp_url: null,
                });
                addAlert({
                  timestamp: new Date().toISOString(),
                  camera: 'Webcam',
                  confidence: Math.round(conf * 100),
                  type: 'violence',
                  thumbnail: '',
                  location: 'Local Device',
                  status: 'new',
                });
                toast({
                  title: '🚨 ALERT CREATED',
                  description: `Violence detected with ${Math.round(conf * 100)}% confidence`,
                });
              } catch (e) {
                console.error('Failed to create alert:', e);
              }
            }
          }
        }
      } catch (err: any) {
        console.error('Detection error:', err);
        setError(err?.message || 'Detection failed');
      } finally {
        setLoading(false);
      }
    };

    // Run detection every 1 second
    scanIntervalRef.current = setInterval(performDetection, 1000);

    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    };
  }, [isScanning, hasPermission, confidenceThreshold, addAlert, toast]);

  const handleToggleScanning = () => {
    setIsScanning(!isScanning);
    toast({
      description: isScanning ? '⏸️ Scanning paused' : '▶️ Scanning resumed',
    });
  };

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
          <Camera className="w-5 h-5 text-primary" />
          <h2 className="font-display text-xl font-semibold text-foreground uppercase tracking-wider">
            Webcam Detection
          </h2>
        </div>
        
        <div className={`
          flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-display font-semibold uppercase tracking-wider
          ${hasPermission 
            ? 'bg-green-500/20 text-green-500 border border-green-500/30' 
            : 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30'
          }
        `}>
          <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
          {hasPermission ? 'Live Mode' : 'Simulated'}
        </div>
      </div>

      {/* Camera Feed */}
      <div ref={containerRef} className="relative aspect-video rounded-xl overflow-hidden border border-white/10 bg-slate-900">
        {hasPermission === true ? (
          /* Real Camera Feed */
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Hidden canvas for frame capture */}
            <canvas
              ref={canvasRef}
              className="hidden"
            />
          </>
        ) : hasPermission === false ? (
          /* Camera Permission Denied */
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-black flex items-center justify-center">
            <div className="text-center space-y-4">
              <AlertTriangle className="w-16 h-16 mx-auto text-yellow-500" />
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">Camera Access Required</p>
                <p className="text-xs text-muted-foreground max-w-xs">{error || 'Please allow camera access in your browser settings'}</p>
                
                {/* Troubleshooting tips */}
                <div className="mt-4 text-left bg-black/40 p-3 rounded text-xs text-muted-foreground space-y-1">
                  <p className="font-semibold text-foreground">Troubleshooting:</p>
                  <p>• Close Teams, Zoom, or Camera app</p>
                  <p>• Check Windows Settings → Privacy → Camera</p>
                  <p>• Refresh this page (F5)</p>
                  <p>• Try a different browser</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Loading */
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-black flex items-center justify-center">
            <div className="text-center space-y-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full mx-auto"
              />
              <p className="text-xs text-muted-foreground">Initializing camera...</p>
            </div>
          </div>
        )}

        {/* HUD Overlay & Detection Boxes */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Scanning beam */}
          {isScanning && hasPermission && (
            <motion.div
              className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-60"
              animate={{ top: ['0%', '100%', '0%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            />
          )}

          {/* Detection box - REMOVED BY USER REQUEST */}
          {/*
          {detection?.violence && detection?.bbox && (
            ...
          )}
          */}

          {/* Status indicators */}
          <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm border border-primary/30">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-display font-semibold text-primary">
              {isScanning ? 'SCANNING' : 'STANDBY'}
            </span>
          </div>

          {/* FPS/Loading */}
          {loading && (
            <div className="absolute top-4 right-4 px-3 py-1 rounded bg-black/50 text-xs text-primary font-mono">
              Processing...
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="glass p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="font-display font-semibold text-foreground text-sm uppercase tracking-wider">
              Detection Status
            </h4>
            <p className="text-xs text-muted-foreground">
              {hasPermission === false 
                ? 'Camera permission denied - enable in browser settings' 
                : hasPermission === true
                ? isScanning ? 'Actively monitoring for violent behavior' : 'Detection paused'
                : 'Initializing camera...'}
            </p>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleScanning}
            disabled={hasPermission !== true}
            className={`
              font-display uppercase tracking-wider text-xs
              ${isScanning 
                ? 'border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10' 
                : 'border-primary/50 text-primary hover:bg-primary/10'
              }
            `}
          >
            {isScanning ? 'Pause Scan' : 'Resume Scan'}
          </Button>
        </div>

        {/* Real-time Stats */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="glass p-2 rounded text-center">
            <p className="text-muted-foreground text-[10px]">Status</p>
            <p className="font-display font-bold text-primary">
              {hasPermission ? '✓ LIVE' : '✗ OFFLINE'}
            </p>
          </div>
          <div className="glass p-2 rounded text-center">
            <p className="text-muted-foreground text-[10px]">Confidence</p>
            <p className="font-display font-bold text-foreground">
              {detection ? Math.round((detection.confidence ?? 0) * 100) : '—'}%
            </p>
          </div>
          <div className="glass p-2 rounded text-center">
            <p className="text-muted-foreground text-[10px]">Threshold</p>
            <p className="font-display font-bold text-primary">{confidenceThreshold}%</p>
          </div>
        </div>

        {/* Debug Info */}
        <div className="text-[10px] text-muted-foreground font-mono p-2 bg-black/20 rounded">
          <p>Permission: {hasPermission === true ? '✓ Granted' : hasPermission === false ? '✗ Denied' : '⏳ Loading'}</p>
          <p>Stream: {videoRef.current?.srcObject ? '✓ Active' : '✗ Inactive'}</p>
          <p>Scanning: {isScanning ? '✓ On' : '✗ Off'}</p>
        </div>

        {/* Info */}
        <p className="text-xs text-center text-muted-foreground">
          Press to capture current frame as evidence. Alert will be added to your log.
        </p>
      </div>
    </motion.div>
  );
};

export default Webcam;
