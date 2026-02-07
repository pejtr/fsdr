import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MessageSquare, Eye, Pin, Lock, Plus, ArrowLeft, ThumbsUp, ThumbsDown, 
  Send, Clock, Users, TrendingUp, ChevronRight 
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { cs } from "date-fns/locale";

// Default forum categories (will be replaced by DB data)
const DEFAULT_CATEGORIES = [
  { id: 1, name: "Představení", description: "Představte se komunitě", icon: "👋", color: "#10b981" },
  { id: 2, name: "Transformace", description: "Sdílejte své TG/TF příběhy", icon: "✨", color: "#8b5cf6" },
  { id: 3, name: "Crossdressing", description: "Tipy, rady a zkušenosti", icon: "👗", color: "#ec4899" },
  { id: 4, name: "Makeup & Beauty", description: "Tutoriály a doporučení", icon: "💄", color: "#f59e0b" },
  { id: 5, name: "Fashion", description: "Móda a styl", icon: "👠", color: "#06b6d4" },
  { id: 6, name: "Off-topic", description: "Cokoliv jiného", icon: "💬", color: "#6b7280" },
];

export default function CommunityForum() {
  const { user, isAuthenticated } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);
  const [newTopicOpen, setNewTopicOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [newTopic, setNewTopic] = useState({ title: "", content: "", categoryId: 1 });

  const utils = trpc.useUtils();

  const { data: categories = [] } = trpc.forum.getCategories.useQuery();
  const displayCategories = categories.length > 0 ? categories : DEFAULT_CATEGORIES;

  const { data: topicsData } = trpc.forum.getTopics.useQuery(
    { categoryId: selectedCategory || undefined, limit: 30 },
    { enabled: selectedCategory !== null || selectedTopic === null }
  );

  const topics = topicsData?.items || [];

  const { data: topicDetail } = trpc.forum.getTopic.useQuery(
    { id: selectedTopic! },
    { enabled: !!selectedTopic }
  );

  const { data: replies = [] } = trpc.forum.getReplies.useQuery(
    { topicId: selectedTopic! },
    { enabled: !!selectedTopic }
  );

  const createTopic = trpc.forum.createTopic.useMutation({
    onSuccess: (data) => {
      toast.success("Téma vytvořeno!");
      setNewTopicOpen(false);
      setNewTopic({ title: "", content: "", categoryId: 1 });
      utils.forum.getTopics.invalidate();
      if (data.topicId) setSelectedTopic(data.topicId);
    },
  });

  const createReply = trpc.forum.createReply.useMutation({
    onSuccess: () => {
      setReplyText("");
      utils.forum.getReplies.invalidate();
      utils.forum.getTopic.invalidate();
    },
  });

  const vote = trpc.forum.vote.useMutation({
    onSuccess: () => {
      utils.forum.getReplies.invalidate();
    },
  });

  // Topic Detail View
  if (selectedTopic && topicDetail) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8 max-w-4xl">
          <Button variant="ghost" className="mb-4" onClick={() => setSelectedTopic(null)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Zpět na fórum
          </Button>

          {/* Topic Header */}
          <Card className="bg-card/50 border-[oklch(0.6_0.15_180)]/10 mb-6">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={topicDetail.authorAvatar || undefined} />
                  <AvatarFallback>{(topicDetail.authorName || 'U').charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {topicDetail.isPinned && <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30"><Pin className="h-3 w-3 mr-1" /> Připnuto</Badge>}
                    {topicDetail.isLocked && <Badge variant="destructive"><Lock className="h-3 w-3 mr-1" /> Zamčeno</Badge>}
                  </div>
                  <h1 className="text-2xl font-bold mt-2">{topicDetail.title}</h1>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span>{topicDetail.authorName || 'Anonym'}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(topicDetail.createdAt), { addSuffix: true, locale: cs })}
                    </span>
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {topicDetail.viewCount} zobrazení</span>
                    <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {topicDetail.replyCount} odpovědí</span>
                  </div>
                  <div className="mt-4 prose prose-invert max-w-none">
                    <p className="text-foreground whitespace-pre-wrap">{topicDetail.content}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Replies */}
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Odpovědi ({topicDetail.replyCount})
            </h3>

            {replies.length === 0 ? (
              <Card className="bg-card/30 border-dashed">
                <CardContent className="p-8 text-center">
                  <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Zatím žádné odpovědi. Buďte první!</p>
                </CardContent>
              </Card>
            ) : (
              replies.map((reply: any, index: number) => (
                <Card key={reply.id} className="bg-card/50 border-[oklch(0.6_0.15_180)]/10">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center gap-1">
                        <button
                          className="p-1 hover:text-green-400 transition-colors text-muted-foreground"
                          onClick={() => vote.mutate({ replyId: reply.id, voteType: 'upvote' })}
                        >
                          <ThumbsUp className="h-4 w-4" />
                        </button>
                        <span className="text-sm font-medium">{reply.likeCount || 0}</span>
                        <button
                          className="p-1 hover:text-red-400 transition-colors text-muted-foreground"
                          onClick={() => vote.mutate({ replyId: reply.id, voteType: 'downvote' })}
                        >
                          <ThumbsDown className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={reply.authorAvatar || undefined} />
                            <AvatarFallback className="text-xs">{(reply.authorName || 'U').charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{reply.authorName || 'Anonym'}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true, locale: cs })}
                          </span>
                          <Badge variant="outline" className="text-xs">#{index + 1}</Badge>
                        </div>
                        <p className="mt-3 text-sm whitespace-pre-wrap">{reply.content}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Reply Input */}
          {isAuthenticated && !topicDetail.isLocked ? (
            <Card className="bg-card/50 border-[oklch(0.6_0.15_180)]/20">
              <CardContent className="p-4">
                <h4 className="text-sm font-medium mb-2">Vaše odpověď</h4>
                <Textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Napište svou odpověď..."
                  rows={4}
                  className="mb-3"
                />
                <div className="flex justify-end">
                  <Button
                    className="symbiote-gradient text-white border-0"
                    onClick={() => {
                      if (replyText.trim().length >= 1) {
                        createReply.mutate({ topicId: selectedTopic!, content: replyText.trim() });
                      }
                    }}
                    disabled={!replyText.trim() || createReply.isPending}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {createReply.isPending ? "Odesílám..." : "Odpovědět"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : topicDetail.isLocked ? (
            <Card className="bg-card/30 border-dashed">
              <CardContent className="p-4 text-center text-muted-foreground">
                <Lock className="h-5 w-5 mx-auto mb-2" />
                Toto téma je zamčené
              </CardContent>
            </Card>
          ) : null}
        </main>
      </div>
    );
  }

  // Forum Main View
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold symbiote-text-gradient">Komunitní fórum</h1>
            <p className="text-muted-foreground mt-1">
              Diskutujte, sdílejte zkušenosti a najděte přátele
            </p>
          </div>
          {isAuthenticated && (
            <Dialog open={newTopicOpen} onOpenChange={setNewTopicOpen}>
              <DialogTrigger asChild>
                <Button className="symbiote-gradient text-white border-0">
                  <Plus className="h-4 w-4 mr-2" /> Nové téma
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Vytvořit nové téma</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Kategorie</label>
                    <Select
                      value={newTopic.categoryId.toString()}
                      onValueChange={v => setNewTopic(f => ({ ...f, categoryId: parseInt(v) }))}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {displayCategories.map((cat: any) => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.icon || '💬'} {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Název tématu</label>
                    <Input
                      value={newTopic.title}
                      onChange={e => setNewTopic(f => ({ ...f, title: e.target.value }))}
                      placeholder="O čem chcete diskutovat?"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Obsah</label>
                    <Textarea
                      value={newTopic.content}
                      onChange={e => setNewTopic(f => ({ ...f, content: e.target.value }))}
                      placeholder="Popište své téma podrobněji..."
                      rows={6}
                    />
                  </div>
                  <Button
                    className="w-full symbiote-gradient text-white border-0"
                    onClick={() => createTopic.mutate(newTopic)}
                    disabled={!newTopic.title.trim() || newTopic.content.trim().length < 10 || createTopic.isPending}
                  >
                    {createTopic.isPending ? "Vytvářím..." : "Vytvořit téma"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="bg-card/50 border-[oklch(0.6_0.15_180)]/10">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-xl font-bold">{topicsData?.total || 0}</div>
                <div className="text-xs text-muted-foreground">Témat</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-[oklch(0.6_0.15_180)]/10">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Users className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <div className="text-xl font-bold">{displayCategories.length}</div>
                <div className="text-xs text-muted-foreground">Kategorií</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-[oklch(0.6_0.15_180)]/10">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <TrendingUp className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <div className="text-xl font-bold">Aktivní</div>
                <div className="text-xs text-muted-foreground">Komunita</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Kategorie</h3>
            <div className="space-y-2">
              <Button
                variant={selectedCategory === null ? "default" : "ghost"}
                className={`w-full justify-start ${selectedCategory === null ? 'symbiote-gradient text-white border-0' : ''}`}
                onClick={() => setSelectedCategory(null)}
              >
                Všechny kategorie
              </Button>
              {displayCategories.map((cat: any) => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? "default" : "ghost"}
                  className={`w-full justify-start ${selectedCategory === cat.id ? 'symbiote-gradient text-white border-0' : ''}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <span className="mr-2">{cat.icon || '💬'}</span>
                  {cat.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Topics List */}
          <div className="lg:col-span-3">
            {topics.length === 0 ? (
              <Card className="bg-card/30 border-dashed">
                <CardContent className="p-12 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Zatím žádná témata</h3>
                  <p className="text-muted-foreground mb-4">
                    Začněte diskuzi vytvořením nového tématu!
                  </p>
                  {isAuthenticated && (
                    <Button className="symbiote-gradient text-white border-0" onClick={() => setNewTopicOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" /> Vytvořit první téma
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {topics.map((topic: any) => (
                  <Card
                    key={topic.id}
                    className="bg-card/50 border-[oklch(0.6_0.15_180)]/10 hover:border-primary/30 transition-all cursor-pointer"
                    onClick={() => setSelectedTopic(topic.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-10 w-10 mt-1">
                          <AvatarImage src={topic.authorAvatar || undefined} />
                          <AvatarFallback className="text-xs">{(topic.authorName || 'U').charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {topic.isPinned && (
                              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                                <Pin className="h-3 w-3 mr-1" /> Pin
                              </Badge>
                            )}
                            {topic.isLocked && (
                              <Badge variant="destructive" className="text-xs">
                                <Lock className="h-3 w-3 mr-1" /> Zamčeno
                              </Badge>
                            )}
                            <h3 className="font-semibold truncate">{topic.title}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{topic.content}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>{topic.authorName || 'Anonym'}</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(topic.createdAt), { addSuffix: true, locale: cs })}
                            </span>
                            <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {topic.viewCount}</span>
                            <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {topic.replyCount}</span>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground mt-2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
