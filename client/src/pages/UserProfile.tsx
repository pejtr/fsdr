import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useRoute, Link } from "wouter";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, MessageSquare, Eye, Camera, ArrowLeft, MapPin, Calendar, Star, Upload, Sparkles } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { cs } from "date-fns/locale";

export default function UserProfile() {
  const { user, isAuthenticated } = useAuth();
  const [, params] = useRoute("/profile/:id");
  const userId = params?.id ? parseInt(params.id) : user?.id;
  const isOwnProfile = userId === user?.id;

  const { data: profile } = trpc.profile.getPublic.useQuery(
    { userId: userId! },
    { enabled: !!userId }
  );

  const { data: myProfile } = trpc.profile.getMy.useQuery(
    undefined,
    { enabled: isAuthenticated && isOwnProfile }
  );

  const { data: transformations = [] } = trpc.profile.getTransformations.useQuery(
    { userId: userId, limit: 20 },
    { enabled: !!userId }
  );

  const { data: photosData } = trpc.photoGallery.getPhotos.useQuery(
    { userId: userId, limit: 20 },
    { enabled: !!userId }
  );

  const photos = photosData?.items || [];

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: "",
    pronouns: "",
    identityType: "other" as string,
    experienceLevel: "curious" as string,
    location: "",
    interests: [] as string[],
    isPublic: true,
  });

  const updateProfile = trpc.profile.update.useMutation({
    onSuccess: () => {
      toast.success("Profil aktualizován!");
      setEditOpen(false);
    },
  });

  const [transformOpen, setTransformOpen] = useState(false);
  const [transformForm, setTransformForm] = useState({
    title: "",
    description: "",
    beforeImageUrl: "",
    afterImageUrl: "",
    category: "other" as string,
  });

  const addTransformation = trpc.profile.addTransformation.useMutation({
    onSuccess: () => {
      toast.success("Transformace přidána!");
      setTransformOpen(false);
      setTransformForm({ title: "", description: "", beforeImageUrl: "", afterImageUrl: "", category: "other" });
    },
  });

  const uploadFile = trpc.photoGallery.uploadFile.useMutation();

  const handleImageUpload = async (file: File, target: 'before' | 'after') => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Maximální velikost souboru je 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      try {
        const result = await uploadFile.mutateAsync({
          fileName: file.name,
          fileData: base64,
          contentType: file.type,
        });
        if (target === 'before') {
          setTransformForm(f => ({ ...f, beforeImageUrl: result.url }));
        } else {
          setTransformForm(f => ({ ...f, afterImageUrl: result.url }));
        }
        toast.success("Obrázek nahrán!");
      } catch {
        toast.error("Chyba při nahrávání");
      }
    };
    reader.readAsDataURL(file);
  };

  const displayProfile = isOwnProfile ? myProfile : profile;
  const displayUser = isOwnProfile ? user : profile;

  const interestOptions = [
    "Crossdressing", "Makeup", "Fashion", "Wigs", "Cosplay",
    "Photography", "Fitness", "Voice Training", "Dating", "Community",
    "TG Fiction", "Transformation", "Femboy Style", "Tutorials",
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <Link href="/browse">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Zpět
          </Button>
        </Link>

        {/* Profile Header */}
        <div className="relative mb-8">
          {/* Cover */}
          <div className="h-48 md:h-64 rounded-xl overflow-hidden bg-gradient-to-r from-[oklch(0.3_0.15_180)] to-[oklch(0.2_0.1_280)]">
            <div className="w-full h-full opacity-30" style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M30 0L60 30L30 60L0 30Z\' fill=\'none\' stroke=\'%2300ffaa\' stroke-width=\'0.5\'/%3E%3C/svg%3E")',
              backgroundSize: '60px 60px',
            }} />
          </div>

          {/* Avatar & Info */}
          <div className="flex flex-col md:flex-row items-start gap-6 -mt-16 md:-mt-20 px-4 md:px-8">
            <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-background ring-4 ring-[oklch(0.6_0.15_180)]/50">
              <AvatarImage src={(displayUser as any)?.avatarUrl || (displayUser as any)?.userAvatar} />
              <AvatarFallback className="text-4xl bg-primary/20 text-primary">
                {((displayUser as any)?.name || (displayUser as any)?.userName || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 pt-4">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold">
                  {(displayProfile as any)?.displayName || (displayUser as any)?.name || (displayUser as any)?.userName || 'Uživatel'}
                </h1>
                {(displayProfile as any)?.isVerified && (
                  <Badge className="symbiote-gradient border-0 text-white">
                    <Star className="h-3 w-3 mr-1" /> Ověřený
                  </Badge>
                )}
                {(displayProfile as any)?.pronouns && (
                  <Badge variant="outline">{(displayProfile as any).pronouns}</Badge>
                )}
              </div>

              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                {(displayProfile as any)?.identityType && (
                  <Badge variant="secondary" className="capitalize">
                    {(displayProfile as any).identityType.replace('_', ' ')}
                  </Badge>
                )}
                {(displayProfile as any)?.experienceLevel && (
                  <Badge variant="outline" className="capitalize">
                    {(displayProfile as any).experienceLevel}
                  </Badge>
                )}
                {(displayProfile as any)?.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {(displayProfile as any).location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Členem od {displayProfile?.createdAt ? 
                    formatDistanceToNow(new Date(displayProfile.createdAt), { locale: cs }) : 'nedávna'}
                </span>
              </div>

              {(displayUser as any)?.bio && (
                <p className="mt-3 text-muted-foreground max-w-2xl">{(displayUser as any).bio || (displayUser as any).userBio}</p>
              )}

              {/* Interests */}
              {(displayProfile as any)?.interests && (displayProfile as any).interests.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {((displayProfile as any).interests as string[]).map((interest: string) => (
                    <Badge key={interest} variant="secondary" className="text-xs">
                      {interest}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 mt-4">
                {isOwnProfile && (
                  <Dialog open={editOpen} onOpenChange={setEditOpen}>
                    <DialogTrigger asChild>
                      <Button className="symbiote-gradient text-white border-0">
                        Upravit profil
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Upravit profil</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Zobrazované jméno</label>
                          <Input
                            value={editForm.displayName}
                            onChange={e => setEditForm(f => ({ ...f, displayName: e.target.value }))}
                            placeholder="Vaše jméno..."
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Zájmena</label>
                          <Input
                            value={editForm.pronouns}
                            onChange={e => setEditForm(f => ({ ...f, pronouns: e.target.value }))}
                            placeholder="she/her, he/him, they/them..."
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Identita</label>
                          <Select value={editForm.identityType} onValueChange={v => setEditForm(f => ({ ...f, identityType: v }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="crossdresser">Crossdresser</SelectItem>
                              <SelectItem value="femboy">Femboy</SelectItem>
                              <SelectItem value="transgender">Transgender</SelectItem>
                              <SelectItem value="non_binary">Non-binary</SelectItem>
                              <SelectItem value="questioning">Questioning</SelectItem>
                              <SelectItem value="ally">Ally</SelectItem>
                              <SelectItem value="other">Jiné</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Úroveň zkušeností</label>
                          <Select value={editForm.experienceLevel} onValueChange={v => setEditForm(f => ({ ...f, experienceLevel: v }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="curious">Zvědavý/á</SelectItem>
                              <SelectItem value="beginner">Začátečník</SelectItem>
                              <SelectItem value="intermediate">Pokročilý</SelectItem>
                              <SelectItem value="experienced">Zkušený</SelectItem>
                              <SelectItem value="mentor">Mentor</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Lokace</label>
                          <Input
                            value={editForm.location}
                            onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))}
                            placeholder="Město, Země..."
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Zájmy</label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {interestOptions.map(interest => (
                              <Badge
                                key={interest}
                                variant={editForm.interests.includes(interest) ? "default" : "outline"}
                                className="cursor-pointer"
                                onClick={() => {
                                  setEditForm(f => ({
                                    ...f,
                                    interests: f.interests.includes(interest)
                                      ? f.interests.filter(i => i !== interest)
                                      : [...f.interests, interest],
                                  }));
                                }}
                              >
                                {interest}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Button
                          className="w-full symbiote-gradient text-white border-0"
                          onClick={() => updateProfile.mutate(editForm as any)}
                          disabled={updateProfile.isPending}
                        >
                          {updateProfile.isPending ? "Ukládám..." : "Uložit profil"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="bg-card/50 border-[oklch(0.6_0.15_180)]/10">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{transformations.length}</div>
              <div className="text-sm text-muted-foreground">Transformace</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-[oklch(0.6_0.15_180)]/10">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{photos.length}</div>
              <div className="text-sm text-muted-foreground">Fotky</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-[oklch(0.6_0.15_180)]/10">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {transformations.reduce((sum: number, t: any) => sum + (t.likeCount || 0), 0) + photos.reduce((sum: number, p: any) => sum + (p.likeCount || 0), 0)}
              </div>
              <div className="text-sm text-muted-foreground">Líbí se</div>
            </CardContent>
          </Card>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="transformations" className="space-y-6">
          <TabsList className="bg-card/50">
            <TabsTrigger value="transformations">
              <Sparkles className="h-4 w-4 mr-2" /> Transformace
            </TabsTrigger>
            <TabsTrigger value="photos">
              <Camera className="h-4 w-4 mr-2" /> Fotky
            </TabsTrigger>
          </TabsList>

          {/* Transformations Tab */}
          <TabsContent value="transformations">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Moje transformace</h2>
              {isOwnProfile && (
                <Dialog open={transformOpen} onOpenChange={setTransformOpen}>
                  <DialogTrigger asChild>
                    <Button className="symbiote-gradient text-white border-0">
                      <Upload className="h-4 w-4 mr-2" /> Přidat transformaci
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Nová transformace</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Název</label>
                        <Input
                          value={transformForm.title}
                          onChange={e => setTransformForm(f => ({ ...f, title: e.target.value }))}
                          placeholder="Moje první transformace..."
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Popis</label>
                        <Textarea
                          value={transformForm.description}
                          onChange={e => setTransformForm(f => ({ ...f, description: e.target.value }))}
                          placeholder="Popište svou cestu..."
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Kategorie</label>
                        <Select value={transformForm.category} onValueChange={v => setTransformForm(f => ({ ...f, category: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mtf">MTF</SelectItem>
                            <SelectItem value="ftm">FTM</SelectItem>
                            <SelectItem value="crossdress">Crossdress</SelectItem>
                            <SelectItem value="makeup">Makeup</SelectItem>
                            <SelectItem value="fashion">Fashion</SelectItem>
                            <SelectItem value="cosplay">Cosplay</SelectItem>
                            <SelectItem value="other">Jiné</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Před</label>
                          <div className="mt-1">
                            {transformForm.beforeImageUrl ? (
                              <img src={transformForm.beforeImageUrl} className="w-full h-32 object-cover rounded-lg" alt="Before" />
                            ) : (
                              <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                                <Upload className="h-6 w-6 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground mt-1">Nahrát</span>
                                <input type="file" accept="image/*" className="hidden" onChange={e => {
                                  const file = e.target.files?.[0];
                                  if (file) handleImageUpload(file, 'before');
                                }} />
                              </label>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Po</label>
                          <div className="mt-1">
                            {transformForm.afterImageUrl ? (
                              <img src={transformForm.afterImageUrl} className="w-full h-32 object-cover rounded-lg" alt="After" />
                            ) : (
                              <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                                <Upload className="h-6 w-6 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground mt-1">Nahrát</span>
                                <input type="file" accept="image/*" className="hidden" onChange={e => {
                                  const file = e.target.files?.[0];
                                  if (file) handleImageUpload(file, 'after');
                                }} />
                              </label>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        className="w-full symbiote-gradient text-white border-0"
                        onClick={() => addTransformation.mutate(transformForm as any)}
                        disabled={addTransformation.isPending || !transformForm.title || !transformForm.beforeImageUrl || !transformForm.afterImageUrl}
                      >
                        {addTransformation.isPending ? "Nahrávám..." : "Přidat transformaci"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {transformations.length === 0 ? (
              <Card className="bg-card/30 border-dashed">
                <CardContent className="p-12 text-center">
                  <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Žádné transformace</h3>
                  <p className="text-muted-foreground">
                    {isOwnProfile ? "Sdílejte svou cestu přidáním první transformace!" : "Tento uživatel zatím nesdílel žádné transformace."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {transformations.map((t: any) => (
                  <Card key={t.id} className="overflow-hidden bg-card/50 border-[oklch(0.6_0.15_180)]/10 hover:border-primary/30 transition-all">
                    <div className="grid grid-cols-2 gap-0">
                      <div className="relative">
                        <img src={t.beforeImageUrl} className="w-full h-48 object-cover" alt="Before" />
                        <Badge className="absolute top-2 left-2 bg-black/70 text-white border-0">Před</Badge>
                      </div>
                      <div className="relative">
                        <img src={t.afterImageUrl} className="w-full h-48 object-cover" alt="After" />
                        <Badge className="absolute top-2 right-2 symbiote-gradient border-0 text-white">Po</Badge>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{t.title}</h3>
                          <Badge variant="secondary" className="mt-1 capitalize text-xs">{t.category}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><Heart className="h-4 w-4" /> {t.likeCount}</span>
                          <span className="flex items-center gap-1"><MessageSquare className="h-4 w-4" /> {t.commentCount}</span>
                        </div>
                      </div>
                      {t.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{t.description}</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Photos Tab */}
          <TabsContent value="photos">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Fotogalerie</h2>
            </div>

            {photos.length === 0 ? (
              <Card className="bg-card/30 border-dashed">
                <CardContent className="p-12 text-center">
                  <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Žádné fotky</h3>
                  <p className="text-muted-foreground">
                    {isOwnProfile ? "Přidejte fotky do galerie!" : "Tento uživatel zatím nesdílel žádné fotky."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((photo: any) => (
                  <Card key={photo.id} className="overflow-hidden bg-card/50 border-[oklch(0.6_0.15_180)]/10 hover:border-primary/30 transition-all group cursor-pointer">
                    <div className="relative aspect-square">
                      <img src={photo.imageUrl} className="w-full h-full object-cover" alt={photo.title || ''} />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-end">
                        <div className="p-3 opacity-0 group-hover:opacity-100 transition-opacity w-full">
                          <div className="flex items-center gap-3 text-white text-sm">
                            <span className="flex items-center gap-1"><Heart className="h-4 w-4" /> {photo.likeCount}</span>
                            <span className="flex items-center gap-1"><MessageSquare className="h-4 w-4" /> {photo.commentCount}</span>
                            <span className="flex items-center gap-1"><Eye className="h-4 w-4" /> {photo.viewCount}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
