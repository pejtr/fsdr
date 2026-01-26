import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Eye, Lock, Flag, Share2 } from "lucide-react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";

export default function VideoPage() {
  const { id } = useParams<{ id: string }>();
  const videoId = parseInt(id || '0');
  const { user, isAuthenticated } = useAuth();
  
  const { data: video, isLoading, refetch } = trpc.video.get.useQuery(
    { videoId },
    { enabled: videoId > 0 }
  );
  
  const { data: creator } = trpc.user.getProfile.useQuery(
    { userId: video?.creatorId || 0 },
    { enabled: !!video?.creatorId }
  );
  
  const likeMutation = trpc.video.like.useMutation({
    onSuccess: () => refetch(),
  });
  
  const flagMutation = trpc.video.flag.useMutation({
    onSuccess: () => toast.success('Video bylo nahlášeno'),
  });

  const handleLike = () => {
    if (!isAuthenticated) {
      toast.error('Pro lajkování se musíte přihlásit');
      return;
    }
    likeMutation.mutate({ videoId });
  };

  const handleFlag = () => {
    if (!isAuthenticated) {
      toast.error('Pro nahlášení se musíte přihlásit');
      return;
    }
    flagMutation.mutate({ videoId, reason: 'other', description: 'Nahlášeno uživatelem' });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Odkaz zkopírován do schránky');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <Skeleton className="aspect-video w-full max-w-4xl mx-auto mb-6" />
          <Skeleton className="h-8 w-2/3 mb-4" />
          <Skeleton className="h-4 w-1/3" />
        </main>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Video nenalezeno</h1>
          <Link href="/browse">
            <Button>Zpět na procházení</Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <div className="max-w-5xl mx-auto">
          {/* Video Player */}
          <div className="aspect-video bg-black rounded-lg overflow-hidden mb-6 relative">
            {video.canView ? (
              <video
                src={video.videoUrl}
                controls
                className="w-full h-full"
                poster={video.thumbnailUrl || undefined}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-secondary/50">
                <Lock className="h-16 w-16 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Prémiový obsah</h3>
                <p className="text-muted-foreground mb-4">
                  Pro přístup k tomuto videu potřebujete předplatné
                </p>
                <Link href={`/creator/${video.creatorId}`}>
                  <Button className="femsider-gradient text-white border-0">
                    Odebírat tvůrce
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Video Info */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">{video.title}</h1>
            <div className="flex items-center gap-4 text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {video.viewCount || 0} zhlédnutí
              </span>
              <span className="flex items-center gap-1">
                <Heart className={`h-4 w-4 ${video.hasLiked ? 'fill-primary text-primary' : ''}`} />
                {video.likeCount || 0}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mb-6">
            <Button
              variant={video.hasLiked ? "default" : "outline"}
              onClick={handleLike}
              disabled={likeMutation.isPending}
              className={video.hasLiked ? 'femsider-gradient text-white border-0' : ''}
            >
              <Heart className={`h-4 w-4 mr-2 ${video.hasLiked ? 'fill-white' : ''}`} />
              {video.hasLiked ? 'Líbí se mi' : 'To se mi líbí'}
            </Button>
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Sdílet
            </Button>
            <Button variant="outline" onClick={handleFlag}>
              <Flag className="h-4 w-4 mr-2" />
              Nahlásit
            </Button>
          </div>

          {/* Creator Card */}
          {creator && (
            <Card className="femsider-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Link href={`/creator/${creator.id}`}>
                    <Avatar className="h-16 w-16 border-2 border-primary/50 cursor-pointer">
                      <AvatarImage src={creator.avatarUrl || undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary text-xl">
                        {creator.name?.charAt(0)?.toUpperCase() || 'C'}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1">
                    <Link href={`/creator/${creator.id}`}>
                      <h3 className="font-semibold text-lg hover:text-primary transition-colors cursor-pointer">
                        {creator.name || 'Tvůrce'}
                      </h3>
                    </Link>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {creator.bio || 'Žádný popis'}
                    </p>
                  </div>
                  <Link href={`/creator/${creator.id}`}>
                    <Button className="femsider-gradient text-white border-0">
                      Profil tvůrce
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Description */}
          {video.description && (
            <Card className="femsider-card mt-6">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">Popis</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {video.description}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
