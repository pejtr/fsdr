import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield, CreditCard, FileCheck, Check, AlertTriangle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

export default function AgeVerification() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  
  const { data: verificationStatus, refetch } = trpc.ageVerification.getStatus.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  
  const submitMutation = trpc.ageVerification.submit.useMutation({
    onSuccess: () => {
      toast.success('Věk byl úspěšně ověřen!');
      refetch();
      // Reload to update user context
      setTimeout(() => window.location.reload(), 1000);
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
          <p className="text-muted-foreground mb-4">Pro ověření věku se musíte přihlásit.</p>
          <a href={getLoginUrl()}>
            <Button className="symbiote-gradient text-white border-0">Přihlásit se</Button>
          </a>
        </main>
      </div>
    );
  }

  // Already verified
  if (verificationStatus?.isVerified) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <div className="max-w-lg mx-auto text-center">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <Check className="h-10 w-10 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Věk ověřen</h1>
            <p className="text-muted-foreground mb-8">
              Váš věk byl úspěšně ověřen. Nyní máte přístup ke všem funkcím platformy.
            </p>
            <Link href="/browse">
              <Button className="symbiote-gradient text-white border-0">
                Procházet obsah
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <Shield className="h-16 w-16 mx-auto mb-4 text-primary" />
            <h1 className="text-3xl font-bold mb-2">Ověření věku</h1>
            <p className="text-muted-foreground">
              Pro přístup k obsahu pro dospělé musíte ověřit, že je vám 18 a více let.
            </p>
          </div>

          <div className="symbiote-card p-6 mb-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-6 w-6 text-accent flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Důležité upozornění</h3>
                <p className="text-sm text-muted-foreground">
                  Tato platforma obsahuje obsah pouze pro dospělé. Vstupem potvrzujete, 
                  že je vám 18 let nebo více a že je legální prohlížet takový obsah ve vaší jurisdikci.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <VerificationOption
              icon={<CreditCard className="h-8 w-8" />}
              title="Ověření kreditní kartou"
              description="Rychlé ověření pomocí platební karty. Žádná platba nebude provedena."
              onClick={() => submitMutation.mutate({ method: 'credit_card' })}
              isLoading={submitMutation.isPending}
            />
            
            <VerificationOption
              icon={<FileCheck className="h-8 w-8" />}
              title="Ověření dokladem"
              description="Nahrajte fotografii občanského průkazu nebo pasu pro ověření."
              onClick={() => submitMutation.mutate({ method: 'id_document' })}
              isLoading={submitMutation.isPending}
            />
            
            <VerificationOption
              icon={<Shield className="h-8 w-8" />}
              title="Ověření třetí stranou"
              description="Použijte službu třetí strany pro anonymní ověření věku."
              onClick={() => submitMutation.mutate({ method: 'third_party', provider: 'AgeChecker' })}
              isLoading={submitMutation.isPending}
            />
          </div>

          <p className="text-xs text-muted-foreground text-center mt-8">
            Vaše osobní údaje jsou zpracovávány v souladu s GDPR a jsou použity pouze pro účely ověření věku.
            Více informací naleznete v našich zásadách ochrany osobních údajů.
          </p>
        </div>
      </main>
    </div>
  );
}

interface VerificationOptionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  isLoading?: boolean;
}

function VerificationOption({ icon, title, description, onClick, isLoading }: VerificationOptionProps) {
  return (
    <Card className="symbiote-card cursor-pointer transition-all hover:symbiote-glow" onClick={onClick}>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="text-primary">{icon}</div>
          <div className="flex-1">
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <Button 
            className="symbiote-gradient text-white border-0"
            disabled={isLoading}
          >
            {isLoading ? 'Ověřuji...' : 'Ověřit'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
