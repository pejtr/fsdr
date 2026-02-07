import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, Calendar, DollarSign, X, CheckCircle2, Crown, Sparkles, Shield, ArrowRight, Star, Zap } from "lucide-react";
import { Link, useSearch } from "wouter";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import { useState, useEffect } from "react";

export default function SubscriberDashboard() {
  const { user, isAuthenticated } = useAuth();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const isSuccess = params.get('success') === 'true';
  const successTier = params.get('tier');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isSuccess) {
      setShowSuccess(true);
      // Auto-hide after 10 seconds
      const timer = setTimeout(() => setShowSuccess(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess]);

  const { data: subscriptions, refetch } = trpc.subscription.mySubscriptions.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: premiumSubs, refetch: refetchPremium } = trpc.subscription.myPremiumSubscriptions.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const cancelMutation = trpc.subscription.cancel.useMutation({
    onSuccess: () => {
      toast.success('Odběr byl zrušen');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const cancelPremiumMutation = trpc.subscription.cancelPremium.useMutation({
    onSuccess: () => {
      toast.success('Premium předplatné bylo zrušeno');
      refetchPremium();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Přihlaste se</h1>
          <p className="text-muted-foreground mb-4">Pro zobrazení odběrů se musíte přihlásit.</p>
          <a href={getLoginUrl()}>
            <Button className="symbiote-gradient text-white border-0">Přihlásit se</Button>
          </a>
        </main>
      </div>
    );
  }

  const activeCreatorSubs = subscriptions?.filter(s => s.status === 'active') || [];
  const cancelledCreatorSubs = subscriptions?.filter(s => s.status !== 'active') || [];
  const activePremium = premiumSubs?.filter(s => s.status === 'active') || [];
  const inactivePremium = premiumSubs?.filter(s => s.status !== 'active') || [];

  const tierConfig: Record<string, { label: string; icon: React.ReactNode; color: string; gradient: string }> = {
    supporter: { label: 'Komunita+', icon: <Heart className="h-5 w-5" />, color: 'text-emerald-400', gradient: 'from-emerald-500 to-teal-500' },
    premium: { label: 'Premium', icon: <Star className="h-5 w-5" />, color: 'text-purple-400', gradient: 'from-purple-500 to-pink-500' },
    vip: { label: 'VIP Insider', icon: <Crown className="h-5 w-5" />, color: 'text-yellow-400', gradient: 'from-yellow-500 to-orange-500' },
    creator: { label: 'Creator', icon: <Sparkles className="h-5 w-5" />, color: 'text-blue-400', gradient: 'from-blue-500 to-cyan-500' },
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8 max-w-4xl">
        {/* Success Banner */}
        {showSuccess && (
          <div className="mb-8 relative overflow-hidden rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,oklch(0.6_0.15_180/0.15),transparent_70%)]" />
            <div className="relative flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-emerald-400 mb-1">
                  Platba úspěšná!
                </h2>
                <p className="text-muted-foreground">
                  Gratulujeme! Tvoje předplatné{' '}
                  <span className="font-semibold text-foreground">
                    {successTier === 'vip' ? 'VIP Insider' : 'Komunita+'}
                  </span>{' '}
                  je nyní aktivní. Užij si všechny výhody!
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowSuccess(false)}
                className="text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <h1 className="text-3xl font-bold mb-8">
          <span className="symbiote-text-gradient">Moje</span> předplatné
        </h1>

        {/* Premium Subscriptions */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-400" />
            Premium plány ({activePremium.length})
          </h2>
          
          {activePremium.length > 0 ? (
            <div className="grid gap-4">
              {activePremium.map((sub) => {
                const config = tierConfig[sub.tier] || tierConfig.supporter;
                return (
                  <Card key={sub.id} className="symbiote-card overflow-hidden">
                    <div className={`h-1 bg-gradient-to-r ${config.gradient}`} />
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center text-white`}>
                          {config.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className={`font-bold text-lg ${config.color}`}>{config.label}</h3>
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400">
                              Aktivní
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              ${sub.priceMonthly}/{sub.billingCycle === 'yearly' ? 'rok' : 'měsíc'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Od {new Date(sub.createdAt).toLocaleDateString('cs-CZ')}
                            </span>
                          </div>
                          {sub.currentPeriodEnd && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Obnoví se: {new Date(sub.currentPeriodEnd).toLocaleDateString('cs-CZ')}
                            </p>
                          )}
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            if (confirm('Opravdu chceš zrušit předplatné? Přijdeš o všechny výhody.')) {
                              cancelPremiumMutation.mutate({ subscriptionId: sub.id });
                            }
                          }}
                          disabled={cancelPremiumMutation.isPending}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Zrušit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="symbiote-card">
              <CardContent className="p-8 text-center">
                <Crown className="h-12 w-12 mx-auto mb-4 text-yellow-400/50" />
                <p className="text-muted-foreground mb-2">Zatím nemáš žádný premium plán.</p>
                <p className="text-sm text-muted-foreground mb-4">Odemkni exkluzivní obsah a funkce s premium předplatným.</p>
                <Link href="/#pricing">
                  <Button className="symbiote-gradient text-white border-0">
                    Zobrazit plány
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Inactive Premium */}
        {inactivePremium.length > 0 && (
          <section className="mb-12">
            <h2 className="text-lg font-semibold mb-4 text-muted-foreground">
              Historie premium ({inactivePremium.length})
            </h2>
            <div className="grid gap-3 opacity-60">
              {inactivePremium.map((sub) => {
                const config = tierConfig[sub.tier] || tierConfig.supporter;
                return (
                  <Card key={sub.id} className="symbiote-card">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground`}>
                          {config.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">{config.label}</h3>
                          <p className="text-xs text-muted-foreground">
                            {sub.status === 'cancelled' ? 'Zrušeno' : 'Vypršelo'} • ${sub.priceMonthly}/{sub.billingCycle === 'yearly' ? 'rok' : 'měsíc'}
                            {sub.cancelledAt && ` • ${new Date(sub.cancelledAt).toLocaleDateString('cs-CZ')}`}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                          {sub.status === 'cancelled' ? 'Zrušeno' : 'Vypršelo'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* Creator Subscriptions */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Odběry tvůrců ({activeCreatorSubs.length})
          </h2>
          
          {activeCreatorSubs.length > 0 ? (
            <div className="grid gap-4">
              {activeCreatorSubs.map((sub) => (
                <CreatorSubscriptionCard 
                  key={sub.id} 
                  subscription={sub}
                  onCancel={() => cancelMutation.mutate({ subscriptionId: sub.id })}
                  isCancelling={cancelMutation.isPending}
                />
              ))}
            </div>
          ) : (
            <Card className="symbiote-card">
              <CardContent className="p-8 text-center">
                <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">Zatím nemáte žádné aktivní odběry tvůrců.</p>
                <Link href="/browse">
                  <Button className="symbiote-gradient text-white border-0">
                    Procházet tvůrce
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Cancelled Creator Subscriptions */}
        {cancelledCreatorSubs.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-4 text-muted-foreground">
              Historie odběrů tvůrců ({cancelledCreatorSubs.length})
            </h2>
            <div className="grid gap-4 opacity-60">
              {cancelledCreatorSubs.map((sub) => (
                <CreatorSubscriptionCard 
                  key={sub.id} 
                  subscription={sub}
                  isInactive
                />
              ))}
            </div>
          </section>
        )}

        {/* Upgrade CTA */}
        {activePremium.length === 0 && (
          <section className="mt-12">
            <Card className="symbiote-card overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-yellow-500" />
              <CardContent className="p-8">
                <div className="flex items-center gap-6">
                  <div className="hidden sm:flex h-20 w-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-yellow-500/20 items-center justify-center">
                    <Zap className="h-10 w-10 text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">Odemkni plný potenciál FEMSIDER</h3>
                    <p className="text-muted-foreground mb-4">
                      Získej přístup k exkluzivnímu obsahu, 4K videím, přímému kontaktu s tvůrci a mnohem více.
                    </p>
                    <div className="flex gap-3">
                      <Link href="/#pricing">
                        <Button className="symbiote-gradient text-white border-0">
                          Zobrazit plány
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </main>
    </div>
  );
}

interface CreatorSubscriptionCardProps {
  subscription: {
    id: number;
    creatorId: number;
    status: string | null;
    priceAtPurchase: string;
    startDate: Date;
    renewsAt: Date | null;
  };
  onCancel?: () => void;
  isCancelling?: boolean;
  isInactive?: boolean;
}

function CreatorSubscriptionCard({ subscription, onCancel, isCancelling, isInactive }: CreatorSubscriptionCardProps) {
  const { data: creator } = trpc.user.getProfile.useQuery(
    { userId: subscription.creatorId },
    { enabled: subscription.creatorId > 0 }
  );

  return (
    <Card className="symbiote-card">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Link href={`/creator/${subscription.creatorId}`}>
            <Avatar className="h-14 w-14 border-2 border-primary/50 cursor-pointer">
              <AvatarImage src={creator?.avatarUrl || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary text-xl">
                {creator?.name?.charAt(0)?.toUpperCase() || 'C'}
              </AvatarFallback>
            </Avatar>
          </Link>
          
          <div className="flex-1">
            <Link href={`/creator/${subscription.creatorId}`}>
              <h3 className="font-semibold text-lg hover:text-primary transition-colors cursor-pointer">
                {creator?.name || 'Tvůrce'}
              </h3>
            </Link>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                ${subscription.priceAtPurchase}/měsíc
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Od {new Date(subscription.startDate).toLocaleDateString('cs-CZ')}
              </span>
            </div>
            {subscription.renewsAt && subscription.status === 'active' && (
              <p className="text-xs text-muted-foreground mt-1">
                Obnoví se: {new Date(subscription.renewsAt).toLocaleDateString('cs-CZ')}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              subscription.status === 'active' 
                ? 'bg-green-500/20 text-green-500' 
                : 'bg-muted text-muted-foreground'
            }`}>
              {subscription.status === 'active' ? 'Aktivní' : 
               subscription.status === 'cancelled' ? 'Zrušeno' : 'Vypršelo'}
            </span>
            
            {!isInactive && onCancel && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={onCancel}
                disabled={isCancelling}
                className="text-destructive hover:text-destructive"
              >
                <X className="h-4 w-4 mr-1" />
                Zrušit
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
