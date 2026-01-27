import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Play,
  Pause,
  Heart,
  Eye,
  Share2,
  Download,
  Search,
  Filter,
  Sparkles,
  Film,
  Clock,
  User,
  Facebook,
  Twitter,
  Copy,
  ExternalLink,
  Volume2,
  VolumeX,
  Maximize,
} from "lucide-react";
import { toast } from "sonner";

// Mock gallery data - v produkci by se načítalo z databáze
const GALLERY_VIDEOS = [
  {
    id: 1,
    title: "Sister's Exchange - Transformation",
    description: "Bratr a sestra si vymění těla pomocí magického artefaktu",
    videoUrl: "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4",
    thumbnailUrl: "/templates/sisters-exchange.jpg",
    category: "body_swap",
    tags: ["tg", "tf", "mtf", "body_swap", "siblings"],
    views: 12500,
    likes: 890,
    duration: "0:06",
    createdAt: new Date("2026-01-15"),
    creator: "FemsiderAI",
    template: "Sister's Exchange",
  },
  {
    id: 2,
    title: "Wishing to be Her - Magic Wish",
    description: "Přání se splní a muž se stane ženou svých snů",
    videoUrl: "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4",
    thumbnailUrl: "/templates/wishing-to-be-her.jpg",
    category: "transformation",
    tags: ["tg", "tf", "mtf", "wish", "magic"],
    views: 9800,
    likes: 720,
    duration: "0:06",
    createdAt: new Date("2026-01-14"),
    creator: "FemsiderAI",
    template: "Wishing to be Her",
  },
  {
    id: 3,
    title: "Hell's Life Saga - Dark Transformation",
    description: "Temná transformace s nadpřirozenými prvky",
    videoUrl: "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4",
    thumbnailUrl: "/templates/hells-life-saga.jpg",
    category: "transformation",
    tags: ["tg", "tf", "mtf", "dark", "supernatural"],
    views: 15200,
    likes: 1100,
    duration: "0:06",
    createdAt: new Date("2026-01-13"),
    creator: "FemsiderAI",
    template: "Hell's Life Saga",
  },
  {
    id: 4,
    title: "Baby Witch - Magical Accident",
    description: "Začínající čarodějka omylem transformuje muže",
    videoUrl: "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4",
    thumbnailUrl: "/templates/baby-witch.jpg",
    category: "magic",
    tags: ["tg", "tf", "mtf", "witch", "magic", "accident"],
    views: 8500,
    likes: 650,
    duration: "0:06",
    createdAt: new Date("2026-01-12"),
    creator: "FemsiderAI",
    template: "Baby Witch",
  },
  {
    id: 5,
    title: "Magic Roulette - Fate's Game",
    description: "Hra s osudem - magická ruleta rozhoduje o transformaci",
    videoUrl: "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4",
    thumbnailUrl: "/templates/magic-roulette.jpg",
    category: "game",
    tags: ["tg", "tf", "mtf", "game", "roulette", "chance"],
    views: 11000,
    likes: 820,
    duration: "0:06",
    createdAt: new Date("2026-01-11"),
    creator: "FemsiderAI",
    template: "Magic Roulette",
  },
  {
    id: 6,
    title: "Hotel Aphrodite - Mystery Hotel",
    description: "Tajemný hotel kde se hosté transformují",
    videoUrl: "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4",
    thumbnailUrl: "/templates/hotel-aphrodite.jpg",
    category: "location",
    tags: ["tg", "tf", "mtf", "hotel", "mystery"],
    views: 13500,
    likes: 980,
    duration: "0:06",
    createdAt: new Date("2026-01-10"),
    creator: "FemsiderAI",
    template: "Hotel Aphrodite",
  },
  {
    id: 7,
    title: "Chromosome of Desire - Sci-Fi Experiment",
    description: "Vědecký experiment s neočekávanými výsledky",
    videoUrl: "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4",
    thumbnailUrl: "/templates/chromosome-of-desire.jpg",
    category: "scifi",
    tags: ["tg", "tf", "mtf", "science", "experiment"],
    views: 7800,
    likes: 540,
    duration: "0:06",
    createdAt: new Date("2026-01-09"),
    creator: "FemsiderAI",
    template: "Chromosome of Desire",
  },
  {
    id: 8,
    title: "TGTF Comet - Cosmic Event",
    description: "Kosmická událost způsobuje hromadné transformace",
    videoUrl: "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4",
    thumbnailUrl: "/templates/tgtf-comet.jpg",
    category: "cosmic",
    tags: ["tg", "tf", "mtf", "comet", "cosmic", "mass_transformation"],
    views: 18000,
    likes: 1350,
    duration: "0:06",
    createdAt: new Date("2026-01-08"),
    creator: "FemsiderAI",
    template: "TGTF Comet",
  },
  {
    id: 9,
    title: "Online Goth Girl - Digital Identity",
    description: "Online identita se stane realitou",
    videoUrl: "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4",
    thumbnailUrl: "/templates/online-goth-girl.jpg",
    category: "digital",
    tags: ["tg", "tf", "mtf", "online", "goth", "avatar"],
    views: 10500,
    likes: 780,
    duration: "0:06",
    createdAt: new Date("2026-01-07"),
    creator: "FemsiderAI",
    template: "Online Goth Girl",
  },
];

const CATEGORIES = [
  { value: "all", label: "Všechny kategorie" },
  { value: "body_swap", label: "Body Swap" },
  { value: "transformation", label: "Transformace" },
  { value: "magic", label: "Magie" },
  { value: "scifi", label: "Sci-Fi" },
  { value: "cosmic", label: "Kosmické" },
  { value: "digital", label: "Digitální" },
  { value: "location", label: "Lokace" },
  { value: "game", label: "Hry" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Nejnovější" },
  { value: "popular", label: "Nejpopulárnější" },
  { value: "most_liked", label: "Nejvíce lajků" },
];

export default function Gallery() {
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedVideo, setSelectedVideo] = useState<typeof GALLERY_VIDEOS[0] | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [likedVideos, setLikedVideos] = useState<Set<number>>(new Set());

  // Filter and sort videos
  const filteredVideos = GALLERY_VIDEOS
    .filter(video => {
      const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === "all" || video.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "popular":
          return b.views - a.views;
        case "most_liked":
          return b.likes - a.likes;
        case "newest":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  const handleLike = (videoId: number) => {
    setLikedVideos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(videoId)) {
        newSet.delete(videoId);
        toast.success("Like odebrán");
      } else {
        newSet.add(videoId);
        toast.success("Video se vám líbí!");
      }
      return newSet;
    });
  };

  const handleShare = (video: typeof GALLERY_VIDEOS[0]) => {
    setSelectedVideo(video);
    setShareDialogOpen(true);
  };

  const shareToSocial = (platform: string) => {
    if (!selectedVideo) return;
    
    const shareUrl = window.location.origin + `/gallery/${selectedVideo.id}`;
    const shareText = `Podívejte se na "${selectedVideo.title}" na FEMSIDER!`;
    
    let url = '';
    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(shareUrl);
        toast.success("Odkaz zkopírován!");
        setShareDialogOpen(false);
        return;
    }
    
    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
    }
    setShareDialogOpen(false);
  };

  const handleDownload = (video: typeof GALLERY_VIDEOS[0]) => {
    const link = document.createElement('a');
    link.href = video.videoUrl;
    link.download = `${video.title.replace(/\s+/g, '_')}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Stahování zahájeno");
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0f0f0f]/95 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Film className="h-6 w-6 text-pink-500" />
                <h1 className="text-xl font-bold text-white">Galerie TG/TF Videí</h1>
              </div>
            </div>
            
            <Link href="/video-recreate">
              <Button className="bg-pink-600 hover:bg-pink-700">
                <Sparkles className="h-4 w-4 mr-2" />
                Vytvořit vlastní
              </Button>
            </Link>
          </div>
          
          {/* Search and Filters */}
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Hledat videa..."
                className="pl-10 bg-[#1a1a1a] border-white/10 text-white"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px] bg-[#1a1a1a] border-white/10 text-white">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Kategorie" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-white/10">
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value} className="text-white hover:bg-white/10">
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px] bg-[#1a1a1a] border-white/10 text-white">
                <SelectValue placeholder="Řadit podle" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-white/10">
                {SORT_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value} className="text-white hover:bg-white/10">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="flex items-center gap-6 mb-8 text-gray-400">
          <span className="flex items-center gap-2">
            <Film className="h-4 w-4" />
            {filteredVideos.length} videí
          </span>
          <span className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            {formatNumber(filteredVideos.reduce((sum, v) => sum + v.views, 0))} zhlédnutí
          </span>
          <span className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            {formatNumber(filteredVideos.reduce((sum, v) => sum + v.likes, 0))} lajků
          </span>
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredVideos.map(video => (
            <Card 
              key={video.id} 
              className="bg-[#1a1a1a] border-white/10 overflow-hidden group cursor-pointer hover:border-pink-500/50 transition-colors"
            >
              <div 
                className="relative aspect-video overflow-hidden"
                onClick={() => setSelectedVideo(video)}
              >
                <img 
                  src={video.thumbnailUrl} 
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-pink-600/90 flex items-center justify-center">
                    <Play className="h-8 w-8 text-white ml-1" />
                  </div>
                </div>
                <Badge className="absolute top-2 right-2 bg-black/70 text-white">
                  {video.duration}
                </Badge>
                <Badge className="absolute top-2 left-2 bg-pink-600/90 text-white text-xs">
                  {video.template}
                </Badge>
              </div>
              
              <CardContent className="p-4">
                <h3 className="text-white font-medium line-clamp-1 mb-1">{video.title}</h3>
                <p className="text-gray-400 text-sm line-clamp-2 mb-3">{video.description}</p>
                
                <div className="flex items-center justify-between text-gray-400 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {formatNumber(video.views)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className={`h-3 w-3 ${likedVideos.has(video.id) ? 'fill-pink-500 text-pink-500' : ''}`} />
                      {formatNumber(video.likes + (likedVideos.has(video.id) ? 1 : 0))}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-pink-500"
                      onClick={(e) => { e.stopPropagation(); handleLike(video.id); }}
                    >
                      <Heart className={`h-4 w-4 ${likedVideos.has(video.id) ? 'fill-pink-500 text-pink-500' : ''}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-white"
                      onClick={(e) => { e.stopPropagation(); handleShare(video); }}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-white"
                      onClick={(e) => { e.stopPropagation(); handleDownload(video); }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1 mt-3">
                  {video.tags.slice(0, 3).map(tag => (
                    <Badge key={tag} variant="outline" className="text-[10px] border-pink-500/30 text-pink-400">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredVideos.length === 0 && (
          <div className="text-center py-16">
            <Film className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">Žádná videa nenalezena</h3>
            <p className="text-gray-400 mb-4">Zkuste změnit vyhledávací kritéria nebo kategorii</p>
            <Button 
              variant="outline" 
              className="border-pink-500/50 text-pink-400"
              onClick={() => { setSearchQuery(""); setSelectedCategory("all"); }}
            >
              Resetovat filtry
            </Button>
          </div>
        )}
      </main>

      {/* Video Player Modal */}
      <Dialog open={!!selectedVideo && !shareDialogOpen} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="bg-[#1a1a1a] border-white/10 max-w-4xl p-0 overflow-hidden">
          <div className="relative aspect-video bg-black">
            <video
              src={selectedVideo?.videoUrl}
              className="w-full h-full"
              autoPlay
              loop
              muted={isMuted}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            
            {/* Video Controls Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity">
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                      onClick={() => {
                        const video = document.querySelector('video');
                        if (video) {
                          isPlaying ? video.pause() : video.play();
                        }
                      }}
                    >
                      {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                      onClick={() => setIsMuted(!isMuted)}
                    >
                      {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                      onClick={() => selectedVideo && handleShare(selectedVideo)}
                    >
                      <Share2 className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                      onClick={() => selectedVideo && handleDownload(selectedVideo)}
                    >
                      <Download className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                      onClick={() => {
                        const video = document.querySelector('video');
                        if (video) {
                          video.requestFullscreen();
                        }
                      }}
                    >
                      <Maximize className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Video Info */}
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">{selectedVideo?.title}</h2>
                <p className="text-gray-400">{selectedVideo?.description}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className={`${likedVideos.has(selectedVideo?.id || 0) ? 'text-pink-500' : 'text-gray-400'} hover:text-pink-500`}
                onClick={() => selectedVideo && handleLike(selectedVideo.id)}
              >
                <Heart className={`h-6 w-6 ${likedVideos.has(selectedVideo?.id || 0) ? 'fill-pink-500' : ''}`} />
              </Button>
            </div>
            
            <div className="flex items-center gap-6 text-gray-400 text-sm mb-4">
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {selectedVideo && formatNumber(selectedVideo.views)} zhlédnutí
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                {selectedVideo && formatNumber(selectedVideo.likes + (likedVideos.has(selectedVideo.id) ? 1 : 0))} lajků
              </span>
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {selectedVideo?.creator}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {selectedVideo?.createdAt.toLocaleDateString('cs-CZ')}
              </span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-pink-600/20 text-pink-400 border-pink-500/30">
                {selectedVideo?.template}
              </Badge>
              {selectedVideo?.tags.map(tag => (
                <Badge key={tag} variant="outline" className="border-white/20 text-gray-400">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="bg-[#1a1a1a] border-white/10 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white">Sdílet video</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-3 gap-4 py-4">
            <Button
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-4 border-white/10 hover:bg-blue-600/20 hover:border-blue-500"
              onClick={() => shareToSocial('facebook')}
            >
              <Facebook className="h-6 w-6 text-blue-500" />
              <span className="text-xs text-gray-400">Facebook</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-4 border-white/10 hover:bg-sky-600/20 hover:border-sky-500"
              onClick={() => shareToSocial('twitter')}
            >
              <Twitter className="h-6 w-6 text-sky-500" />
              <span className="text-xs text-gray-400">Twitter/X</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-4 border-white/10 hover:bg-white/10"
              onClick={() => shareToSocial('copy')}
            >
              <Copy className="h-6 w-6 text-gray-400" />
              <span className="text-xs text-gray-400">Kopírovat</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
