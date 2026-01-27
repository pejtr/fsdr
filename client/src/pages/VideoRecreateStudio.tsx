import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Plus,
  Video,
  Wand2,
  Play,
  Pause,
  Image as ImageIcon,
  Sparkles,
  Upload,
  Link as LinkIcon,
  Youtube,
  Film,
  Heart,
  Scissors,
  Clock,
  Star,
  Trash2,
  RefreshCw,
  Check,
  AlertCircle,
  Loader2,
  Share2,
  Facebook,
  Twitter,
  Instagram,
  Download,
  Copy,
  ExternalLink,
  Maximize,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { cs } from "date-fns/locale";

const AI_MODELS = [
  { value: "wan_2_6", label: "WAN 2.6", description: "Nejlepší pro NSFW obsah, podporuje zvuk", badge: "Doporučeno" },
  { value: "hailuo_ai", label: "Hailuo AI", description: "Vysoká kvalita, rychlé generování" },
  { value: "veo_3", label: "VEO 3", description: "Google DeepMind, realistické výsledky" },
];

const PROJECT_TYPES = [
  { value: "extend_scene", label: "Rozšířit scénu", icon: Scissors, description: "Prodloužit vybranou scénu" },
  { value: "remake", label: "Remake", icon: RefreshCw, description: "Vytvořit novou verzi videa" },
  { value: "sequel", label: "Sequel", icon: Film, description: "Pokračování příběhu" },
];

const SCENE_TYPE_COLORS: Record<string, string> = {
  dialogue: "bg-blue-500/20 text-blue-400 border-blue-500/50",
  action: "bg-orange-500/20 text-orange-400 border-orange-500/50",
  romantic: "bg-pink-500/20 text-pink-400 border-pink-500/50",
  kiss: "bg-red-500/20 text-red-400 border-red-500/50",
  intimate: "bg-purple-500/20 text-purple-400 border-purple-500/50",
  transition: "bg-gray-500/20 text-gray-400 border-gray-500/50",
  other: "bg-gray-500/20 text-gray-400 border-gray-500/50",
};

const SCENE_TYPE_LABELS: Record<string, string> = {
  dialogue: "Dialog",
  action: "Akce",
  romantic: "Romantika",
  kiss: "Polibek",
  intimate: "Intimní",
  transition: "Přechod",
  transformation: "Transformace",
  body_swap: "Body Swap",
  other: "Ostatní",
};

// TG/TF Transformation Šablony scénářů inspirované Femsider YouTube kanály
const TGTF_TEMPLATES = [
  {
    id: "sisters_exchange",
    title: "Sister's Exchange",
    description: "Bratr a sestra si vymění těla pomocí magického artefaktu",
    category: "body_swap",
    tags: ["tg", "tf", "mtf", "body_swap", "siblings"],
    thumbnail: "/templates/sisters-exchange.jpg",
    scenes: [
      { type: "intro", prompt: "Young man discovers ancient medallion in sister's room, curious expression, cinematic lighting" },
      { type: "transformation", prompt: "Magical transformation sequence, body morphing, glowing energy, male to female transition" },
      { type: "reaction", prompt: "Shocked expression looking in mirror, feminine reflection, dramatic lighting" },
      { type: "adaptation", prompt: "Learning to move in new female body, awkward but curious, soft lighting" },
    ],
  },
  {
    id: "wishing_to_be_her",
    title: "Wishing to be Her",
    description: "Přání se splní a muž se stane ženou svých snů",
    category: "transformation",
    tags: ["tg", "tf", "mtf", "wish", "magic"],
    thumbnail: "/templates/wishing-to-be-her.jpg",
    scenes: [
      { type: "intro", prompt: "Man looking longingly at beautiful woman, desire in eyes, romantic atmosphere" },
      { type: "wish", prompt: "Making a wish under starlight, mystical atmosphere, hopeful expression" },
      { type: "transformation", prompt: "Gradual transformation sequence, body changing, hair growing, feminine features emerging" },
      { type: "reveal", prompt: "Beautiful woman looking at reflection, satisfied smile, glamorous lighting" },
    ],
  },
  {
    id: "hells_life_saga",
    title: "Hell's Life Saga",
    description: "Temná transformace s nadpřirozenými prvky",
    category: "transformation",
    tags: ["tg", "tf", "mtf", "dark", "supernatural"],
    thumbnail: "/templates/hells-life-saga.jpg",
    scenes: [
      { type: "intro", prompt: "Dark mysterious setting, ominous atmosphere, man encountering supernatural entity" },
      { type: "curse", prompt: "Demonic curse being cast, red glowing eyes, dark magic swirling" },
      { type: "transformation", prompt: "Painful transformation sequence, body contorting, dark energy, male to female" },
      { type: "aftermath", prompt: "Transformed woman with supernatural beauty, dark elegance, mysterious aura" },
    ],
  },
  {
    id: "baby_witch",
    title: "Baby Witch",
    description: "Začínající čarodějka omylem transformuje muže",
    category: "magic",
    tags: ["tg", "tf", "mtf", "witch", "magic", "accident"],
    thumbnail: "/templates/baby-witch.jpg",
    scenes: [
      { type: "intro", prompt: "Young witch practicing spells, magical room with candles and potions" },
      { type: "accident", prompt: "Spell goes wrong, magical explosion, surprised expressions" },
      { type: "transformation", prompt: "Accidental transformation, sparkles and magic, male becoming female" },
      { type: "comedy", prompt: "Witch trying to reverse spell, comedic situation, transformed person confused" },
    ],
  },
  {
    id: "magic_roulette",
    title: "Magic Roulette",
    description: "Hra s osudem - magická ruleta rozhoduje o transformaci",
    category: "game",
    tags: ["tg", "tf", "mtf", "game", "roulette", "chance"],
    thumbnail: "/templates/magic-roulette.jpg",
    scenes: [
      { type: "intro", prompt: "Mystical roulette wheel glowing with magic, group of people watching nervously" },
      { type: "spin", prompt: "Roulette spinning with magical energy, anticipation, dramatic lighting" },
      { type: "transformation", prompt: "Winner being transformed, magical energy surrounding body, gender change" },
      { type: "result", prompt: "Newly transformed woman examining herself, mix of shock and acceptance" },
    ],
  },
  {
    id: "stepmother_daughters",
    title: "Stepmother Daughter's",
    description: "Rodinná dynamika se změní po transformaci",
    category: "family",
    tags: ["tg", "tf", "mtf", "family", "stepmother"],
    thumbnail: "/templates/stepmother-daughters.jpg",
    scenes: [
      { type: "intro", prompt: "Family dinner scene, tension between stepson and stepmother" },
      { type: "conflict", prompt: "Argument escalating, emotional confrontation" },
      { type: "transformation", prompt: "Unexpected transformation triggered by emotions, body changing" },
      { type: "resolution", prompt: "New understanding between family members, transformed person finding acceptance" },
    ],
  },
  {
    id: "hotel_aphrodite",
    title: "Hotel Aphrodite",
    description: "Tajemný hotel kde se hosté transformují",
    category: "location",
    tags: ["tg", "tf", "mtf", "hotel", "mystery"],
    thumbnail: "/templates/hotel-aphrodite.jpg",
    scenes: [
      { type: "intro", prompt: "Elegant mysterious hotel entrance, art deco style, man checking in" },
      { type: "discovery", prompt: "Strange occurrences in hotel room, mirrors showing different reflection" },
      { type: "transformation", prompt: "Hotel's magic taking effect, gradual transformation, luxurious setting" },
      { type: "reveal", prompt: "Beautiful woman in elegant hotel room, embracing new identity" },
    ],
  },
  {
    id: "chromosome_of_desire",
    title: "Chromosome of Desire",
    description: "Vědecký experiment s neočekávanými výsledky",
    category: "scifi",
    tags: ["tg", "tf", "mtf", "science", "experiment"],
    thumbnail: "/templates/chromosome-of-desire.jpg",
    scenes: [
      { type: "intro", prompt: "Scientific laboratory, DNA research, scientist examining samples" },
      { type: "experiment", prompt: "Experimental procedure, high-tech equipment, subject in chamber" },
      { type: "transformation", prompt: "Genetic transformation in progress, scientific visualization, body changing" },
      { type: "result", prompt: "Successful transformation, scientist amazed at results, beautiful female subject" },
    ],
  },
  {
    id: "my_sisters_room",
    title: "My Sister's Room",
    description: "Zvědavost vede k neočekávané transformaci",
    category: "discovery",
    tags: ["tg", "tf", "mtf", "curiosity", "siblings"],
    thumbnail: "/templates/my-sisters-room.jpg",
    scenes: [
      { type: "intro", prompt: "Brother sneaking into sister's room, curious expression, feminine decor" },
      { type: "discovery", prompt: "Finding mysterious object or clothing, temptation" },
      { type: "transformation", prompt: "Trying on items triggers transformation, surprised reaction, body changing" },
      { type: "caught", prompt: "Sister returns, comedic or dramatic confrontation, transformed brother" },
    ],
  },
  {
    id: "tgtf_comet",
    title: "TGTF Comet",
    description: "Kosmická událost způsobuje hromadné transformace",
    category: "cosmic",
    tags: ["tg", "tf", "mtf", "comet", "cosmic", "mass_transformation"],
    thumbnail: "/templates/tgtf-comet.jpg",
    scenes: [
      { type: "intro", prompt: "Night sky with approaching comet, people watching in awe" },
      { type: "impact", prompt: "Comet's energy wave hitting Earth, cosmic light washing over city" },
      { type: "transformation", prompt: "Multiple people transforming simultaneously, cosmic energy, gender changes" },
      { type: "new_world", prompt: "Aftermath of mass transformation, society adapting to changes" },
    ],
  },
  {
    id: "girlfriends_friend",
    title: "Girlfriend's Friend",
    description: "Přátelství se změní po transformaci",
    category: "relationship",
    tags: ["tg", "tf", "mtf", "friendship", "girlfriend"],
    thumbnail: "/templates/girlfriends-friend.jpg",
    scenes: [
      { type: "intro", prompt: "Couple with female friend, social gathering, casual atmosphere" },
      { type: "jealousy", prompt: "Tension and jealousy building, emotional undercurrents" },
      { type: "transformation", prompt: "Unexpected transformation of boyfriend, becoming female" },
      { type: "new_dynamic", prompt: "Three women navigating new friendship dynamic, acceptance" },
    ],
  },
  {
    id: "online_goth_girl",
    title: "Online Goth Girl",
    description: "Online identita se stane realitou",
    category: "digital",
    tags: ["tg", "tf", "mtf", "online", "goth", "avatar"],
    thumbnail: "/templates/online-goth-girl.jpg",
    scenes: [
      { type: "intro", prompt: "Person creating female goth avatar online, dark aesthetic, computer screen" },
      { type: "immersion", prompt: "Deep connection with online persona, blurring reality" },
      { type: "transformation", prompt: "Avatar becoming real, transformation into goth girl, dark makeup appearing" },
      { type: "embrace", prompt: "Fully transformed goth girl, embracing dark aesthetic, confident pose" },
    ],
  },
];

// TG/TF Kategorie
const TGTF_CATEGORIES = [
  { value: "all", label: "Všechny šablony", icon: Sparkles },
  { value: "body_swap", label: "Body Swap", icon: RefreshCw },
  { value: "transformation", label: "Transformace", icon: Wand2 },
  { value: "magic", label: "Magie", icon: Sparkles },
  { value: "scifi", label: "Sci-Fi", icon: Film },
  { value: "family", label: "Rodina", icon: Heart },
  { value: "relationship", label: "Vztahy", icon: Heart },
];

// Přednaštavené prompty pro TG/TF generování
const TGTF_PROMPT_PRESETS = [
  {
    id: "transformation_sequence",
    label: "Transformační sekvence",
    prompt: "Cinematic transformation sequence, male to female gender change, body morphing smoothly, magical energy particles, dramatic lighting, high quality, detailed",
  },
  {
    id: "mirror_reveal",
    label: "Zrcadlové odhalení",
    prompt: "Person looking at mirror reflection, shocked expression seeing female reflection, dramatic reveal moment, soft lighting, emotional",
  },
  {
    id: "body_discovery",
    label: "Objevování nového těla",
    prompt: "Newly transformed woman exploring her body, curious and amazed expression, touching face and hair, intimate moment, soft lighting",
  },
  {
    id: "clothing_change",
    label: "Změna oblečení",
    prompt: "Transformed person trying on feminine clothing for first time, mix of nervousness and excitement, mirror reflection, bedroom setting",
  },
  {
    id: "acceptance_moment",
    label: "Moment přijetí",
    prompt: "Beautiful woman smiling at reflection, accepting new identity, confident pose, warm lighting, emotional satisfaction",
  },
  {
    id: "romantic_scene",
    label: "Romantická scéna",
    prompt: "Transformed woman in romantic setting, soft focus, intimate atmosphere, feminine beauty, emotional connection",
  },
  {
    id: "before_after",
    label: "Před a po",
    prompt: "Split screen effect showing before and after transformation, male on left, female on right, same pose, dramatic comparison",
  },
];

export default function VideoRecreateStudio() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("projects");
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  
  // New project form state
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    sourceType: "url" as "upload" | "url" | "youtube",
    sourceUrl: "",
    projectType: "extend_scene" as "remake" | "sequel" | "extend_scene",
    targetModel: "wan_2_6" as "hailuo_ai" | "veo_3" | "wan_2_6",
    generateNude: false,
    generateAudio: true,
  });

  // Template selection state
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<typeof TGTF_TEMPLATES[0] | null>(null);
  const [templateCategory, setTemplateCategory] = useState("all");
  const [selectedPromptPreset, setSelectedPromptPreset] = useState<string | null>(null);

  // Filtered templates by category
  const filteredTemplates = templateCategory === "all" 
    ? TGTF_TEMPLATES 
    : TGTF_TEMPLATES.filter(t => t.category === templateCategory);

  // Apply template to new project
  const applyTemplate = (template: typeof TGTF_TEMPLATES[0]) => {
    setSelectedTemplate(template);
    setNewProject(prev => ({
      ...prev,
      title: template.title,
      description: template.description,
    }));
    setShowTemplates(false);
    toast.success(`Šablona "${template.title}" aplikována`);
  };

  // Fetch projects
  const { data: projects, isLoading: projectsLoading, refetch: refetchProjects } = 
    trpc.videoRecreate.getProjects.useQuery({ limit: 20 }, { enabled: isAuthenticated });

  // Fetch selected project
  const { data: selectedProject, isLoading: projectLoading, refetch: refetchProject } = 
    trpc.videoRecreate.getProject.useQuery(
      { projectId: selectedProjectId || 0 },
      { enabled: !!selectedProjectId }
    );

  // Fetch extendable scenes
  const { data: extendableScenes, refetch: refetchScenes } = 
    trpc.videoRecreate.getExtendableScenes.useQuery(
      { projectId: selectedProjectId || 0 },
      { enabled: !!selectedProjectId }
    );

  // Mutations
  const createProject = trpc.videoRecreate.createProject.useMutation({
    onSuccess: (data) => {
      setShowNewProjectDialog(false);
      setSelectedProjectId(data.projectId || null);
      refetchProjects();
      toast.success("Projekt vytvořen");
    },
    onError: () => toast.error("Nepodařilo se vytvořit projekt"),
  });

  const analyzeVideo = trpc.videoRecreate.analyzeVideo.useMutation({
    onSuccess: () => {
      refetchProject();
      refetchScenes();
      toast.success("Analýza videa dokončena");
    },
    onError: () => toast.error("Analýza selhala"),
  });

  const selectScreenshot = trpc.videoRecreate.selectScreenshot.useMutation({
    onSuccess: () => {
      refetchScenes();
      toast.success("Screenshot vybrán");
    },
  });

  const generateScene = trpc.videoRecreate.generateScene.useMutation({
    onSuccess: () => {
      refetchProject();
      toast.success("Generování zahájeno");
      // Start polling for completion
      startPolling();
    },
    onError: () => toast.error("Generování selhalo"),
  });
  
  const generateFromTemplate = trpc.videoRecreate.generateFromTemplate.useMutation({
    onSuccess: () => {
      refetchProject();
      startPolling();
    },
    onError: (error) => console.error("Template generation error:", error),
  });

  // Polling for video generation status
  const [isPolling, setIsPolling] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startPolling = () => {
    if (isPolling) return;
    setIsPolling(true);
    
    pollingIntervalRef.current = setInterval(async () => {
      await refetchProject();
      
      // Check if all segments are completed or failed
      if (selectedProject?.segments) {
        const pendingSegments = selectedProject.segments.filter(
          (s: any) => s.status === 'generating' || s.status === 'pending'
        );
        
        if (pendingSegments.length === 0) {
          stopPolling();
          const completedCount = selectedProject.segments.filter((s: any) => s.status === 'completed').length;
          if (completedCount > 0) {
            toast.success(`${completedCount} video segmentů vygenerováno!`);
          }
        }
      }
    }, 5000); // Poll every 5 seconds
  };

  const stopPolling = () => {
    setIsPolling(false);
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => stopPolling();
  }, []);

  // Auto-start polling if there are generating segments
  useEffect(() => {
    if (selectedProject?.segments) {
      const hasGenerating = selectedProject.segments.some(
        (s: any) => s.status === 'generating' || s.status === 'pending'
      );
      if (hasGenerating && !isPolling) {
        startPolling();
      }
    }
  }, [selectedProject]);

  // Social sharing state
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedSegmentForShare, setSelectedSegmentForShare] = useState<any>(null);

  const handleShare = (segment: any) => {
    setSelectedSegmentForShare(segment);
    setShareDialogOpen(true);
  };

  const shareToSocial = (platform: string) => {
    if (!selectedSegmentForShare?.videoUrl) {
      toast.error("Video není dostupné pro sdílení");
      return;
    }

    const videoUrl = selectedSegmentForShare.videoUrl;
    const shareText = `Podívejte se na toto AI-generované video z FEMSIDER!`;
    
    let shareUrl = '';
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(videoUrl)}&quote=${encodeURIComponent(shareText)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(videoUrl)}&text=${encodeURIComponent(shareText)}`;
        break;
      case 'instagram':
        // Instagram doesn't have direct share URL, copy link instead
        navigator.clipboard.writeText(videoUrl);
        toast.success("Odkaz zkopírován! Vložte ho do Instagram Stories nebo příspěvku.");
        setShareDialogOpen(false);
        return;
      case 'tiktok':
        // TikTok doesn't have direct share URL, copy link instead
        navigator.clipboard.writeText(videoUrl);
        toast.success("Odkaz zkopírován! Vložte ho do TikTok.");
        setShareDialogOpen(false);
        return;
      case 'copy':
        navigator.clipboard.writeText(videoUrl);
        toast.success("Odkaz zkopírován do schránky!");
        setShareDialogOpen(false);
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
    setShareDialogOpen(false);
  };

  const downloadVideo = async (segment: any) => {
    if (!segment.videoUrl) {
      toast.error("Video není dostupné ke stažení");
      return;
    }
    
    try {
      const response = await fetch(segment.videoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `femsider-video-${segment.id}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Stahování zahájeno");
    } catch (error) {
      toast.error("Stažení selhalo");
    }
  };

  // Video Player Modal State
  const [videoPlayerOpen, setVideoPlayerOpen] = useState(false);
  const [selectedVideoSegment, setSelectedVideoSegment] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const openVideoPlayer = (segment: any) => {
    if (!segment.videoUrl) {
      toast.error("Video není dostupné pro přehrání");
      return;
    }
    setSelectedVideoSegment(segment);
    setVideoPlayerOpen(true);
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const closeVideoPlayer = () => {
    setVideoPlayerOpen(false);
    setSelectedVideoSegment(null);
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol;
    }
    setIsMuted(vol === 0);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.volume = volume || 1;
        setIsMuted(false);
      } else {
        videoRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const skipTime = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
  };

  const uploadVideo = trpc.videoRecreate.uploadVideo.useMutation({
    onSuccess: () => {
      refetchProject();
      toast.success("Video nahráno úspěšně");
    },
    onError: () => toast.error("Nahrávání selhalo"),
  });

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (500MB max)
    if (file.size > 500 * 1024 * 1024) {
      toast.error("Soubor je příliš velký. Maximum je 500MB.");
      return;
    }

    // Validate file type
    const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
    if (!validTypes.includes(file.type)) {
      toast.error("Nepodporovaný formát. Použijte MP4, MOV, AVI nebo WebM.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 50));
        }
      };
      
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        setUploadProgress(60);
        
        // First create project if needed, then upload
        if (!selectedProjectId) {
          // Create project first
          const result = await createProject.mutateAsync({
            ...newProject,
            sourceType: 'upload',
          });
          setUploadProgress(70);
          
          if (result.projectId) {
            await uploadVideo.mutateAsync({
              projectId: result.projectId,
              fileName: file.name,
              fileData: base64,
              mimeType: file.type,
            });
          }
        } else {
          await uploadVideo.mutateAsync({
            projectId: selectedProjectId,
            fileName: file.name,
            fileData: base64,
            mimeType: file.type,
          });
        }
        
        setUploadProgress(100);
        setShowNewProjectDialog(false);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Nahrávání selhalo");
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 1000);
    }
  };

  const deleteProject = trpc.videoRecreate.deleteProject.useMutation({
    onSuccess: () => {
      setSelectedProjectId(null);
      refetchProjects();
      toast.success("Projekt smazán");
    },
    onError: () => toast.error("Nepodařilo se smazat projekt"),
  });

  const handleCreateProject = async () => {
    if (!newProject.title.trim()) {
      toast.error("Zadejte název projektu");
      return;
    }
    
    // Vytvoř projekt
    createProject.mutate(newProject, {
      onSuccess: async (data) => {
        // Pokud je vybrána šablona, automaticky vygeneruj scény
        if (selectedTemplate && data.projectId) {
          toast.info(`Generuji ${selectedTemplate.scenes.length} scén ze šablony...`);
          
          // Generuj každou scénu ze šablony
          for (let i = 0; i < selectedTemplate.scenes.length; i++) {
            const scene = selectedTemplate.scenes[i];
            try {
              await generateFromTemplate.mutateAsync({
                projectId: data.projectId,
                prompt: scene.prompt,
                model: "hailuo_02",
                duration: 6,
                aspectRatio: "16:9",
              });
            } catch (error) {
              console.error(`Chyba při generování scény ${i + 1}:`, error);
            }
          }
          
          toast.success(`Všechny scény ze šablony "${selectedTemplate.title}" byly přidány do fronty`);
          setSelectedTemplate(null);
        }
      }
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <Card className="bg-[#1a1a1a] border-white/10 max-w-md">
          <CardContent className="py-12 text-center">
            <Wand2 className="h-12 w-12 text-pink-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Video Recreate Studio</h2>
            <p className="text-gray-400 mb-4">Pro přístup ke studiu se musíte přihlásit.</p>
            <a href={getLoginUrl()}>
              <Button className="bg-pink-600 hover:bg-pink-700">Přihlásit se</Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user?.role !== "creator" && user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <Card className="bg-[#1a1a1a] border-white/10 max-w-md">
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Pouze pro tvůrce</h2>
            <p className="text-gray-400 mb-4">Video Recreate Studio je dostupné pouze pro tvůrce obsahu.</p>
            <Link href="/dashboard">
              <Button className="bg-pink-600 hover:bg-pink-700">Stát se tvůrcem</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0f0f0f]/95 backdrop-blur border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Wand2 className="h-6 w-6 text-pink-500" />
                <h1 className="text-2xl font-bold text-pink-500">Video Recreate Studio</h1>
              </div>
              <Badge variant="outline" className="border-purple-500 text-purple-400">
                AI Powered
              </Badge>
            </div>
            
            <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
              <DialogTrigger asChild>
                <Button className="bg-pink-600 hover:bg-pink-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Nový projekt
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#1a1a1a] border-white/10 max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-white">Vytvořit nový projekt</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Nahrajte video nebo vložte odkaz pro AI analýzu a rozšíření
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                  {/* TG/TF Template Selection */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-white">TG/TF Šablona scénáře</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-pink-500/50 text-pink-400 hover:bg-pink-500/20"
                        onClick={() => setShowTemplates(!showTemplates)}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        {selectedTemplate ? "Změnit šablonu" : "Vybrat šablonu"}
                      </Button>
                    </div>
                    
                    {selectedTemplate && (
                      <div className="p-3 rounded-lg bg-pink-500/10 border border-pink-500/30">
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-12 rounded bg-gradient-to-br from-pink-500/30 to-purple-500/30 flex items-center justify-center">
                            <Film className="h-6 w-6 text-pink-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-medium">{selectedTemplate.title}</p>
                            <p className="text-gray-400 text-sm">{selectedTemplate.description}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-400 hover:text-white"
                            onClick={() => setSelectedTemplate(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {selectedTemplate.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs border-pink-500/30 text-pink-400">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {showTemplates && (
                      <div className="p-4 rounded-lg bg-[#0f0f0f] border border-white/10 space-y-4">
                        {/* Category Filter */}
                        <div className="flex flex-wrap gap-2">
                          {TGTF_CATEGORIES.map(cat => (
                            <Button
                              key={cat.value}
                              variant="outline"
                              size="sm"
                              className={`${
                                templateCategory === cat.value
                                  ? "bg-pink-500/20 border-pink-500 text-pink-400"
                                  : "border-white/20 text-gray-400 hover:border-pink-500/50"
                              }`}
                              onClick={() => setTemplateCategory(cat.value)}
                            >
                              <cat.icon className="h-3 w-3 mr-1" />
                              {cat.label}
                            </Button>
                          ))}
                        </div>
                        
                        {/* Template Grid */}
                        <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                          {filteredTemplates.map(template => (
                            <button
                              key={template.id}
                              onClick={() => applyTemplate(template)}
                              className="rounded-lg bg-[#1a1a1a] border border-white/10 hover:border-pink-500/50 text-left transition-colors overflow-hidden group"
                            >
                              <div className="relative aspect-video w-full overflow-hidden">
                                <img 
                                  src={template.thumbnail} 
                                  alt={template.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                <div className="absolute bottom-2 left-2 right-2">
                                  <p className="text-white font-medium text-sm truncate">{template.title}</p>
                                </div>
                                <Badge variant="outline" className="absolute top-2 right-2 text-[10px] border-pink-500/50 bg-black/50 text-pink-400">
                                  {template.scenes.length} scén
                                </Badge>
                              </div>
                              <div className="p-2">
                                <p className="text-gray-400 text-xs line-clamp-2">{template.description}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Title & Description */}
                  <div className="space-y-2">
                    <Label className="text-white">Název projektu</Label>
                    <Input
                      value={newProject.title}
                      onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                      placeholder="Můj video projekt"
                      className="bg-[#0f0f0f] border-white/10 text-white"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-white">Popis (volitelné)</Label>
                    <Textarea
                      value={newProject.description}
                      onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                      placeholder="Popište, co chcete s videem udělat..."
                      className="bg-[#0f0f0f] border-white/10 text-white resize-none"
                    />
                  </div>
                  
                  {/* Source Type */}
                  <div className="space-y-2">
                    <Label className="text-white">Zdroj videa</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: "url", label: "URL odkaz", icon: LinkIcon },
                        { value: "youtube", label: "YouTube", icon: Youtube },
                        { value: "upload", label: "Nahrát", icon: Upload },
                      ].map((source) => (
                        <button
                          key={source.value}
                          onClick={() => setNewProject({ ...newProject, sourceType: source.value as any })}
                          className={`p-4 rounded-lg border transition-colors ${
                            newProject.sourceType === source.value
                              ? "bg-pink-600/20 border-pink-500"
                              : "bg-[#0f0f0f] border-white/10 hover:border-pink-500/50"
                          }`}
                        >
                          <source.icon className={`h-6 w-6 mx-auto mb-2 ${
                            newProject.sourceType === source.value ? "text-pink-500" : "text-gray-400"
                          }`} />
                          <p className="text-sm text-white text-center">{source.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Source URL */}
                  {(newProject.sourceType === "url" || newProject.sourceType === "youtube") && (
                    <div className="space-y-2">
                      <Label className="text-white">
                        {newProject.sourceType === "youtube" ? "YouTube URL" : "Video URL"}
                      </Label>
                      <Input
                        value={newProject.sourceUrl}
                        onChange={(e) => setNewProject({ ...newProject, sourceUrl: e.target.value })}
                        placeholder={newProject.sourceType === "youtube" 
                          ? "https://youtube.com/watch?v=..." 
                          : "https://example.com/video.mp4"
                        }
                        className="bg-[#0f0f0f] border-white/10 text-white"
                      />
                    </div>
                  )}
                  
                  {newProject.sourceType === "upload" && (
                    <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      {isUploading ? (
                        <>
                          <Loader2 className="h-12 w-12 text-pink-500 mx-auto mb-4 animate-spin" />
                          <p className="text-white mb-2">Nahrávám video...</p>
                          <Progress value={uploadProgress} className="w-full max-w-xs mx-auto" />
                          <p className="text-xs text-gray-400 mt-2">{uploadProgress}%</p>
                        </>
                      ) : (
                        <>
                          <Upload className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                          <p className="text-gray-400 mb-2">Přetáhněte video sem nebo klikněte pro výběr</p>
                          <p className="text-xs text-gray-500">MP4, MOV, AVI, WebM do 500MB</p>
                          <Button 
                            variant="outline" 
                            className="mt-4" 
                            onClick={() => fileInputRef.current?.click()}
                          >
                            Vybrat soubor
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                  
                  {/* Project Type */}
                  <div className="space-y-2">
                    <Label className="text-white">Typ projektu</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {PROJECT_TYPES.map((type) => (
                        <button
                          key={type.value}
                          onClick={() => setNewProject({ ...newProject, projectType: type.value as any })}
                          className={`p-4 rounded-lg border transition-colors ${
                            newProject.projectType === type.value
                              ? "bg-pink-600/20 border-pink-500"
                              : "bg-[#0f0f0f] border-white/10 hover:border-pink-500/50"
                          }`}
                        >
                          <type.icon className={`h-6 w-6 mx-auto mb-2 ${
                            newProject.projectType === type.value ? "text-pink-500" : "text-gray-400"
                          }`} />
                          <p className="text-sm text-white text-center font-medium">{type.label}</p>
                          <p className="text-xs text-gray-500 text-center mt-1">{type.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* AI Model */}
                  <div className="space-y-2">
                    <Label className="text-white">AI Model</Label>
                    <Select
                      value={newProject.targetModel}
                      onValueChange={(value) => setNewProject({ ...newProject, targetModel: value as any })}
                    >
                      <SelectTrigger className="bg-[#0f0f0f] border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a1a] border-white/10">
                        {AI_MODELS.map((model) => (
                          <SelectItem key={model.value} value={model.value} className="text-white">
                            <div className="flex items-center gap-2">
                              <span>{model.label}</span>
                              {model.badge && (
                                <Badge variant="outline" className="text-xs border-pink-500 text-pink-400">
                                  {model.badge}
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      {AI_MODELS.find(m => m.value === newProject.targetModel)?.description}
                    </p>
                  </div>
                  
                  {/* Options */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-white">Generovat NSFW obsah</Label>
                      <p className="text-xs text-gray-500">Povolit generování nahoty (pouze WAN 2.6)</p>
                    </div>
                    <Switch
                      checked={newProject.generateNude}
                      onCheckedChange={(checked) => setNewProject({ ...newProject, generateNude: checked })}
                      disabled={newProject.targetModel !== "wan_2_6"}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-white">Generovat zvuk</Label>
                      <p className="text-xs text-gray-500">Přidat AI generovaný zvuk k videu</p>
                    </div>
                    <Switch
                      checked={newProject.generateAudio}
                      onCheckedChange={(checked) => setNewProject({ ...newProject, generateAudio: checked })}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setShowNewProjectDialog(false)}>
                    Zrušit
                  </Button>
                  <Button
                    onClick={handleCreateProject}
                    disabled={createProject.isPending || !newProject.title.trim()}
                    className="bg-pink-600 hover:bg-pink-700"
                  >
                    {createProject.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Vytvořit projekt
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Projects Sidebar */}
          <Card className="bg-[#1a1a1a] border-white/10 lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-white text-lg">Moje projekty</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {projectsLoading ? (
                <div className="space-y-2 p-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : projects && projects.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => setSelectedProjectId(project.id)}
                      className={`w-full p-4 text-left hover:bg-white/5 transition-colors ${
                        selectedProjectId === project.id ? "bg-white/10" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">{project.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className={`text-xs ${
                              project.status === "completed" ? "border-green-500 text-green-400" :
                              project.status === "analyzing" || project.status === "generating" ? "border-yellow-500 text-yellow-400" :
                              "border-gray-500 text-gray-400"
                            }`}>
                              {project.status === "draft" ? "Koncept" :
                               project.status === "analyzing" ? "Analyzuji" :
                               project.status === "generating" ? "Generuji" :
                               project.status === "completed" ? "Hotovo" : project.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true, locale: cs })}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Video className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Zatím žádné projekty</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {selectedProjectId && selectedProject ? (
              <div className="space-y-6">
                {/* Project Header */}
                <Card className="bg-[#1a1a1a] border-white/10">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-white text-xl">{selectedProject.title}</CardTitle>
                        {selectedProject.description && (
                          <CardDescription className="text-gray-400 mt-1">
                            {selectedProject.description}
                          </CardDescription>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-purple-500 text-purple-400">
                          {AI_MODELS.find(m => m.value === selectedProject.targetModel)?.label}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-400 hover:text-red-500"
                          onClick={() => {
                            if (confirm("Opravdu chcete smazat tento projekt?")) {
                              deleteProject.mutate({ projectId: selectedProjectId });
                            }
                          }}
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      {selectedProject.analysisStatus === "pending" && (
                        <Button
                          onClick={() => analyzeVideo.mutate({ projectId: selectedProjectId })}
                          disabled={analyzeVideo.isPending}
                          className="bg-pink-600 hover:bg-pink-700"
                        >
                          {analyzeVideo.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4 mr-2" />
                          )}
                          Analyzovat video
                        </Button>
                      )}
                      {selectedProject.analysisStatus === "processing" && (
                        <div className="flex items-center gap-2 text-yellow-400">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Probíhá analýza...</span>
                        </div>
                      )}
                      {selectedProject.analysisStatus === "completed" && (
                        <div className="flex items-center gap-2 text-green-400">
                          <Check className="h-4 w-4" />
                          <span>Analýza dokončena</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Scenes & Screenshots */}
                {selectedProject.analysisStatus === "completed" && extendableScenes && extendableScenes.length > 0 && (
                  <Card className="bg-[#1a1a1a] border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white">Rozšiřitelné scény</CardTitle>
                      <CardDescription className="text-gray-400">
                        Vyberte scénu a screenshot pro generování rozšířené verze
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {extendableScenes.map((scene: any) => (
                          <div key={scene.id} className="border border-white/10 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <Badge className={SCENE_TYPE_COLORS[scene.sceneType] || SCENE_TYPE_COLORS.other}>
                                  {SCENE_TYPE_LABELS[scene.sceneType] || scene.sceneType}
                                </Badge>
                                {scene.isKeyScene && (
                                  <Badge variant="outline" className="border-pink-500 text-pink-400">
                                    <Heart className="h-3 w-3 mr-1" />
                                    Klíčová scéna
                                  </Badge>
                                )}
                                <span className="text-sm text-gray-400">
                                  <Clock className="h-3 w-3 inline mr-1" />
                                  {Math.floor(scene.startTime / 1000)}s - {Math.floor(scene.endTime / 1000)}s
                                </span>
                              </div>
                            </div>
                            
                            <p className="text-gray-300 mb-4">{scene.description}</p>
                            
                            {scene.extensionSuggestion && (
                              <p className="text-sm text-pink-400 mb-4 italic">
                                💡 {scene.extensionSuggestion}
                              </p>
                            )}
                            
                            {/* Screenshots Grid */}
                            {scene.screenshots && scene.screenshots.length > 0 && (
                              <div className="grid grid-cols-4 gap-3 mb-4">
                                {scene.screenshots.map((screenshot: any) => (
                                  <button
                                    key={screenshot.id}
                                    onClick={() => selectScreenshot.mutate({
                                      screenshotId: screenshot.id,
                                      sceneId: scene.id,
                                    })}
                                    className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                                      screenshot.isSelected
                                        ? "border-pink-500 ring-2 ring-pink-500/50"
                                        : "border-white/10 hover:border-pink-500/50"
                                    }`}
                                  >
                                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-purple-500/20" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <ImageIcon className="h-8 w-8 text-gray-500" />
                                    </div>
                                    {screenshot.isSelected && (
                                      <div className="absolute top-2 right-2 bg-pink-500 rounded-full p-1">
                                        <Check className="h-3 w-3 text-white" />
                                      </div>
                                    )}
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                                      <p className="text-xs text-white">Frame {screenshot.frameNumber}</p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                            
                            <Button
                              onClick={() => {
                                const selectedScreenshot = scene.screenshots?.find((s: any) => s.isSelected);
                                generateScene.mutate({
                                  projectId: selectedProjectId,
                                  sceneId: scene.id,
                                  screenshotId: selectedScreenshot?.id,
                                });
                              }}
                              disabled={generateScene.isPending}
                              className="bg-pink-600 hover:bg-pink-700"
                            >
                              {generateScene.isPending ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Wand2 className="h-4 w-4 mr-2" />
                              )}
                              Generovat rozšíření
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Generated Segments */}
                {selectedProject.segments && selectedProject.segments.length > 0 && (
                  <Card className="bg-[#1a1a1a] border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white">Vygenerované segmenty</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        {selectedProject.segments.map((segment: any) => (
                          <div
                            key={segment.id}
                            className="border border-white/10 rounded-lg overflow-hidden"
                          >
                            <div className="aspect-video bg-[#0f0f0f] flex items-center justify-center relative">
                              {segment.status === "generating" ? (
                                <div className="text-center">
                                  <Loader2 className="h-8 w-8 text-pink-500 animate-spin mx-auto mb-2" />
                                  <p className="text-sm text-gray-400">Generuji...</p>
                                </div>
                              ) : segment.status === "completed" ? (
                                <>
                                  {segment.videoUrl ? (
                                    <video
                                      src={segment.videoUrl}
                                      className="w-full h-full object-cover"
                                      muted
                                      playsInline
                                    />
                                  ) : (
                                    <Video className="h-12 w-12 text-gray-500" />
                                  )}
                                  <Button
                                    size="icon"
                                    className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-pink-600/80 hover:bg-pink-600"
                                    onClick={() => openVideoPlayer(segment)}
                                  >
                                    <Play className="h-6 w-6" />
                                  </Button>
                                </>
                              ) : (
                                <AlertCircle className="h-8 w-8 text-red-500" />
                              )}
                            </div>
                            <div className="p-3">
                              <div className="flex items-center justify-between">
                                <Badge variant="outline" className={`text-xs ${
                                  segment.status === "completed" ? "border-green-500 text-green-400" :
                                  segment.status === "generating" ? "border-yellow-500 text-yellow-400" :
                                  "border-red-500 text-red-400"
                                }`}>
                                  {segment.status === "completed" ? "Hotovo" :
                                   segment.status === "generating" ? "Generuji" : "Chyba"}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {segment.duration / 1000}s
                                </span>
                              </div>
                              {segment.status === "completed" && (
                                <>
                                  <div className="flex items-center gap-1 mt-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <button
                                        key={star}
                                        onClick={() => toast.info("Hodnocení bude brzy dostupné")}
                                        className="text-gray-500 hover:text-yellow-400 transition-colors"
                                      >
                                        <Star className={`h-4 w-4 ${
                                          segment.userRating && star <= segment.userRating
                                            ? "fill-yellow-400 text-yellow-400"
                                            : ""
                                        }`} />
                                      </button>
                                    ))}
                                  </div>
                                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="flex-1 border-white/20 hover:bg-white/10"
                                      onClick={() => handleShare(segment)}
                                    >
                                      <Share2 className="h-4 w-4 mr-1" />
                                      Sdílet
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="border-white/20 hover:bg-white/10"
                                      onClick={() => downloadVideo(segment)}
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="bg-[#1a1a1a] border-white/10">
                <CardContent className="py-16 text-center">
                  <Wand2 className="h-16 w-16 text-gray-600 mx-auto mb-6" />
                  <h2 className="text-2xl font-bold text-white mb-4">Video Recreate Studio</h2>
                  <p className="text-gray-400 max-w-md mx-auto mb-6">
                    Vytvořte rozšířené verze videí pomocí AI. Analyzujte video, vyberte klíčové scény
                    a nechte AI vygenerovat pokračování nebo remake.
                  </p>
                  <Button
                    onClick={() => setShowNewProjectDialog(true)}
                    className="bg-pink-600 hover:bg-pink-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Vytvořit první projekt
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="bg-[#1a1a1a] border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Sdílet video</DialogTitle>
            <DialogDescription className="text-gray-400">
              Vyberte platformu pro sdílení vašeho AI-generovaného videa
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <Button
              variant="outline"
              className="border-white/20 hover:bg-blue-600/20 hover:border-blue-500 h-16 flex-col gap-1"
              onClick={() => shareToSocial('facebook')}
            >
              <Facebook className="h-6 w-6 text-blue-500" />
              <span className="text-sm">Facebook</span>
            </Button>
            <Button
              variant="outline"
              className="border-white/20 hover:bg-sky-600/20 hover:border-sky-500 h-16 flex-col gap-1"
              onClick={() => shareToSocial('twitter')}
            >
              <Twitter className="h-6 w-6 text-sky-500" />
              <span className="text-sm">Twitter / X</span>
            </Button>
            <Button
              variant="outline"
              className="border-white/20 hover:bg-pink-600/20 hover:border-pink-500 h-16 flex-col gap-1"
              onClick={() => shareToSocial('instagram')}
            >
              <Instagram className="h-6 w-6 text-pink-500" />
              <span className="text-sm">Instagram</span>
            </Button>
            <Button
              variant="outline"
              className="border-white/20 hover:bg-purple-600/20 hover:border-purple-500 h-16 flex-col gap-1"
              onClick={() => shareToSocial('tiktok')}
            >
              <Video className="h-6 w-6 text-purple-500" />
              <span className="text-sm">TikTok</span>
            </Button>
          </div>
          <div className="mt-4 pt-4 border-t border-white/10">
            <Button
              variant="outline"
              className="w-full border-white/20 hover:bg-white/10"
              onClick={() => shareToSocial('copy')}
            >
              <Copy className="h-4 w-4 mr-2" />
              Zkopírovat odkaz
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Video Player Modal */}
      <Dialog open={videoPlayerOpen} onOpenChange={(open) => !open && closeVideoPlayer()}>
        <DialogContent className="bg-[#0a0a0a] border-white/10 max-w-4xl p-0 overflow-hidden">
          <div className="relative">
            {/* Video Element */}
            <div className="aspect-video bg-black">
              {selectedVideoSegment?.videoUrl && (
                <video
                  ref={videoRef}
                  src={selectedVideoSegment.videoUrl}
                  className="w-full h-full"
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={handleVideoEnded}
                  onClick={togglePlay}
                />
              )}
            </div>

            {/* Video Controls Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
              {/* Progress Bar */}
              <div className="mb-3">
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-pink-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                />
              </div>

              {/* Controls Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* Skip Back */}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-white hover:bg-white/20"
                    onClick={() => skipTime(-5)}
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>

                  {/* Play/Pause */}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-10 w-10 text-white hover:bg-white/20"
                    onClick={togglePlay}
                  >
                    {isPlaying ? (
                      <Pause className="h-6 w-6" />
                    ) : (
                      <Play className="h-6 w-6" />
                    )}
                  </Button>

                  {/* Skip Forward */}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-white hover:bg-white/20"
                    onClick={() => skipTime(5)}
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>

                  {/* Volume */}
                  <div className="flex items-center gap-2 ml-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-white hover:bg-white/20"
                      onClick={toggleMute}
                    >
                      {isMuted ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-20 h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                    />
                  </div>

                  {/* Time Display */}
                  <span className="text-white text-sm ml-3">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Share Button */}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-white hover:bg-white/20"
                    onClick={() => {
                      closeVideoPlayer();
                      handleShare(selectedVideoSegment);
                    }}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>

                  {/* Download Button */}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-white hover:bg-white/20"
                    onClick={() => downloadVideo(selectedVideoSegment)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>

                  {/* Fullscreen */}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-white hover:bg-white/20"
                    onClick={toggleFullscreen}
                  >
                    <Maximize className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Video Info */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium">Vygenerovaný segment</h3>
                <p className="text-gray-400 text-sm mt-1">
                  Délka: {selectedVideoSegment?.duration ? (selectedVideoSegment.duration / 1000).toFixed(1) : 0}s
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="border-white/20 hover:bg-white/10"
                  onClick={() => {
                    closeVideoPlayer();
                    handleShare(selectedVideoSegment);
                  }}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Sdílet
                </Button>
                <Button
                  className="bg-pink-600 hover:bg-pink-700"
                  onClick={() => downloadVideo(selectedVideoSegment)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Stáhnout
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
