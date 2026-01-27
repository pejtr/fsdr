import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Send,
  Search,
  MessageSquare,
  Image as ImageIcon,
  MoreVertical,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import { cs } from "date-fns/locale";

export default function Messages() {
  const { user, isAuthenticated } = useAuth();
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  const { data: conversations, isLoading: convsLoading, refetch: refetchConvs } = 
    trpc.messages.getConversations.useQuery(undefined, { enabled: isAuthenticated });

  // Fetch messages for selected conversation
  const { data: messages, isLoading: msgsLoading, refetch: refetchMsgs } = 
    trpc.messages.getMessages.useQuery(
      { conversationId: selectedConversationId || 0 },
      { enabled: !!selectedConversationId }
    );

  // Unread count
  const { data: unreadCount } = trpc.messages.getUnreadCount.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Send message mutation
  const sendMessage = trpc.messages.send.useMutation({
    onSuccess: () => {
      setNewMessage("");
      refetchMsgs();
      refetchConvs();
    },
    onError: () => toast.error("Nepodařilo se odeslat zprávu"),
  });

  // Mark as read mutation
  const markRead = trpc.messages.markRead.useMutation({
    onSuccess: () => refetchConvs(),
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark conversation as read when selected
  useEffect(() => {
    if (selectedConversationId) {
      markRead.mutate({ conversationId: selectedConversationId });
    }
  }, [selectedConversationId]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversationId) return;
    sendMessage.mutate({
      conversationId: selectedConversationId,
      content: newMessage,
    });
  };

  const selectedConversation = conversations?.find(c => c.id === selectedConversationId);

  // Filter conversations by search
  const filteredConversations = conversations?.filter(conv => 
    conv.otherUser?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <Card className="bg-[#1a1a1a] border-white/10 max-w-md">
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 text-pink-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Přihlaste se</h2>
            <p className="text-gray-400 mb-4">Pro přístup ke zprávám se musíte přihlásit.</p>
            <a href={getLoginUrl()}>
              <Button className="bg-pink-600 hover:bg-pink-700">Přihlásit se</Button>
            </a>
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
          <div className="flex items-center gap-4">
            <Link href="/feed">
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-pink-500">Zprávy</h1>
            {unreadCount && unreadCount > 0 && (
              <Badge className="bg-pink-600">{unreadCount}</Badge>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-180px)]">
          {/* Conversations List */}
          <Card className="bg-[#1a1a1a] border-white/10 md:col-span-1 flex flex-col">
            <CardHeader className="pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Hledat konverzace..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-[#0f0f0f] border-white/10 text-white"
                />
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-full">
                {convsLoading ? (
                  <div className="space-y-2 p-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3 p-3">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredConversations && filteredConversations.length > 0 ? (
                  <div className="divide-y divide-white/5">
                    {filteredConversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConversationId(conv.id)}
                        className={`w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors text-left ${
                          selectedConversationId === conv.id ? "bg-white/10" : ""
                        }`}
                      >
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={conv.otherUser?.avatarUrl || undefined} />
                          <AvatarFallback className="bg-pink-600">
                            {conv.otherUser?.name?.[0] || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-white truncate">
                              {conv.otherUser?.name || "Uživatel"}
                            </span>
                            {conv.lastMessageAt && (
                              <span className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(conv.lastMessageAt), {
                                  addSuffix: false,
                                  locale: cs,
                                })}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-400 truncate">
                            {conv.lastMessagePreview || "Žádné zprávy"}
                          </p>
                        </div>
                        {(conv.unreadCount ?? 0) > 0 && (
                          <Badge className="bg-pink-600 ml-2">{conv.unreadCount}</Badge>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <MessageSquare className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Zatím žádné konverzace</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Messages Area */}
          <Card className="bg-[#1a1a1a] border-white/10 md:col-span-2 flex flex-col">
            {selectedConversationId ? (
              <>
                {/* Conversation Header */}
                <CardHeader className="border-b border-white/10 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={selectedConversation?.otherUser?.avatarUrl || undefined} />
                        <AvatarFallback className="bg-pink-600">
                          {selectedConversation?.otherUser?.name?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-white">
                          {selectedConversation?.otherUser?.name || "Uživatel"}
                        </h3>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-gray-400">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 overflow-hidden p-0">
                  <ScrollArea className="h-full p-4">
                    {msgsLoading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : ""}`}>
                            <Skeleton className="h-16 w-48 rounded-lg" />
                          </div>
                        ))}
                      </div>
                    ) : messages && messages.length > 0 ? (
                      <div className="space-y-4">
                        {messages.map((msg) => {
                          const isOwn = msg.senderId === user?.id;
                          return (
                            <div
                              key={msg.id}
                              className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-[70%] rounded-lg p-3 ${
                                  isOwn
                                    ? "bg-pink-600 text-white"
                                    : "bg-[#0f0f0f] text-gray-200"
                                }`}
                              >
                                {msg.content && <p>{msg.content}</p>}
                                {msg.imageUrl && (
                                  <img
                                    src={msg.imageUrl}
                                    alt="Message image"
                                    className="rounded mt-2 max-w-full"
                                  />
                                )}
                                <p
                                  className={`text-xs mt-1 ${
                                    isOwn ? "text-pink-200" : "text-gray-500"
                                  }`}
                                >
                                  {format(new Date(msg.createdAt), "HH:mm", { locale: cs })}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-gray-500">Začněte konverzaci</p>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>

                {/* Message Input */}
                <div className="border-t border-white/10 p-4">
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-pink-400"
                      onClick={() => toast.info("Nahrávání obrázků bude brzy dostupné")}
                    >
                      <ImageIcon className="h-5 w-5" />
                    </Button>
                    <Input
                      placeholder="Napište zprávu..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                      className="bg-[#0f0f0f] border-white/10 text-white"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={sendMessage.isPending || !newMessage.trim()}
                      className="bg-pink-600 hover:bg-pink-700"
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Vyberte konverzaci
                  </h3>
                  <p className="text-gray-400">
                    Vyberte konverzaci ze seznamu nebo začněte novou
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
