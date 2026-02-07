import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { useState, useEffect, useRef } from "react";
import { 
  Play, Users, DollarSign, Shield, Sparkles, ArrowRight, Heart, 
  MessageCircle, Share2, Lock, Eye, Star, Crown, Zap, ChevronDown,
  Check, Gift, Clock, TrendingUp, Award
} from "lucide-react";
import { Link } from "wouter";
import Header from "@/components/Header";
import { trpc } from "@/lib/trpc";
import { useCtaTest } from "@/hooks/useCtaTest";
import { toast } from "sonner";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [scrollY, setScrollY] = useState(0);
  const [showExitPopup, setShowExitPopup] = useState(false);
  const [lastCTA, setLastCTA] = useState<string>("default");
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const heroRef = useRef<HTMLElement>(null);
  const exitShownRef = useRef(false);

  // A/B Testing hooks
  const heroCta = useCtaTest('hero');
  const pricingCta = useCtaTest('pricing');

  // Stripe checkout mutation
  const checkoutMutation = trpc.checkout.createSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        toast.success("Přesměrování na platbu...", { description: "Otevíráme Stripe checkout v novém okně." });
        window.open(data.url, '_blank');
        // Track conversion for A/B test
        pricingCta.trackConversion();
      }
    },
    onError: (err) => {
      toast.error("Chyba", { description: err.message });
    },
  });

  const handleCheckout = (productKey: 'community_plus' | 'vip_insider') => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    checkoutMutation.mutate({ productKey, billingCycle: 'monthly' });
  };

  // Fetch real content counts
  const { data: topicsData } = trpc.forum.getTopics.useQuery({ limit: 3 });
  const { data: leaderboard } = trpc.gamification.getLeaderboard.useQuery({ limit: 5 });

  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        if (rect.bottom > 0) {
          setScrollY(window.scrollY);
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Exit-intent popup (desktop only)
  useEffect(() => {
    if (isAuthenticated) return;
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !exitShownRef.current) {
        exitShownRef.current = true;
        setShowExitPopup(true);
      }
    };
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [isAuthenticated]);

  const handleCTAClick = (variant: string) => {
    setLastCTA(variant);
  };

  // Sample locked content thumbnails (using existing CDN images)
  const lockedContent = [
    { id: 1, title: "Sister's Exchange - Full TG", blur: true, views: "12.4K", likes: 892 },
    { id: 2, title: "Magic Roulette Transform", blur: true, views: "8.7K", likes: 654 },
    { id: 3, title: "Wishing To Be Her - EP3", blur: true, views: "15.2K", likes: 1203 },
    { id: 4, title: "AI Body Swap Studio", blur: true, views: "6.3K", likes: 445 },
    { id: 5, title: "Symbiote Fusion TF", blur: true, views: "9.1K", likes: 723 },
    { id: 6, title: "The Mirror's Secret", blur: true, views: "11.8K", likes: 967 },
  ];

  const faqItems = [
    { q: "Naúčtuje se mi něco za registraci?", a: "Ne. Registrace je zcela zdarma. Platíte pouze pokud se rozhodnete pro prémiový tier." },
    { q: "Mohu kdykoliv zrušit předplatné?", a: "Ano, předplatné můžete zrušit kdykoliv jedním kliknutím. Žádné skryté poplatky." },
    { q: "Jak funguje affiliate program?", a: "Za každého přivedeného platícího uživatele získáte 25% doživotní provizi. Multi-tier systém až 4 úrovně." },
    { q: "Je obsah bezpečný?", a: "Veškerý obsah je generován AI. Používáme ověření věku a bezpečné platby." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* ========== HERO SECTION ========== */}
      <section ref={heroRef} className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ transform: `translateY(${scrollY * 0.3}px)` }}>
          <div className="absolute left-0 top-0 bottom-0 w-1/3 opacity-40">
            <img 
              src="https://files.manuscdn.com/user_upload_by_module/session_file/89740521/RdLPeADGOAGhrVda.png" 
              alt="" 
              className="h-full object-cover object-right"
            />
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-40">
            <img 
              src="https://files.manuscdn.com/user_upload_by_module/session_file/89740521/ypLFGemAnHfcHTHG.png" 
              alt="" 
              className="h-full object-cover object-left"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/40 to-background" />
        </div>
        
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[oklch(0.6_0.15_180)]/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/4 translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[oklch(0.6_0.15_180)]/20 rounded-full blur-3xl" />
        
        <div className="container relative py-24 md:py-32">
          <div className="max-w-5xl mx-auto">
            {/* Profile Header */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12">
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[oklch(0.6_0.15_180)] shadow-[0_0_30px_oklch(0.6_0.15_180/0.5)]">
                  <img 
                    src="https://files.manuscdn.com/user_upload_by_module/session_file/89740521/CrlsnPOMLOibjsgs.png" 
                    alt="FEMSIDER Creator" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -inset-2 bg-gradient-to-r from-[oklch(0.6_0.15_180)] to-[oklch(0.55_0.15_160)] rounded-full opacity-20 blur-xl animate-pulse" />
                {/* Live indicator */}
                <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background animate-pulse" />
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-4xl md:text-5xl font-bold mb-3 symbiote-text-gradient">
                  FEMSIDER
                </h1>
                <p className="text-lg text-muted-foreground mb-2">
                  Exkluzivní TG/TF transformační obsah s AI technologií
                </p>
                <p className="text-sm text-[oklch(0.6_0.15_180)] font-medium mb-4">
                  Přidej se k 15,000+ členům kteří už sledují
                </p>
                <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-[oklch(0.6_0.15_180)]" />
                    <span>15.4K sledujících</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Play className="h-4 w-4 text-[oklch(0.6_0.15_180)]" />
                    <span>474 videí</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-[oklch(0.6_0.15_180)]" />
                    <span>2.3K podporovatelů</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-400" />
                    <span className="text-yellow-400 font-medium">4.9/5 hodnocení</span>
                  </div>
                </div>
              </div>
              
              {/* CTA Buttons - Hormozi style */}
              <div className="flex flex-col gap-3 min-w-[220px]">
                {isAuthenticated ? (
                  <>
                    <Link href="/browse">
                      <Button size="lg" className="symbiote-gradient text-white border-0 symbiote-glow w-full text-base font-bold">
                        <Play className="mr-2 h-5 w-5" />
                        Procházet obsah
                      </Button>
                    </Link>
                    <Link href="/subscriptions">
                      <Button size="lg" variant="outline" className="w-full border-[oklch(0.6_0.15_180)]/50">
                        <Crown className="mr-2 h-4 w-4 text-yellow-400" />
                        Upgradovat na VIP
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <a href={getLoginUrl()} onClick={() => { handleCTAClick("hero_join"); heroCta.trackClick(); }}>
                      <Button size="lg" className={`${heroCta.variant?.buttonColor || 'symbiote-gradient'} text-white border-0 symbiote-glow w-full text-base font-bold animate-pulse hover:animate-none`}>
                        <Sparkles className="mr-2 h-5 w-5" />
                        {heroCta.variant?.buttonText || 'Připojit se ZDARMA'}
                      </Button>
                    </a>
                    <p className="text-xs text-center text-muted-foreground">
                      {heroCta.variant?.subText || 'Žádná kreditní karta. Zrušit kdykoliv.'}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* About - collapsible */}
            <div className="symbiote-card p-6 mb-8">
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[oklch(0.6_0.15_180)]" />
                O platformě
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                FEMSIDER je prémiová platforma pro tvůrce exkluzivního TG/TF (transgender/transformation) obsahu. 
                Využíváme pokročilé AI technologie pro vytváření unikátních transformačních videí. 
                Naše komunita spojuje tvůrce a fanoušky, kteří sdílejí vášeň pro transformační příběhy a umění.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========== LOCKED CONTENT PREVIEW - Key Conversion Section ========== */}
      <section className="py-20 border-t border-[oklch(0.6_0.15_180)]/20">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Ukázka <span className="symbiote-text-gradient">obsahu</span>
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Podívej se, co na tebe čeká. <span className="text-[oklch(0.6_0.15_180)] font-medium">Odemkni plný přístup</span> k 474+ videím.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-6xl mx-auto mb-8">
            {lockedContent.map((item) => (
              <div key={item.id} className="group relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer">
                {/* Placeholder gradient background simulating blurred content */}
                <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.3_0.05_180)] via-[oklch(0.2_0.08_200)] to-[oklch(0.15_0.05_160)]" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTUiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9zdmc+')] opacity-50" />
                
                {/* Blur overlay */}
                <div className="absolute inset-0 backdrop-blur-sm bg-background/30" />
                
                {/* Lock icon */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-[oklch(0.6_0.15_180)]/20 border border-[oklch(0.6_0.15_180)]/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Lock className="h-5 w-5 text-[oklch(0.6_0.15_180)]" />
                  </div>
                  <span className="text-xs text-[oklch(0.6_0.15_180)] font-medium">Premium</span>
                </div>
                
                {/* Stats overlay at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-xs font-medium truncate text-white/90">{item.title}</p>
                  <div className="flex items-center gap-2 text-[10px] text-white/60">
                    <span className="flex items-center gap-0.5"><Eye className="h-2.5 w-2.5" />{item.views}</span>
                    <span className="flex items-center gap-0.5"><Heart className="h-2.5 w-2.5" />{item.likes}</span>
                  </div>
                </div>
                
                {/* Hover effect */}
                <div className="absolute inset-0 bg-[oklch(0.6_0.15_180)]/0 group-hover:bg-[oklch(0.6_0.15_180)]/10 transition-colors" />
              </div>
            ))}
          </div>
          
          {/* CTA under locked content */}
          <div className="text-center">
            {!isAuthenticated ? (
              <a href={getLoginUrl()} onClick={() => handleCTAClick("content_unlock")}>
                <Button size="lg" className="symbiote-gradient text-white border-0 symbiote-glow font-bold text-base">
                  <Lock className="mr-2 h-5 w-5" />
                  Odemknout vše ZDARMA
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </a>
            ) : (
              <Link href="/browse">
                <Button size="lg" className="symbiote-gradient text-white border-0 font-bold">
                  <Play className="mr-2 h-5 w-5" />
                  Procházet vše
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            )}
            <p className="text-xs text-muted-foreground mt-3">
              474+ videí | Nový obsah každý týden | Zrušit kdykoliv
            </p>
          </div>
        </div>
      </section>

      {/* ========== MEMBERSHIP TIERS - Hormozi Value Stack ========== */}
      <section className="py-20 border-t border-[oklch(0.6_0.15_180)]/20">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Vyber si svůj <span className="symbiote-text-gradient">tier</span>
          </h2>
          <p className="text-center text-muted-foreground mb-4 max-w-2xl mx-auto">
            Získej přístup k exkluzivnímu obsahu a podpoř tvůrce
          </p>
          {/* Urgency banner */}
          <div className="flex items-center justify-center gap-2 mb-12">
            <Clock className="h-4 w-4 text-orange-400 animate-pulse" />
            <span className="text-sm text-orange-400 font-medium">
              Omezená nabídka: první měsíc se slevou 50%
            </span>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Free Tier */}
            <div className="symbiote-card p-6 relative">
              <h3 className="text-xl font-bold mb-1">Fanoušek</h3>
              <p className="text-xs text-muted-foreground mb-3">(Nic to nestojí)</p>
              <div className="text-3xl font-bold mb-4 symbiote-text-gradient">Zdarma</div>
              <ul className="space-y-3 mb-6">
                {[
                  "Procházení obsahu",
                  "Komunitní diskuze",
                  "Základní profil",
                  "Komentáře a reakce",
                  "Komunitní fórum a chat",
                ].map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-[oklch(0.6_0.15_180)] mt-0.5 flex-shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              {!isAuthenticated ? (
                <a href={getLoginUrl()} onClick={() => handleCTAClick("tier_free")}>
                  <Button variant="outline" className="w-full">
                    Vytvořit účet zdarma
                  </Button>
                </a>
              ) : (
                <Button variant="outline" className="w-full" disabled>
                  Aktivní
                </Button>
              )}
              <p className="text-center text-xs text-muted-foreground mt-3">
                Hodnota: $0/měsíc | Cena: $0/měsíc
              </p>
            </div>

            {/* Popular Tier */}
            <div className="symbiote-card p-6 relative border-[oklch(0.6_0.15_180)] symbiote-glow scale-105">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 symbiote-gradient text-white text-sm font-semibold rounded-full flex items-center gap-1">
                <Crown className="h-3.5 w-3.5" /> Nejoblíbenější
              </div>
              <h3 className="text-xl font-bold mb-1">Komunita+</h3>
              <p className="text-xs text-muted-foreground mb-3">Pro skutečné fanoušky</p>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-bold symbiote-text-gradient">$4.99</span>
                <span className="text-sm text-muted-foreground line-through">$9.99</span>
                <span className="text-sm text-muted-foreground">/měsíc</span>
              </div>
              <p className="text-xs text-orange-400 mb-4 flex items-center gap-1">
                <Zap className="h-3 w-3" /> Ušetříš $60/rok
              </p>
              <ul className="space-y-3 mb-6">
                {[
                  "Vše z Fanouška",
                  "HD přístup ke všem videím",
                  "Early access k novinkám",
                  "Hlasování o obsahu",
                  "Přístup k fotogalerii",
                  "Prioritní podpora",
                ].map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-[oklch(0.6_0.15_180)] mt-0.5 flex-shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              {!isAuthenticated ? (
                <a href={getLoginUrl()} onClick={() => { handleCTAClick("tier_community"); pricingCta.trackClick(); }}>
                  <Button className={`${pricingCta.variant?.buttonColor || 'symbiote-gradient'} text-white border-0 w-full font-bold`}>
                    {pricingCta.variant?.buttonText || 'Připojit se nyní'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              ) : (
                <Button 
                  className="symbiote-gradient text-white border-0 w-full font-bold"
                  onClick={() => handleCheckout('community_plus')}
                  disabled={checkoutMutation.isPending}
                >
                  {checkoutMutation.isPending ? 'Načítání...' : 'Předplatit Komunita+'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
              <p className="text-center text-xs text-muted-foreground mt-3">
                Hodnota: $49/měsíc | <span className="text-[oklch(0.6_0.15_180)]">Platíš jen $4.99</span>
              </p>
            </div>

            {/* VIP Tier */}
            <div className="symbiote-card p-6 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-sm font-semibold rounded-full flex items-center gap-1">
                <Gift className="h-3.5 w-3.5" /> Bonus
              </div>
              <h3 className="text-xl font-bold mb-1">VIP Insider</h3>
              <p className="text-xs text-muted-foreground mb-3">Maximální zážitek</p>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-bold symbiote-text-gradient">$9.99</span>
                <span className="text-sm text-muted-foreground line-through">$19.99</span>
                <span className="text-sm text-muted-foreground">/měsíc</span>
              </div>
              <p className="text-xs text-orange-400 mb-4 flex items-center gap-1">
                <Zap className="h-3 w-3" /> Ušetříš $120/rok
              </p>
              <ul className="space-y-3 mb-6">
                {[
                  "Vše z Komunita+",
                  "4K video kvalita",
                  "Vlastní požadavky na obsah",
                  "Přímý kontakt s tvůrci",
                  "Behind-the-scenes přístup",
                  "Exkluzivní AI nástroje",
                  "Affiliate bonus 30%",
                ].map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-[oklch(0.6_0.15_180)] mt-0.5 flex-shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              {!isAuthenticated ? (
                <a href={getLoginUrl()} onClick={() => handleCTAClick("tier_vip")}>
                  <Button variant="outline" className="w-full border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10 font-bold">
                    Získat VIP přístup
                  </Button>
                </a>
              ) : (
                <Button 
                  variant="outline" 
                  className="w-full border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10 font-bold"
                  onClick={() => handleCheckout('vip_insider')}
                  disabled={checkoutMutation.isPending}
                >
                  {checkoutMutation.isPending ? 'Načítání...' : 'Předplatit VIP'}
                  </Button>
              )}
              <p className="text-center text-xs text-muted-foreground mt-3">
                Hodnota: $99/měsíc | <span className="text-yellow-400">Platíš jen $9.99</span>
              </p>
            </div>
          </div>

          {/* Social proof under pricing */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-400" />
              <span>Bezpečné platby</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-400" />
              <span>Zrušit kdykoliv</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-400" />
              <span>2,300+ platících členů</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-400" />
              <span>4.9/5 hodnocení</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========== RECENT POSTS ========== */}
      <section className="py-20 border-t border-[oklch(0.6_0.15_180)]/20">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Nejnovější <span className="symbiote-text-gradient">příspěvky</span>
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <PostCard
              title="Nový TG/TF template: Sister's Exchange"
              preview="Právě jsme přidali nový template pro body swap transformace..."
              image="/tg-templates/sisters-exchange.jpg"
              likes={234}
              comments={45}
              locked={false}
            />
            <PostCard
              title="AI Video Recreation Studio je live!"
              preview="Vyzkoušejte naši novou AI funkci pro rozšiřování videí..."
              image="/tg-templates/wishing-to-be-her.jpg"
              likes={567}
              comments={89}
              locked={true}
            />
            <PostCard
              title="12 nových transformačních šablon"
              preview="Od magie po sci-fi - objevte všechny naše nové šablony..."
              image="/tg-templates/magic-roulette.jpg"
              likes={432}
              comments={67}
              locked={true}
            />
          </div>
          
          <div className="text-center mt-8">
            <Link href="/browse">
              <Button variant="outline" size="lg">
                Zobrazit všechny příspěvky
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ========== COMMUNITY SECTIONS ========== */}
      <section className="py-20 border-t border-[oklch(0.6_0.15_180)]/20">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Prozkoumej naše <span className="symbiote-text-gradient">komunity</span>
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Připoj se k tisícům členů, kteří sdílejí svou cestu, styl a příběhy
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Link href="/crossdresser">
              <div className="group relative overflow-hidden rounded-2xl border border-pink-500/30 bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-transparent p-8 hover:border-pink-500/50 transition-all cursor-pointer">
                <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform" />
                <div className="relative">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center mb-4">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                    Crossdresser Community
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Style guides, makeover tutorials, fashion tips a podpůrná komunita pro crossdressery.
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="w-4 h-4" /> 50K+ členů</span>
                    <span className="flex items-center gap-1"><Heart className="w-4 h-4" /> 200+ guides</span>
                  </div>
                </div>
              </div>
            </Link>
            
            <Link href="/femboy">
              <div className="group relative overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-transparent p-8 hover:border-blue-500/50 transition-all cursor-pointer">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform" />
                <div className="relative">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mb-4">
                    <Heart className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Femboy Hub
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Style inspiration, creator profiles, trending content a spojte se s femboy komunitou.
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="w-4 h-4" /> 75K+ členů</span>
                    <span className="flex items-center gap-1"><Play className="w-4 h-4" /> 10K+ videí</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ========== FAQ - Collapsible ========== */}
      <section className="py-20 border-t border-[oklch(0.6_0.15_180)]/20">
        <div className="container max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            FAQ
          </h2>
          <p className="text-center text-muted-foreground mb-8">
            Podívej se na nejčastější otázky
          </p>
          
          <div className="space-y-3">
            {faqItems.map((item, i) => (
              <div key={i} className="symbiote-card overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-card/80 transition-colors"
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                >
                  <span className="font-medium flex items-center gap-2">
                    <span className="text-[oklch(0.6_0.15_180)]">{i === 0 ? '💰' : i === 1 ? '🔄' : i === 2 ? '🤝' : '🔒'}</span>
                    {item.q}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${faqOpen === i ? 'rotate-180' : ''}`} />
                </button>
                {faqOpen === i && (
                  <div className="px-4 pb-4 text-sm text-muted-foreground animate-in fade-in-50 slide-in-from-top-2">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Verification link */}
          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground mb-2 flex items-center justify-center gap-2">
              <Shield className="h-4 w-4 text-green-400" />
              Naúčtuje se <span className="text-[oklch(0.6_0.15_180)] font-medium">ověřeným</span> tvůrcům
            </p>
            <Link href="/browse">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Zobrazit všechny příspěvky <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ========== FINAL CTA ========== */}
      {!isAuthenticated && (
        <section className="py-20 border-t border-[oklch(0.6_0.15_180)]/20">
          <div className="container">
            <div className="symbiote-card p-8 md:p-12 text-center symbiote-glow max-w-3xl mx-auto">
              <div className="mb-4 flex justify-center">
                <div className="w-16 h-16 rounded-full bg-[oklch(0.6_0.15_180)]/20 flex items-center justify-center">
                  <Zap className="h-8 w-8 text-[oklch(0.6_0.15_180)]" />
                </div>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Připraven na transformaci?
              </h2>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                Připoj se k 15,000+ členům. Registrace je zdarma a trvá 30 sekund.
              </p>
              <a href={getLoginUrl()} onClick={() => handleCTAClick("final_cta")}>
                <Button size="lg" className="symbiote-gradient text-white border-0 font-bold text-lg px-10">
                  Vytvořit účet ZDARMA
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </a>
              <p className="text-xs text-muted-foreground mt-4">
                Žádná kreditní karta | Zrušit kdykoliv | 474+ videí čeká
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-8 border-t border-[oklch(0.6_0.15_180)]/20">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="symbiote-text-gradient font-bold text-xl">FEMSIDER</div>
            <div className="text-sm text-muted-foreground">
              © 2026 FEMSIDER. Všechna práva vyhrazena.
            </div>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Podmínky</a>
              <a href="#" className="hover:text-foreground transition-colors">Soukromí</a>
              <a href="#" className="hover:text-foreground transition-colors">Kontakt</a>
            </div>
          </div>
        </div>
      </footer>

      {/* ========== EXIT-INTENT POPUP ========== */}
      {showExitPopup && !isAuthenticated && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in-0">
          <div className="relative symbiote-card p-8 max-w-md mx-4 symbiote-glow animate-in zoom-in-95">
            <button
              onClick={() => setShowExitPopup(false)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors text-lg font-bold"
            >
              ×
            </button>
            
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="w-16 h-16 rounded-full bg-[oklch(0.6_0.15_180)]/20 flex items-center justify-center animate-pulse">
                  <Gift className="h-8 w-8 text-[oklch(0.6_0.15_180)]" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-2">
                {lastCTA.includes("tier") 
                  ? "Počkej! Speciální nabídka jen pro tebe" 
                  : "Nechceš přijít o 474+ videí?"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {lastCTA.includes("tier")
                  ? "Registruj se teď a získej první měsíc se slevou 50%. Nabídka platí jen dnes."
                  : "Registrace je zdarma a trvá 30 sekund. Žádná kreditní karta."}
              </p>
              <a href={getLoginUrl()}>
                <Button size="lg" className="symbiote-gradient text-white border-0 w-full font-bold text-base">
                  <Sparkles className="mr-2 h-5 w-5" />
                  {lastCTA.includes("tier") ? "Získat slevu 50%" : "Připojit se ZDARMA"}
                </Button>
              </a>
              <p className="text-xs text-muted-foreground mt-3">
                Připojilo se 15,000+ členů
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PostCard({ title, preview, image, likes, comments, locked }: { 
  title: string; preview: string; image: string; likes: number; comments: number; locked?: boolean;
}) {
  return (
    <div className="symbiote-card overflow-hidden transition-all hover:symbiote-glow group">
      <div className="aspect-video overflow-hidden relative">
        <img src={image} alt={title} className={`w-full h-full object-cover ${locked ? 'blur-sm' : ''}`} />
        {locked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="w-12 h-12 rounded-full bg-black/50 border border-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Lock className="h-5 w-5 text-white/80" />
            </div>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="font-semibold flex-1">{title}</h3>
          {locked && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-[oklch(0.6_0.15_180)]/20 text-[oklch(0.6_0.15_180)] border border-[oklch(0.6_0.15_180)]/30">
              Premium
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{preview}</p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Heart className="h-4 w-4" />
            <span>{likes}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="h-4 w-4" />
            <span>{comments}</span>
          </div>
          <button className="ml-auto hover:text-foreground transition-colors">
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
