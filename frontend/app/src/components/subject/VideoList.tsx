import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Youtube,
  HardDrive,
  Eye,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import type { VideoItem } from '@/types';
import { getSignedViewUrl } from '@/lib/supabaseData';

interface VideoListProps {
  videos: VideoItem[];
  isLoggedIn: boolean;
}

export function VideoList({ videos, isLoggedIn }: VideoListProps) {
  const [playingVideo, setPlayingVideo] = useState<VideoItem | null>(null);
  const [playingVideoUrl, setPlayingVideoUrl] = useState<string | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);

  const handlePlayVideo = async (video: VideoItem) => {
    setPlayingVideo(video);
    if (video.videoType === 'youtube') {
      setPlayingVideoUrl(null);
    } else if (video.storagePath) {
      setIsVideoLoading(true);
      const url = await getSignedViewUrl(video.storagePath);
      setPlayingVideoUrl(url);
      setIsVideoLoading(false);
    }
  };

  const getVideoIcon = (videoType: string) => {
    if (videoType === 'youtube') {
      return <Youtube className="w-5 h-5 text-red-500" />;
    }
    return <HardDrive className="w-5 h-5 text-sage" />;
  };

  if (videos.length === 0) {
    return (
      <div className="text-center py-12 border-4 border-black border-dashed rounded-xl bg-white shadow-neo-sm mt-4">
        <div className="w-16 h-16 rounded-md border-2 border-black bg-sand flex items-center justify-center mx-auto mb-4 shadow-neo-sm">
          <span className="text-3xl">🎬</span>
        </div>
        <p className="text-black font-bold uppercase tracking-wider">Video lectures coming soon for this subject!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Video List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {videos.map((video, index) => (
          <motion.div
            key={video.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-md border-2 border-black overflow-hidden shadow-neo-sm hover:shadow-neo hover:-translate-y-1 transition-all flex flex-col"
          >
            {/* Thumbnail */}
            <div className="relative aspect-video bg-secondary border-b-2 border-black">
              {video.thumbnailUrl ? (
                <img 
                  src={video.thumbnailUrl} 
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-secondary">
                  <Play className="w-12 h-12 text-muted-foreground/40" />
                </div>
              )}
              
              {/* Duration Badge */}
              <div className="absolute bottom-2 right-2 px-2 py-1 bg-white border-2 border-black rounded text-xs text-black font-black shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                {video.duration}
              </div>

              {/* Play Overlay */}
              {isLoggedIn && (
                <div 
                  className="absolute inset-0 bg-primary/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={() => handlePlayVideo(video)}
                >
                  <div className="w-14 h-14 rounded-full bg-white border-4 border-black flex items-center justify-center shadow-neo">
                    <Play className="w-6 h-6 text-black ml-1 font-black" />
                  </div>
                </div>
              )}
            </div>

            {/* Video Info */}
            <div className="p-4 flex flex-col flex-1">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded border-2 border-black bg-sand flex items-center justify-center shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                  {getVideoIcon(video.videoType)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="text-black font-black text-sm line-clamp-2">
                    {video.title}
                  </h4>
                  
                  <div className="flex items-center gap-3 mt-2">
                    <Badge 
                      variant="secondary" 
                      className={`text-xs border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] ${
                        video.videoType === 'youtube' 
                          ? 'bg-white text-rose font-black' 
                          : 'bg-white text-sage font-black'
                      }`}
                    >
                      {video.videoType === 'youtube' ? 'YOUTUBE' : 'HOSTED'}
                    </Badge>
                    
                    <span className="flex items-center gap-1 text-xs text-black font-bold">
                      <Eye className="w-3 h-3" />
                      {video.views} VIEWS
                    </span>
                  </div>
                </div>
              </div>

              {/* Watch Button */}
              <div className="mt-auto pt-4">
                {isLoggedIn ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePlayVideo(video)}
                    className="w-full border-2 border-black text-black hover:text-black hover:bg-sand font-black uppercase shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:shadow-neo"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    WATCH NOW
                  </Button>
                ) : (
                  <Badge 
                    variant="secondary" 
                    className="w-full justify-center bg-white text-black py-1.5 border-2 border-black font-black uppercase shadow-[2px_2px_0px_rgba(0,0,0,1)]"
                  >
                    <span className="mr-1">🔒</span> LOGIN TO WATCH
                  </Badge>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {playingVideo && (
          <motion.div
            ref={playerRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onAnimationComplete={() => {
              if (playingVideo && playerRef.current) {
                const yOffset = -100; // 100px top offset to preserve top navbar & comfortable margin
                const elementTop = playerRef.current.getBoundingClientRect().top + window.pageYOffset;
                window.scrollTo({ top: Math.max(0, elementTop + yOffset), behavior: 'smooth' });
              }
            }}
            className="bg-white rounded-md border-4 border-black overflow-hidden shadow-neo-lg"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 bg-white border-b-4 border-black">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-black text-sm font-black uppercase tracking-wider">WATCHING:</span>
                <span className="text-black text-sm font-bold truncate">{playingVideo.title}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPlayingVideo(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-black font-black uppercase border-2 border-transparent hover:border-black hover:bg-rose/20"
              >
                <X className="w-4 h-4 mr-1" />
                CLOSE
              </Button>
            </div>

            {/* Video Player */}
            <div className="aspect-video bg-black relative flex items-center justify-center">
              {playingVideo.videoType === 'youtube' ? (
                <iframe
                  src={playingVideo.youtubeUrl?.replace('watch?v=', 'embed/')}
                  title={playingVideo.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : isVideoLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-white">
                  <Loader2 className="w-8 h-8 animate-spin mb-4" />
                  <p className="text-sm font-black uppercase tracking-widest animate-pulse">
                    Generating secure link...
                  </p>
                </div>
              ) : playingVideoUrl ? (
                <video
                  src={playingVideoUrl}
                  controls
                  className="w-full h-full"
                  poster={playingVideo.thumbnailUrl}
                  autoPlay
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-white">
                  <p className="text-sm font-black uppercase tracking-wider text-rose-400">
                    Failed to load video.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
