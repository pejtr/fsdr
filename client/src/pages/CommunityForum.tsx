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
import { 
  MessageSquare, Eye, Pin, Lock, Plus, ArrowLeft, ThumbsUp, ThumbsDown, 
  Send, Clock, Users, TrendingUp, ChevronRight, Wifi, WifiOff, CheckCircle2,
  Star, Medal, Award, Flame, Crown
} from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { cs } from "date-fns/locale";
import { useForumWebSocket } from "@/hooks/useForumWebSocket";

export default function CommunityForum() {
  const { user, isAuthenticated } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);
  const [newTopicOpen, setNewTopicOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [newTopic, setNewTopic] = useState({ title: "", content: "", categoryId: 1 });
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const repliesEndRef = useRef<HTMLDivElement>(null);

  const utils = trpc.useUtils();

  // WebSocket for real-time features
  const onNewReply = useCallback((reply: Record<string, unknown>) => {
    utils.forum.getReplies.invalidate();
    utils.forum.getTopic.invalidate();
  }, [utils]);

  const onNewTopic = useCallback((topic: Record<string, unknown>) => {
    utils.forum.getTopics.invalidate();
  }, [utils]);

  const { 
    isConnected, onlineUsers, onlineCount, typingUsers, 
    sendTyping, sendNewReply, sendNewTopic 
  } = useForumWebSocket({
    topicId: selectedTopic || undefined,
    userId: user?.id,
    username: user?.name || user?.email || 'Anonymous',
    onNewReply,
    onNewTopic,
  });

  const { data: categories = [] } = trpc.forum.getCategories.useQuery();

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
      sendNewTopic({ topicId: data.topicId });
      if (data.topicId) setSelectedTopic(data.topicId);
    },
  });

  const createReply = trpc.forum.createReply.useMutation({
    onSuccess: (data) => {
      setReplyText("");
      sendTyping(false);
      utils.forum.getReplies.invalidate();
      utils.forum.getTopic.invalidate();
      sendNewReply({ replyId: data.replyId, topicId: selectedTopic });
      // Scroll to bottom
      setTimeout(() => repliesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 200);
    },
  });

  const vote = trpc.forum.vote.useMutation({
    onSuccess: () => {
      utils.forum.getReplies.invalidate();
    },
  });

  // Handle typing indicator
  const handleReplyChange = (value: string) => {
    setReplyText(value);
    sendTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => sendTyping(false), 2000);
  };

  // Auto-scroll when new replies come in
  useEffect(() => {
    if (replies.length > 0) {
      repliesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [replies.length]);

  // Verified badge component
  const VerifiedBadge = ({ isVerified }: { isVerified?: boolean }) => {
    if (!isVerified) return null;
    return (
      <span className="inline-flex items-center" title="Ověřený profil">
        <CheckCircle2 className="h-4 w-4 text-[oklch(0.7_0.15_180)] fill-[oklch(0.7_0.15_180)]/20" />
      </span>
    );
  };

  // Rank badge component
  const RANK_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
    newcomer: { label: "Newcomer", color: "text-gray-400", icon: Star },
    member: { label: "Member", color: "text-blue-400", icon: Medal },
    contributor: { label: "Contributor", color: "text-purple-400", icon: Award },
    expert: { label: "Expert", color: "text-orange-400", icon: Flame },
    legend: { label: "Legend", color: "text-yellow-400", icon: Crown },
  };

  const RankBadge = ({ rank, points }: { rank?: string | null; points?: number | null }) => {
    if (!rank) return null;
    const config = RANK_CONFIG[rank] || RANK_CONFIG.newcomer;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-0.5 text-xs ${config.color}`} title={`${config.label} (${points || 0} pts)`}>
        <Icon className="h-3 w-3" />
        <span className="hidden sm:inline">{config.label}</span>
      </span>
    );
  };

  // Topic Detail View with real-time chat
  if (selectedTopic && topicDetail) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8 max-w-4xl">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" onClick={() => setSelectedTopic(null)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Zpět na fórum
            </Button>
            <div className="flex items-center gap-3">
              {/* Online indicator */}
              <div className="flex items-center gap-2 text-sm">
                {isConnected ? (
                  <span className="flex items-center gap-1.5 text-green-400">
                    <Wifi className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Live</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <WifiOff className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Offline</span>
                  </span>
                )}
              </div>
              {onlineCount > 0 && (
                <Badge variant="outline" className="border-green-500/30 text-green-400">
                  <Users className="h-3 w-3 mr-1" /> {onlineCount} online
                </Badge>
              )}
            </div>
          </div>

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
                    <span className="flex items-center gap-1">
                      {topicDetail.authorName || 'Anonym'}
                      <VerifiedBadge isVerified={(topicDetail as any).authorVerified} />
                      <RankBadge rank={(topicDetail as any).authorRank} points={(topicDetail as any).authorPoints} />
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(topicDetail.createdAt), { addSuffix: true, locale: cs })}
                    </span>
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {topicDetail.viewCount}</span>
                    <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {topicDetail.replyCount}</span>
                  </div>
                  <div className="mt-4 prose prose-invert max-w-none">
                    <p className="text-foreground whitespace-pre-wrap">{topicDetail.content}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Online Users Bar */}
          {onlineUsers.length > 0 && (
            <div className="flex items-center gap-2 mb-4 px-2">
              <span className="text-xs text-muted-foreground">Online:</span>
              <div className="flex flex-wrap gap-1">
                {onlineUsers.slice(0, 10).map((u) => (
                  <Badge key={u.userId} variant="outline" className="text-xs py-0 border-green-500/20 text-green-400/80">
                    {u.username}
                  </Badge>
                ))}
                {onlineUsers.length > 10 && (
                  <Badge variant="outline" className="text-xs py-0">+{onlineUsers.length - 10}</Badge>
                )}
              </div>
            </div>
          )}

          {/* Replies */}
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Odpovědi ({topicDetail.replyCount})
              {isConnected && <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
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
                <Card key={reply.id} className="bg-card/50 border-[oklch(0.6_0.15_180)]/10 animate-in fade-in-50">
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
                          <span className="text-sm font-medium flex items-center gap-1">
                            {reply.authorName || 'Anonym'}
                            <VerifiedBadge isVerified={(reply as any).authorVerified} />
                            <RankBadge rank={(reply as any).authorRank} points={(reply as any).authorPoints} />
                          </span>
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
            <div ref={repliesEndRef} />
          </div>

          {/* Typing Indicator */}
          {typingUsers.length > 0 && (
            <div className="flex items-center gap-2 mb-3 px-2 text-sm text-muted-foreground animate-in fade-in-50">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span>
                {typingUsers.map(u => u.username).join(', ')} {typingUsers.length === 1 ? 'píše' : 'píšou'}...
              </span>
            </div>
          )}

          {/* Reply Input */}
          {isAuthenticated && !topicDetail.isLocked ? (
            <Card className="bg-card/50 border-[oklch(0.6_0.15_180)]/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-sm font-medium">Vaše odpověď</h4>
                  {isConnected && (
                    <span className="text-xs text-green-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Live
                    </span>
                  )}
                </div>
                <Textarea
                  value={replyText}
                  onChange={e => handleReplyChange(e.target.value)}
                  placeholder="Napište svou odpověď... (ostatní uvidí, že píšete)"
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
            <h1 className="text-3xl font-bold symbiote-text-gradient">Community Forum</h1>
            <p className="text-muted-foreground mt-1">
              Discuss, share experiences and find friends
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isConnected && (
              <Badge variant="outline" className="border-green-500/30 text-green-400">
                <Wifi className="h-3 w-3 mr-1" /> Live
              </Badge>
            )}
            {isAuthenticated && (
              <Dialog open={newTopicOpen} onOpenChange={setNewTopicOpen}>
                <DialogTrigger asChild>
                  <Button className="symbiote-gradient text-white border-0">
                    <Plus className="h-4 w-4 mr-2" /> New Topic
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create New Topic</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Category</label>
                      <Select
                        value={newTopic.categoryId.toString()}
                        onValueChange={v => setNewTopic(f => ({ ...f, categoryId: parseInt(v) }))}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {categories.map((cat: any) => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>
                              {cat.icon || '💬'} {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Topic Title</label>
                      <Input
                        value={newTopic.title}
                        onChange={e => setNewTopic(f => ({ ...f, title: e.target.value }))}
                        placeholder="What do you want to discuss?"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Content</label>
                      <Textarea
                        value={newTopic.content}
                        onChange={e => setNewTopic(f => ({ ...f, content: e.target.value }))}
                        placeholder="Describe your topic in detail..."
                        rows={6}
                      />
                    </div>
                    <Button
                      className="w-full symbiote-gradient text-white border-0"
                      onClick={() => createTopic.mutate(newTopic)}
                      disabled={!newTopic.title.trim() || newTopic.content.trim().length < 10 || createTopic.isPending}
                    >
                      {createTopic.isPending ? "Creating..." : "Create Topic"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
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
                <div className="text-xs text-muted-foreground">Topics</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-[oklch(0.6_0.15_180)]/10">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Users className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <div className="text-xl font-bold">{categories.length}</div>
                <div className="text-xs text-muted-foreground">Categories</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-[oklch(0.6_0.15_180)]/10">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <TrendingUp className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <div className="text-xl font-bold">Active</div>
                <div className="text-xs text-muted-foreground">Community</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Categories</h3>
            <div className="space-y-2">
              <Button
                variant={selectedCategory === null ? "default" : "ghost"}
                className={`w-full justify-start ${selectedCategory === null ? 'symbiote-gradient text-white border-0' : ''}`}
                onClick={() => setSelectedCategory(null)}
              >
                All Categories
              </Button>
              {categories.map((cat: any) => (
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
                  <h3 className="text-lg font-medium mb-2">No topics yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start a discussion by creating a new topic!
                  </p>
                  {isAuthenticated && (
                    <Button className="symbiote-gradient text-white border-0" onClick={() => setNewTopicOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" /> Create First Topic
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
                                <Lock className="h-3 w-3 mr-1" /> Locked
                              </Badge>
                            )}
                            <h3 className="font-semibold truncate">{topic.title}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{topic.content}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              {topic.authorName || 'Anonymous'}
                              <VerifiedBadge isVerified={(topic as any).authorVerified} />
                              <RankBadge rank={(topic as any).authorRank} points={(topic as any).authorPoints} />
                            </span>
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
