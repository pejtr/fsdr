import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Smile } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReactionPickerProps {
  videoId: number;
  currentTime: number;
  onReactionAdded?: () => void;
}

const REACTIONS = [
  { type: 'love' as const, emoji: '❤️', label: 'Láska' },
  { type: 'laugh' as const, emoji: '😂', label: 'Smích' },
  { type: 'wow' as const, emoji: '😮', label: 'Wow' },
  { type: 'sad' as const, emoji: '😢', label: 'Smutek' },
  { type: 'fire' as const, emoji: '🔥', label: 'Fire' },
  { type: 'clap' as const, emoji: '👏', label: 'Potlesk' },
  { type: 'thinking' as const, emoji: '🤔', label: 'Přemýšlení' },
  { type: 'heart_eyes' as const, emoji: '😍', label: 'Zamilovaný' },
];

export default function ReactionPicker({ 
  videoId, 
  currentTime,
  onReactionAdded 
}: ReactionPickerProps) {
  const [open, setOpen] = useState(false);
  const utils = trpc.useUtils();

  const addReactionMutation = trpc.videoReactions.addReaction.useMutation({
    onSuccess: () => {
      setOpen(false);
      utils.videoReactions.getReactionHeatmap.invalidate({ videoId });
      onReactionAdded?.();
    },
    onError: (error) => {
      console.error('Failed to add reaction:', error);
    },
  });

  const handleReaction = (reactionType: typeof REACTIONS[number]['type']) => {
    addReactionMutation.mutate({
      videoId,
      reactionType,
      timestamp: Math.floor(currentTime),
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
        >
          <Smile className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="end">
        <div className="grid grid-cols-4 gap-1">
          {REACTIONS.map((reaction) => (
            <Button
              key={reaction.type}
              variant="ghost"
              size="icon"
              className={cn(
                "h-12 w-12 text-2xl hover:scale-110 transition-transform",
                addReactionMutation.isPending && "opacity-50 pointer-events-none"
              )}
              onClick={() => handleReaction(reaction.type)}
              title={reaction.label}
            >
              {reaction.emoji}
            </Button>
          ))}
        </div>
        <div className="text-xs text-center text-muted-foreground mt-2">
          Reagovat na {Math.floor(currentTime)}s
        </div>
      </PopoverContent>
    </Popover>
  );
}
