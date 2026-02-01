import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Volume2, VolumeX, Maximize, MessageSquare, Smile } from "lucide-react";
import ReactionPicker from "@/components/ReactionPicker";
import { cn } from "@/lib/utils";

interface InteractiveVideoPlayerProps {
  videoId: number;
  videoUrl: string;
  duration?: number;
  onTimeUpdate?: (currentTime: number) => void;
}

interface TimelineMarker {
  timestamp: number;
  type: 'comment' | 'reaction';
  count: number;
  data?: any;
}

const REACTION_EMOJIS = {
  love: '❤️',
  laugh: '😂',
  wow: '😮',
  sad: '😢',
  fire: '🔥',
  clap: '👏',
  thinking: '🤔',
  heart_eyes: '😍',
};

export default function InteractiveVideoPlayer({ 
  videoId, 
  videoUrl, 
  duration = 0,
  onTimeUpdate 
}: InteractiveVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [hoveredTime, setHoveredTime] = useState<number | null>(null);
  const [timelineMarkers, setTimelineMarkers] = useState<TimelineMarker[]>([]);

  // Fetch timestamped comments
  const { data: timestampedComments = [] } = trpc.feed.getTimestampedComments.useQuery({ videoId });
  
  // Fetch reaction heatmap
  const { data: reactionHeatmap = [] } = trpc.videoReactions.getReactionHeatmap.useQuery({ videoId });

  // Build timeline markers
  useEffect(() => {
    const markers: TimelineMarker[] = [];

    // Add comment markers
    const commentGroups = new Map<number, number>();
    timestampedComments.forEach((comment: any) => {
      const roundedTime = Math.floor(comment.timestamp);
      commentGroups.set(roundedTime, (commentGroups.get(roundedTime) || 0) + 1);
    });
    commentGroups.forEach((count, timestamp) => {
      markers.push({ timestamp, type: 'comment', count });
    });

    // Add reaction markers
    reactionHeatmap.forEach((item: any) => {
      markers.push({ 
        timestamp: item.timestamp, 
        type: 'reaction', 
        count: item.count,
        data: { reactionType: item.reactionType }
      });
    });

    setTimelineMarkers(markers);
  }, [timestampedComments, reactionHeatmap]);

  // Video controls
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time);
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.volume = value[0];
      setVolume(value[0]);
      setIsMuted(value[0] === 0);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getMarkerPosition = (timestamp: number) => {
    const videoDuration = videoRef.current?.duration || duration || 1;
    return (timestamp / videoDuration) * 100;
  };

  // Hover preview comments
  const getCommentsAtTime = (time: number) => {
    return timestampedComments.filter((c: any) => 
      Math.abs(c.timestamp - time) < 2 // 2 second window
    );
  };

  return (
    <div 
      className="relative w-full bg-black rounded-lg overflow-hidden group"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full aspect-video"
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onClick={togglePlay}
      />

      {/* Controls Overlay */}
      <div 
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0"
        )}
      >
        {/* Timeline with markers */}
        <div className="relative mb-4">
          {/* Hover preview */}
          {hoveredTime !== null && (
            <div 
              className="absolute bottom-full mb-2 bg-black/90 text-white p-2 rounded text-xs whitespace-nowrap pointer-events-none z-10"
              style={{ left: `${getMarkerPosition(hoveredTime)}%`, transform: 'translateX(-50%)' }}
            >
              <div className="font-semibold mb-1">{formatTime(hoveredTime)}</div>
              {getCommentsAtTime(hoveredTime).slice(0, 3).map((comment: any, i: number) => (
                <div key={i} className="text-xs opacity-80 truncate max-w-[200px]">
                  {comment.content}
                </div>
              ))}
            </div>
          )}

          {/* Timeline markers */}
          <div className="absolute top-0 left-0 right-0 h-1 pointer-events-none">
            {timelineMarkers.map((marker, i) => (
              <div
                key={i}
                className={cn(
                  "absolute w-1 h-3 -top-1 rounded-full",
                  marker.type === 'comment' ? "bg-blue-400" : "bg-primary"
                )}
                style={{ left: `${getMarkerPosition(marker.timestamp)}%` }}
                title={`${marker.count} ${marker.type}${marker.count > 1 ? 's' : ''} at ${formatTime(marker.timestamp)}`}
              />
            ))}
          </div>

          {/* Seek bar */}
          <Slider
            value={[currentTime]}
            max={videoRef.current?.duration || duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            onPointerMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const percentage = x / rect.width;
              const time = percentage * (videoRef.current?.duration || duration || 100);
              setHoveredTime(time);
            }}
            onPointerLeave={() => setHoveredTime(null)}
            className="cursor-pointer"
          />
        </div>

        {/* Control buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={togglePlay}
            className="text-white hover:bg-white/20"
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="text-white hover:bg-white/20"
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Button>

          <Slider
            value={[volume]}
            max={1}
            step={0.1}
            onValueChange={handleVolumeChange}
            className="w-24"
          />

          <span className="text-white text-sm mx-2">
            {formatTime(currentTime)} / {formatTime(videoRef.current?.duration || duration || 0)}
          </span>

          <div className="flex-1" />

          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
          >
            <MessageSquare className="h-5 w-5" />
            <span className="ml-1 text-xs">{timestampedComments.length}</span>
          </Button>

          <ReactionPicker
            videoId={videoId}
            currentTime={currentTime}
            onReactionAdded={() => {
              // Reaction added, heatmap will auto-refresh
            }}
          />

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="text-white hover:bg-white/20"
          >
            <Maximize className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
