import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Eye, Heart, Users, DollarSign, Check } from "lucide-react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";

export default function CreatorProfile() {
  const { id } = useParams<{ id: string }>();
  const creatorId = parseInt(id || '0');
  const { user, isAuthenticated } = useAuth();
  
  const { data: creator, isLoading } = trpc.user.getProfile.useQuery(
    { userId: creatorId },
    { enabled: creatorId > 0 }
  );
  
  const { data: videos } = trpc.video.listByCreator.useQuery(
    { creatorId, limit: 20, offset: 0 },
    { enabled: creatorId > 0 }
  );
  
  const { data: accessData } = trpc.subscription.checkAccess.useQuery(
    { creatorId },
    { enabled: isAuthenticated && creatorId > 0 }
  );
  
  const subscribeMutation = trpc.subscription.subscribe.useMutation({
    onSuccess: () => {
      toast.success('Úspěšně jste se přihlásili k odběru!');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubscribe = () => {
    if (!isAuthenticated) {
      toast.error('Pro odběr se musíte přihlásit');
      return;
    }
    if (!user?.isAgeVerified) {
      toast.error('Pro odběr musíte mít ověřený věk');
      return;
    }
    subscribeMutation.mutate({ creatorId });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-48 w-full rounded-lg mb-6" />
            <Skeleton className="h-8 w-1/3 mb-4" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </main>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Tvůrce nenalezen</h1>
          <Link href="/browse">
            <Button>Zpět na procházení</Button>
          </Link>
        </main>
      </div>
    );
  }

  const isOwnProfile = user?.id === creatorId;
  const hasAccess = accessData?.hasAccess || isOwnProfile;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <div className="max-w-5xl mx-auto">
          {/* Profile Header */}
          <Card className="symbiote-card overflow-hidden mb-8">
            {/* Banner */}
            <div className="h-32 md:h-48 symbiote-gradient" />
            
            <CardContent className="relative pt-0 pb-6 px-6">
              {/* Avatar */}
              <Avatar className="absolute -top-16 left-6 h-32 w-32 border-4 border-card">
                <AvatarImage src={creator.avatarUrl || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary text-4xl">
                  {creator.name?.charAt(0)?.toUpperCase() || 'C'}
                </AvatarFallback>
              </Avatar>
              
              {/* Actions */}
              <div className="flex justify-end pt-4 mb-12 md:mb-0">
                {!isOwnProfile && (
                  hasAccess ? (
                    <Button disabled className="bg-green-600 text-white">
                      <Check className="h-4 w-4 mr-2" />
                      Odebíráte
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleSubscribe}
                      disabled={subscribeMutation.isPending}
                      className="symbiote-gradient text-white border-0"
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      Odebírat za ${creator.subscriptionPrice}/měsíc
                    </Button>
                  )
                )}
              </div>
              
              {/* Info */}
              <div className="mt-4 md:mt-0">
                <h1 className="text-2xl md:text-3xl font-bold mb-2">
                  {creator.name || 'Tvůrce'}
                </h1>
                {creator.bio && (
                  <p className="text-muted-foreground max-w-2xl">
                    {creator.bio}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Content Tabs */}
          <Tabs defaultValue="videos" className="w-full">
            <TabsList className="w-full justify-start bg-card border border-border mb-6">
              <TabsTrigger value="videos" className="flex-1 md:flex-none">
                <Play className="h-4 w-4 mr-2" />
                Videa ({videos?.length || 0})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="videos">
              {videos && videos.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {videos.map((video) => (
                    <VideoCard key={video.id} video={video} hasAccess={hasAccess} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Tento tvůrce zatím nemá žádná videa.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
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
  };
  hasAccess: boolean;
}

function VideoCard({ video, hasAccess }: VideoCardProps) {
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const canView = !video.isPremium || hasAccess;

  return (
    <Link href={`/video/${video.id}`}>
      <Card className="symbiote-card overflow-hidden cursor-pointer group transition-all hover:symbiote-glow">
        <div className="relative aspect-video bg-secondary">
          {video.thumbnailUrl ? (
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className={`w-full h-full object-cover ${!canView ? 'blur-sm' : ''}`}
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
            <div className="absolute top-2 left-2 symbiote-gradient px-2 py-1 rounded text-xs font-medium">
              PREMIUM
            </div>
          )}
          
          {/* Lock overlay for premium content */}
          {!canView && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="text-center">
                <DollarSign className="h-8 w-8 mx-auto mb-2 text-primary" />
                <span className="text-sm">Pouze pro odběratele</span>
              </div>
            </div>
          )}
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
