import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Trash2,
  Image as ImageIcon,
  Send,
  Crown,
  ArrowLeft,
  Bell,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { cs } from "date-fns/locale";

export default function Feed() {
  const { user, isAuthenticated } = useAuth();
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [newComment, setNewComment] = useState("");

  // Fetch posts
  const { data: posts, isLoading, refetch } = trpc.feed.getPosts.useQuery(
    { limit: 20, offset: 0 },
    { enabled: isAuthenticated }
  );

  const { data: publicPosts, isLoading: publicLoading } = trpc.feed.getPublicPosts.useQuery(
    { limit: 20, offset: 0 },
    { enabled: !isAuthenticated }
  );

  const displayPosts = isAuthenticated ? posts : publicPosts;
  const loading = isAuthenticated ? isLoading : publicLoading;

  // Mutations
  const createPost = trpc.feed.createPost.useMutation({
    onSuccess: () => {
      setNewPostContent("");
      setNewPostImage(null);
      refetch();
      toast.success("Příspěvek byl zveřejněn");
    },
    onError: () => toast.error("Nepodařilo se zveřejnit příspěvek"),
  });

  const toggleLike = trpc.feed.toggleLike.useMutation({
    onSuccess: () => refetch(),
  });

  const deletePost = trpc.feed.deletePost.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Příspěvek byl smazán");
    },
    onError: () => toast.error("Nepodařilo se smazat příspěvek"),
  });

  // Comments
  const { data: comments, refetch: refetchComments } = trpc.feed.getComments.useQuery(
    { postId: selectedPostId || 0 },
    { enabled: !!selectedPostId }
  );

  const addComment = trpc.feed.addComment.useMutation({
    onSuccess: () => {
      setNewComment("");
      refetchComments();
      refetch();
      toast.success("Komentář byl přidán");
    },
    onError: () => toast.error("Nepodařilo se přidat komentář"),
  });

  const handleCreatePost = () => {
    if (!newPostContent.trim() && !newPostImage) return;
    createPost.mutate({
      content: newPostContent,
      imageUrl: newPostImage || undefined,
      visibility: "public",
    });
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !selectedPostId) return;
    addComment.mutate({
      postId: selectedPostId,
      content: newComment,
    });
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0f0f0f]/95 backdrop-blur border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-pink-500">Newsfeed</h1>
            </div>
            
            <div className="flex items-center gap-2">
              {isAuthenticated && (
                <>
                  <Link href="/messages">
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                      <MessageSquare className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/notifications">
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                      <Bell className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/ai-assistant">
                    <Button variant="ghost" size="icon" className="text-pink-400 hover:text-pink-300">
                      <Sparkles className="h-5 w-5" />
                    </Button>
                  </Link>
                </>
              )}
              {!isAuthenticated && (
                <a href={getLoginUrl()}>
                  <Button className="bg-pink-600 hover:bg-pink-700">Přihlásit se</Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Create Post (only for creators) */}
        {isAuthenticated && (user?.role === "creator" || user?.role === "admin") && (
          <Card className="bg-[#1a1a1a] border-white/10 mb-6">
            <CardContent className="pt-4">
              <div className="flex gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user?.avatarUrl || undefined} />
                  <AvatarFallback className="bg-pink-600">
                    {user?.name?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    placeholder="Co máte na mysli?"
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    className="bg-[#0f0f0f] border-white/10 text-white resize-none min-h-[80px]"
                  />
                  {newPostImage && (
                    <div className="mt-2 relative">
                      <img
                        src={newPostImage}
                        alt="Preview"
                        className="rounded-lg max-h-60 object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => setNewPostImage(null)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-pink-400"
                      onClick={() => toast.info("Nahrávání obrázků bude brzy dostupné")}
                    >
                      <ImageIcon className="h-5 w-5 mr-2" />
                      Obrázek
                    </Button>
                    <Button
                      onClick={handleCreatePost}
                      disabled={createPost.isPending || (!newPostContent.trim() && !newPostImage)}
                      className="bg-pink-600 hover:bg-pink-700"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Zveřejnit
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Posts */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-[#1a1a1a] border-white/10">
                <CardHeader className="flex flex-row items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : displayPosts && displayPosts.length > 0 ? (
          <div className="space-y-4">
            {displayPosts.map((post) => (
              <Card key={post.id} className="bg-[#1a1a1a] border-white/10">
                <CardHeader className="flex flex-row items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Link href={`/creator/${post.author?.id}`}>
                      <Avatar className="h-10 w-10 cursor-pointer hover:ring-2 hover:ring-pink-500 transition-all">
                        <AvatarImage src={post.author?.avatarUrl || undefined} />
                        <AvatarFallback className="bg-pink-600">
                          {post.author?.name?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div>
                      <div className="flex items-center gap-2">
                        <Link href={`/creator/${post.author?.id}`}>
                          <span className="font-semibold text-white hover:text-pink-400 transition-colors cursor-pointer">
                            {post.author?.name || "Neznámý uživatel"}
                          </span>
                        </Link>
                        {post.author?.role === "creator" && (
                          <Badge variant="outline" className="border-pink-500 text-pink-500 text-xs">
                            <Crown className="h-3 w-3 mr-1" />
                            Tvůrce
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(post.createdAt), {
                          addSuffix: true,
                          locale: cs,
                        })}
                      </p>
                    </div>
                  </div>
                  
                  {isAuthenticated && (post.authorId === user?.id || user?.role === "admin") && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-gray-400">
                          <MoreHorizontal className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-white/10">
                        <DropdownMenuItem
                          className="text-red-500 cursor-pointer"
                          onClick={() => deletePost.mutate({ postId: post.id })}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Smazat
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </CardHeader>

                <CardContent>
                  {post.content && (
                    <p className="text-gray-200 whitespace-pre-wrap">{post.content}</p>
                  )}
                  {post.imageUrl && (
                    <img
                      src={post.imageUrl}
                      alt="Post image"
                      className="mt-3 rounded-lg max-h-96 w-full object-cover"
                    />
                  )}
                </CardContent>

                <CardFooter className="border-t border-white/10 pt-4">
                  <div className="flex items-center gap-6 w-full">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`text-gray-400 hover:text-pink-400 ${
                        post.hasLiked ? "text-pink-500" : ""
                      }`}
                      onClick={() => {
                        if (!isAuthenticated) {
                          toast.error("Pro lajkování se musíte přihlásit");
                          return;
                        }
                        toggleLike.mutate({ postId: post.id });
                      }}
                    >
                      <Heart
                        className={`h-5 w-5 mr-1 ${post.hasLiked ? "fill-pink-500" : ""}`}
                      />
                      {post.likeCount || 0}
                    </Button>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-pink-400"
                          onClick={() => setSelectedPostId(post.id)}
                        >
                          <MessageCircle className="h-5 w-5 mr-1" />
                          {post.commentCount || 0}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-[#1a1a1a] border-white/10 max-w-lg">
                        <DialogHeader>
                          <DialogTitle className="text-white">Komentáře</DialogTitle>
                        </DialogHeader>
                        <div className="max-h-96 overflow-y-auto space-y-4">
                          {comments && comments.length > 0 ? (
                            comments.map((comment) => (
                              <div key={comment.id} className="flex gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={comment.author?.avatarUrl || undefined} />
                                  <AvatarFallback className="bg-pink-600 text-xs">
                                    {comment.author?.name?.[0] || "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 bg-[#0f0f0f] rounded-lg p-3">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-white text-sm">
                                      {comment.author?.name || "Uživatel"}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {formatDistanceToNow(new Date(comment.createdAt), {
                                        addSuffix: true,
                                        locale: cs,
                                      })}
                                    </span>
                                  </div>
                                  <p className="text-gray-300 text-sm mt-1">{comment.content}</p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-gray-500 text-center py-4">
                              Zatím žádné komentáře
                            </p>
                          )}
                        </div>
                        {isAuthenticated && (
                          <div className="flex gap-2 mt-4">
                            <Textarea
                              placeholder="Napište komentář..."
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              className="bg-[#0f0f0f] border-white/10 text-white resize-none min-h-[60px]"
                            />
                            <Button
                              onClick={handleAddComment}
                              disabled={addComment.isPending || !newComment.trim()}
                              className="bg-pink-600 hover:bg-pink-700"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-pink-400"
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.origin + `/feed?post=${post.id}`);
                        toast.success("Odkaz zkopírován");
                      }}
                    >
                      <Share2 className="h-5 w-5 mr-1" />
                      Sdílet
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-[#1a1a1a] border-white/10">
            <CardContent className="py-12 text-center">
              <MessageCircle className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Zatím žádné příspěvky</h3>
              <p className="text-gray-400">
                {isAuthenticated
                  ? "Sledujte tvůrce, abyste viděli jejich příspěvky"
                  : "Přihlaste se pro zobrazení personalizovaného feedu"}
              </p>
              {!isAuthenticated && (
                <a href={getLoginUrl()}>
                  <Button className="mt-4 bg-pink-600 hover:bg-pink-700">
                    Přihlásit se
                  </Button>
                </a>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
