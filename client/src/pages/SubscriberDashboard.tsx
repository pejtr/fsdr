import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, Calendar, DollarSign, X } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

export default function SubscriberDashboard() {
  const { user, isAuthenticated } = useAuth();
  
  const { data: subscriptions, refetch } = trpc.subscription.mySubscriptions.useQuery(undefined, {
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Přihlaste se</h1>
          <p className="text-muted-foreground mb-4">Pro zobrazení odběrů se musíte přihlásit.</p>
          <a href={getLoginUrl()}>
            <Button className="femsider-gradient text-white border-0">Přihlásit se</Button>
          </a>
        </main>
      </div>
    );
  }

  const activeSubscriptions = subscriptions?.filter(s => s.status === 'active') || [];
  const cancelledSubscriptions = subscriptions?.filter(s => s.status !== 'active') || [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <h1 className="text-3xl font-bold mb-8">
          <span className="femsider-text-gradient">Moje</span> odběry
        </h1>

        {/* Active Subscriptions */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Aktivní odběry ({activeSubscriptions.length})
          </h2>
          
          {activeSubscriptions.length > 0 ? (
            <div className="grid gap-4">
              {activeSubscriptions.map((sub) => (
                <SubscriptionCard 
                  key={sub.id} 
                  subscription={sub}
                  onCancel={() => cancelMutation.mutate({ subscriptionId: sub.id })}
                  isCancelling={cancelMutation.isPending}
                />
              ))}
            </div>
          ) : (
            <Card className="femsider-card">
              <CardContent className="p-8 text-center">
                <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">Zatím nemáte žádné aktivní odběry.</p>
                <Link href="/browse">
                  <Button className="femsider-gradient text-white border-0">
                    Procházet tvůrce
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Cancelled/Expired Subscriptions */}
        {cancelledSubscriptions.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4 text-muted-foreground">
              Historie odběrů ({cancelledSubscriptions.length})
            </h2>
            <div className="grid gap-4 opacity-60">
              {cancelledSubscriptions.map((sub) => (
                <SubscriptionCard 
                  key={sub.id} 
                  subscription={sub}
                  isInactive
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

interface SubscriptionCardProps {
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

function SubscriptionCard({ subscription, onCancel, isCancelling, isInactive }: SubscriptionCardProps) {
  const { data: creator } = trpc.user.getProfile.useQuery(
    { userId: subscription.creatorId },
    { enabled: subscription.creatorId > 0 }
  );

  return (
    <Card className="femsider-card">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Link href={`/creator/${subscription.creatorId}`}>
            <Avatar className="h-16 w-16 border-2 border-primary/50 cursor-pointer">
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
