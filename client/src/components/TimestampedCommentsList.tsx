import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimestampedCommentsListProps {
  videoId: number;
  onSeekToTime?: (time: number) => void;
  highlightTime?: number | null;
}

export default function TimestampedCommentsList({ 
  videoId, 
  onSeekToTime,
  highlightTime 
}: TimestampedCommentsListProps) {
  const { data: comments = [], isLoading } = trpc.feed.getTimestampedComments.useQuery({ videoId });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return <div className="text-center text-muted-foreground py-8">Načítání komentářů...</div>;
  }

  if (comments.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>Zatím žádné komentáře s časovou značkou</p>
        <p className="text-sm mt-1">Buďte první, kdo přidá komentář k videu!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment: any) => {
        const isHighlighted = highlightTime !== null && highlightTime !== undefined && 
          Math.abs(comment.timestamp - highlightTime) < 2;

        return (
          <div
            key={comment.id}
            className={cn(
              "p-4 rounded-lg border transition-colors",
              isHighlighted ? "border-primary bg-primary/5" : "border-border"
            )}
          >
            <div className="flex items-start gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSeekToTime?.(comment.timestamp)}
                className="shrink-0"
              >
                <Clock className="h-3 w-3 mr-1" />
                {formatTime(comment.timestamp)}
              </Button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">
                    {comment.youtubeAuthorName || 'Uživatel'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(comment.createdAt).toLocaleDateString('cs-CZ')}
                  </span>
                </div>
                <p className="text-sm text-foreground break-words">
                  {comment.content}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
