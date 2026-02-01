import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Send } from "lucide-react";


interface TimestampedCommentInputProps {
  videoId: number;
  currentTime: number;
  onCommentAdded?: () => void;
}

export default function TimestampedCommentInput({ 
  videoId, 
  currentTime,
  onCommentAdded 
}: TimestampedCommentInputProps) {
  const [content, setContent] = useState("");
  const [includeTimestamp, setIncludeTimestamp] = useState(true);

  const utils = trpc.useUtils();

  const createCommentMutation = trpc.feed.createComment.useMutation({
    onSuccess: () => {
      setContent("");

      utils.feed.getTimestampedComments.invalidate({ videoId });
      onCommentAdded?.();
    },
    onError: (error) => {
      console.error('Failed to create comment:', error);
    },
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = () => {
    if (!content.trim()) return;

    createCommentMutation.mutate({
      videoId,
      content: content.trim(),
      timestamp: includeTimestamp ? Math.floor(currentTime) : undefined,
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>Aktuální čas: {formatTime(currentTime)}</span>
        <Button
          variant={includeTimestamp ? "default" : "outline"}
          size="sm"
          onClick={() => setIncludeTimestamp(!includeTimestamp)}
          className="ml-auto"
        >
          {includeTimestamp ? "Časová značka zapnuta" : "Časová značka vypnuta"}
        </Button>
      </div>

      <div className="flex gap-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={includeTimestamp ? `Napište komentář k času ${formatTime(currentTime)}...` : "Napište komentář..."}
          className="min-h-[80px] resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
              handleSubmit();
            }
          }}
        />
      </div>

      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground">
          {includeTimestamp && "Komentář bude zobrazen na časové značce"}
        </span>
        <Button
          onClick={handleSubmit}
          disabled={!content.trim() || createCommentMutation.isPending}
          size="sm"
        >
          <Send className="h-4 w-4 mr-2" />
          {createCommentMutation.isPending ? "Odesílám..." : "Odeslat"}
        </Button>
      </div>
    </div>
  );
}
