import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Video, 
  DollarSign, 
  Users, 
  Eye, 
  Heart, 
  Upload, 
  Plus,
  TrendingUp,
  Link as LinkIcon
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";
import { getLoginUrl } from "@/const";

export default function CreatorDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  
  const { data: stats } = trpc.analytics.creatorStats.useQuery(undefined, {
    enabled: isAuthenticated && (user?.role === 'creator' || user?.role === 'admin'),
  });
  
  const { data: videos, refetch: refetchVideos } = trpc.video.myVideos.useQuery(
    { limit: 50, offset: 0 },
    { enabled: isAuthenticated && (user?.role === 'creator' || user?.role === 'admin') }
  );
  
  const { data: subscribers } = trpc.subscription.mySubscribers.useQuery(undefined, {
    enabled: isAuthenticated && (user?.role === 'creator' || user?.role === 'admin'),
  });
  
  const { data: affiliateStats } = trpc.affiliate.getStats.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  
  const becomeCreatorMutation = trpc.user.becomeCreator.useMutation({
    onSuccess: () => {
      toast.success('Nyní jste tvůrce! Můžete začít nahrávat videa.');
      window.location.reload();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Přihlaste se</h1>
          <p className="text-muted-foreground mb-4">Pro přístup k dashboardu se musíte přihlásit.</p>
          <a href={getLoginUrl()}>
            <Button className="femsider-gradient text-white border-0">Přihlásit se</Button>
          </a>
        </main>
      </div>
    );
  }

  // Show become creator prompt if not a creator
  if (user?.role !== 'creator' && user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4">Staň se tvůrcem</h1>
            <p className="text-muted-foreground mb-8">
              Začni vydělávat sdílením svého obsahu s fanoušky. 
              Získej 88% z každého předplatného!
            </p>
            
            {!user?.isAgeVerified ? (
              <div className="femsider-card p-6 mb-6">
                <p className="text-muted-foreground mb-4">
                  Pro vytvoření účtu tvůrce musíte nejprve ověřit svůj věk.
                </p>
                <Link href="/verify-age">
                  <Button className="femsider-gradient text-white border-0">
                    Ověřit věk
                  </Button>
                </Link>
              </div>
            ) : (
              <Button 
                onClick={() => becomeCreatorMutation.mutate()}
                disabled={becomeCreatorMutation.isPending}
                className="femsider-gradient text-white border-0"
                size="lg"
              >
                Stát se tvůrcem
              </Button>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">
            <span className="femsider-text-gradient">Dashboard</span> tvůrce
          </h1>
          <UploadVideoDialog onSuccess={refetchVideos} />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Celkové příjmy"
            value={`$${stats?.totalEarnings || '0'}`}
            icon={<DollarSign className="h-5 w-5" />}
            trend="+12%"
          />
          <StatCard
            title="Odběratelé"
            value={stats?.totalSubscribers?.toString() || '0'}
            icon={<Users className="h-5 w-5" />}
          />
          <StatCard
            title="Zhlédnutí"
            value={stats?.totalViews?.toString() || '0'}
            icon={<Eye className="h-5 w-5" />}
          />
          <StatCard
            title="Lajky"
            value={stats?.totalLikes?.toString() || '0'}
            icon={<Heart className="h-5 w-5" />}
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="videos" className="w-full">
          <TabsList className="w-full justify-start bg-card border border-border mb-6">
            <TabsTrigger value="videos">
              <Video className="h-4 w-4 mr-2" />
              Moje videa
            </TabsTrigger>
            <TabsTrigger value="subscribers">
              <Users className="h-4 w-4 mr-2" />
              Odběratelé
            </TabsTrigger>
            <TabsTrigger value="affiliate">
              <LinkIcon className="h-4 w-4 mr-2" />
              Affiliate
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="videos">
            {videos && videos.length > 0 ? (
              <div className="grid gap-4">
                {videos.map((video) => (
                  <VideoRow key={video.id} video={video} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 femsider-card">
                <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">Zatím nemáte žádná videa.</p>
                <UploadVideoDialog onSuccess={refetchVideos} />
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="subscribers">
            {subscribers && subscribers.length > 0 ? (
              <div className="grid gap-4">
                {subscribers.map((sub) => (
                  <Card key={sub.id} className="femsider-card">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">Odběratel #{sub.subscriberId}</p>
                        <p className="text-sm text-muted-foreground">
                          Od: {new Date(sub.startDate).toLocaleDateString('cs-CZ')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-primary">${sub.priceAtPurchase}/měsíc</p>
                        <p className="text-sm text-muted-foreground capitalize">{sub.status}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 femsider-card">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Zatím nemáte žádné odběratele.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="affiliate">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="femsider-card">
                <CardHeader>
                  <CardTitle>Váš affiliate odkaz</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input 
                      readOnly 
                      value={`${window.location.origin}?ref=${affiliateStats?.affiliateCode || ''}`}
                    />
                    <Button 
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `${window.location.origin}?ref=${affiliateStats?.affiliateCode || ''}`
                        );
                        toast.success('Odkaz zkopírován!');
                      }}
                    >
                      Kopírovat
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Získejte 25% provizi z každého předplatného přivedeného uživatele!
                  </p>
                </CardContent>
              </Card>
              
              <Card className="femsider-card">
                <CardHeader>
                  <CardTitle>Affiliate statistiky</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Celkové příjmy</span>
                      <span className="font-medium text-primary">${affiliateStats?.totalEarnings || '0'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Počet referralů</span>
                      <span className="font-medium">{affiliateStats?.referralCount || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon, trend }: { 
  title: string; 
  value: string; 
  icon: React.ReactNode;
  trend?: string;
}) {
  return (
    <Card className="femsider-card">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-muted-foreground text-sm">{title}</span>
          <span className="text-primary">{icon}</span>
        </div>
        <div className="flex items-end gap-2">
          <span className="text-2xl font-bold">{value}</span>
          {trend && (
            <span className="text-green-500 text-sm flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              {trend}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function VideoRow({ video }: { video: any }) {
  return (
    <Card className="femsider-card">
      <CardContent className="p-4 flex items-center gap-4">
        <div className="w-32 h-20 bg-secondary rounded overflow-hidden flex-shrink-0">
          {video.thumbnailUrl ? (
            <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Video className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">{video.title}</h3>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {video.viewCount || 0}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              {video.likeCount || 0}
            </span>
            <span className={`px-2 py-0.5 rounded text-xs ${
              video.status === 'approved' ? 'bg-green-500/20 text-green-500' :
              video.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
              'bg-red-500/20 text-red-500'
            }`}>
              {video.status === 'approved' ? 'Schváleno' : 
               video.status === 'pending' ? 'Čeká na schválení' : 'Zamítnuto'}
            </span>
          </div>
        </div>
        <Link href={`/video/${video.id}`}>
          <Button variant="outline" size="sm">Zobrazit</Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function UploadVideoDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [isPremium, setIsPremium] = useState(true);
  
  const createMutation = trpc.video.create.useMutation({
    onSuccess: () => {
      toast.success('Video bylo úspěšně nahráno!');
      setOpen(false);
      setTitle('');
      setDescription('');
      setVideoUrl('');
      setThumbnailUrl('');
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !videoUrl) {
      toast.error('Vyplňte název a URL videa');
      return;
    }
    createMutation.mutate({
      title,
      description,
      videoUrl,
      thumbnailUrl: thumbnailUrl || undefined,
      isPremium,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="femsider-gradient text-white border-0">
          <Plus className="h-4 w-4 mr-2" />
          Nahrát video
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle>Nahrát nové video</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Název videa</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Zadejte název videa"
              className="bg-input"
            />
          </div>
          <div>
            <Label htmlFor="description">Popis</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Popis videa (volitelné)"
              className="bg-input"
            />
          </div>
          <div>
            <Label htmlFor="videoUrl">URL videa</Label>
            <Input
              id="videoUrl"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://..."
              className="bg-input"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Zadejte URL hostovaného videa (např. z S3, Bunny CDN)
            </p>
          </div>
          <div>
            <Label htmlFor="thumbnailUrl">URL náhledu (volitelné)</Label>
            <Input
              id="thumbnailUrl"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="https://..."
              className="bg-input"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="premium">Prémiový obsah</Label>
              <p className="text-xs text-muted-foreground">
                Pouze pro platící odběratele
              </p>
            </div>
            <Switch
              id="premium"
              checked={isPremium}
              onCheckedChange={setIsPremium}
            />
          </div>
          <Button 
            type="submit" 
            className="w-full femsider-gradient text-white border-0"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Nahrávám...' : 'Nahrát video'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
