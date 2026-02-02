import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { useState, useEffect, useRef } from "react";
import { Play, Users, DollarSign, Shield, Sparkles, ArrowRight, Heart, MessageCircle, Share2 } from "lucide-react";
import { Link } from "wouter";
import Header from "@/components/Header";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLElement>(null);

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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section - Symbiote Theme */}
      <section ref={heroRef} className="relative overflow-hidden">
        {/* Symbiote background with parallax */}
        <div className="absolute inset-0" style={{ transform: `translateY(${scrollY * 0.3}px)` }}>
          {/* Left symbiote character */}
          <div className="absolute left-0 top-0 bottom-0 w-1/3 opacity-40">
            <img 
              src="/symbiote-left.png" 
              alt="" 
              className="h-full object-cover object-right"
            />
          </div>
          
          {/* Right symbiote character */}
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-40">
            <img 
              src="/symbiote-right.png" 
              alt="" 
              className="h-full object-cover object-left"
            />
          </div>
          
          {/* Gradient overlays for seamless blending */}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/40 to-background" />
        </div>
        
        {/* Symbiote glow effect - teal/emerald */}
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[oklch(0.6_0.15_180)]/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/4 translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[oklch(0.6_0.15_180)]/20 rounded-full blur-3xl" />
        
        <div className="container relative py-24 md:py-32">
          {/* Patreon-style Profile Section */}
          <div className="max-w-5xl mx-auto">
            {/* Profile Header */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12">
              {/* Profile Avatar - Skrull Shapeshifter */}
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[oklch(0.6_0.15_180)] shadow-[0_0_30px_oklch(0.6_0.15_180/0.5)]">
                  <img 
                    src="/skrull-profile.png" 
                    alt="FEMSIDER Creator" 
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Symbiote effect around avatar */}
                <div className="absolute -inset-2 bg-gradient-to-r from-[oklch(0.6_0.15_180)] to-[oklch(0.55_0.15_160)] rounded-full opacity-20 blur-xl animate-pulse" />
              </div>
              
              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-4xl md:text-5xl font-bold mb-3 symbiote-text-gradient">
                  FEMSIDER
                </h1>
                <p className="text-lg text-muted-foreground mb-4">
                  Vytváříme exkluzivní TG/TF transformační obsah s AI technologií
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
                </div>
              </div>
              
              {/* CTA Buttons */}
              <div className="flex flex-col gap-3">
                {isAuthenticated ? (
                  <>
                    <Link href="/browse">
                      <Button size="lg" className="symbiote-gradient text-white border-0 symbiote-glow w-full">
                        <Play className="mr-2 h-5 w-5" />
                        Procházet obsah
                      </Button>
                    </Link>
                    {user?.role === 'creator' && (
                      <Link href="/dashboard">
                        <Button size="lg" variant="outline" className="w-full">
                          Můj dashboard
                        </Button>
                      </Link>
                    )}
                  </>
                ) : (
                  <>
                    <a href={getLoginUrl()}>
                      <Button size="lg" className="symbiote-gradient text-white border-0 symbiote-glow w-full">
                        <Sparkles className="mr-2 h-5 w-5" />
                        Připojit se
                      </Button>
                    </a>
                    <Link href="/browse">
                      <Button size="lg" variant="outline" className="w-full">
                        Procházet obsah
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* About Section */}
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

      {/* Membership Tiers Section - Patreon Style */}
      <section className="py-20 border-t border-[oklch(0.6_0.15_180)]/20">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Staň se <span className="symbiote-text-gradient">členem</span>
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Získej přístup k exkluzivnímu obsahu a podpoř tvůrce
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <MembershipTier
              name="Začátečník"
              price="$4.99"
              benefits={[
                "Přístup k základním videím",
                "Komunitní diskuze",
                "Měsíční newsletter"
              ]}
              popular={false}
            />
            <MembershipTier
              name="Fanoušek"
              price="$9.99"
              benefits={[
                "Vše ze Začátečníka",
                "Přístup k HD videím",
                "Early access k novému obsahu",
                "Hlasování o budoucím obsahu"
              ]}
              popular={true}
            />
            <MembershipTier
              name="VIP"
              price="$19.99"
              benefits={[
                "Vše z Fanouška",
                "4K video kvalita",
                "Vlastní požadavky na obsah",
                "Přímý kontakt s tvůrci",
                "Exkluzivní behind-the-scenes"
              ]}
              popular={false}
            />
          </div>
        </div>
      </section>

      {/* Features Section - Symbiote Theme */}
      <section className="py-20 border-t border-[oklch(0.6_0.15_180)]/20">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Proč <span className="symbiote-text-gradient">FEMSIDER</span>?
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={<DollarSign className="h-8 w-8" />}
              title="88% pro tvůrce"
              description={<><span className="text-[oklch(0.6_0.15_180)] font-bold">Nejvyšší</span> podíl na trhu. Tvé peníze zůstávají tobě.</>}
            />
            <FeatureCard
              icon={<Users className="h-8 w-8" />}
              title="Affiliate program"
              description="Získej 25-30% doživotní provizi za každého přivedeného uživatele."
            />
            <FeatureCard
              icon={<Shield className="h-8 w-8" />}
              title="Bezpečnost"
              description="Ověření věku a bezpečné platby přes CCBill/Segpay."
            />
            <FeatureCard
              icon={<Sparkles className="h-8 w-8" />}
              title="AI Technologie"
              description="Pokročilé AI nástroje pro vytváření transformačních videí."
            />
          </div>
        </div>
      </section>

      {/* Recent Posts Section - Patreon Style */}
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
            />
            <PostCard
              title="AI Video Recreation Studio je live!"
              preview="Vyzkoušejte naši novou AI funkci pro rozšiřování videí..."
              image="/tg-templates/wishing-to-be-her.jpg"
              likes={567}
              comments={89}
            />
            <PostCard
              title="12 nových transformačních šablon"
              preview="Od magie po sci-fi - objevte všechny naše nové šablony..."
              image="/tg-templates/magic-roulette.jpg"
              likes={432}
              comments={67}
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

      {/* Community Sections */}
      <section className="py-20 border-t border-[oklch(0.6_0.15_180)]/20">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Prozkoumej naše <span className="symbiote-text-gradient">komunity</span>
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Připoj se k tisícům členů, kteří sdílejí svou cestu, styl a příběhy
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Crossdresser Community Card */}
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
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" /> 50K+ členů
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4" /> 200+ guides
                    </span>
                  </div>
                </div>
              </div>
            </Link>
            
            {/* Femboy Hub Card */}
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
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" /> 75K+ členů
                    </span>
                    <span className="flex items-center gap-1">
                      <Play className="w-4 h-4" /> 10K+ videí
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-[oklch(0.6_0.15_180)]/20">
        <div className="container">
          <div className="symbiote-card p-8 md:p-12 text-center symbiote-glow">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Připraven začít vydělávat svou vášní?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Připoj se k mnoha tvůrcům, kteří již monetizují svůj obsah na FEMSIDER.
            </p>
            {!isAuthenticated && (
              <a href={getLoginUrl()}>
                <Button size="lg" className="symbiote-gradient text-white border-0">
                  Vytvořit účet zdarma
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </a>
            )}
          </div>
        </div>
      </section>

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
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: React.ReactNode }) {
  return (
    <div className="symbiote-card p-6 transition-all hover:symbiote-glow">
      <div className="text-[oklch(0.6_0.15_180)] mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}

function MembershipTier({ name, price, benefits, popular }: { name: string; price: string; benefits: string[]; popular: boolean }) {
  return (
    <div className={`symbiote-card p-6 relative ${popular ? 'border-[oklch(0.6_0.15_180)] symbiote-glow' : ''}`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 symbiote-gradient text-white text-sm font-semibold rounded-full">
          Nejoblíbenější
        </div>
      )}
      <h3 className="text-xl font-bold mb-2">{name}</h3>
      <div className="text-3xl font-bold mb-4 symbiote-text-gradient">{price}<span className="text-sm text-muted-foreground">/měsíc</span></div>
      <ul className="space-y-3 mb-6">
        {benefits.map((benefit, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-[oklch(0.6_0.15_180)] mt-0.5 flex-shrink-0" />
            <span>{benefit}</span>
          </li>
        ))}
      </ul>
      <Button className={popular ? "symbiote-gradient text-white border-0 w-full" : "w-full"} variant={popular ? "default" : "outline"}>
        Vybrat tier
      </Button>
    </div>
  );
}

function PostCard({ title, preview, image, likes, comments }: { title: string; preview: string; image: string; likes: number; comments: number }) {
  return (
    <div className="symbiote-card overflow-hidden transition-all hover:symbiote-glow">
      <div className="aspect-video overflow-hidden">
        <img src={image} alt={title} className="w-full h-full object-cover" />
      </div>
      <div className="p-4">
        <h3 className="font-semibold mb-2">{title}</h3>
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
