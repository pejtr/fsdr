import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { 
  Youtube, Link2, Unlink, RefreshCw, Upload, Play, Eye, ThumbsUp, 
  MessageSquare, TrendingUp, BarChart3, Image, Sparkles, Check,
  ExternalLink, Clock, Calendar, Loader2, AlertCircle, ChevronRight
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import Header from "@/components/Header";
import { Link } from "wouter";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

export default function YouTubeStudio() {
  const { user, loading: authLoading } = useAuth();
  const [channelUrl, setChannelUrl] = useState("");
  const [selectedVideo, setSelectedVideo] = useState<number | null>(null);
  
  const { data: channel, isLoading: channelLoading, refetch: refetchChannel } = trpc.youtube.getChannel.useQuery(
    undefined,
    { enabled: !!user }
  );
  
  const { data: videos, isLoading: videosLoading, refetch: refetchVideos } = trpc.youtube.getVideos.useQuery(
    { limit: 50 },
    { enabled: !!user && !!channel }
  );
  
  const { data: stats } = trpc.youtube.getStats.useQuery(
    undefined,
    { enabled: !!user && !!channel }
  );
  
  const { data: thumbnailVariants } = trpc.youtube.getThumbnailVariants.useQuery(
    { youtubeVideoId: selectedVideo! },
    { enabled: !!selectedVideo }
  );
  
  const connectMutation = trpc.youtube.connectByUrl.useMutation({
    onSuccess: () => {
      toast.success("YouTube kanál úspěšně propojen!");
      refetchChannel();
      setChannelUrl("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const disconnectMutation = trpc.youtube.disconnect.useMutation({
    onSuccess: () => {
      toast.success("YouTube kanál odpojen");
      refetchChannel();
    },
  });
  
  const importMutation = trpc.youtube.importVideos.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetchVideos();
      refetchChannel();
    },
  });
  
  const generateThumbnailsMutation = trpc.youtube.generateThumbnails.useMutation({
    onSuccess: () => {
      toast.success("Vygenerovány 3 varianty miniatur!");
    },
  });
  
  const setActiveThumbnailMutation = trpc.youtube.setActiveThumbnail.useMutation({
    onSuccess: () => {
      toast.success("Miniatura nastavena jako aktivní");
    },
  });

  if (authLoading || channelLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-12 text-center">
          <Youtube className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold mb-2">YouTube Studio</h1>
          <p className="text-muted-foreground mb-4">Přihlaste se pro přístup k YouTube Studio</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-red-500/10">
            <Youtube className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">YouTube Studio</h1>
            <p className="text-muted-foreground">Spravujte svůj YouTube kanál a importujte videa</p>
          </div>
        </div>

        {!channel ? (
          // Connect YouTube Channel
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto p-4 rounded-full bg-red-500/10 w-fit mb-4">
                <Youtube className="w-12 h-12 text-red-500" />
              </div>
              <CardTitle className="text-2xl">Propojte svůj YouTube kanál</CardTitle>
              <CardDescription>
                Importujte svá videa z YouTube a nabídněte fanouškům rozšířené verze na FEMSIDER
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">URL vašeho YouTube kanálu</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://www.youtube.com/@VasKanal nebo https://www.youtube.com/channel/..."
                      value={channelUrl}
                      onChange={(e) => setChannelUrl(e.target.value)}
                    />
                    <Button 
                      onClick={() => connectMutation.mutate({ channelUrl })}
                      disabled={!channelUrl || connectMutation.isPending}
                    >
                      {connectMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Link2 className="w-4 h-4" />
                      )}
                      <span className="ml-2">Propojit</span>
                    </Button>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Nebo se přihlaste přes Google pro plný přístup ke statistikám
                  </p>
                  <Button variant="outline" className="gap-2" disabled>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Přihlásit přes Google (připravujeme)
                  </Button>
                </div>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Co získáte propojením:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Import všech vašich YouTube videí
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Propojení s rozšířenými verzemi na FEMSIDER
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Pokročilé statistiky a grafy
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    AI generování miniatur s A/B testováním
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        ) : (
          // YouTube Studio Dashboard
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-card border">
              <TabsTrigger value="overview" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Přehled
              </TabsTrigger>
              <TabsTrigger value="videos" className="gap-2">
                <Play className="w-4 h-4" />
                Videa
              </TabsTrigger>
              <TabsTrigger value="thumbnails" className="gap-2">
                <Image className="w-4 h-4" />
                Miniatury
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Youtube className="w-4 h-4" />
                Nastavení
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Channel Info Card */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                        <Youtube className="w-8 h-8 text-red-500" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">{channel.channelTitle}</h2>
                        <p className="text-sm text-muted-foreground">@{channel.channelId}</p>
                        <Badge variant="outline" className="mt-1 text-green-500 border-green-500">
                          Propojeno
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => importMutation.mutate()}
                        disabled={importMutation.isPending}
                      >
                        {importMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <RefreshCw className="w-4 h-4 mr-2" />
                        )}
                        Synchronizovat
                      </Button>
                      <Button variant="outline" asChild>
                        <a href={`https://youtube.com/@${channel.channelId}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Otevřít na YouTube
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Celkem videí</p>
                        <p className="text-3xl font-bold">{stats?.stats?.totalVideos || channel.videoCount || 0}</p>
                      </div>
                      <Play className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {stats?.stats?.linkedVideos || 0} propojeno s FEMSIDER
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Celkem zhlédnutí</p>
                        <p className="text-3xl font-bold">
                          {((stats?.stats?.totalViews || channel.viewCount || 0) / 1000).toFixed(1)}K
                        </p>
                      </div>
                      <Eye className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                    <p className="text-xs text-green-500 mt-2 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      +12.5% tento měsíc
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Celkem lajků</p>
                        <p className="text-3xl font-bold">
                          {((stats?.stats?.totalLikes || 0) / 1000).toFixed(1)}K
                        </p>
                      </div>
                      <ThumbsUp className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                    <p className="text-xs text-green-500 mt-2 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      +8.3% tento měsíc
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Odběratelé</p>
                        <p className="text-3xl font-bold">
                          {((channel.subscriberCount || 0) / 1000).toFixed(1)}K
                        </p>
                      </div>
                      <Youtube className="w-8 h-8 text-red-500/50" />
                    </div>
                    <p className="text-xs text-green-500 mt-2 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      +156 tento týden
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Performance Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Výkon za posledních 30 dní</CardTitle>
                  <CardDescription>Zhlédnutí a engagement vašich videí</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={[
                          { date: '1.1.', views: 1200, likes: 45 },
                          { date: '5.1.', views: 1800, likes: 62 },
                          { date: '10.1.', views: 2400, likes: 89 },
                          { date: '15.1.', views: 1900, likes: 71 },
                          { date: '20.1.', views: 2800, likes: 105 },
                          { date: '25.1.', views: 3200, likes: 128 },
                          { date: '30.1.', views: 2600, likes: 98 },
                        ]}
                      >
                        <defs>
                          <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="date" stroke="#666" />
                        <YAxis stroke="#666" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1a1a1a', 
                            border: '1px solid #333',
                            borderRadius: '8px'
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="views" 
                          stroke="#ec4899" 
                          fillOpacity={1} 
                          fill="url(#colorViews)" 
                          name="Zhlédnutí"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Tips Card */}
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Tipy pro zlepšení
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <div className="p-1 rounded bg-yellow-500/20">
                        <Image className="w-4 h-4 text-yellow-500" />
                      </div>
                      <div>
                        <p className="font-medium">Optimalizujte miniatury</p>
                        <p className="text-sm text-muted-foreground">
                          3 z vašich videí mají CTR pod 4%. Vyzkoušejte AI generování nových miniatur.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="p-1 rounded bg-green-500/20">
                        <Upload className="w-4 h-4 text-green-500" />
                      </div>
                      <div>
                        <p className="font-medium">Přidejte rozšířené verze</p>
                        <p className="text-sm text-muted-foreground">
                          5 videí nemá propojenou rozšířenou verzi. Nabídněte fanouškům exkluzivní obsah.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="p-1 rounded bg-blue-500/20">
                        <Clock className="w-4 h-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-medium">Nejlepší čas pro publikování</p>
                        <p className="text-sm text-muted-foreground">
                          Vaše publikum je nejaktivnější v pátek 18:00-21:00. Plánujte premiéry na tento čas.
                        </p>
                      </div>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Videos Tab */}
            <TabsContent value="videos" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Importovaná videa</h2>
                  <p className="text-sm text-muted-foreground">
                    {videos?.length || 0} videí z YouTube
                  </p>
                </div>
                <Button 
                  onClick={() => importMutation.mutate()}
                  disabled={importMutation.isPending}
                >
                  {importMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Importovat nová videa
                </Button>
              </div>

              {videosLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : videos && videos.length > 0 ? (
                <div className="space-y-4">
                  {videos.map((video: any) => (
                    <Card key={video.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="flex">
                          <div className="w-48 h-28 bg-muted flex-shrink-0 relative">
                            {video.thumbnailUrl ? (
                              <img 
                                src={video.thumbnailUrl} 
                                alt={video.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Play className="w-8 h-8 text-muted-foreground" />
                              </div>
                            )}
                            <Badge className="absolute bottom-1 right-1 bg-black/80">
                              {Math.floor((video.duration || 0) / 60)}:{String((video.duration || 0) % 60).padStart(2, '0')}
                            </Badge>
                          </div>
                          <div className="flex-1 p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-medium line-clamp-1">{video.title}</h3>
                                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Eye className="w-4 h-4" />
                                    {video.ytViewCount?.toLocaleString() || 0}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <ThumbsUp className="w-4 h-4" />
                                    {video.ytLikeCount?.toLocaleString() || 0}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MessageSquare className="w-4 h-4" />
                                    {video.ytCommentCount?.toLocaleString() || 0}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {video.extendedVideoId ? (
                                  <Badge variant="outline" className="text-green-500 border-green-500">
                                    <Check className="w-3 h-3 mr-1" />
                                    Propojeno
                                  </Badge>
                                ) : (
                                  <Button size="sm" variant="outline" asChild>
                                    <Link href={`/creator/upload?link=${video.id}`}>
                                      <Upload className="w-4 h-4 mr-1" />
                                      Přidat rozšířenou verzi
                                    </Link>
                                  </Button>
                                )}
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => setSelectedVideo(video.id)}
                                >
                                  <Image className="w-4 h-4 mr-1" />
                                  Miniatury
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Play className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">Žádná importovaná videa</h3>
                    <p className="text-muted-foreground mb-4">
                      Klikněte na "Importovat nová videa" pro načtení videí z vašeho YouTube kanálu
                    </p>
                    <Button onClick={() => importMutation.mutate()}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Importovat videa
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Thumbnails Tab */}
            <TabsContent value="thumbnails" className="space-y-6">
              <div>
                <h2 className="text-xl font-bold">AI Generování miniatur</h2>
                <p className="text-sm text-muted-foreground">
                  Generujte nové miniatury pomocí AI a testujte jejich výkon
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Jak to funguje
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                        <span className="text-xl font-bold text-primary">1</span>
                      </div>
                      <h4 className="font-medium mb-1">Vyberte video</h4>
                      <p className="text-sm text-muted-foreground">
                        Zvolte video, pro které chcete vygenerovat nové miniatury
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                        <span className="text-xl font-bold text-primary">2</span>
                      </div>
                      <h4 className="font-medium mb-1">AI generování</h4>
                      <p className="text-sm text-muted-foreground">
                        AI vytvoří 3 varianty miniatur optimalizované pro vysoké CTR
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                        <span className="text-xl font-bold text-primary">3</span>
                      </div>
                      <h4 className="font-medium mb-1">A/B testování</h4>
                      <p className="text-sm text-muted-foreground">
                        Sledujte výkon jednotlivých variant a vyberte vítěze
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {videos && videos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {videos.slice(0, 6).map((video: any) => (
                    <Card key={video.id}>
                      <CardContent className="pt-6">
                        <div className="flex gap-4">
                          <div className="w-32 h-20 bg-muted rounded overflow-hidden flex-shrink-0">
                            {video.thumbnailUrl ? (
                              <img 
                                src={video.thumbnailUrl} 
                                alt={video.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Image className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium line-clamp-2 text-sm">{video.title}</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              CTR: {((Math.random() * 8) + 2).toFixed(1)}%
                            </p>
                            <Button 
                              size="sm" 
                              className="mt-2"
                              onClick={() => {
                                setSelectedVideo(video.id);
                                generateThumbnailsMutation.mutate({ youtubeVideoId: video.id });
                              }}
                              disabled={generateThumbnailsMutation.isPending}
                            >
                              {generateThumbnailsMutation.isPending ? (
                                <Loader2 className="w-3 h-3 animate-spin mr-1" />
                              ) : (
                                <Sparkles className="w-3 h-3 mr-1" />
                              )}
                              Generovat varianty
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Image className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">Nejprve importujte videa</h3>
                    <p className="text-muted-foreground">
                      Pro generování miniatur potřebujete mít importovaná videa z YouTube
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Propojený kanál</CardTitle>
                  <CardDescription>Správa propojení s YouTube</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                        <Youtube className="w-6 h-6 text-red-500" />
                      </div>
                      <div>
                        <p className="font-medium">{channel.channelTitle}</p>
                        <p className="text-sm text-muted-foreground">@{channel.channelId}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-green-500 border-green-500">
                      Aktivní
                    </Badge>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Poslední synchronizace</p>
                    <p className="text-sm text-muted-foreground">
                      {channel.lastSyncedAt 
                        ? new Date(channel.lastSyncedAt).toLocaleString('cs-CZ')
                        : 'Nikdy'}
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-destructive">Odpojit kanál</p>
                      <p className="text-sm text-muted-foreground">
                        Tím se odstraní propojení s YouTube, ale vaše videa na FEMSIDER zůstanou
                      </p>
                    </div>
                    <Button 
                      variant="destructive" 
                      onClick={() => disconnectMutation.mutate()}
                      disabled={disconnectMutation.isPending}
                    >
                      {disconnectMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Unlink className="w-4 h-4 mr-2" />
                      )}
                      Odpojit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
