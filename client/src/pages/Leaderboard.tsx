import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Trophy, Medal, Star, Crown, Flame, TrendingUp, 
  MessageSquare, ThumbsUp, Image, Award, Zap, Target
} from "lucide-react";

const RANK_CONFIG: Record<string, { label: string; color: string; icon: any; minPoints: number; nextRank: string; nextPoints: number }> = {
  newcomer: { label: "Newcomer", color: "text-gray-400", icon: Star, minPoints: 0, nextRank: "Member", nextPoints: 50 },
  member: { label: "Member", color: "text-blue-400", icon: Medal, minPoints: 50, nextRank: "Contributor", nextPoints: 200 },
  contributor: { label: "Contributor", color: "text-purple-400", icon: Award, minPoints: 200, nextRank: "Expert", nextPoints: 500 },
  expert: { label: "Expert", color: "text-orange-400", icon: Flame, minPoints: 500, nextRank: "Legend", nextPoints: 1000 },
  legend: { label: "Legend", color: "text-yellow-400", icon: Crown, minPoints: 1000, nextRank: "Max", nextPoints: 1000 },
};

const BADGE_CATEGORY_COLORS: Record<string, string> = {
  milestone: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  community: "bg-green-500/20 text-green-400 border-green-500/30",
  content: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  special: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
};

export default function Leaderboard() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("leaderboard");

  const { data: leaderboard = [] } = trpc.gamification.getLeaderboard.useQuery({ limit: 20 });
  const { data: myReputation } = trpc.gamification.getMyReputation.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: allBadges = [] } = trpc.gamification.getBadges.useQuery();
  const { data: myBadges = [] } = trpc.gamification.getUserBadges.useQuery(
    { userId: user?.id || 0 },
    { enabled: isAuthenticated && !!user?.id }
  );

  const rankConfig = myReputation ? RANK_CONFIG[myReputation.rank] || RANK_CONFIG.newcomer : RANK_CONFIG.newcomer;
  const RankIcon = rankConfig.icon;
  const progressToNext = myReputation
    ? rankConfig.nextPoints > rankConfig.minPoints
      ? Math.min(100, ((myReputation.points - rankConfig.minPoints) / (rankConfig.nextPoints - rankConfig.minPoints)) * 100)
      : 100
    : 0;

  const earnedBadgeCount = myBadges.filter((b: any) => b.earned).length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <h1 className="text-3xl font-bold mb-2">
          <span className="symbiote-text-gradient">Community</span> Leaderboard
        </h1>
        <p className="text-muted-foreground mb-8">Earn reputation points, unlock badges, and climb the ranks!</p>

        {/* My Reputation Card */}
        {isAuthenticated && myReputation && (
          <Card className="symbiote-card mb-8 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
            <CardContent className="p-6 relative">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                {/* Rank Badge */}
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-full bg-secondary flex items-center justify-center ${rankConfig.color}`}>
                    <RankIcon className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Your Rank</p>
                    <p className={`text-2xl font-bold ${rankConfig.color}`}>{rankConfig.label}</p>
                    <p className="text-lg font-semibold">{myReputation.points} points</p>
                  </div>
                </div>

                {/* Progress to Next Rank */}
                <div className="flex-1 w-full md:w-auto">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Progress to {rankConfig.nextRank}</span>
                    <span className="font-medium">{Math.round(progressToNext)}%</span>
                  </div>
                  <Progress value={progressToNext} className="h-3" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {myReputation.rank === 'legend' 
                      ? 'You reached the highest rank!' 
                      : `${rankConfig.nextPoints - myReputation.points} more points needed`}
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-lg font-bold">{myReputation.postsCount}</p>
                    <p className="text-xs text-muted-foreground">Posts</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold">{myReputation.repliesCount}</p>
                    <p className="text-xs text-muted-foreground">Replies</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold">{earnedBadgeCount}</p>
                    <p className="text-xs text-muted-foreground">Badges</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-card border border-border mb-6">
            <TabsTrigger value="leaderboard" className="gap-2">
              <Trophy className="h-4 w-4" />
              Leaderboard
            </TabsTrigger>
            <TabsTrigger value="badges" className="gap-2">
              <Award className="h-4 w-4" />
              Badges ({allBadges.length})
            </TabsTrigger>
            <TabsTrigger value="howto" className="gap-2">
              <Target className="h-4 w-4" />
              How to Earn
            </TabsTrigger>
          </TabsList>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard">
            <div className="space-y-2">
              {leaderboard.length > 0 ? leaderboard.map((entry: any, index: number) => {
                const entryRank = RANK_CONFIG[entry.rank] || RANK_CONFIG.newcomer;
                const EntryIcon = entryRank.icon;
                const isMe = user?.id === entry.userId;
                const positionColors = ['text-yellow-400', 'text-gray-300', 'text-amber-600'];
                
                return (
                  <Card key={entry.userId} className={`symbiote-card ${isMe ? 'ring-1 ring-primary' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Position */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                          index < 3 ? positionColors[index] : 'text-muted-foreground'
                        } ${index < 3 ? 'bg-secondary' : ''}`}>
                          {index < 3 ? (
                            <Trophy className="h-5 w-5" />
                          ) : (
                            <span>{entry.position}</span>
                          )}
                        </div>

                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden flex-shrink-0">
                          {entry.avatarUrl ? (
                            <img src={entry.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                              {entry.userName?.[0] || '?'}
                            </div>
                          )}
                        </div>

                        {/* Name & Rank */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{entry.userName}</span>
                            {isMe && <Badge className="bg-primary/20 text-primary text-xs">You</Badge>}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <EntryIcon className={`h-3 w-3 ${entryRank.color}`} />
                            <span className={`text-xs ${entryRank.color}`}>{entryRank.label}</span>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1" title="Posts">
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span>{entry.postsCount}</span>
                          </div>
                          <div className="flex items-center gap-1" title="Replies">
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span>{entry.repliesCount}</span>
                          </div>
                          <div className="flex items-center gap-1" title="Upvotes">
                            <ThumbsUp className="h-3.5 w-3.5" />
                            <span>{entry.upvotesReceived}</span>
                          </div>
                        </div>

                        {/* Points */}
                        <div className="text-right">
                          <p className="font-bold text-lg">{entry.points}</p>
                          <p className="text-xs text-muted-foreground">points</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              }) : (
                <Card className="symbiote-card">
                  <CardContent className="p-8 text-center">
                    <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No one on the leaderboard yet. Be the first!</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Badges Tab */}
          <TabsContent value="badges">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(isAuthenticated ? myBadges : allBadges).map((badge: any) => {
                const isEarned = badge.earned !== undefined ? badge.earned : false;
                const categoryColor = BADGE_CATEGORY_COLORS[badge.category] || BADGE_CATEGORY_COLORS.special;
                
                return (
                  <Card key={badge.id} className={`symbiote-card transition-all ${isEarned ? 'ring-1 ring-primary/50' : 'opacity-60'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${
                          isEarned ? 'bg-primary/20' : 'bg-secondary'
                        }`}>
                          {badge.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-sm">{badge.name}</h3>
                            {isEarned && <Zap className="h-3.5 w-3.5 text-primary" />}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{badge.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={`text-xs border ${categoryColor}`}>{badge.category}</Badge>
                            <span className="text-xs text-muted-foreground">+{badge.pointsReward} pts</span>
                          </div>
                          {isEarned && badge.earnedAt && (
                            <p className="text-xs text-primary mt-1">
                              Earned {new Date(badge.earnedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {(isAuthenticated ? myBadges : allBadges).length === 0 && (
                <Card className="symbiote-card col-span-full">
                  <CardContent className="p-8 text-center">
                    <Award className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No badges defined yet.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* How to Earn Tab */}
          <TabsContent value="howto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="symbiote-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Zap className="h-5 w-5 text-primary" />
                    Earning Points
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { action: "Create a forum topic", points: "+5", icon: MessageSquare },
                      { action: "Reply to a topic", points: "+3", icon: MessageSquare },
                      { action: "Receive an upvote", points: "+2", icon: ThumbsUp },
                      { action: "Receive a like on photo", points: "+1", icon: ThumbsUp },
                      { action: "Upload a photo", points: "+2", icon: Image },
                      { action: "Earn a badge", points: "+10-500", icon: Award },
                    ].map((item, i) => {
                      const Icon = item.icon;
                      return (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                          <div className="flex items-center gap-3">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{item.action}</span>
                          </div>
                          <span className="text-sm font-bold text-primary">{item.points}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="symbiote-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Rank Progression
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(RANK_CONFIG).map(([key, config]) => {
                      const Icon = config.icon;
                      const isCurrentRank = myReputation?.rank === key;
                      return (
                        <div key={key} className={`flex items-center gap-3 p-3 rounded-lg ${
                          isCurrentRank ? 'bg-primary/10 ring-1 ring-primary/30' : 'bg-secondary/30'
                        }`}>
                          <Icon className={`h-6 w-6 ${config.color}`} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`font-medium ${config.color}`}>{config.label}</span>
                              {isCurrentRank && <Badge className="bg-primary/20 text-primary text-xs">Current</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground">{config.minPoints}+ points required</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
