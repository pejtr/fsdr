import os

content = '''import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { useState, useEffect, useRef } from "react";
import { 
  Play, Users, Shield, Sparkles, ArrowRight, Heart, 
  MessageCircle, Share2, Lock, Eye, Star, Crown, Zap, ChevronDown,
  Check, Gift, Clock, Award, BadgeCheck, Flame, Quote
} from "lucide-react";
import { Link } from "wouter";
import Header from "@/components/Header";
import { trpc } from "@/lib/trpc";
import { useCtaTest } from "@/hooks/useCtaTest";
import { toast } from "sonner";

const SOCIAL_PROOF_EVENTS = [
  { name: "Tomáš K.", city: "Praha", action: "se přihlásil k VIP Insider", time: "před 2 min" },
  { name: "Markéta S.", city: "Brno", action: "odemkla Sister\'s Exchange", time: "před 5 min" },
  { name: "Jakub V.", city: "Ostrava", action: "se přihlásil k Komunita+", time: "před 8 min" },
  { name: "Lucie P.", city: "Plzeň", action: "se připojila ZDARMA", time: "před 11 min" },
  { name: "David M.", city: "Liberec", action: "upgradoval na VIP Insider", time: "před 14 min" },
  { name: "Petra N.", city: "Olomouc", action: "odemkla AI Video Studio", time: "před 18 min" },
  { name: "Martin H.", city: "Hradec Králové", action: "se přihlásil k Komunita+", time: "před 22 min" },
  { name: "Jana B.", city: "České Budějovice", action: "se připojila ZDARMA", time: "před 25 min" },
];

const TESTIMONIALS = [
  { name: "Tomáš K.", role: "VIP Insider člen", avatar: "TK", stars: 5, text: "Nejlepší platforma pro TG/TF obsah. AI nástroje jsou na jiné úrovni než cokoliv jiného. Stojí to za každou korunu." },
  { name: "Markéta S.", role: "Komunita+ členka", avatar: "MS", stars: 5, text: "Komunita je úžasná, obsah exkluzivní. Affiliate program mi přináší pasivní příjem každý měsíc." },
  { name: "David M.", role: "Tvůrce & VIP člen", avatar: "DM", stars: 5, text: "Jako tvůrce vydělávám 88% z každého předplatného. FEMSIDER je nejférovější platforma, co jsem zkoušel." },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [scrollY, setScrollY] = useState(0);
  const [showExitPopup, setShowExitPopup] = useState(false);
  const [lastCTA, setLastCTA] = useState<string>("default");
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [socialProofIdx, setSocialProofIdx] = useState(0);
  const [showSocialProof, setShowSocialProof] = useState(false);
  const [showStickyCTA, setShowStickyCTA] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const exitShownRef = useRef(false);

  const heroCta = useCtaTest("hero");
  const pricingCta = useCtaTest("pricing");

  const checkoutMutation = trpc.checkout.createSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        toast.success("Přesměrování na platbu...", { description: "Otevíráme Stripe checkout v novém okně." });
        window.open(data.url, "_blank");
        pricingCta.trackConversion();
      }
    },
    onError: (err) => toast.error("Chyba", { description: err.message }),
  });

  const handleCheckout = (productKey: "community_plus" | "vip_insider") => {
    if (!isAuthenticated) { window.location.href = getLoginUrl(); return; }
    checkoutMutation.mutate({ productKey, billingCycle: "monthly" });
  };

  const handleCTAClick = (variant: string) => setLastCTA(variant);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setScrollY(y);
      setShowStickyCTA(y > 600 && !isAuthenticated);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) return;
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !exitShownRef.current) {
        exitShownRef.current = true;
        setShowExitPopup(true);
      }
    };
    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) return;
    const timer1 = setTimeout(() => setShowSocialProof(true), 4000);
    const interval = setInterval(() => setSocialProofIdx(i => (i + 1) % SOCIAL_PROOF_EVENTS.length), 5000);
    return () => { clearTimeout(timer1); clearInterval(interval); };
  }, [isAuthenticated]);

  const lockedContent = [
    { id: 1, title: "Sister\'s Exchange - Full TG", views: "12.4K", likes: 892 },
    { id: 2, title: "Magic Roulette Transform", views: "8.7K", likes: 654 },
    { id: 3, title: "Wishing To Be Her - EP3", views: "15.2K", likes: 1203 },
    { id: 4, title: "AI Body Swap Studio", views: "6.3K", likes: 445 },
    { id: 5, title: "Symbiote Fusion TF", views: "9.1K", likes: 723 },
    { id: 6, title: "The Mirror\'s Secret", views: "11.8K", likes: 967 },
  ];

  const faqItems = [
    { q: "Naúčtuje se mi něco za registraci?", a: "Ne. Registrace je zcela zdarma. Platíte pouze pokud se rozhodnete pro prémiový tier." },
    { q: "Mohu kdykoliv zrušit předplatné?", a: "Ano, předplatné můžete zrušit kdykoliv jedním kliknutím. Žádné skryté poplatky, žádné závazky." },
    { q: "Jak funguje affiliate program?", a: "Za každého přivedeného platícího uživatele získáte 25% doživotní provizi. Multi-tier systém až 4 úrovně." },
    { q: "Je obsah bezpečný a legální?", a: "Veškerý obsah je generován AI. Používáme ověření věku 18+ a bezpečné platby přes Stripe." },
    { q: "Jak rychle dostanu přístup po platbě?", a: "Přístup je okamžitý — do 30 sekund od platby máte plný přístup ke všemu obsahu." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* HERO */}
      <section ref={heroRef} className="relative overflow-hidden min-h-[90vh] flex items-center">
        <div className="absolute inset-0" style={{ transform: `translateY(${scrollY * 0.25}px)` }}>
          <div className="absolute left-0 top-0 bottom-0 w-2/5 opacity-35">
            <img src="https://files.manuscdn.com/user_upload_by_module/session_file/89740521/RdLPeADGOAGhrVda.png" alt="" className="h-full w-full object-cover object-right" />
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-2/5 opacity-35">
            <img src="https://files.manuscdn.com/user_upload_by_module/session_file/89740521/ypLFGemAnHfcHTHG.png" alt="" className="h-full w-full object-cover object-left" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/30 to-background" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-transparent to-background" />
        </div>
        <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] bg-[oklch(0.6_0.15_180)]/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-[oklch(0.55_0.15_160)]/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="container relative py-24 md:py-32">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-10">
              <div className="relative flex-shrink-0">
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-2 border-[oklch(0.6_0.15_180)] shadow-[0_0_40px_oklch(0.6_0.15_180/0.4)]">
                  <img src="https://files.manuscdn.com/user_upload_by_module/session_file/89740521/CrlsnPOMLOibjsgs.png" alt="FEMSIDER" className="w-full h-full object-cover" />
                </div>
                <div className="absolute -inset-3 bg-gradient-to-r from-[oklch(0.6_0.15_180)] to-[oklch(0.55_0.15_160)] rounded-full opacity-15 blur-xl animate-pulse" />
                <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background animate-pulse" title="Online" />
              </div>

              <div className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[oklch(0.6_0.15_180)]/10 border border-[oklch(0.6_0.15_180)]/25 text-[oklch(0.75_0.15_180)] text-xs font-semibold tracking-widest uppercase mb-4">
                  <Sparkles className="h-3 w-3" />Prémiová AI platforma
                </div>
                <h1 className="hero-headline text-5xl md:text-7xl font-bold mb-4">
                  FEM<span className="symbiote-text-gradient">SIDER</span>
                </h1>
                <p className="text-xl md:text-2xl text-foreground/80 font-light mb-2 leading-relaxed">Exkluzivní TG/TF obsah. Ověřená kvalita.</p>
                <p className="text-base text-muted-foreground mb-6 max-w-lg">
                  Připoj se k <span className="text-[oklch(0.75_0.15_180)] font-semibold">15,000+</span> členům a odemkni 474+ AI videí, kreativní komunitu a nástroje pro tvůrce.
                </p>
                <div className="flex flex-wrap gap-5 justify-center md:justify-start text-sm mb-6">
                  {[
                    { icon: <Users className="h-4 w-4" />, value: "15.4K", label: "sledujících" },
                    { icon: <Play className="h-4 w-4" />, value: "474", label: "videí" },
                    { icon: <Heart className="h-4 w-4" />, value: "2.3K", label: "podporovatelů" },
                    { icon: <Star className="h-4 w-4 text-yellow-400" />, value: "4.9/5", label: "hodnocení", gold: true },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className={s.gold ? "text-yellow-400" : "text-[oklch(0.6_0.15_180)]"}>{s.icon}</span>
                      <span className={`font-bold ${s.gold ? "text-yellow-400" : "text-foreground"}`}>{s.value}</span>
                      <span className="text-muted-foreground">{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3 min-w-[230px]">
                {isAuthenticated ? (
                  <>
                    <Link href="/browse">
                      <Button size="lg" className="symbiote-gradient text-white border-0 symbiote-glow w-full text-base font-bold h-12">
                        <Play className="mr-2 h-5 w-5" />Procházet obsah
                      </Button>
                    </Link>
                    <Link href="/subscriptions">
                      <Button size="lg" variant="outline" className="w-full border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10 h-12">
                        <Crown className="mr-2 h-4 w-4" />Upgradovat na VIP
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <a href={getLoginUrl()} onClick={() => { handleCTAClick("hero_join"); heroCta.trackClick(); }}>
                      <Button size="lg" className={`${heroCta.variant?.buttonColor || "symbiote-gradient"} text-white border-0 symbiote-glow w-full text-base font-bold h-12`}>
                        <Sparkles className="mr-2 h-5 w-5" />{heroCta.variant?.buttonText || "Připojit se ZDARMA"}
                      </Button>
                    </a>
                    <p className="text-xs text-center text-muted-foreground">{heroCta.variant?.subText || "Žádná kreditní karta · Zrušit kdykoliv"}</p>
                    <a href={getLoginUrl()} onClick={() => handleCTAClick("hero_vip")}>
                      <Button size="lg" variant="outline" className="w-full border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10 h-11 text-sm">
                        <Crown className="mr-2 h-4 w-4" />Prohlédnout VIP plány
                      </Button>
                    </a>
                  </>
                )}
              </div>
            </div>

            <div className="premium-card p-5">
              <p className="text-muted-foreground leading-relaxed text-sm">
                FEMSIDER je prémiová platforma pro tvůrce exkluzivního <span className="text-foreground font-medium">TG/TF (transgender/transformation)</span> obsahu.
                Využíváme pokročilé AI technologie pro vytváření unikátních transformačních videí.
                Naše komunita spojuje tvůrce a fanoušky, kteří sdílejí vášeň pro transformační příběhy a umění.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <div className="trust-bar py-5">
        <div className="container">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14">
            {[
              { icon: <Star className="h-5 w-5 text-yellow-400" />, value: "4.9 / 5", label: "průměrné hodnocení", color: "text-yellow-400" },
              { icon: <Users className="h-5 w-5 text-[oklch(0.6_0.15_180)]" />, value: "15,400+", label: "aktivních členů", color: "text-[oklch(0.75_0.15_180)]" },
              { icon: <Play className="h-5 w-5 text-[oklch(0.6_0.15_180)]" />, value: "474+", label: "exkluzivních videí", color: "text-[oklch(0.75_0.15_180)]" },
              { icon: <Shield className="h-5 w-5 text-green-400" />, value: "100%", label: "bezpečné platby", color: "text-green-400" },
              { icon: <Award className="h-5 w-5 text-[oklch(0.72_0.12_75)]" />, value: "3+ roky", label: "na trhu", color: "text-[oklch(0.82_0.12_75)]" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 text-sm">
                {item.icon}
                <div>
                  <div className={`font-bold text-base leading-none ${item.color}`}>{item.value}</div>
                  <div className="text-muted-foreground text-xs mt-0.5">{item.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* LOCKED CONTENT */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[oklch(0.6_0.15_180)]/10 border border-[oklch(0.6_0.15_180)]/25 text-[oklch(0.75_0.15_180)] text-xs font-semibold tracking-widest uppercase mb-4">
              <Lock className="h-3 w-3" />Exkluzivní obsah
            </span>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-3">
              Ukázka <span className="symbiote-text-gradient">obsahu</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Podívej se, co na tebe čeká. <span className="text-[oklch(0.75_0.15_180)] font-medium">Odemkni plný přístup</span> k 474+ videím.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-6xl mx-auto mb-8">
            {lockedContent.map((item) => (
              <div key={item.id} className="content-card group relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.3_0.05_180)] via-[oklch(0.2_0.08_200)] to-[oklch(0.15_0.05_160)]" />
                <div className="absolute inset-0 backdrop-blur-sm bg-background/30" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-[oklch(0.6_0.15_180)]/20 border border-[oklch(0.6_0.15_180)]/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Lock className="h-5 w-5 text-[oklch(0.6_0.15_180)]" />
                  </div>
                  <span className="premium-badge">Premium</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-xs font-medium truncate text-white/90">{item.title}</p>
                  <div className="flex items-center gap-2 text-[10px] text-white/60">
                    <span className="flex items-center gap-0.5"><Eye className="h-2.5 w-2.5" />{item.views}</span>
                    <span className="flex items-center gap-0.5"><Heart className="h-2.5 w-2.5" />{item.likes}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center">
            {!isAuthenticated ? (
              <>
                <a href={getLoginUrl()} onClick={() => handleCTAClick("content_unlock")}>
                  <Button size="lg" className="symbiote-gradient text-white border-0 symbiote-glow font-bold text-base h-12 px-8">
                    <Lock className="mr-2 h-5 w-5" />Odemknout vše ZDARMA<ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </a>
                <p className="text-xs text-muted-foreground mt-3">474+ videí · Nový obsah každý týden · Zrušit kdykoliv</p>
              </>
            ) : (
              <Link href="/browse">
                <Button size="lg" className="symbiote-gradient text-white border-0 font-bold h-12 px-8">
                  <Play className="mr-2 h-5 w-5" />Procházet vše<ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="py-20 relative">
        <div className="section-divider" />
        <div className="absolute inset-0 bg-gradient-to-b from-[oklch(0.6_0.15_180)]/3 via-transparent to-transparent pointer-events-none" />
        <div className="container relative">
          <div className="text-center mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[oklch(0.6_0.15_180)]/10 border border-[oklch(0.6_0.15_180)]/25 text-[oklch(0.75_0.15_180)] text-xs font-semibold tracking-widest uppercase mb-4">
              <Crown className="h-3 w-3" />Membership plány
            </span>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-3">
              Vyber si svůj <span className="symbiote-text-gradient">tier</span>
            </h2>
            <p className="text-muted-foreground mb-4 max-w-xl mx-auto">Získej přístup k exkluzivnímu obsahu a podpoř tvůrce, které miluješ.</p>
          </div>
          <div className="flex items-center justify-center gap-2 mb-10">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/30">
              <Flame className="h-4 w-4 text-orange-400 animate-pulse" />
              <span className="text-sm text-orange-400 font-semibold">Omezená nabídka: první měsíc se slevou 50% — pouze do konce měsíce</span>
              <Clock className="h-4 w-4 text-orange-400" />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-start">
            <div className="premium-card p-6 relative">
              <h3 className="text-xl font-bold mb-1">Fanoušek</h3>
              <p className="text-xs text-muted-foreground mb-4">Začni zdarma, bez závazků</p>
              <div className="text-4xl font-bold mb-1 symbiote-text-gradient">Zdarma</div>
              <p className="text-xs text-muted-foreground mb-5">navždy</p>
              <ul className="space-y-2.5 mb-6">
                {["Registrace a profil","Náhledy obsahu","Komunitní fórum","Komentáře a reakce","Základní chat"].map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-[oklch(0.6_0.15_180)] mt-0.5 flex-shrink-0" />
                    <span className="text-foreground/80">{b}</span>
                  </li>
                ))}
              </ul>
              {!isAuthenticated ? (
                <a href={getLoginUrl()} onClick={() => handleCTAClick("tier_free")}>
                  <Button variant="outline" className="w-full h-11">Vytvořit účet zdarma</Button>
                </a>
              ) : (
                <Button variant="outline" className="w-full h-11" disabled>Aktivní</Button>
              )}
              <p className="text-center text-xs text-muted-foreground mt-3">Žádná kreditní karta · Okamžitý přístup</p>
            </div>

            <div className="pricing-popular p-6 relative scale-105 z-10">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 symbiote-gradient text-white text-xs font-bold rounded-full flex items-center gap-1.5 shadow-lg">
                <Crown className="h-3.5 w-3.5" />NEJOBLÍBENĚJŠÍ
              </div>
              <h3 className="text-xl font-bold mb-1 mt-2">Komunita+</h3>
              <p className="text-xs text-muted-foreground mb-4">Pro skutečné fanoušky</p>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-4xl font-bold symbiote-text-gradient">$4.99</span>
                <span className="text-base text-muted-foreground line-through">$9.99</span>
                <span className="text-sm text-muted-foreground">/měsíc</span>
              </div>
              <div className="flex items-center gap-2 mb-5">
                <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 text-xs font-bold">UŠETŘÍŠ 50%</span>
                <span className="text-xs text-orange-400 flex items-center gap-1"><Zap className="h-3 w-3" /> = $60 ročně</span>
              </div>
              <ul className="space-y-2.5 mb-6">
                {["Vše z Fanouška","HD přístup ke všem 474+ videím","Early access k novinkám","Hlasování o obsahu","Přístup k fotogalerii","Prioritní podpora"].map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-[oklch(0.6_0.15_180)] mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">{b}</span>
                  </li>
                ))}
              </ul>
              {!isAuthenticated ? (
                <a href={getLoginUrl()} onClick={() => { handleCTAClick("tier_community"); pricingCta.trackClick(); }}>
                  <Button className={`${pricingCta.variant?.buttonColor || "symbiote-gradient"} text-white border-0 w-full font-bold h-12 text-base`}>
                    {pricingCta.variant?.buttonText || "Připojit se nyní"}<ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              ) : (
                <Button className="symbiote-gradient text-white border-0 w-full font-bold h-12 text-base" onClick={() => handleCheckout("community_plus")} disabled={checkoutMutation.isPending}>
                  {checkoutMutation.isPending ? "Načítání..." : "Předplatit Komunita+"}<ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
              <p className="text-center text-xs text-muted-foreground mt-3">Hodnota: $49/měsíc · <span className="text-[oklch(0.75_0.15_180)]">Platíš jen $4.99</span></p>
              <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-green-400">
                <Shield className="h-3 w-3" />7 dní zdarma · Zrušení kdykoliv
              </div>
            </div>

            <div className="pricing-vip p-6 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold rounded-full flex items-center gap-1.5 shadow-lg">
                <Gift className="h-3.5 w-3.5" />VIP EXKLUZIVNÍ
              </div>
              <h3 className="text-xl font-bold mb-1 mt-2">VIP Insider</h3>
              <p className="text-xs text-muted-foreground mb-4">Maximální zážitek</p>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-4xl font-bold gold-gradient">$9.99</span>
                <span className="text-base text-muted-foreground line-through">$19.99</span>
                <span className="text-sm text-muted-foreground">/měsíc</span>
              </div>
              <div className="flex items-center gap-2 mb-5">
                <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 text-xs font-bold">UŠETŘÍŠ 50%</span>
                <span className="text-xs text-yellow-400 flex items-center gap-1"><Zap className="h-3 w-3" /> = $120 ročně</span>
              </div>
              <ul className="space-y-2.5 mb-6">
                {["Vše z Komunita+","4K video kvalita","Vlastní požadavky na obsah","Přímý kontakt s tvůrci","Behind-the-scenes přístup","Exkluzivní AI nástroje","Affiliate bonus 30%"].map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">{b}</span>
                  </li>
                ))}
              </ul>
              {!isAuthenticated ? (
                <a href={getLoginUrl()} onClick={() => handleCTAClick("tier_vip")}>
                  <Button variant="outline" className="w-full border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10 font-bold h-12 text-base">
                    Získat VIP přístup<Crown className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              ) : (
                <Button variant="outline" className="w-full border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10 font-bold h-12 text-base" onClick={() => handleCheckout("vip_insider")} disabled={checkoutMutation.isPending}>
                  {checkoutMutation.isPending ? "Načítání..." : "Předplatit VIP"}<Crown className="ml-2 h-4 w-4" />
                </Button>
              )}
              <p className="text-center text-xs text-muted-foreground mt-3">Hodnota: $99/měsíc · <span className="text-yellow-400">Platíš jen $9.99</span></p>
              <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-green-400">
                <Shield className="h-3 w-3" />7 dní zdarma · Zrušení kdykoliv
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm text-muted-foreground">
            {[
              { icon: <Shield className="h-4 w-4 text-green-400" />, text: "Bezpečné platby Stripe" },
              { icon: <Clock className="h-4 w-4 text-blue-400" />, text: "Zrušit kdykoliv" },
              { icon: <Users className="h-4 w-4 text-[oklch(0.6_0.15_180)]" />, text: "2,300+ platících členů" },
              { icon: <Star className="h-4 w-4 text-yellow-400" />, text: "4.9/5 hodnocení" },
              { icon: <Zap className="h-4 w-4 text-orange-400" />, text: "Okamžitý přístup" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">{item.icon}<span>{item.text}</span></div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 relative">
        <div className="section-divider" />
        <div className="container">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/25 text-yellow-400 text-xs font-semibold tracking-widest uppercase mb-4">
              <Star className="h-3 w-3" />Recenze členů
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
              Co říkají naši <span className="symbiote-text-gradient">členové</span>
            </h2>
            <p className="text-muted-foreground">Přidej se k tisícům spokojených uživatelů</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="premium-card p-6 relative">
                <Quote className="absolute top-4 right-4 h-8 w-8 text-[oklch(0.6_0.15_180)]/20" />
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, si) => (
                    <Star key={si} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-foreground/85 leading-relaxed mb-5 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[oklch(0.6_0.15_180)]/20 border border-[oklch(0.6_0.15_180)]/30 flex items-center justify-center text-sm font-bold text-[oklch(0.75_0.15_180)]">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-sm flex items-center gap-1.5">
                      {t.name}<BadgeCheck className="h-4 w-4 text-[oklch(0.6_0.15_180)]" />
                    </div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMMUNITY */}
      <section className="py-20">
        <div className="section-divider" />
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
              Prozkoumej naši <span className="symbiote-text-gradient">komunitu</span>
            </h2>
            <p className="text-muted-foreground">Sekce pro každý vkus a styl</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Link href="/crossdresser">
              <div className="premium-card p-8 group cursor-pointer relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-pink-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500" />
                <div className="relative">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center mb-4">
                    <Sparkles className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-display text-2xl font-bold mb-2 bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">Crossdresser</h3>
                  <p className="text-muted-foreground mb-4 text-sm leading-relaxed">Makeover tutorials, fashion guides, before/after galerie a sdílení transformací s komunitou.</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="w-4 h-4" /> 45K+ členů</span>
                    <span className="flex items-center gap-1"><Play className="w-4 h-4" /> 8K+ videí</span>
                  </div>
                </div>
              </div>
            </Link>
            <Link href="/femboy">
              <div className="premium-card p-8 group cursor-pointer relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500" />
                <div className="relative">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mb-4">
                    <Heart className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-display text-2xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Femboy Hub</h3>
                  <p className="text-muted-foreground mb-4 text-sm leading-relaxed">Style inspiration, creator profiles, trending content a spojte se s femboy komunitou.</p>
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

      {/* FAQ */}
      <section className="py-20">
        <div className="section-divider" />
        <div className="container max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
              Časté <span className="symbiote-text-gradient">otázky</span>
            </h2>
            <p className="text-muted-foreground">Máš otázku? Máme odpověď.</p>
          </div>
          <div className="space-y-3">
            {faqItems.map((item, i) => (
              <div key={i} className="premium-card overflow-hidden">
                <button className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-colors" onClick={() => setFaqOpen(faqOpen === i ? null : i)}>
                  <span className="font-medium flex items-center gap-3 text-foreground">
                    <span className="text-lg">{["💰","🔄","🤝","🔒","⚡"][i]}</span>{item.q}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform flex-shrink-0 ml-4 ${faqOpen === i ? "rotate-180" : ""}`} />
                </button>
                {faqOpen === i && (
                  <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed animate-in fade-in-50 slide-in-from-top-2 border-t border-border/50 pt-4">{item.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      {!isAuthenticated && (
        <section className="py-24">
          <div className="section-divider" />
          <div className="container">
            <div className="premium-card p-10 md:p-16 text-center symbiote-glow max-w-3xl mx-auto relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.6_0.15_180)]/5 via-transparent to-[oklch(0.55_0.15_160)]/5 pointer-events-none" />
              <div className="relative">
                <div className="mb-6 flex justify-center">
                  <div className="w-20 h-20 rounded-full bg-[oklch(0.6_0.15_180)]/15 border border-[oklch(0.6_0.15_180)]/30 flex items-center justify-center">
                    <Zap className="h-10 w-10 text-[oklch(0.6_0.15_180)]" />
                  </div>
                </div>
                <h2 className="font-display text-3xl md:text-5xl font-bold mb-4 text-foreground">Připraven na transformaci?</h2>
                <p className="text-muted-foreground mb-8 max-w-xl mx-auto text-lg leading-relaxed">
                  Připoj se k <span className="text-foreground font-semibold">15,000+ členům</span>. Registrace je zdarma a trvá 30 sekund.
                </p>
                <a href={getLoginUrl()} onClick={() => handleCTAClick("final_cta")}>
                  <Button size="lg" className="symbiote-gradient text-white border-0 symbiote-glow font-bold text-lg px-12 h-14">
                    Vytvořit účet ZDARMA<ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </a>
                <p className="text-xs text-muted-foreground mt-5">Žádná kreditní karta · Zrušit kdykoliv · 474+ videí čeká</p>
                <div className="mt-8 grid grid-cols-3 gap-4 text-sm">
                  {[{ icon: "🎬", text: "474+ videí" },{ icon: "🤖", text: "AI nástroje" },{ icon: "💰", text: "Affiliate 25%" }].map((v, i) => (
                    <div key={i} className="flex flex-col items-center gap-1 text-muted-foreground">
                      <span className="text-2xl">{v.icon}</span>
                      <span className="text-xs">{v.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* STICKY CTA */}
      {showStickyCTA && (
        <div className="sticky-cta fixed bottom-0 left-0 right-0 z-50 py-3 px-4 flex items-center justify-between gap-4 md:hidden animate-in slide-in-from-bottom-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Připoj se ZDARMA</p>
            <p className="text-xs text-muted-foreground">474+ videí · Žádná kreditní karta</p>
          </div>
          <a href={getLoginUrl()} onClick={() => handleCTAClick("sticky_cta")}>
            <Button size="sm" className="symbiote-gradient text-white border-0 font-bold flex-shrink-0">
              Začít<ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </a>
        </div>
      )}

      {/* SOCIAL PROOF */}
      {showSocialProof && !isAuthenticated && (
        <div className="fixed bottom-6 left-4 z-40 max-w-[280px] animate-in slide-in-from-left-4 fade-in-0">
          <div className="social-proof-widget p-3 flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-[oklch(0.6_0.15_180)]/20 border border-[oklch(0.6_0.15_180)]/30 flex items-center justify-center flex-shrink-0 text-xs font-bold text-[oklch(0.75_0.15_180)]">
              {SOCIAL_PROOF_EVENTS[socialProofIdx].name.split(" ").map(n => n[0]).join("")}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-foreground leading-snug">
                <span className="font-semibold">{SOCIAL_PROOF_EVENTS[socialProofIdx].name}</span>
                {" "}z {SOCIAL_PROOF_EVENTS[socialProofIdx].city}
                {" "}<span className="text-[oklch(0.75_0.15_180)]">{SOCIAL_PROOF_EVENTS[socialProofIdx].action}</span>
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{SOCIAL_PROOF_EVENTS[socialProofIdx].time}</p>
            </div>
            <button onClick={() => setShowSocialProof(false)} className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 text-xs">x</button>
          </div>
        </div>
      )}

      {/* EXIT POPUP */}
      {showExitPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-0">
          <div className="premium-card p-8 max-w-md w-full text-center relative symbiote-glow">
            <button onClick={() => setShowExitPopup(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors text-lg font-bold">x</button>
            <div className="text-4xl mb-4">🎁</div>
            <h3 className="font-display text-2xl font-bold mb-2 text-foreground">Počkej! Máme pro tebe dárek</h3>
            <p className="text-muted-foreground mb-2 text-sm">
              {lastCTA.includes("tier") || lastCTA.includes("vip") ? "Zaregistruj se dnes a získej první měsíc se slevou 50%." : "Registrace je zdarma a trvá 30 sekund. Žádná kreditní karta."}
            </p>
            <div className="my-4 p-3 rounded-lg bg-[oklch(0.6_0.15_180)]/10 border border-[oklch(0.6_0.15_180)]/25">
              <p className="text-[oklch(0.75_0.15_180)] font-semibold text-sm">474+ videí · AI nástroje · Komunita 15K+</p>
            </div>
            <a href={getLoginUrl()}>
              <Button size="lg" className="symbiote-gradient text-white border-0 symbiote-glow w-full font-bold text-base h-12">
                <Sparkles className="mr-2 h-5 w-5" />
                {lastCTA.includes("tier") ? "Získat slevu 50%" : "Připojit se ZDARMA"}
              </Button>
            </a>
            <p className="text-xs text-muted-foreground mt-3">Připojilo se 15,000+ členů</p>
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
    <div className="premium-card overflow-hidden group content-card">
      <div className="aspect-video overflow-hidden relative">
        <img src={image} alt={title} className={`w-full h-full object-cover ${locked ? "blur-sm" : ""}`} />
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
          <h3 className="font-semibold flex-1 text-foreground">{title}</h3>
          {locked && <span className="premium-badge">Premium</span>}
        </div>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{preview}</p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1"><Heart className="h-4 w-4" /><span>{likes}</span></div>
          <div className="flex items-center gap-1"><MessageCircle className="h-4 w-4" /><span>{comments}</span></div>
          <button className="ml-auto hover:text-foreground transition-colors"><Share2 className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
}
'''

path = '/home/ubuntu/femsider/client/src/pages/Home.tsx'
with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print(f"Written {len(content)} chars, {content.count(chr(10))} lines")
