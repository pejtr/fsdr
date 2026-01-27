import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import Header from "@/components/Header";
import { 
  Wallet, 
  CreditCard, 
  Building2, 
  Bitcoin, 
  ArrowLeft,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  Settings,
  History,
  Loader2
} from "lucide-react";
import { getLoginUrl } from "@/const";

export default function PayoutSettings() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("balance");
  const [payoutAmount, setPayoutAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<"paypal" | "bank_transfer" | "crypto">("paypal");
  
  // Form states
  const [paypalEmail, setPaypalEmail] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankRoutingNumber, setBankRoutingNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankSwift, setBankSwift] = useState("");
  const [bankIban, setBankIban] = useState("");
  const [cryptoWallet, setCryptoWallet] = useState("");
  const [cryptoCurrency, setCryptoCurrency] = useState("USDT");
  const [minimumPayout, setMinimumPayout] = useState("50");
  const [autoPayoutEnabled, setAutoPayoutEnabled] = useState(false);
  const [autoPayoutThreshold, setAutoPayoutThreshold] = useState("100");
  
  const { data: balance, isLoading: balanceLoading } = trpc.payout.getBalance.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  
  const { data: settings, isLoading: settingsLoading } = trpc.payout.getSettings.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  
  const { data: payoutHistory, isLoading: historyLoading } = trpc.payout.getMyRequests.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  
  const utils = trpc.useUtils();
  
  const updateSettingsMutation = trpc.payout.updateSettings.useMutation({
    onSuccess: () => {
      toast.success("Nastavení uloženo");
      utils.payout.getSettings.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const requestPayoutMutation = trpc.payout.requestPayout.useMutation({
    onSuccess: () => {
      toast.success("Žádost o výplatu odeslána");
      setPayoutAmount("");
      utils.payout.getBalance.invalidate();
      utils.payout.getMyRequests.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  // Load settings into form
  useEffect(() => {
    if (settings) {
      setPaypalEmail(settings.paypalEmail || "");
      setBankAccountName(settings.bankAccountName || "");
      setBankAccountNumber(settings.bankAccountNumber || "");
      setBankRoutingNumber(settings.bankRoutingNumber || "");
      setBankName(settings.bankName || "");
      setBankSwift(settings.bankSwift || "");
      setBankIban(settings.bankIban || "");
      setCryptoWallet(settings.cryptoWalletAddress || "");
      setCryptoCurrency(settings.cryptoCurrency || "USDT");
      setMinimumPayout(settings.minimumPayout || "50");
      setAutoPayoutEnabled(settings.autoPayoutEnabled || false);
      setAutoPayoutThreshold(settings.autoPayoutThreshold || "100");
      setSelectedMethod(settings.preferredMethod || "paypal");
    }
  }, [settings]);
  
  const handleSaveSettings = () => {
    updateSettingsMutation.mutate({
      preferredMethod: selectedMethod,
      paypalEmail: paypalEmail || null,
      bankAccountName: bankAccountName || null,
      bankAccountNumber: bankAccountNumber || null,
      bankRoutingNumber: bankRoutingNumber || null,
      bankName: bankName || null,
      bankSwift: bankSwift || null,
      bankIban: bankIban || null,
      cryptoWalletAddress: cryptoWallet || null,
      cryptoCurrency: cryptoCurrency || null,
      minimumPayout,
      autoPayoutEnabled,
      autoPayoutThreshold,
    });
  };
  
  const handleRequestPayout = () => {
    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount < 10) {
      toast.error("Minimální výplata je $10");
      return;
    }
    requestPayoutMutation.mutate({
      amount,
      paymentMethod: selectedMethod,
    });
  };
  
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-20 text-center">
          <Wallet className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-4">Přihlaste se pro přístup k výplatám</h1>
          <Button asChild>
            <a href={getLoginUrl()}>Přihlásit se</a>
          </Button>
        </div>
      </div>
    );
  }
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"><Clock className="h-3 w-3 mr-1" /> Čeká</Badge>;
      case "processing":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20"><AlertCircle className="h-3 w-3 mr-1" /> Zpracovává se</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20"><CheckCircle className="h-3 w-3 mr-1" /> Dokončeno</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20"><XCircle className="h-3 w-3 mr-1" /> Zamítnuto</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <div className="mb-6">
          <Link href="/affiliate" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zpět na Affiliate Dashboard
          </Link>
          <h1 className="text-3xl font-bold">Výplaty</h1>
          <p className="text-muted-foreground">Spravujte své výdělky a platební metody</p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="balance" className="gap-2">
              <Wallet className="h-4 w-4" />
              Zůstatek
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Nastavení
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              Historie
            </TabsTrigger>
          </TabsList>
          
          {/* Balance Tab */}
          <TabsContent value="balance">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Celkové výdělky</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500">
                    ${balance?.totalEarnings.toFixed(2) || "0.00"}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>K dispozici</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    ${balance?.available.toFixed(2) || "0.00"}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Čekající výplaty</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-500">
                    ${balance?.pendingPayouts.toFixed(2) || "0.00"}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Vyplaceno</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-muted-foreground">
                    ${balance?.paidOut.toFixed(2) || "0.00"}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Požádat o výplatu
                </CardTitle>
                <CardDescription>
                  Minimální výplata: ${minimumPayout}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Částka (USD)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={payoutAmount}
                        onChange={(e) => setPayoutAmount(e.target.value)}
                        className="pl-9"
                        min={10}
                        max={balance?.available || 0}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Dostupné: ${balance?.available.toFixed(2) || "0.00"}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Platební metoda</Label>
                    <div className="flex gap-2">
                      <Button
                        variant={selectedMethod === "paypal" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedMethod("paypal")}
                        className="flex-1"
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        PayPal
                      </Button>
                      <Button
                        variant={selectedMethod === "bank_transfer" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedMethod("bank_transfer")}
                        className="flex-1"
                      >
                        <Building2 className="h-4 w-4 mr-2" />
                        Banka
                      </Button>
                      <Button
                        variant={selectedMethod === "crypto" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedMethod("crypto")}
                        className="flex-1"
                      >
                        <Bitcoin className="h-4 w-4 mr-2" />
                        Crypto
                      </Button>
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={handleRequestPayout}
                  disabled={requestPayoutMutation.isPending || !payoutAmount || parseFloat(payoutAmount) < 10}
                  className="w-full"
                >
                  {requestPayoutMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Požádat o výplatu
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* PayPal */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-blue-500" />
                    PayPal
                  </CardTitle>
                  <CardDescription>Nejrychlejší způsob výplaty</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>PayPal Email</Label>
                    <Input
                      type="email"
                      placeholder="vas@email.com"
                      value={paypalEmail}
                      onChange={(e) => setPaypalEmail(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
              
              {/* Bank Transfer */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-green-500" />
                    Bankovní převod
                  </CardTitle>
                  <CardDescription>Pro větší částky</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Jméno majitele účtu</Label>
                      <Input
                        placeholder="Jan Novák"
                        value={bankAccountName}
                        onChange={(e) => setBankAccountName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Název banky</Label>
                      <Input
                        placeholder="Česká spořitelna"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Číslo účtu</Label>
                      <Input
                        placeholder="123456789"
                        value={bankAccountNumber}
                        onChange={(e) => setBankAccountNumber(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>IBAN</Label>
                      <Input
                        placeholder="CZ65 0800 0000 0012 3456 7899"
                        value={bankIban}
                        onChange={(e) => setBankIban(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>SWIFT/BIC</Label>
                      <Input
                        placeholder="GIBACZPX"
                        value={bankSwift}
                        onChange={(e) => setBankSwift(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Routing Number (US)</Label>
                      <Input
                        placeholder="Volitelné"
                        value={bankRoutingNumber}
                        onChange={(e) => setBankRoutingNumber(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Crypto */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bitcoin className="h-5 w-5 text-orange-500" />
                    Kryptoměny
                  </CardTitle>
                  <CardDescription>Anonymní a rychlé</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Měna</Label>
                      <div className="flex gap-2">
                        {["USDT", "BTC", "ETH"].map((currency) => (
                          <Button
                            key={currency}
                            variant={cryptoCurrency === currency ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCryptoCurrency(currency)}
                          >
                            {currency}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Adresa peněženky</Label>
                      <Input
                        placeholder="0x..."
                        value={cryptoWallet}
                        onChange={(e) => setCryptoWallet(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Auto Payout */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Automatické výplaty
                  </CardTitle>
                  <CardDescription>Nastavte automatické výplaty</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Povolit automatické výplaty</Label>
                      <p className="text-sm text-muted-foreground">
                        Automaticky vyplatit při dosažení limitu
                      </p>
                    </div>
                    <Switch
                      checked={autoPayoutEnabled}
                      onCheckedChange={setAutoPayoutEnabled}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Minimální výplata ($)</Label>
                      <Input
                        type="number"
                        value={minimumPayout}
                        onChange={(e) => setMinimumPayout(e.target.value)}
                        min={10}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Auto-výplata při ($)</Label>
                      <Input
                        type="number"
                        value={autoPayoutThreshold}
                        onChange={(e) => setAutoPayoutThreshold(e.target.value)}
                        min={50}
                        disabled={!autoPayoutEnabled}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="mt-6">
              <Button 
                onClick={handleSaveSettings}
                disabled={updateSettingsMutation.isPending}
                size="lg"
              >
                {updateSettingsMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Uložit nastavení
              </Button>
            </div>
          </TabsContent>
          
          {/* History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Historie výplat</CardTitle>
                <CardDescription>Přehled všech vašich žádostí o výplatu</CardDescription>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : payoutHistory && payoutHistory.length > 0 ? (
                  <div className="space-y-4">
                    {payoutHistory.map((payout) => (
                      <div 
                        key={payout.id} 
                        className="flex items-center justify-between p-4 rounded-lg border bg-card"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-full ${
                            payout.paymentMethod === 'paypal' ? 'bg-blue-500/10' :
                            payout.paymentMethod === 'bank_transfer' ? 'bg-green-500/10' :
                            'bg-orange-500/10'
                          }`}>
                            {payout.paymentMethod === 'paypal' ? (
                              <CreditCard className="h-5 w-5 text-blue-500" />
                            ) : payout.paymentMethod === 'bank_transfer' ? (
                              <Building2 className="h-5 w-5 text-green-500" />
                            ) : (
                              <Bitcoin className="h-5 w-5 text-orange-500" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">${parseFloat(payout.amount).toFixed(2)}</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(payout.createdAt).toLocaleDateString('cs-CZ')}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {getStatusBadge(payout.status || 'pending')}
                          {payout.transactionId && (
                            <span className="text-xs text-muted-foreground font-mono">
                              {payout.transactionId.slice(0, 8)}...
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Zatím žádné výplaty</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
