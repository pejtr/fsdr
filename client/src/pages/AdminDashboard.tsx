import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Video, 
  Flag, 
  Check, 
  X, 
  Eye,
  AlertTriangle,
  Shield
} from "lucide-react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  
  const { data: pendingVideos, refetch: refetchVideos } = trpc.admin.pendingVideos.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === 'admin',
  });
  
  const { data: pendingFlags, refetch: refetchFlags } = trpc.admin.pendingFlags.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === 'admin',
  });
  
  const approveMutation = trpc.admin.approveVideo.useMutation({
    onSuccess: () => {
      toast.success('Video bylo schváleno');
      refetchVideos();
    },
  });
  
  const rejectMutation = trpc.admin.rejectVideo.useMutation({
    onSuccess: () => {
      toast.success('Video bylo zamítnuto');
      refetchVideos();
    },
  });
  
  const resolveFlagMutation = trpc.admin.resolveFlag.useMutation({
    onSuccess: () => {
      toast.success('Nahlášení bylo vyřešeno');
      refetchFlags();
    },
  });

  // Redirect if not admin
  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8 text-center">
          <Shield className="h-16 w-16 mx-auto mb-4 text-destructive" />
          <h1 className="text-2xl font-bold mb-4">Přístup odepřen</h1>
          <p className="text-muted-foreground mb-4">Tato stránka je pouze pro administrátory.</p>
          <Link href="/">
            <Button>Zpět na hlavní stránku</Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <h1 className="text-3xl font-bold mb-8">
          <span className="femsider-text-gradient">Admin</span> panel
        </h1>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="femsider-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Videa ke schválení</p>
                  <p className="text-3xl font-bold">{pendingVideos?.length || 0}</p>
                </div>
                <Video className="h-10 w-10 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card className="femsider-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Nahlášení k řešení</p>
                  <p className="text-3xl font-bold">{pendingFlags?.length || 0}</p>
                </div>
                <Flag className="h-10 w-10 text-accent" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="videos" className="w-full">
          <TabsList className="w-full justify-start bg-card border border-border mb-6">
            <TabsTrigger value="videos">
              <Video className="h-4 w-4 mr-2" />
              Videa ke schválení ({pendingVideos?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="flags">
              <Flag className="h-4 w-4 mr-2" />
              Nahlášení ({pendingFlags?.length || 0})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="videos">
            {pendingVideos && pendingVideos.length > 0 ? (
              <div className="grid gap-4">
                {pendingVideos.map((video) => (
                  <Card key={video.id} className="femsider-card">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-40 h-24 bg-secondary rounded overflow-hidden flex-shrink-0">
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
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {video.description || 'Bez popisu'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            Tvůrce ID: {video.creatorId} | Nahráno: {new Date(video.createdAt).toLocaleDateString('cs-CZ')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link href={`/video/${video.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              Zobrazit
                            </Button>
                          </Link>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-green-500 hover:text-green-500"
                            onClick={() => approveMutation.mutate({ videoId: video.id })}
                            disabled={approveMutation.isPending}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Schválit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => rejectMutation.mutate({ videoId: video.id })}
                            disabled={rejectMutation.isPending}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Zamítnout
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="femsider-card">
                <CardContent className="p-8 text-center">
                  <Check className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p className="text-muted-foreground">Všechna videa jsou zkontrolována.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="flags">
            {pendingFlags && pendingFlags.length > 0 ? (
              <div className="grid gap-4">
                {pendingFlags.map((flag) => (
                  <Card key={flag.id} className="femsider-card">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <AlertTriangle className="h-10 w-10 text-accent flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium">
                            Video ID: {flag.videoId}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Důvod: <span className="text-accent capitalize">{flag.reason.replace('_', ' ')}</span>
                          </p>
                          {flag.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Popis: {flag.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            Nahlášeno: {new Date(flag.createdAt).toLocaleDateString('cs-CZ')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link href={`/video/${flag.videoId}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              Zobrazit
                            </Button>
                          </Link>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => resolveFlagMutation.mutate({ flagId: flag.id, action: 'dismiss' })}
                            disabled={resolveFlagMutation.isPending}
                          >
                            Zamítnout
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => resolveFlagMutation.mutate({ flagId: flag.id, action: 'action_taken' })}
                            disabled={resolveFlagMutation.isPending}
                          >
                            Akce
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="femsider-card">
                <CardContent className="p-8 text-center">
                  <Check className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p className="text-muted-foreground">Žádná nahlášení k řešení.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
