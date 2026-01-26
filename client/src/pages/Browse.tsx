import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, Eye, Heart } from "lucide-react";
import { Link } from "wouter";

export default function Browse() {
  const { data: videos, isLoading } = trpc.video.list.useQuery({ limit: 20, offset: 0 });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <h1 className="text-3xl font-bold mb-8">
          <span className="femsider-text-gradient">Procházet</span> videa
        </h1>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <VideoCardSkeleton key={i} />
            ))}
          </div>
        ) : videos && videos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">Zatím zde nejsou žádná videa.</p>
            <p className="text-muted-foreground text-sm mt-2">Buď první, kdo nahraje obsah!</p>
          </div>
        )}
      </main>
    </div>
  );
}

interface VideoCardProps {
  video: {
    id: number;
    title: string;
    thumbnailUrl: string | null;
    duration: number | null;
    viewCount: number | null;
    likeCount: number | null;
    isPremium: boolean | null;
    creatorId: number;
  };
}

function VideoCard({ video }: VideoCardProps) {
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Link href={`/video/${video.id}`}>
      <Card className="femsider-card overflow-hidden cursor-pointer group transition-all hover:femsider-glow">
        <div className="relative aspect-video bg-secondary">
          {video.thumbnailUrl ? (
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Play className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          
          {/* Duration badge */}
          <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs font-medium">
            {formatDuration(video.duration)}
          </div>
          
          {/* Premium badge */}
          {video.isPremium && (
            <div className="absolute top-2 left-2 femsider-gradient px-2 py-1 rounded text-xs font-medium">
              PREMIUM
            </div>
          )}
          
          {/* Play overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-primary/80 flex items-center justify-center">
              <Play className="h-8 w-8 text-white fill-white" />
            </div>
          </div>
        </div>
        
        <CardContent className="p-4">
          <h3 className="font-medium line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {video.title}
          </h3>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {video.viewCount || 0}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              {video.likeCount || 0}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function VideoCardSkeleton() {
  return (
    <Card className="femsider-card overflow-hidden">
      <Skeleton className="aspect-video" />
      <CardContent className="p-4">
        <Skeleton className="h-5 w-full mb-2" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
    </Card>
  );
}
