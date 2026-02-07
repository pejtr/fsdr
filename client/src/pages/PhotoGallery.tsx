import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, MessageSquare, Eye, Upload, Camera, X, Send, Filter } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { cs } from "date-fns/locale";

const CATEGORIES = [
  { value: "all", label: "Vše" },
  { value: "transformation", label: "Transformace" },
  { value: "fashion", label: "Móda" },
  { value: "makeup", label: "Makeup" },
  { value: "lifestyle", label: "Lifestyle" },
  { value: "before_after", label: "Před/Po" },
  { value: "cosplay", label: "Cosplay" },
  { value: "other", label: "Ostatní" },
];

export default function PhotoGallery() {
  const { user, isAuthenticated } = useAuth();
  const [category, setCategory] = useState("all");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const [commentText, setCommentText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    category: "other" as string,
    tags: [] as string[],
    tagInput: "",
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const { data: photosData, isLoading } = trpc.photoGallery.getPhotos.useQuery({
    category: category === "all" ? undefined : category,
    limit: 40,
  });

  const photos = photosData?.items || [];
  const total = photosData?.total || 0;

  const { data: photoComments = [] } = trpc.photoGallery.getComments.useQuery(
    { photoId: selectedPhoto?.id },
    { enabled: !!selectedPhoto }
  );

  const uploadFile = trpc.photoGallery.uploadFile.useMutation();

  const uploadPhoto = trpc.photoGallery.upload.useMutation({
    onSuccess: () => {
      toast.success("Fotka nahrána!");
      setUploadOpen(false);
      setUploadForm({ title: "", description: "", category: "other", tags: [], tagInput: "" });
      setPreviewUrl(null);
      setUploadedUrl(null);
      utils.photoGallery.getPhotos.invalidate();
    },
  });

  const toggleLike = trpc.photoGallery.toggleLike.useMutation({
    onSuccess: () => {
      utils.photoGallery.getPhotos.invalidate();
    },
  });

  const addComment = trpc.photoGallery.addComment.useMutation({
    onSuccess: () => {
      setCommentText("");
      utils.photoGallery.getComments.invalidate();
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Maximální velikost souboru je 10MB");
      return;
    }

    // Preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Upload to S3
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      try {
        const result = await uploadFile.mutateAsync({
          fileName: file.name,
          fileData: base64,
          contentType: file.type,
        });
        setUploadedUrl(result.url);
        toast.success("Soubor nahrán!");
      } catch {
        toast.error("Chyba při nahrávání souboru");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitPhoto = () => {
    if (!uploadedUrl) {
      toast.error("Nejdříve nahrajte obrázek");
      return;
    }
    uploadPhoto.mutate({
      title: uploadForm.title || undefined,
      description: uploadForm.description || undefined,
      imageUrl: uploadedUrl,
      category: uploadForm.category as any,
      tags: uploadForm.tags.length > 0 ? uploadForm.tags : undefined,
    });
  };

  const addTag = () => {
    if (uploadForm.tagInput.trim() && uploadForm.tags.length < 10) {
      setUploadForm(f => ({
        ...f,
        tags: [...f.tags, f.tagInput.trim()],
        tagInput: "",
      }));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold symbiote-text-gradient">Fotogalerie</h1>
            <p className="text-muted-foreground mt-1">
              {total} fotek od komunity
            </p>
          </div>
          {isAuthenticated && (
            <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
              <DialogTrigger asChild>
                <Button className="symbiote-gradient text-white border-0">
                  <Upload className="h-4 w-4 mr-2" /> Nahrát fotku
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Nahrát novou fotku</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Image Upload Area */}
                  {previewUrl ? (
                    <div className="relative">
                      <img src={previewUrl} className="w-full h-64 object-cover rounded-lg" alt="Preview" />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
                        onClick={() => { setPreviewUrl(null); setUploadedUrl(null); }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      {uploadFile.isPending && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                          <div className="text-white">Nahrávám...</div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                      <Camera className="h-10 w-10 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">Klikněte pro výběr obrázku</span>
                      <span className="text-xs text-muted-foreground mt-1">Max 10MB, JPG/PNG/WebP</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                    </label>
                  )}

                  <div>
                    <label className="text-sm font-medium">Název (volitelný)</label>
                    <Input
                      value={uploadForm.title}
                      onChange={e => setUploadForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="Název fotky..."
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Popis (volitelný)</label>
                    <Textarea
                      value={uploadForm.description}
                      onChange={e => setUploadForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Popište svou fotku..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Kategorie</label>
                    <Select value={uploadForm.category} onValueChange={v => setUploadForm(f => ({ ...f, category: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.filter(c => c.value !== "all").map(c => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Tagy</label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={uploadForm.tagInput}
                        onChange={e => setUploadForm(f => ({ ...f, tagInput: e.target.value }))}
                        placeholder="Přidat tag..."
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                      />
                      <Button variant="outline" onClick={addTag}>+</Button>
                    </div>
                    {uploadForm.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {uploadForm.tags.map((tag, i) => (
                          <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => {
                            setUploadForm(f => ({ ...f, tags: f.tags.filter((_, idx) => idx !== i) }));
                          }}>
                            {tag} <X className="h-3 w-3 ml-1" />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button
                    className="w-full symbiote-gradient text-white border-0"
                    onClick={handleSubmitPhoto}
                    disabled={!uploadedUrl || uploadPhoto.isPending}
                  >
                    {uploadPhoto.isPending ? "Publikuji..." : "Publikovat fotku"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map(c => (
            <Button
              key={c.value}
              variant={category === c.value ? "default" : "outline"}
              size="sm"
              className={category === c.value ? "symbiote-gradient text-white border-0" : ""}
              onClick={() => setCategory(c.value)}
            >
              {c.label}
            </Button>
          ))}
        </div>

        {/* Photo Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square bg-card/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : photos.length === 0 ? (
          <Card className="bg-card/30 border-dashed">
            <CardContent className="p-16 text-center">
              <Camera className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">Zatím žádné fotky</h3>
              <p className="text-muted-foreground mb-4">
                Buďte první, kdo sdílí svou fotku s komunitou!
              </p>
              {isAuthenticated && (
                <Button className="symbiote-gradient text-white border-0" onClick={() => setUploadOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" /> Nahrát první fotku
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo: any) => (
              <Card
                key={photo.id}
                className="overflow-hidden bg-card/50 border-[oklch(0.6_0.15_180)]/10 hover:border-primary/30 transition-all group cursor-pointer"
                onClick={() => setSelectedPhoto(photo)}
              >
                <div className="relative aspect-square">
                  <img src={photo.imageUrl} className="w-full h-full object-cover" alt={photo.title || ''} loading="lazy" />
                  {photo.isPremium && (
                    <Badge className="absolute top-2 right-2 symbiote-gradient border-0 text-white text-xs">Premium</Badge>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      {photo.title && <p className="text-white text-sm font-medium truncate">{photo.title}</p>}
                      <div className="flex items-center gap-3 text-white/80 text-xs mt-1">
                        <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {photo.likeCount}</span>
                        <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {photo.commentCount}</span>
                        <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {photo.viewCount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Photo Detail Dialog */}
        <Dialog open={!!selectedPhoto} onOpenChange={(open) => { if (!open) setSelectedPhoto(null); }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
            {selectedPhoto && (
              <div className="grid grid-cols-1 md:grid-cols-2">
                {/* Image */}
                <div className="bg-black flex items-center justify-center min-h-[300px]">
                  <img src={selectedPhoto.imageUrl} className="max-w-full max-h-[70vh] object-contain" alt={selectedPhoto.title || ''} />
                </div>
                
                {/* Details & Comments */}
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b border-border">
                    {selectedPhoto.title && <h3 className="font-semibold text-lg">{selectedPhoto.title}</h3>}
                    {selectedPhoto.description && <p className="text-sm text-muted-foreground mt-1">{selectedPhoto.description}</p>}
                    <div className="flex items-center gap-3 mt-3">
                      <Badge variant="secondary" className="capitalize text-xs">{selectedPhoto.category}</Badge>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <button
                          className="flex items-center gap-1 hover:text-primary transition-colors"
                          onClick={() => toggleLike.mutate({ photoId: selectedPhoto.id })}
                        >
                          <Heart className="h-4 w-4" /> {selectedPhoto.likeCount}
                        </button>
                        <span className="flex items-center gap-1"><Eye className="h-4 w-4" /> {selectedPhoto.viewCount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Comments */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[300px]">
                    {photoComments.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Žádné komentáře</p>
                    ) : (
                      photoComments.map((comment: any) => (
                        <div key={comment.id} className="flex gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={comment.userAvatar} />
                            <AvatarFallback className="text-xs">{(comment.userName || 'U').charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{comment.userName || 'Anonym'}</span>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: cs })}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{comment.content}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Comment Input */}
                  {isAuthenticated && (
                    <div className="p-4 border-t border-border">
                      <div className="flex gap-2">
                        <Input
                          value={commentText}
                          onChange={e => setCommentText(e.target.value)}
                          placeholder="Napište komentář..."
                          onKeyDown={e => {
                            if (e.key === 'Enter' && commentText.trim()) {
                              addComment.mutate({ photoId: selectedPhoto.id, content: commentText.trim() });
                            }
                          }}
                        />
                        <Button
                          size="icon"
                          className="symbiote-gradient text-white border-0"
                          onClick={() => {
                            if (commentText.trim()) {
                              addComment.mutate({ photoId: selectedPhoto.id, content: commentText.trim() });
                            }
                          }}
                          disabled={!commentText.trim() || addComment.isPending}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
