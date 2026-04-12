import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Users, MessageSquare, Bot, RotateCcw, UserPlus,
  TrendingUp, DollarSign, Send, Plus, Zap, Star,
  Clock, Target, ChevronRight, Sparkles, Shield,
  Film, Copy, Wand2, Play, BookOpen, FolderOpen, RefreshCw
} from "lucide-react";

// ─── Category labels ─────────────────────────────────────────────────────────
const CATEGORY_LABELS: Record<string, string> = {
  cinematic: "🎬 Cinematic",
  transformation: "✨ Transformation",
  time_freeze: "⏸️ Time-Freeze",
  action: "⚡ Action",
  fantasy: "🔮 Fantasy",
  romance: "💕 Romance",
  horror: "🌑 Horror",
  comedy: "😄 Comedy",
  custom: "🛠️ Custom",
};

// ─── Video Studio Tab (Seedance 2.0) ─────────────────────────────────────────
function VideoStudioTab() {
  const [activeView, setActiveView] = useState<"templates" | "generator" | "projects">("templates");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [generatorForm, setGeneratorForm] = useState({
    title: "",
    basePrompt: "",
    style: "cinematic",
    mood: "dramatic",
    cameraMovement: "smooth tracking",
    lighting: "natural cinematic",
    duration: 15,
    aspectRatio: "16:9",
    negativePrompt: "",
    templateId: undefined as number | undefined,
  });
  const [enhancedPrompt, setEnhancedPrompt] = useState("");
  const [copied, setCopied] = useState(false);

  const { data: templates, isLoading: templatesLoading } = trpc.promptStudio.listTemplates.useQuery(
    selectedCategory !== "all" ? { category: selectedCategory as any } : undefined
  );
  const { data: projects, refetch: refetchProjects } = trpc.promptStudio.listProjects.useQuery();

  const generateMutation = trpc.promptStudio.generatePrompt.useMutation({
    onSuccess: (data) => {
      setEnhancedPrompt(data.enhancedPrompt);
      toast.success("AI prompt vylepšen!");
    },
    onError: () => toast.error("Chyba při generování promptu"),
  });

  const saveProjectMutation = trpc.promptStudio.createProject.useMutation({
    onSuccess: () => {
      toast.success("Projekt uložen!");
      refetchProjects();
      setActiveView("projects");
    },
    onError: () => toast.error("Chyba při ukládání projektu"),
  });

  const handleUseTemplate = (template: any) => {
    setSelectedTemplate(template);
    setGeneratorForm(prev => ({
      ...prev,
      title: template.title,
      basePrompt: template.prompt,
      negativePrompt: template.negativePrompt || "",
      duration: template.duration || 15,
      aspectRatio: template.aspectRatio || "16:9",
      templateId: template.id,
    }));
    setEnhancedPrompt("");
    setActiveView("generator");
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Prompt zkopírován do schránky!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerate = () => {
    if (!generatorForm.basePrompt.trim()) {
      toast.error("Zadej základní prompt");
      return;
    }
    generateMutation.mutate({
      basePrompt: generatorForm.basePrompt,
      style: generatorForm.style,
      mood: generatorForm.mood,
      cameraMovement: generatorForm.cameraMovement,
      lighting: generatorForm.lighting,
      duration: generatorForm.duration,
      aspectRatio: generatorForm.aspectRatio,
    });
  };

  const handleSaveProject = () => {
    if (!generatorForm.title.trim() || !generatorForm.basePrompt.trim()) {
      toast.error("Zadej název a prompt");
      return;
    }
    saveProjectMutation.mutate({
      title: generatorForm.title,
      templateId: generatorForm.templateId,
      prompt: enhancedPrompt || generatorForm.basePrompt,
      negativePrompt: generatorForm.negativePrompt || undefined,
      engine: "seedance-2.0",
      duration: generatorForm.duration,
      aspectRatio: generatorForm.aspectRatio,
    });
  };

  const categories = ["all", "cinematic", "transformation", "time_freeze", "action", "fantasy", "romance", "horror", "comedy"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Film className="h-5 w-5 text-purple-400" />
            AI Video Prompt Studio
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">Seedance 2.0</Badge>
          </h3>
          <p className="text-sm text-gray-400 mt-1">Profesionální AI video prompty pro tvorbu cinematic obsahu</p>
        </div>
        <div className="flex gap-2">
          {(["templates", "generator", "projects"] as const).map(view => (
            <Button
              key={view}
              size="sm"
              variant={activeView === view ? "default" : "outline"}
              onClick={() => setActiveView(view)}
              className={activeView === view ? "bg-purple-500 text-white" : "border-white/20 text-gray-300"}
            >
              {view === "templates" && <BookOpen className="h-3 w-3 mr-1" />}
              {view === "generator" && <Wand2 className="h-3 w-3 mr-1" />}
              {view === "projects" && <FolderOpen className="h-3 w-3 mr-1" />}
              {view === "templates" ? "Šablony" : view === "generator" ? "Generátor" : "Projekty"}
            </Button>
          ))}
        </div>
      </div>

      {/* TEMPLATES VIEW */}
      {activeView === "templates" && (
        <div className="space-y-4">
          {/* Category filter */}
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <Button
                key={cat}
                size="sm"
                variant={selectedCategory === cat ? "default" : "outline"}
                onClick={() => setSelectedCategory(cat)}
                className={selectedCategory === cat ? "bg-purple-500 text-white" : "border-white/20 text-gray-300 text-xs"}
              >
                {cat === "all" ? "🎯 Všechny" : CATEGORY_LABELS[cat] || cat}
              </Button>
            ))}
          </div>

          {/* Templates grid */}
          {templatesLoading ? (
            <div className="text-center py-12 text-gray-400">Načítám šablony...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(templates ?? []).map((template: any) => (
                <Card key={template.id} className={`bg-white/5 border-white/10 hover:bg-white/10 transition-all cursor-pointer group ${
                  template.isFeatured ? "border-purple-500/40 bg-purple-500/5" : ""
                }`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {template.isFeatured && (
                            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">⭐ Featured</Badge>
                          )}
                          <Badge className="bg-white/10 text-gray-300 border-white/20 text-xs">
                            {CATEGORY_LABELS[template.category] || template.category}
                          </Badge>
                        </div>
                        <CardTitle className="text-white text-sm font-semibold">{template.title}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">{template.prompt}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {template.cameraStyle && (
                        <span className="flex items-center gap-1"><Play className="h-3 w-3" />{template.cameraStyle}</span>
                      )}
                      <span>{template.duration}s</span>
                      <span>{template.aspectRatio}</span>
                      <span>{template.usageCount} použití</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-purple-500 text-white hover:bg-purple-400 text-xs"
                        onClick={() => handleUseTemplate(template)}
                      >
                        <Wand2 className="h-3 w-3 mr-1" /> Použít šablonu
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/20 text-gray-300 hover:bg-white/10 text-xs"
                        onClick={() => handleCopy(template.prompt)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* GENERATOR VIEW */}
      {activeView === "generator" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Input form */}
          <div className="space-y-4">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Wand2 className="h-4 w-4 text-purple-400" /> Konfigurace promptu
                </CardTitle>
                {selectedTemplate && (
                  <CardDescription className="text-purple-300 text-xs">
                    Šablona: {selectedTemplate.title}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-gray-300 text-xs">Název projektu</Label>
                  <Input
                    value={generatorForm.title}
                    onChange={e => setGeneratorForm(p => ({ ...p, title: e.target.value }))}
                    className="bg-white/5 border-white/20 text-white mt-1"
                    placeholder="Můj cinematic projekt..."
                  />
                </div>
                <div>
                  <Label className="text-gray-300 text-xs">Základní prompt *</Label>
                  <Textarea
                    value={generatorForm.basePrompt}
                    onChange={e => setGeneratorForm(p => ({ ...p, basePrompt: e.target.value }))}
                    className="bg-white/5 border-white/20 text-white mt-1"
                    rows={5}
                    placeholder="Popiš scénu, postavu, akci..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-gray-300 text-xs">Styl</Label>
                    <Select value={generatorForm.style} onValueChange={v => setGeneratorForm(p => ({ ...p, style: v }))}>
                      <SelectTrigger className="bg-white/5 border-white/20 text-white mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-white/20">
                        {["cinematic","documentary","noir","fantasy","horror","romance"].map(s => (
                          <SelectItem key={s} value={s} className="text-white">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-gray-300 text-xs">Nálada</Label>
                    <Select value={generatorForm.mood} onValueChange={v => setGeneratorForm(p => ({ ...p, mood: v }))}>
                      <SelectTrigger className="bg-white/5 border-white/20 text-white mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-white/20">
                        {["dramatic","sensual","mysterious","epic","intimate","playful"].map(s => (
                          <SelectItem key={s} value={s} className="text-white">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-gray-300 text-xs">Pohyb kamery</Label>
                    <Select value={generatorForm.cameraMovement} onValueChange={v => setGeneratorForm(p => ({ ...p, cameraMovement: v }))}>
                      <SelectTrigger className="bg-white/5 border-white/20 text-white mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-white/20">
                        {["smooth tracking","360° orbital","slow push-in","handheld","crane shot","static"].map(s => (
                          <SelectItem key={s} value={s} className="text-white">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-gray-300 text-xs">Osvětlení</Label>
                    <Select value={generatorForm.lighting} onValueChange={v => setGeneratorForm(p => ({ ...p, lighting: v }))}>
                      <SelectTrigger className="bg-white/5 border-white/20 text-white mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-white/20">
                        {["natural cinematic","golden hour","neon","studio","candlelight","dramatic shadows"].map(s => (
                          <SelectItem key={s} value={s} className="text-white">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-gray-300 text-xs">Délka (s)</Label>
                    <Select value={String(generatorForm.duration)} onValueChange={v => setGeneratorForm(p => ({ ...p, duration: Number(v) }))}>
                      <SelectTrigger className="bg-white/5 border-white/20 text-white mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-white/20">
                        {[5,8,10,12,15,20,30].map(d => (
                          <SelectItem key={d} value={String(d)} className="text-white">{d}s</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-gray-300 text-xs">Poměr stran</Label>
                    <Select value={generatorForm.aspectRatio} onValueChange={v => setGeneratorForm(p => ({ ...p, aspectRatio: v }))}>
                      <SelectTrigger className="bg-white/5 border-white/20 text-white mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-white/20">
                        {["16:9","9:16","1:1","4:5","21:9"].map(r => (
                          <SelectItem key={r} value={r} className="text-white">{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-300 text-xs">Negative prompt (volitelné)</Label>
                  <Input
                    value={generatorForm.negativePrompt}
                    onChange={e => setGeneratorForm(p => ({ ...p, negativePrompt: e.target.value }))}
                    className="bg-white/5 border-white/20 text-white mt-1"
                    placeholder="cartoon, anime, low quality..."
                  />
                </div>
                <Button
                  className="w-full bg-purple-500 text-white hover:bg-purple-400"
                  onClick={handleGenerate}
                  disabled={generateMutation.isPending}
                >
                  {generateMutation.isPending ? (
                    <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> AI vylepšuje prompt...</>
                  ) : (
                    <><Sparkles className="h-4 w-4 mr-2" /> Vylepšit AI promptem</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right: Enhanced prompt output */}
          <div className="space-y-4">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-yellow-400" /> Vylepšený prompt
                  <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-xs ml-auto">Seedance 2.0 Ready</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {enhancedPrompt ? (
                  <>
                    <div className="bg-black/30 rounded-lg p-4 border border-purple-500/20">
                      <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{enhancedPrompt}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        className="flex-1 bg-green-500 text-black hover:bg-green-400"
                        onClick={() => handleCopy(enhancedPrompt)}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        {copied ? "Zkopírováno!" : "Kopírovat prompt"}
                      </Button>
                      <Button
                        variant="outline"
                        className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20"
                        onClick={handleSaveProject}
                        disabled={saveProjectMutation.isPending}
                      >
                        <FolderOpen className="h-4 w-4 mr-2" /> Uložit projekt
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <Wand2 className="h-12 w-12 mx-auto mb-3 text-purple-400 opacity-40" />
                    <p className="text-gray-400 text-sm">Vyplň prompt a klikni na \"Vylepšit AI promptem\"</p>
                    <p className="text-gray-500 text-xs mt-1">AI přidá technické detaily, kamerové instrukce a color grade</p>
                  </div>
                )}

                {/* Quick copy of base prompt */}
                {generatorForm.basePrompt && !enhancedPrompt && (
                  <div className="border-t border-white/10 pt-4">
                    <p className="text-xs text-gray-400 mb-2">Nebo zkopíruj základní prompt přímo:</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full border-white/20 text-gray-300"
                      onClick={() => handleCopy(generatorForm.basePrompt)}
                    >
                      <Copy className="h-3 w-3 mr-2" /> Kopírovat základní prompt
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Seedance 2.0 tips */}
            <Card className="bg-purple-500/5 border-purple-500/20">
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-purple-300 mb-2">💡 Seedance 2.0 tipy</p>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• Používej sekce [SCENE], [CAMERA], [LIGHTING], [MOOD]</li>
                  <li>• Specifikuj fps: "120fps slow motion" nebo "24fps cinematic"</li>
                  <li>• Přidej color grade: "warm teal-orange", "desaturated cold"</li>
                  <li>• Uveď typ objektivu: "anamorphic", "85mm portrait", "wide angle"</li>
                  <li>• Time-freeze: "particles suspended mid-air", "fabric frozen in wave"</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* PROJECTS VIEW */}
      {activeView === "projects" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-white font-medium">Moje video projekty</h4>
            <Button size="sm" variant="outline" className="border-white/20 text-gray-300" onClick={() => setActiveView("generator")}>
              <Plus className="h-3 w-3 mr-1" /> Nový projekt
            </Button>
          </div>
          {(projects ?? []).length === 0 ? (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-8 text-center">
                <Film className="h-12 w-12 mx-auto mb-3 text-purple-400 opacity-30" />
                <p className="text-gray-400">Zatím žádné projekty</p>
                <p className="text-gray-500 text-xs mt-1">Vytvoř svůj první AI video projekt</p>
                <Button size="sm" className="mt-4 bg-purple-500 text-white" onClick={() => setActiveView("templates")}>
                  Procházet šablony
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {(projects ?? []).map((project: any) => (
                <Card key={project.id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="text-white font-medium text-sm">{project.title}</h5>
                          <Badge className={`text-xs ${
                            project.status === "completed" ? "bg-green-500/20 text-green-300" :
                            project.status === "generating" ? "bg-yellow-500/20 text-yellow-300" :
                            project.status === "failed" ? "bg-red-500/20 text-red-300" :
                            "bg-gray-500/20 text-gray-300"
                          }`}>{project.status}</Badge>
                        </div>
                        <p className="text-xs text-gray-400 line-clamp-2">{project.prompt}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span>{project.engine}</span>
                          <span>{project.duration}s</span>
                          <span>{project.aspectRatio}</span>
                          <span>{new Date(project.createdAt).toLocaleDateString("cs-CZ")}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-gray-400 hover:text-white ml-3"
                        onClick={() => handleCopy(project.prompt)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Segment badge colors ────────────────────────────────────────────────────
const segmentColor: Record<string, string> = {
  new: "bg-blue-500/20 text-blue-300",
  active: "bg-green-500/20 text-green-300",
  vip: "bg-yellow-500/20 text-yellow-300",
  inactive: "bg-gray-500/20 text-gray-400",
  churned: "bg-red-500/20 text-red-400",
};

// ─── Fan CRM Tab ─────────────────────────────────────────────────────────────
function FanCrmTab() {
  const [segment, setSegment] = useState<string>("all");
  const [editFan, setEditFan] = useState<{ userId: number; notes?: string; segment?: string } | null>(null);

  const { data: stats } = trpc.fanCrm.getStats.useQuery();
  const { data: fans, refetch } = trpc.fanCrm.getProfiles.useQuery({ segment: segment === "all" ? undefined : segment });
  const { data: inactive } = trpc.fanCrm.getInactiveFans.useQuery({ days: 30 });
  const updateMutation = trpc.fanCrm.updateProfile.useMutation({
    onSuccess: () => { toast.success("Fan profile updated"); refetch(); setEditFan(null); }
  });

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Total Fans", value: stats?.total ?? 0, icon: Users, color: "text-cyan-400" },
          { label: "VIP", value: stats?.vip ?? 0, icon: Star, color: "text-yellow-400" },
          { label: "Inactive", value: stats?.inactive ?? 0, icon: Clock, color: "text-gray-400" },
          { label: "New", value: stats?.new ?? 0, icon: Zap, color: "text-blue-400" },
          { label: "Total LTV", value: `$${parseFloat(stats?.totalLtv ?? "0").toFixed(0)}`, icon: DollarSign, color: "text-green-400" },
        ].map(s => (
          <Card key={s.label} className="bg-white/5 border-white/10">
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-8 w-8 ${s.color}`} />
              <div>
                <p className="text-xs text-gray-400">{s.label}</p>
                <p className="text-xl font-bold text-white">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Inactive fans alert */}
      {(inactive?.length ?? 0) > 0 && (
        <Card className="bg-orange-500/10 border-orange-500/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-orange-400" />
              <div>
                <p className="text-sm font-semibold text-orange-300">{inactive?.length} inactive fans (30+ days)</p>
                <p className="text-xs text-gray-400">Consider running a winback campaign</p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="border-orange-500/50 text-orange-300 hover:bg-orange-500/20">
              View Winback
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {["all", "new", "active", "vip", "inactive", "churned"].map(s => (
          <Button
            key={s}
            size="sm"
            variant={segment === s ? "default" : "outline"}
            onClick={() => setSegment(s)}
            className={segment === s ? "bg-cyan-500 text-black" : "border-white/20 text-gray-300"}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </Button>
        ))}
      </div>

      {/* Fan list */}
      <div className="space-y-2">
        {(fans ?? []).length === 0 && (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-8 text-center text-gray-400">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No fans yet. Start creating content to build your audience!</p>
            </CardContent>
          </Card>
        )}
        {(fans ?? []).map((fan: any) => (
          <Card key={fan.id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                  {(fan.userName || "?")[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{fan.userName || "Anonymous"}</p>
                  <p className="text-xs text-gray-400">{fan.userEmail || ""}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-1 rounded-full ${segmentColor[fan.segment] || ""}`}>
                  {fan.segment}
                </span>
                <span className="text-sm text-green-400 font-medium">${parseFloat(fan.ltv || "0").toFixed(2)}</span>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="ghost" onClick={() => setEditFan({ userId: fan.userId, notes: fan.notes, segment: fan.segment })}>
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-900 border-white/20">
                    <DialogHeader><DialogTitle className="text-white">Edit Fan Profile</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-gray-300">Segment</Label>
                        <Select defaultValue={fan.segment} onValueChange={v => setEditFan(prev => prev ? { ...prev, segment: v } : null)}>
                          <SelectTrigger className="bg-white/5 border-white/20 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-900 border-white/20">
                            {["new", "active", "vip", "inactive", "churned"].map(s => (
                              <SelectItem key={s} value={s} className="text-white">{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-gray-300">Notes</Label>
                        <Textarea
                          defaultValue={fan.notes || ""}
                          onChange={e => setEditFan(prev => prev ? { ...prev, notes: e.target.value } : null)}
                          className="bg-white/5 border-white/20 text-white"
                          placeholder="Private notes about this fan..."
                        />
                      </div>
                      <Button
                        className="w-full bg-cyan-500 text-black hover:bg-cyan-400"
                        onClick={() => editFan && updateMutation.mutate({ userId: fan.userId, segment: editFan.segment as any, notes: editFan.notes })}
                        disabled={updateMutation.isPending}
                      >
                        Save Changes
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Mass Messaging Tab ───────────────────────────────────────────────────────
function MassMessagingTab() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", message: "", targetSegment: "all" });

  const { data: campaigns, refetch } = trpc.massCampaign.list.useQuery();
  const createMutation = trpc.massCampaign.create.useMutation({
    onSuccess: () => { toast.success("Campaign created!"); refetch(); setOpen(false); setForm({ title: "", message: "", targetSegment: "all" }); }
  });
  const sendMutation = trpc.massCampaign.send.useMutation({
    onSuccess: (data) => { toast.success(`Campaign sent to ${data.sent} fans!`); refetch(); }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Mass Messaging</h3>
          <p className="text-sm text-gray-400">Send targeted messages to fan segments</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-cyan-500 text-black hover:bg-cyan-400">
              <Plus className="h-4 w-4 mr-2" /> New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-white/20">
            <DialogHeader><DialogTitle className="text-white">Create Campaign</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">Campaign Title</Label>
                <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="bg-white/5 border-white/20 text-white" placeholder="Weekend Special..." />
              </div>
              <div>
                <Label className="text-gray-300">Message</Label>
                <Textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} className="bg-white/5 border-white/20 text-white" rows={4} placeholder="Hey gorgeous! I have something special for you..." />
              </div>
              <div>
                <Label className="text-gray-300">Target Segment</Label>
                <Select value={form.targetSegment} onValueChange={v => setForm(p => ({ ...p, targetSegment: v }))}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-gray-900 border-white/20">
                    {["all", "new", "active", "vip", "inactive", "churned"].map(s => (
                      <SelectItem key={s} value={s} className="text-white">{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full bg-cyan-500 text-black hover:bg-cyan-400" onClick={() => createMutation.mutate(form as any)} disabled={createMutation.isPending || !form.title || !form.message}>
                Create Campaign
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {(campaigns ?? []).length === 0 && (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-8 text-center text-gray-400">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No campaigns yet. Create your first mass message!</p>
            </CardContent>
          </Card>
        )}
        {(campaigns ?? []).map((c: any) => (
          <Card key={c.id} className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-white">{c.title}</p>
                    <Badge variant="outline" className={c.status === 'sent' ? 'border-green-500/50 text-green-400' : 'border-gray-500/50 text-gray-400'}>
                      {c.status}
                    </Badge>
                    <Badge variant="outline" className="border-cyan-500/50 text-cyan-400">{c.targetSegment}</Badge>
                  </div>
                  <p className="text-sm text-gray-400 line-clamp-2">{c.message}</p>
                  {c.status === 'sent' && (
                    <div className="flex gap-4 mt-2 text-xs text-gray-400">
                      <span>Sent: {c.sentCount}</span>
                      <span>Opens: {c.openCount}</span>
                      <span>Replies: {c.replyCount}</span>
                    </div>
                  )}
                </div>
                {c.status === 'draft' && (
                  <Button size="sm" className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 ml-4"
                    onClick={() => sendMutation.mutate({ campaignId: c.id })} disabled={sendMutation.isPending}>
                    <Send className="h-3 w-3 mr-1" /> Send
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── AI Personas Tab ──────────────────────────────────────────────────────────
function AiPersonasTab() {
  const [open, setOpen] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [testPersonaId, setTestPersonaId] = useState<number | null>(null);
  const [testMessage, setTestMessage] = useState("");
  const [testReply, setTestReply] = useState("");
  const [form, setForm] = useState({ name: "", personality: "friendly", tone: "casual", language: "cs", systemPrompt: "", autoReply: false });

  const { data: personas, refetch } = trpc.aiPersona.list.useQuery();
  const createMutation = trpc.aiPersona.create.useMutation({
    onSuccess: () => { toast.success("AI Persona created!"); refetch(); setOpen(false); }
  });
  const updateMutation = trpc.aiPersona.update.useMutation({
    onSuccess: () => { toast.success("Persona updated!"); refetch(); }
  });
  const replyMutation = trpc.aiPersona.generateReply.useMutation({
    onSuccess: (data) => setTestReply(data.reply)
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">AI Personas</h3>
          <p className="text-sm text-gray-400">Create AI personalities for automated fan engagement</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-500 text-white hover:bg-purple-400">
              <Plus className="h-4 w-4 mr-2" /> New Persona
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-white/20 max-w-lg">
            <DialogHeader><DialogTitle className="text-white">Create AI Persona</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">Persona Name</Label>
                <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="bg-white/5 border-white/20 text-white" placeholder="Luna, Sofia, Alex..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-gray-300">Personality</Label>
                  <Select value={form.personality} onValueChange={v => setForm(p => ({ ...p, personality: v }))}>
                    <SelectTrigger className="bg-white/5 border-white/20 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/20">
                      {["flirty", "friendly", "professional", "playful", "mysterious"].map(v => (
                        <SelectItem key={v} value={v} className="text-white">{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-300">Tone</Label>
                  <Select value={form.tone} onValueChange={v => setForm(p => ({ ...p, tone: v }))}>
                    <SelectTrigger className="bg-white/5 border-white/20 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/20">
                      {["casual", "formal", "seductive", "sweet", "bold"].map(v => (
                        <SelectItem key={v} value={v} className="text-white">{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-gray-300">Language</Label>
                <Select value={form.language} onValueChange={v => setForm(p => ({ ...p, language: v }))}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-gray-900 border-white/20">
                    <SelectItem value="cs" className="text-white">Czech</SelectItem>
                    <SelectItem value="en" className="text-white">English</SelectItem>
                    <SelectItem value="sk" className="text-white">Slovak</SelectItem>
                    <SelectItem value="de" className="text-white">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-300">Custom System Prompt (optional)</Label>
                <Textarea value={form.systemPrompt} onChange={e => setForm(p => ({ ...p, systemPrompt: e.target.value }))} className="bg-white/5 border-white/20 text-white" rows={3} placeholder="You are Luna, a mysterious creator who..." />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.autoReply} onCheckedChange={v => setForm(p => ({ ...p, autoReply: v }))} />
                <Label className="text-gray-300">Enable Auto-Reply</Label>
              </div>
              <Button className="w-full bg-purple-500 text-white hover:bg-purple-400" onClick={() => createMutation.mutate(form as any)} disabled={createMutation.isPending || !form.name}>
                Create Persona
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {(personas ?? []).length === 0 && (
          <Card className="bg-white/5 border-white/10 md:col-span-2">
            <CardContent className="p-8 text-center text-gray-400">
              <Bot className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No AI personas yet. Create your first one to automate fan engagement!</p>
            </CardContent>
          </Card>
        )}
        {(personas ?? []).map((p: any) => (
          <Card key={p.id} className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                      {p.name[0]}
                    </div>
                    <p className="font-semibold text-white">{p.name}</p>
                    {p.isActive && <Badge className="bg-green-500/20 text-green-400 text-xs">Active</Badge>}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{p.personality} · {p.tone} · {p.language.toUpperCase()}</p>
                </div>
                <Switch checked={p.isActive} onCheckedChange={v => updateMutation.mutate({ id: p.id, isActive: v })} />
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 border-white/20 text-gray-300 text-xs"
                  onClick={() => { setTestPersonaId(p.id); setTestOpen(true); setTestReply(""); }}>
                  <Zap className="h-3 w-3 mr-1" /> Test
                </Button>
                <Button size="sm" variant="outline" className={`flex-1 border-white/20 text-xs ${p.autoReply ? 'text-green-400' : 'text-gray-300'}`}
                  onClick={() => updateMutation.mutate({ id: p.id, autoReply: !p.autoReply })}>
                  {p.autoReply ? "Auto ON" : "Auto OFF"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Test dialog */}
      <Dialog open={testOpen} onOpenChange={setTestOpen}>
        <DialogContent className="bg-gray-900 border-white/20">
          <DialogHeader><DialogTitle className="text-white">Test AI Persona</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Textarea value={testMessage} onChange={e => setTestMessage(e.target.value)} className="bg-white/5 border-white/20 text-white" rows={3} placeholder="Type a fan message to test..." />
            <Button className="w-full bg-purple-500 text-white hover:bg-purple-400"
              onClick={() => testPersonaId && replyMutation.mutate({ personaId: testPersonaId, message: testMessage })}
              disabled={replyMutation.isPending || !testMessage}>
              {replyMutation.isPending ? "Generating..." : "Generate Reply"}
            </Button>
            {testReply && (
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                <p className="text-xs text-purple-400 mb-1">AI Reply:</p>
                <p className="text-white">{testReply}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Winback Tab ──────────────────────────────────────────────────────────────
function WinbackTab() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ triggerDays: 30, message: "", isActive: true });

  const { data: campaigns, refetch } = trpc.winback.list.useQuery();
  const { data: inactive } = trpc.fanCrm.getInactiveFans.useQuery({ days: 30 });
  const createMutation = trpc.winback.create.useMutation({
    onSuccess: () => { toast.success("Winback campaign created!"); refetch(); setOpen(false); }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Winback Campaigns</h3>
          <p className="text-sm text-gray-400">Re-engage inactive fans automatically</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 text-white hover:bg-orange-400">
              <Plus className="h-4 w-4 mr-2" /> New Winback
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-white/20">
            <DialogHeader><DialogTitle className="text-white">Create Winback Campaign</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">Trigger after (days inactive)</Label>
                <Input type="number" value={form.triggerDays} onChange={e => setForm(p => ({ ...p, triggerDays: parseInt(e.target.value) }))} className="bg-white/5 border-white/20 text-white" />
              </div>
              <div>
                <Label className="text-gray-300">Re-engagement Message</Label>
                <Textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} className="bg-white/5 border-white/20 text-white" rows={4} placeholder="Hey, I miss you! Come back and see what you've been missing..." />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.isActive} onCheckedChange={v => setForm(p => ({ ...p, isActive: v }))} />
                <Label className="text-gray-300">Active</Label>
              </div>
              <Button className="w-full bg-orange-500 text-white hover:bg-orange-400" onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending || !form.message}>
                Create Winback
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Inactive fans summary */}
      <Card className="bg-orange-500/10 border-orange-500/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <RotateCcw className="h-8 w-8 text-orange-400" />
            <div>
              <p className="font-semibold text-white">{inactive?.length ?? 0} fans inactive for 30+ days</p>
              <p className="text-sm text-gray-400">Average LTV: ${inactive?.length ? (inactive.reduce((s: number, f: any) => s + parseFloat(f.ltv || "0"), 0) / inactive.length).toFixed(2) : "0"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {(campaigns ?? []).length === 0 && (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-8 text-center text-gray-400">
              <RotateCcw className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No winback campaigns yet. Create one to re-engage inactive fans!</p>
            </CardContent>
          </Card>
        )}
        {(campaigns ?? []).map((c: any) => (
          <Card key={c.id} className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-white">After {c.triggerDays} days inactive</p>
                    <Badge className={c.isActive ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}>
                      {c.isActive ? "Active" : "Paused"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-400 line-clamp-2">{c.message}</p>
                  <p className="text-xs text-gray-500 mt-1">Sent: {c.sentCount} · Reconverted: {c.reconvertedCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Team Management Tab ──────────────────────────────────────────────────────
function TeamTab() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ userId: "", role: "chatter" });

  const { data: members, refetch } = trpc.team.list.useQuery();
  const addMutation = trpc.team.add.useMutation({
    onSuccess: () => { toast.success("Team member added!"); refetch(); setOpen(false); }
  });
  const removeMutation = trpc.team.remove.useMutation({
    onSuccess: () => { toast.success("Member removed"); refetch(); }
  });

  const roleColor: Record<string, string> = {
    manager: "text-yellow-400 bg-yellow-500/20",
    chatter: "text-cyan-400 bg-cyan-500/20",
    analyst: "text-blue-400 bg-blue-500/20",
    moderator: "text-purple-400 bg-purple-500/20",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Team Management</h3>
          <p className="text-sm text-gray-400">Manage your team members and their roles</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-500 text-white hover:bg-blue-400">
              <UserPlus className="h-4 w-4 mr-2" /> Add Member
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-white/20">
            <DialogHeader><DialogTitle className="text-white">Add Team Member</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">User ID</Label>
                <Input value={form.userId} onChange={e => setForm(p => ({ ...p, userId: e.target.value }))} className="bg-white/5 border-white/20 text-white" placeholder="Enter user ID..." />
              </div>
              <div>
                <Label className="text-gray-300">Role</Label>
                <Select value={form.role} onValueChange={v => setForm(p => ({ ...p, role: v }))}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-gray-900 border-white/20">
                    {["manager", "chatter", "analyst", "moderator"].map(r => (
                      <SelectItem key={r} value={r} className="text-white">{r.charAt(0).toUpperCase() + r.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full bg-blue-500 text-white hover:bg-blue-400"
                onClick={() => addMutation.mutate({ userId: parseInt(form.userId), role: form.role as any })}
                disabled={addMutation.isPending || !form.userId}>
                Add Member
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Role legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { role: "Manager", desc: "Full access", icon: Shield },
          { role: "Chatter", desc: "Fan messaging", icon: MessageSquare },
          { role: "Analyst", desc: "View analytics", icon: TrendingUp },
          { role: "Moderator", desc: "Content moderation", icon: Target },
        ].map(r => (
          <Card key={r.role} className="bg-white/5 border-white/10">
            <CardContent className="p-3 text-center">
              <r.icon className="h-5 w-5 mx-auto mb-1 text-gray-400" />
              <p className="text-sm font-medium text-white">{r.role}</p>
              <p className="text-xs text-gray-500">{r.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-2">
        {(members ?? []).length === 0 && (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-8 text-center text-gray-400">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No team members yet. Add your first team member to scale your operation!</p>
            </CardContent>
          </Card>
        )}
        {(members ?? []).map((m: any) => (
          <Card key={m.id} className="bg-white/5 border-white/10">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                  {(m.userName || "?")[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{m.userName || `User #${m.userId}`}</p>
                  <p className="text-xs text-gray-400">{m.userEmail || ""}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-1 rounded-full ${roleColor[m.role] || ""}`}>{m.role}</span>
                <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  onClick={() => removeMutation.mutate({ memberId: m.id })} disabled={removeMutation.isPending}>
                  Remove
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Main CreatorStudio Page ──────────────────────────────────────────────────
export default function CreatorStudio() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="h-12 w-12 text-cyan-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-400">Loading Creator Studio...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="bg-white/5 border-white/10 max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <Sparkles className="h-12 w-12 text-cyan-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Creator Studio</h2>
            <p className="text-gray-400">Please log in to access the Creator Studio.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Creator Studio</h1>
              <p className="text-xs text-gray-400">Fan management · AI automation · Team tools</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
              {(user.name || "U")[0].toUpperCase()}
            </div>
            <span className="text-sm text-gray-300 hidden md:block">{user.name}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="fancrm" className="space-y-6">
          <TabsList className="bg-white/5 border border-white/10 h-auto flex-wrap gap-1 p-1">
            <TabsTrigger value="fancrm" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black text-gray-400 gap-2">
              <Users className="h-4 w-4" /> Fan CRM
            </TabsTrigger>
            <TabsTrigger value="mass" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black text-gray-400 gap-2">
              <MessageSquare className="h-4 w-4" /> Mass Messaging
            </TabsTrigger>
            <TabsTrigger value="ai" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black text-gray-400 gap-2">
              <Bot className="h-4 w-4" /> AI Personas
            </TabsTrigger>
            <TabsTrigger value="winback" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black text-gray-400 gap-2">
              <RotateCcw className="h-4 w-4" /> Winback
            </TabsTrigger>
            <TabsTrigger value="team" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black text-gray-400 gap-2">
              <UserPlus className="h-4 w-4" /> Team
            </TabsTrigger>
            <TabsTrigger value="videostudio" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white text-gray-400 gap-2">
              <Film className="h-4 w-4" /> Video Studio
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fancrm"><FanCrmTab /></TabsContent>
          <TabsContent value="mass"><MassMessagingTab /></TabsContent>
          <TabsContent value="ai"><AiPersonasTab /></TabsContent>
          <TabsContent value="winback"><WinbackTab /></TabsContent>
          <TabsContent value="team"><TeamTab /></TabsContent>
          <TabsContent value="videostudio"><VideoStudioTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
