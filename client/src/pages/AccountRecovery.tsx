import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { KeyRound, Mail, ShieldCheck, HelpCircle, ArrowRight, ExternalLink, CheckCircle2 } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function AccountRecovery() {
  const [step, setStep] = useState<'options' | 'support' | 'sent'>('options');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const sendSupportMutation = trpc.system.notifyOwner.useMutation({
    onSuccess: () => {
      setStep('sent');
      toast.success('Žádost odeslána!');
    },
    onError: () => {
      toast.error('Nepodařilo se odeslat. Zkuste to znovu.');
    },
  });

  const handleSendSupport = () => {
    if (!email.trim()) {
      toast.error('Zadejte svůj e-mail');
      return;
    }
    sendSupportMutation.mutate({
      title: `🔑 Žádost o obnovení účtu: ${email}`,
      content: `E-mail: ${email}\nZpráva: ${message || 'Potřebuji pomoc s přístupem k účtu.'}\nČas: ${new Date().toLocaleString('cs-CZ')}`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-12 max-w-2xl">
        <div className="text-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <KeyRound className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">
            <span className="symbiote-text-gradient">Obnovení</span> přístupu
          </h1>
          <p className="text-muted-foreground">
            Nemůžeš se přihlásit? Pomůžeme ti získat přístup zpět.
          </p>
        </div>

        {step === 'options' && (
          <div className="space-y-4">
            {/* Primary: Login with OAuth */}
            <Card className="symbiote-card overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-6 w-6 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">Přihlásit se přes Google</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      FEMSIDER používá bezpečné přihlášení přes Google. Pokud máš přístup ke svému Google účtu, 
                      jednoduše se přihlas a automaticky se připojíš ke svému FEMSIDER profilu.
                    </p>
                    <a href={getLoginUrl()}>
                      <Button className="symbiote-gradient text-white border-0">
                        Přihlásit se přes Google
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Google Account Recovery */}
            <Card className="symbiote-card">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                    <ExternalLink className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">Obnovení Google účtu</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Pokud nemáš přístup ke svému Google účtu, použij nástroj pro obnovení účtu od Google. 
                      Po obnovení přístupu ke Google se budeš moci přihlásit i na FEMSIDER.
                    </p>
                    <a href="https://accounts.google.com/signin/recovery" target="_blank" rel="noopener noreferrer">
                      <Button variant="outline">
                        Obnovit Google účet
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Support */}
            <Card className="symbiote-card">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
                    <HelpCircle className="h-6 w-6 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">Kontaktovat podporu</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Pokud žádná z výše uvedených možností nepomohla, kontaktuj naši podporu. 
                      Pomůžeme ti s obnovením přístupu k tvému účtu.
                    </p>
                    <Button variant="outline" onClick={() => setStep('support')}>
                      <Mail className="mr-2 h-4 w-4" />
                      Napsat podpoře
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* FAQ */}
            <div className="mt-8 p-6 rounded-xl bg-muted/30 border border-border/50">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-muted-foreground" />
                Často kladené otázky
              </h3>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-medium mb-1">Proč nemám klasické heslo?</p>
                  <p className="text-muted-foreground">
                    FEMSIDER používá OAuth přihlášení přes Google pro maximální bezpečnost. 
                    Neukládáme žádná hesla — tvůj účet je chráněn zabezpečením Google.
                  </p>
                </div>
                <div>
                  <p className="font-medium mb-1">Změnil/a jsem e-mail u Google. Přijdu o účet?</p>
                  <p className="text-muted-foreground">
                    Ne, tvůj FEMSIDER účet je propojený s tvým Google ID, ne s e-mailem. 
                    I po změně e-mailu se přihlásíš normálně.
                  </p>
                </div>
                <div>
                  <p className="font-medium mb-1">Mohu přepnout na jiný Google účet?</p>
                  <p className="text-muted-foreground">
                    Kontaktuj podporu a my ti pomůžeme s migrací účtu na jiný Google profil.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'support' && (
          <Card className="symbiote-card">
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Kontaktovat podporu
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Tvůj e-mail *</label>
                  <Input
                    type="email"
                    placeholder="tvuj@email.cz"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-background"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Popis problému</label>
                  <Textarea
                    placeholder="Popiš, co se děje a jak ti můžeme pomoci..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="bg-background"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep('options')}
                  >
                    Zpět
                  </Button>
                  <Button
                    className="symbiote-gradient text-white border-0"
                    onClick={handleSendSupport}
                    disabled={sendSupportMutation.isPending}
                  >
                    {sendSupportMutation.isPending ? 'Odesílám...' : 'Odeslat žádost'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'sent' && (
          <Card className="symbiote-card">
            <CardContent className="p-8 text-center">
              <CheckCircle2 className="h-16 w-16 text-emerald-400 mx-auto mb-4" />
              <h3 className="font-bold text-xl mb-2">Žádost odeslána!</h3>
              <p className="text-muted-foreground mb-6">
                Tvoje žádost o obnovení přístupu byla odeslána. Ozveme se ti co nejdříve na e-mail{' '}
                <span className="font-medium text-foreground">{email}</span>.
              </p>
              <div className="flex gap-3 justify-center">
                <a href={getLoginUrl()}>
                  <Button className="symbiote-gradient text-white border-0">
                    Zkusit přihlášení
                  </Button>
                </a>
                <Button variant="outline" onClick={() => setStep('options')}>
                  Zpět na možnosti
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
