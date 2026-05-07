import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
  src: string;
  detections?: Array<{
    timestamp: number;
    confidence: number;
    bbox?: [number, number, number, number] | null;
  }>;
  onTimeUpdate?: (time: number) => void;
}

const VideoPlayer = ({ src, detections = [], onTimeUpdate }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showDetection, setShowDetection] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      onTimeUpdate?.(video.currentTime);
      drawDetectionOverlay();
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [onTimeUpdate, detections]);

  const drawDetectionOverlay = () => {
    if (!showDetection || !canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Find detection at current time (within 0.5 second)
    const currentDetection = detections.find(
      (d) => Math.abs(d.timestamp - video.currentTime) < 0.5
    );

    if (!currentDetection?.bbox) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const [x1, y1, x2, y2] = currentDetection.bbox;
    const scaleX = canvas.width / video.videoWidth;
    const scaleY = canvas.height / video.videoHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 3;
    ctx.strokeRect(x1 * scaleX, y1 * scaleY, (x2 - x1) * scaleX, (y2 - y1) * scaleY);

    // Draw label
    ctx.fillStyle = '#ff0000';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(
      `Violence: ${Math.round(currentDetection.confidence * 100)}%`,
      x1 * scaleX,
      Math.max(y1 * scaleY - 10, 20)
    );
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      isPlaying ? videoRef.current.pause() : videoRef.current.play();
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4 glass p-4 rounded-lg border border-border"
    >
      {/* Video Container */}
      <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
        <video
          ref={videoRef}
          src={src}
          className="w-full h-full object-contain"
          crossOrigin="anonymous"
        />
        {showDetection && (
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            width={640}
            height={360}
          />
        )}
      </div>

      {/* Detection Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowDetection(!showDetection)}
          className={cn(
            "px-3 py-1 rounded text-sm font-medium transition-colors",
            showDetection
              ? "bg-destructive/20 text-destructive"
              : "bg-muted text-muted-foreground"
          )}
        >
          {showDetection ? "Detection ON" : "Detection OFF"}
        </button>
      </div>

      {/* Playback Controls */}
      <div className="space-y-3">
        {/* Progress Bar */}
        <Slider
          value={[currentTime]}
          onValueChange={([val]) => {
            if (videoRef.current) {
              videoRef.current.currentTime = val;
            }
          }}
          max={duration || 100}
          step={0.1}
          className="w-full"
        />

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-4">
          <Button
            onClick={togglePlayPause}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4" /> Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4" /> Play
              </>
            )}
          </Button>

          {/* Volume Control */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <Slider
              value={[isMuted ? 0 : volume]}
              onValueChange={([val]) => {
                setVolume(val);
                setIsMuted(false);
                if (videoRef.current) {
                  videoRef.current.volume = val;
                }
              }}
              max={1}
              step={0.01}
              className="w-24"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default VideoPlayer;
