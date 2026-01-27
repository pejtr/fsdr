import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Send,
  Plus,
  Sparkles,
  Lightbulb,
  Image as ImageIcon,
  BarChart3,
  Megaphone,
  MessageSquare,
  Trash2,
  Bot,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { cs } from "date-fns/locale";
import { Streamdown } from "streamdown";

const CONTEXT_OPTIONS = [
  { value: "general", label: "Obecné", icon: MessageSquare, description: "Obecné dotazy a pomoc" },
  { value: "content_tips", label: "Tipy pro obsah", icon: Lightbulb, description: "Vylepšení videí a příspěvků" },
  { value: "thumbnail_generation", label: "Miniatury", icon: ImageIcon, description: "Návrhy a optimalizace miniatur" },
  { value: "analytics", label: "Analytika", icon: BarChart3, description: "Interpretace statistik" },
  { value: "marketing", label: "Marketing", icon: Megaphone, description: "Propagace a růst" },
] as const;

type ContextType = typeof CONTEXT_OPTIONS[number]["value"];

export default function AIAssistant() {
  const { user, isAuthenticated } = useAuth();
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [selectedContext, setSelectedContext] = useState<ContextType>("general");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  const { data: conversations, isLoading: convsLoading, refetch: refetchConvs } = 
    trpc.chatbot.getConversations.useQuery(undefined, { enabled: isAuthenticated });

  // Fetch messages for selected conversation
  const { data: messages, isLoading: msgsLoading, refetch: refetchMsgs } = 
    trpc.chatbot.getMessages.useQuery(
      { conversationId: selectedConversationId || 0 },
      { enabled: !!selectedConversationId }
    );

  // Create conversation mutation
  const createConversation = trpc.chatbot.createConversation.useMutation({
    onSuccess: (data) => {
      if (data.conversationId) {
        setSelectedConversationId(data.conversationId);
        refetchConvs();
      }
    },
    onError: () => toast.error("Nepodařilo se vytvořit konverzaci"),
  });

  // Send message mutation
  const sendMessage = trpc.chatbot.sendMessage.useMutation({
    onSuccess: () => {
      setNewMessage("");
      setIsTyping(false);
      refetchMsgs();
      refetchConvs();
    },
    onError: () => {
      setIsTyping(false);
      toast.error("Nepodařilo se odeslat zprávu");
    },
  });

  // Delete conversation mutation
  const deleteConversation = trpc.chatbot.deleteConversation.useMutation({
    onSuccess: () => {
      setSelectedConversationId(null);
      refetchConvs();
      toast.success("Konverzace byla smazána");
    },
    onError: () => toast.error("Nepodařilo se smazat konverzaci"),
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleNewConversation = () => {
    createConversation.mutate({ context: selectedContext });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversationId || isTyping) return;
    setIsTyping(true);
    sendMessage.mutate({
      conversationId: selectedConversationId,
      content: newMessage,
    });
  };

  const selectedConversation = conversations?.find(c => c.id === selectedConversationId);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <Card className="bg-[#1a1a1a] border-white/10 max-w-md">
          <CardContent className="py-12 text-center">
            <Sparkles className="h-12 w-12 text-pink-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">AI Asistent</h2>
            <p className="text-gray-400 mb-4">Pro přístup k AI asistentovi se musíte přihlásit.</p>
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
            <Sparkles className="h-6 w-6 text-pink-500" />
            <h1 className="text-2xl font-bold text-pink-500">AI Asistent</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[calc(100vh-180px)]">
          {/* Sidebar - Conversations & Context */}
          <Card className="bg-[#1a1a1a] border-white/10 md:col-span-1 flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-lg">Konverzace</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
              {/* Context Selection */}
              <div className="p-4 border-b border-white/10">
                <p className="text-sm text-gray-400 mb-2">Nová konverzace:</p>
                <div className="grid grid-cols-2 gap-2">
                  {CONTEXT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedContext(option.value)}
                      className={`p-2 rounded-lg text-left transition-colors ${
                        selectedContext === option.value
                          ? "bg-pink-600/20 border border-pink-500"
                          : "bg-[#0f0f0f] border border-white/10 hover:border-pink-500/50"
                      }`}
                    >
                      <option.icon className={`h-4 w-4 mb-1 ${
                        selectedContext === option.value ? "text-pink-500" : "text-gray-400"
                      }`} />
                      <p className="text-xs font-medium text-white truncate">{option.label}</p>
                    </button>
                  ))}
                </div>
                <Button
                  onClick={handleNewConversation}
                  disabled={createConversation.isPending}
                  className="w-full mt-3 bg-pink-600 hover:bg-pink-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nová konverzace
                </Button>
              </div>

              {/* Conversations List */}
              <ScrollArea className="flex-1">
                {convsLoading ? (
                  <div className="space-y-2 p-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : conversations && conversations.length > 0 ? (
                  <div className="divide-y divide-white/5">
                    {conversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConversationId(conv.id)}
                        className={`w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors text-left ${
                          selectedConversationId === conv.id ? "bg-white/10" : ""
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs border-pink-500/50 text-pink-400">
                              {CONTEXT_OPTIONS.find(o => o.value === conv.context)?.label || conv.context}
                            </Badge>
                          </div>
                          <p className="text-sm text-white truncate mt-1">
                            {conv.title || "Nová konverzace"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(conv.updatedAt), {
                              addSuffix: true,
                              locale: cs,
                            })}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <Bot className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-sm">Zatím žádné konverzace</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="bg-[#1a1a1a] border-white/10 md:col-span-3 flex flex-col">
            {selectedConversationId ? (
              <>
                {/* Conversation Header */}
                <CardHeader className="border-b border-white/10 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                        <Sparkles className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">FEMSIDER AI</h3>
                        <p className="text-xs text-gray-400">
                          {CONTEXT_OPTIONS.find(o => o.value === selectedConversation?.context)?.description}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-red-500"
                      onClick={() => {
                        if (confirm("Opravdu chcete smazat tuto konverzaci?")) {
                          deleteConversation.mutate({ conversationId: selectedConversationId });
                        }
                      }}
                    >
                      <Trash2 className="h-5 w-5" />
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
                            <Skeleton className="h-16 w-64 rounded-lg" />
                          </div>
                        ))}
                      </div>
                    ) : messages && messages.length > 0 ? (
                      <div className="space-y-4">
                        {messages.map((msg) => {
                          const isUser = msg.role === "user";
                          return (
                            <div
                              key={msg.id}
                              className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                            >
                              <div className={`flex gap-3 max-w-[80%] ${isUser ? "flex-row-reverse" : ""}`}>
                                {!isUser && (
                                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                    <Sparkles className="h-4 w-4 text-white" />
                                  </div>
                                )}
                                {isUser && (
                                  <Avatar className="h-8 w-8 flex-shrink-0">
                                    <AvatarFallback className="bg-pink-600 text-xs">
                                      {user?.name?.[0] || "U"}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                                <div
                                  className={`rounded-lg p-3 ${
                                    isUser
                                      ? "bg-pink-600 text-white"
                                      : "bg-[#0f0f0f] text-gray-200"
                                  }`}
                                >
                                  {isUser ? (
                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                  ) : (
                                    <div className="prose prose-invert prose-sm max-w-none">
                                      <Streamdown>{msg.content}</Streamdown>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {isTyping && (
                          <div className="flex justify-start">
                            <div className="flex gap-3 max-w-[80%]">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                <Sparkles className="h-4 w-4 text-white animate-pulse" />
                              </div>
                              <div className="bg-[#0f0f0f] rounded-lg p-3">
                                <div className="flex gap-1">
                                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                          <Sparkles className="h-12 w-12 text-pink-500 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-white mb-2">
                            Jak vám mohu pomoci?
                          </h3>
                          <p className="text-gray-400 text-sm max-w-md">
                            Jsem váš AI asistent pro FEMSIDER. Pomohu vám s optimalizací obsahu,
                            návrhy miniatur, analýzou statistik a marketingovou strategií.
                          </p>
                        </div>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>

                {/* Message Input */}
                <div className="border-t border-white/10 p-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Napište svůj dotaz..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                      disabled={isTyping}
                      className="bg-[#0f0f0f] border-white/10 text-white"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={sendMessage.isPending || !newMessage.trim() || isTyping}
                      className="bg-pink-600 hover:bg-pink-700"
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center max-w-md">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="h-10 w-10 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-4">
                    FEMSIDER AI Asistent
                  </h2>
                  <p className="text-gray-400 mb-6">
                    Váš osobní asistent pro tvorbu obsahu. Pomohu vám s optimalizací videí,
                    návrhy miniatur, analýzou statistik a marketingovou strategií.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {CONTEXT_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSelectedContext(option.value);
                          handleNewConversation();
                        }}
                        className="p-4 rounded-lg bg-[#0f0f0f] border border-white/10 hover:border-pink-500/50 transition-colors text-left"
                      >
                        <option.icon className="h-6 w-6 text-pink-500 mb-2" />
                        <p className="font-medium text-white">{option.label}</p>
                        <p className="text-xs text-gray-400 mt-1">{option.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
