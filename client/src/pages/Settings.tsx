import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, DollarSign, Shield, Save, Mail, BellRing, Megaphone } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";

export default function Settings() {
  const { user, isAuthenticated } = useAuth();
  
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [subscriptionPrice, setSubscriptionPrice] = useState('9.99');
  const [weeklyDigestEnabled, setWeeklyDigestEnabled] = useState(true);
  const [promotionalEmailsEnabled, setPromotionalEmailsEnabled] = useState(true);

  const { data: emailPreferences, isLoading: emailPreferencesLoading } = trpc.user.getEmailPreferences.useQuery(
    undefined,
    { enabled: isAuthenticated },
  );

  const updateEmailPreferencesMutation = trpc.user.updateEmailPreferences.useMutation({
    onSuccess: (preferences) => {
      setWeeklyDigestEnabled(preferences.weeklyDigestEnabled);
      setPromotionalEmailsEnabled(preferences.promotionalEmailsEnabled);
      toast.success('E-mailové preference byly uloženy');
    },
    onError: (error) => {
      toast.error('Preference se nepodařilo uložit', { description: error.message });
    },
  });
  
  const updateMutation = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      toast.success('Profil byl aktualizován');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setBio(user.bio || '');
      setAvatarUrl(user.avatarUrl || '');
      setSubscriptionPrice(user.subscriptionPrice || '9.99');
    }
  }, [user]);

  useEffect(() => {
    if (!emailPreferences) return;
    setWeeklyDigestEnabled(emailPreferences.weeklyDigestEnabled);
    setPromotionalEmailsEnabled(emailPreferences.promotionalEmailsEnabled);
  }, [emailPreferences]);

  const handleSave = () => {
    updateMutation.mutate({
      name,
      bio,
      avatarUrl: avatarUrl || undefined,
      subscriptionPrice: subscriptionPrice || undefined,
    });
  };

  const handleEmailPreferencesSave = () => {
    updateEmailPreferencesMutation.mutate({
      weeklyDigestEnabled,
      promotionalEmailsEnabled,
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Přihlaste se</h1>
          <p className="text-muted-foreground mb-4">Pro přístup k nastavení se musíte přihlásit.</p>
          <a href={getLoginUrl()}>
            <Button className="symbiote-gradient text-white border-0">Přihlásit se</Button>
          </a>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <h1 className="text-3xl font-bold mb-8">
          <span className="symbiote-text-gradient">Nastavení</span>
        </h1>

        <div className="max-w-2xl">
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="flex w-full gap-0 bg-card border border-border mb-6">
              <TabsTrigger value="profile" className="min-w-0 flex-1 px-1 text-[11px] sm:px-3 sm:text-sm">
                <User className="h-4 w-4 mr-1 shrink-0 sm:mr-2" />
                Profil
              </TabsTrigger>
              {(user?.role === 'creator' || user?.role === 'admin') && (
                <TabsTrigger value="monetization" className="min-w-0 flex-1 px-1 text-[11px] sm:px-3 sm:text-sm">
                  <DollarSign className="h-4 w-4 mr-1 shrink-0 sm:mr-2" />
                  Monetizace
                </TabsTrigger>
              )}
              <TabsTrigger value="security" className="min-w-0 flex-1 px-1 text-[11px] sm:px-3 sm:text-sm">
                <Shield className="h-4 w-4 mr-1 shrink-0 sm:mr-2" />
                Bezpečnost
              </TabsTrigger>
              <TabsTrigger value="email" className="min-w-0 flex-1 px-1 text-[11px] sm:px-3 sm:text-sm">
                <Mail className="h-4 w-4 mr-1 shrink-0 sm:mr-2" />
                E-maily
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile">
              <Card className="symbiote-card">
                <CardHeader>
                  <CardTitle>Informace o profilu</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar preview */}
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20 border-2 border-primary/50">
                      <AvatarImage src={avatarUrl || undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary text-2xl">
                        {name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{name || 'Uživatel'}</p>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="name">Jméno</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Vaše jméno"
                      className="bg-input"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Napište něco o sobě..."
                      className="bg-input"
                      rows={4}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="avatar">URL profilového obrázku</Label>
                    <Input
                      id="avatar"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://..."
                      className="bg-input"
                    />
                  </div>
                  
                  <Button 
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                    className="symbiote-gradient text-white border-0"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateMutation.isPending ? 'Ukládám...' : 'Uložit změny'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="email">
              <Card className="symbiote-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    E-mailové preference
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Rozhodni, které zprávy chceš dostávat na adresu <span className="text-foreground">{user?.email || 'tvůj e-mail'}</span>.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-secondary/30 p-4 transition-colors hover:bg-secondary/50">
                    <div className="flex items-start gap-3">
                      <BellRing className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <div>
                        <p className="font-medium">Týdenní přehled komunity</p>
                        <p className="text-sm text-muted-foreground">Body, odznaky, leaderboard a nové dění ve fóru.</p>
                      </div>
                    </div>
                    <Switch
                      checked={weeklyDigestEnabled}
                      onCheckedChange={setWeeklyDigestEnabled}
                      disabled={emailPreferencesLoading || updateEmailPreferencesMutation.isPending}
                      aria-label="Povolit týdenní přehledy"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-secondary/30 p-4 transition-colors hover:bg-secondary/50">
                    <div className="flex items-start gap-3">
                      <Megaphone className="mt-0.5 h-5 w-5 shrink-0 text-yellow-400" />
                      <div>
                        <p className="font-medium">Nabídky a novinky FEMSIDER</p>
                        <p className="text-sm text-muted-foreground">Občasné VIP nabídky, nové funkce a personalizované tipy.</p>
                      </div>
                    </div>
                    <Switch
                      checked={promotionalEmailsEnabled}
                      onCheckedChange={setPromotionalEmailsEnabled}
                      disabled={emailPreferencesLoading || updateEmailPreferencesMutation.isPending}
                      aria-label="Povolit marketingové e-maily"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
                    <p className="text-xs text-muted-foreground">Změnu můžeš kdykoliv upravit. Provozní e-maily účtu jsou oddělené.</p>
                    <Button
                      onClick={handleEmailPreferencesSave}
                      disabled={emailPreferencesLoading || updateEmailPreferencesMutation.isPending}
                      className="symbiote-gradient shrink-0 text-white border-0"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {updateEmailPreferencesMutation.isPending ? 'Ukládám…' : 'Uložit preference'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {(user?.role === 'creator' || user?.role === 'admin') && (
              <TabsContent value="monetization">
                <Card className="symbiote-card">
                  <CardHeader>
                    <CardTitle>Nastavení monetizace</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label htmlFor="price">Měsíční cena předplatného (USD)</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-muted-foreground">$</span>
                        <Input
                          id="price"
                          type="number"
                          min="1"
                          max="100"
                          step="0.01"
                          value={subscriptionPrice}
                          onChange={(e) => setSubscriptionPrice(e.target.value)}
                          className="bg-input w-32"
                        />
                        <span className="text-muted-foreground">/ měsíc</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Doporučená cena: $5 - $20 pro začínající tvůrce
                      </p>
                    </div>
                    
                    <div className="symbiote-card p-4">
                      <h4 className="font-medium mb-2">Váš výdělek</h4>
                      <p className="text-sm text-muted-foreground">
                        Z každého předplatného získáte <span className="text-primary font-bold">88%</span>.
                        Při ceně ${subscriptionPrice} to je <span className="text-primary font-bold">
                          ${(parseFloat(subscriptionPrice || '0') * 0.88).toFixed(2)}
                        </span> za odběratele měsíčně.
                      </p>
                    </div>
                    
                    <Button 
                      onClick={handleSave}
                      disabled={updateMutation.isPending}
                      className="symbiote-gradient text-white border-0"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {updateMutation.isPending ? 'Ukládám...' : 'Uložit změny'}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
            
            <TabsContent value="security">
              <Card className="symbiote-card">
                <CardHeader>
                  <CardTitle>Bezpečnost a ověření</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                    <div>
                      <h4 className="font-medium">Ověření věku</h4>
                      <p className="text-sm text-muted-foreground">
                        {user?.isAgeVerified 
                          ? 'Váš věk byl ověřen' 
                          : 'Pro přístup k obsahu pro dospělé ověřte svůj věk'}
                      </p>
                    </div>
                    {user?.isAgeVerified ? (
                      <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-500 text-sm">
                        Ověřeno
                      </span>
                    ) : (
                      <Link href="/verify-age">
                        <Button className="symbiote-gradient text-white border-0">
                          Ověřit
                        </Button>
                      </Link>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                    <div>
                      <h4 className="font-medium">Role účtu</h4>
                      <p className="text-sm text-muted-foreground capitalize">
                        {user?.role === 'admin' ? 'Administrátor' : 
                         user?.role === 'creator' ? 'Tvůrce' : 'Uživatel'}
                      </p>
                    </div>
                    {user?.role === 'user' && user?.isAgeVerified && (
                      <Link href="/dashboard">
                        <Button variant="outline">
                          Stát se tvůrcem
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
