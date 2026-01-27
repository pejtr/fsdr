import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { useState, useEffect, useRef } from "react";
import { Play, Users, DollarSign, Shield, Sparkles, ArrowRight } from "lucide-react";
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
      
      {/* Hero Section */}
      <section ref={heroRef} className="relative overflow-hidden femsider-parallax">
        {/* Background image with parallax */}
        <div className="absolute inset-0 femsider-parallax-bg" style={{ transform: `translateY(${scrollY * 0.3}px)` }}>
          <img 
            src="/banners/banner-collage.png" 
            alt="FEMSIDER" 
            className="w-full h-full object-cover opacity-50 scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/30 to-background/60" />
        </div>
        {/* Subtle glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        
        <div className="container relative py-24 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 femsider-hero-title">
              <span className="femsider-text-gradient">FEMSIDER</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Prémiová platforma pro tvůrce exkluzivního obsahu. 
              Monetizuj svou kreativitu a buduj komunitu fanoušků.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <>
                  <Link href="/browse">
                    <Button size="lg" className="femsider-gradient text-white border-0 femsider-glow">
                      <Play className="mr-2 h-5 w-5" />
                      Procházet obsah
                    </Button>
                  </Link>
                  {user?.role === 'creator' && (
                    <Link href="/dashboard">
                      <Button size="lg" variant="outline">
                        Můj dashboard
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <a href={getLoginUrl()}>
                    <Button size="lg" className="femsider-gradient text-white border-0 femsider-glow">
                      <Sparkles className="mr-2 h-5 w-5" />
                      Začít zdarma
                    </Button>
                  </a>
                  <Link href="/browse">
                    <Button size="lg" variant="outline">
                      Procházet obsah
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 border-t border-border">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Proč <span className="femsider-text-gradient">FEMSIDER</span>?
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={<DollarSign className="h-8 w-8" />}
              title="88% pro tvůrce"
              description={<><span className="text-primary font-bold">Nejvyšší</span> podíl na trhu. Tvé peníze zůstávají tobě.</>}
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
              icon={<Play className="h-8 w-8" />}
              title="HD Streaming"
              description="Kvalitní přehrávání videí ve vysokém rozlišení."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-border">
        <div className="container">
          <div className="femsider-card p-8 md:p-12 text-center femsider-glow">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Připraven začít vydělávat?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Připoj se k tisícům tvůrců, kteří již monetizují svůj obsah na FEMSIDER.
            </p>
            {!isAuthenticated && (
              <a href={getLoginUrl()}>
                <Button size="lg" className="femsider-gradient text-white border-0">
                  Vytvořit účet zdarma
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="femsider-text-gradient font-bold text-xl">FEMSIDER</div>
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
    <div className="femsider-card p-6 transition-all hover:femsider-glow">
      <div className="text-primary mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}
