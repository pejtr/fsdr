import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  DollarSign, 
  Trophy,
  Network,
  Copy,
  Crown,
  Medal,
  Star,
  Gem,
  UserPlus,
  TrendingUp,
  Award,
  GitBranch
} from "lucide-react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

// Icon mapping for badges
const iconMap: Record<string, React.ReactNode> = {
  UserPlus: <UserPlus className="h-5 w-5" />,
  Users: <Users className="h-5 w-5" />,
  Star: <Star className="h-5 w-5" />,
  Crown: <Crown className="h-5 w-5" />,
  Gem: <Gem className="h-5 w-5" />,
  DollarSign: <DollarSign className="h-5 w-5" />,
  Banknote: <DollarSign className="h-5 w-5" />,
  Wallet: <DollarSign className="h-5 w-5" />,
  TrendingUp: <TrendingUp className="h-5 w-5" />,
  Trophy: <Trophy className="h-5 w-5" />,
  Network: <Network className="h-5 w-5" />,
  GitBranch: <GitBranch className="h-5 w-5" />,
  Share2: <Network className="h-5 w-5" />,
  Globe: <Network className="h-5 w-5" />,
};

// Tier colors
const tierColors: Record<string, string> = {
  bronze: "from-amber-700 to-amber-900",
  silver: "from-gray-400 to-gray-600",
  gold: "from-yellow-400 to-yellow-600",
  platinum: "from-purple-400 to-purple-600",
  diamond: "from-pink-400 to-cyan-400",
};

const tierBgColors: Record<string, string> = {
  bronze: "bg-amber-500/20 border-amber-500/50",
  silver: "bg-gray-400/20 border-gray-400/50",
  gold: "bg-yellow-500/20 border-yellow-500/50",
  platinum: "bg-purple-500/20 border-purple-500/50",
  diamond: "bg-gradient-to-r from-pink-500/20 to-cyan-500/20 border-pink-500/50",
};

export default function AffiliateDashboard() {
  const { user, isAuthenticated } = useAuth();
  
  const { data: stats } = trpc.affiliate.getStats.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  
  const { data: leaderboard } = trpc.affiliate.getLeaderboard.useQuery(
    { limit: 20 },
    { enabled: true }
  );
  
  const { data: myPosition } = trpc.affiliate.getMyPosition.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  
  const { data: directReferrals } = trpc.affiliate.getDirectReferrals.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  
  const { data: myBadges } = trpc.affiliate.getMyBadges.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  
  const { data: allBadges } = trpc.affiliate.getAllBadges.useQuery();
  
  const checkBadgesMutation = trpc.affiliate.checkBadges.useMutation({
    onSuccess: (data) => {
      if (data.newBadges.length > 0) {
        data.newBadges.forEach(badge => {
          toast.success(`🏆 Nový odznak: ${badge.name}!`);
        });
      }
    },
  });

  const copyAffiliateLink = () => {
    const link = `${window.location.origin}?ref=${stats?.affiliateCode || ''}`;
    navigator.clipboard.writeText(link);
    toast.success('Affiliate odkaz zkopírován!');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Přihlaste se</h1>
          <p className="text-muted-foreground mb-4">Pro přístup k affiliate dashboardu se musíte přihlásit.</p>
          <a href={getLoginUrl()}>
            <Button className="femsider-gradient text-white border-0">Přihlásit se</Button>
          </a>
        </main>
      </div>
    );
  }

  const earnedBadgeIds = new Set(myBadges?.map(b => b.badge.id) || []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">
              <span className="femsider-text-gradient">Affiliate</span> Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Sleduj svou síť, výdělky a odznaky
            </p>
          </div>
          <Button 
            onClick={() => checkBadgesMutation.mutate()}
            disabled={checkBadgesMutation.isPending}
            variant="outline"
          >
            <Award className="h-4 w-4 mr-2" />
            Zkontrolovat odznaky
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Celkové výdělky"
            value={`$${stats?.totalEarnings || '0'}`}
            icon={<DollarSign className="h-5 w-5" />}
            gradient="from-emerald-500 to-green-600"
          />
          <StatCard
            title="Přímé referraly"
            value={stats?.networkStats?.tier1?.toString() || '0'}
            icon={<UserPlus className="h-5 w-5" />}
            gradient="from-blue-500 to-cyan-600"
          />
          <StatCard
            title="Celková síť"
            value={stats?.networkStats?.total?.toString() || '0'}
            icon={<Network className="h-5 w-5" />}
            gradient="from-purple-500 to-pink-600"
          />
          <StatCard
            title="Pozice v žebříčku"
            value={myPosition ? `#${myPosition.rank}` : '-'}
            icon={<Trophy className="h-5 w-5" />}
            gradient="from-yellow-500 to-orange-600"
          />
        </div>

        {/* Affiliate Link */}
        <Card className="femsider-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Copy className="h-5 w-5 text-primary" />
              Tvůj affiliate odkaz
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input 
                readOnly 
                value={`${window.location.origin}?ref=${stats?.affiliateCode || ''}`}
                className="bg-input font-mono text-sm"
              />
              <Button onClick={copyAffiliateLink} className="femsider-gradient text-white border-0">
                <Copy className="h-4 w-4 mr-2" />
                Kopírovat
              </Button>
            </div>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="femsider-card p-3">
                <p className="text-2xl font-bold text-primary">{(stats?.tiers?.[1] ?? 0.25) * 100}%</p>
                <p className="text-xs text-muted-foreground">Tier 1</p>
              </div>
              <div className="femsider-card p-3">
                <p className="text-2xl font-bold text-blue-400">{(stats?.tiers?.[2] ?? 0.10) * 100}%</p>
                <p className="text-xs text-muted-foreground">Tier 2</p>
              </div>
              <div className="femsider-card p-3">
                <p className="text-2xl font-bold text-purple-400">{(stats?.tiers?.[3] ?? 0.05) * 100}%</p>
                <p className="text-xs text-muted-foreground">Tier 3</p>
              </div>
              <div className="femsider-card p-3">
                <p className="text-2xl font-bold text-pink-400">{(stats?.tiers?.[4] ?? 0.02) * 100}%</p>
                <p className="text-xs text-muted-foreground">Tier 4</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="network" className="w-full">
          <TabsList className="w-full justify-start bg-card border border-border mb-6">
            <TabsTrigger value="network">
              <Network className="h-4 w-4 mr-2" />
              Moje síť
            </TabsTrigger>
            <TabsTrigger value="leaderboard">
              <Trophy className="h-4 w-4 mr-2" />
              Žebříček
            </TabsTrigger>
            <TabsTrigger value="badges">
              <Award className="h-4 w-4 mr-2" />
              Odznaky
            </TabsTrigger>
            <TabsTrigger value="earnings">
              <DollarSign className="h-4 w-4 mr-2" />
              Výdělky
            </TabsTrigger>
          </TabsList>
          
          {/* Network Tab */}
          <TabsContent value="network">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Network Visualization */}
              <Card className="femsider-card">
                <CardHeader>
                  <CardTitle>Struktura sítě</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <NetworkTierRow 
                      tier={1} 
                      count={stats?.networkStats?.tier1 || 0} 
                      label="Přímé referraly"
                      color="text-primary"
                      percentage={25}
                    />
                    <NetworkTierRow 
                      tier={2} 
                      count={stats?.networkStats?.tier2 || 0} 
                      label="Tier 2"
                      color="text-blue-400"
                      percentage={10}
                    />
                    <NetworkTierRow 
                      tier={3} 
                      count={stats?.networkStats?.tier3 || 0} 
                      label="Tier 3"
                      color="text-purple-400"
                      percentage={5}
                    />
                    <NetworkTierRow 
                      tier={4} 
                      count={stats?.networkStats?.tier4 || 0} 
                      label="Tier 4"
                      color="text-pink-400"
                      percentage={2}
                    />
                    <div className="pt-4 border-t border-border">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Celkem v síti</span>
                        <span className="text-2xl font-bold femsider-text-gradient">
                          {stats?.networkStats?.total || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Direct Referrals List */}
              <Card className="femsider-card">
                <CardHeader>
                  <CardTitle>Přímé referraly ({directReferrals?.length || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                  {directReferrals && directReferrals.length > 0 ? (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {directReferrals.map((referral) => (
                        <div key={referral.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={referral.avatarUrl || undefined} />
                              <AvatarFallback>{referral.name?.[0] || '?'}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{referral.name || `Uživatel #${referral.id}`}</p>
                              <p className="text-xs text-muted-foreground">
                                +{referral.theirReferralCount} referralů
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-primary">${referral.earningsFromReferral}</p>
                            <p className="text-xs text-muted-foreground">výdělek</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <UserPlus className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">Zatím nemáte žádné referraly.</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Sdílejte svůj affiliate odkaz a začněte vydělávat!
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard">
            <Card className="femsider-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Top Affiliate Partneři
                </CardTitle>
              </CardHeader>
              <CardContent>
                {leaderboard && leaderboard.length > 0 ? (
                  <div className="space-y-2">
                    {leaderboard.map((entry, index) => (
                      <LeaderboardRow 
                        key={entry.userId} 
                        entry={entry} 
                        isCurrentUser={entry.userId === user?.id}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Žebříček je zatím prázdný.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Badges Tab */}
          <TabsContent value="badges">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Earned Badges */}
              <Card className="femsider-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    Získané odznaky ({myBadges?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {myBadges && myBadges.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {myBadges.map((item) => (
                        <BadgeCard 
                          key={item.id} 
                          badge={item.badge} 
                          earned={true}
                          earnedAt={item.earnedAt}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Medal className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">Zatím nemáte žádné odznaky.</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Přivádějte uživatele a odemykejte odznaky!
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* All Badges */}
              <Card className="femsider-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    Všechny odznaky
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {allBadges && allBadges.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 max-h-[500px] overflow-y-auto">
                      {allBadges.map((badge) => (
                        <BadgeCard 
                          key={badge.id} 
                          badge={badge} 
                          earned={earnedBadgeIds.has(badge.id)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Načítám odznaky...</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Earnings Tab */}
          <TabsContent value="earnings">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Earnings by Tier */}
              <Card className="femsider-card">
                <CardHeader>
                  <CardTitle>Výdělky podle úrovně</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats?.earningsByTier?.map((tierData: any) => (
                      <div key={tierData.tier} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                        <div>
                          <p className="font-medium">Tier {tierData.tier}</p>
                          <p className="text-xs text-muted-foreground">{tierData.count} transakcí</p>
                        </div>
                        <p className="text-xl font-bold text-primary">${tierData.total}</p>
                      </div>
                    )) || (
                      <p className="text-center text-muted-foreground py-4">Zatím žádné výdělky</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Earnings */}
              <Card className="femsider-card">
                <CardHeader>
                  <CardTitle>Poslední transakce</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats?.recentEarnings && stats.recentEarnings.length > 0 ? (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {stats.recentEarnings.map((earning: any) => (
                        <div key={earning.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                          <div>
                            <p className="font-medium">Tier {earning.tier} provize</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(earning.createdAt).toLocaleDateString('cs-CZ')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-primary">+${earning.amount}</p>
                            <p className={`text-xs ${
                              earning.status === 'approved' ? 'text-green-500' :
                              earning.status === 'pending' ? 'text-yellow-500' : 'text-muted-foreground'
                            }`}>
                              {earning.status === 'approved' ? 'Schváleno' :
                               earning.status === 'pending' ? 'Čeká' : earning.status}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">Zatím žádné výdělky.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon, gradient }: { 
  title: string; 
  value: string; 
  icon: React.ReactNode;
  gradient: string;
}) {
  return (
    <Card className="femsider-card overflow-hidden">
      <CardContent className="p-6 relative">
        <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${gradient} opacity-10 rounded-bl-full`} />
        <div className="flex items-center justify-between mb-2">
          <span className="text-muted-foreground text-sm">{title}</span>
          <span className={`bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>{icon}</span>
        </div>
        <span className="text-2xl font-bold">{value}</span>
      </CardContent>
    </Card>
  );
}

function NetworkTierRow({ tier, count, label, color, percentage }: {
  tier: number;
  count: number;
  label: string;
  color: string;
  percentage: number;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${color.replace('text-', 'bg-')}`} />
          <span className="text-sm">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium">{count}</span>
          <span className={`text-xs ${color}`}>({percentage}%)</span>
        </div>
      </div>
      <Progress value={Math.min(count * 10, 100)} className="h-2" />
    </div>
  );
}

function LeaderboardRow({ entry, isCurrentUser }: { 
  entry: any; 
  isCurrentUser: boolean;
}) {
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-700" />;
    return <span className="text-muted-foreground font-mono">#{rank}</span>;
  };

  return (
    <div className={`flex items-center justify-between p-4 rounded-lg ${
      isCurrentUser ? 'bg-primary/10 border border-primary/30' : 'bg-secondary/30'
    }`}>
      <div className="flex items-center gap-4">
        <div className="w-8 text-center">
          {getRankIcon(entry.rank)}
        </div>
        <Avatar className="h-10 w-10">
          <AvatarImage src={entry.avatarUrl || undefined} />
          <AvatarFallback>{entry.name?.[0] || '?'}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">
            {entry.name}
            {isCurrentUser && <span className="text-primary ml-2">(Vy)</span>}
          </p>
          <p className="text-xs text-muted-foreground">{entry.referralCount} referralů</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-bold text-primary">${entry.totalEarnings}</p>
        <p className="text-xs text-muted-foreground">celkem</p>
      </div>
    </div>
  );
}

function BadgeCard({ badge, earned, earnedAt }: { 
  badge: any; 
  earned: boolean;
  earnedAt?: Date;
}) {
  const icon = iconMap[badge.icon] || <Award className="h-5 w-5" />;
  
  return (
    <div className={`p-4 rounded-lg border ${
      earned 
        ? tierBgColors[badge.tier] || 'bg-primary/10 border-primary/30'
        : 'bg-secondary/20 border-border opacity-50'
    }`}>
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-full ${
          earned 
            ? `bg-gradient-to-r ${tierColors[badge.tier] || 'from-primary to-pink-500'}`
            : 'bg-secondary'
        }`}>
          <span className={earned ? 'text-white' : 'text-muted-foreground'}>
            {icon}
          </span>
        </div>
        <div>
          <p className="font-medium text-sm">{badge.name}</p>
          <p className="text-xs text-muted-foreground capitalize">{badge.tier}</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{badge.description}</p>
      {earned && earnedAt && (
        <p className="text-xs text-primary mt-2">
          Získáno: {new Date(earnedAt).toLocaleDateString('cs-CZ')}
        </p>
      )}
    </div>
  );
}
