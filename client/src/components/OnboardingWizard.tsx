import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Play,
  MessageSquare,
  Trophy,
  Users,
  CreditCard,
  Camera,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  Star,
  ArrowRight,
} from "lucide-react";

interface OnboardingStep {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  cta: string;
  ctaLink: string;
  gradient: string;
  illustration: string;
}

const STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    icon: <Sparkles className="h-8 w-8" />,
    title: "Vítej na FEMSIDER!",
    subtitle: "Tvůj průvodce platformou",
    description:
      "Jsme rádi, že jsi tady. Projdeme tě hlavními funkcemi platformy, abys mohl/a naplno využít vše, co nabízíme.",
    features: [
      "Exkluzivní TG/TF transformační obsah",
      "Aktivní komunita tvůrců a fanoušků",
      "AI technologie pro tvorbu obsahu",
      "Gamifikace a odměny za aktivitu",
    ],
    cta: "Pojďme na to →",
    ctaLink: "",
    gradient: "from-emerald-500/20 via-teal-500/10 to-transparent",
    illustration: "🎉",
  },
  {
    id: "browse",
    icon: <Play className="h-8 w-8" />,
    title: "Procházej obsah",
    subtitle: "Videa, fotky a transformace",
    description:
      "Objevuj stovky exkluzivních videí a fotografií od talentovaných tvůrců. Prémiový obsah je dostupný s předplatným.",
    features: [
      "Procházej videa a fotogalerii",
      "Sleduj oblíbené tvůrce",
      "Odemkni prémiový obsah s předplatným",
      "Hodnoť a komentuj obsah",
    ],
    cta: "Prohlédnout obsah",
    ctaLink: "/browse",
    gradient: "from-purple-500/20 via-violet-500/10 to-transparent",
    illustration: "🎬",
  },
  {
    id: "forum",
    icon: <MessageSquare className="h-8 w-8" />,
    title: "Komunitní fórum",
    subtitle: "Diskutuj a sdílej",
    description:
      "Připoj se k diskuzím v komunitním fóru. Zakládej témata, odpovídej na příspěvky a získávej reputační body.",
    features: [
      "Diskuzní kategorie pro různá témata",
      "Hlasování o příspěvcích (upvote/downvote)",
      "@mention notifikace",
      "Reputační body za aktivitu",
    ],
    cta: "Navštívit fórum",
    ctaLink: "/forum",
    gradient: "from-blue-500/20 via-cyan-500/10 to-transparent",
    illustration: "💬",
  },
  {
    id: "gamification",
    icon: <Trophy className="h-8 w-8" />,
    title: "Gamifikace & Odznaky",
    subtitle: "Sbírej body a stoupej v žebříčku",
    description:
      "Za každou aktivitu získáváš reputační body. Stoupej v rankách od Newcomer po Legend a odemykej unikátní odznaky.",
    features: [
      "+5 bodů za nový příspěvek",
      "+3 body za odpověď ve fóru",
      "+2 body za obdržený upvote",
      "5 ranků: Newcomer → Legend",
    ],
    cta: "Zobrazit leaderboard",
    ctaLink: "/leaderboard",
    gradient: "from-amber-500/20 via-yellow-500/10 to-transparent",
    illustration: "🏆",
  },
  {
    id: "affiliate",
    icon: <Users className="h-8 w-8" />,
    title: "Affiliate program",
    subtitle: "Vydělávej sdílením",
    description:
      "Sdílej svůj unikátní affiliate odkaz a vydělávej provizi z každého nového předplatitele, kterého přivedeš.",
    features: [
      "Unikátní affiliate kód",
      "Provize z každého referralu",
      "+10 reputačních bodů za referral",
      "Detailní statistiky a výplaty",
    ],
    cta: "Otevřít affiliate dashboard",
    ctaLink: "/affiliate",
    gradient: "from-green-500/20 via-emerald-500/10 to-transparent",
    illustration: "💰",
  },
  {
    id: "subscribe",
    icon: <CreditCard className="h-8 w-8" />,
    title: "Předplatné",
    subtitle: "Odemkni plný přístup",
    description:
      "Vyber si tier, který ti vyhovuje. Komunita+ za $4.99/měsíc nebo VIP Insider za $9.99/měsíc s plným přístupem ke všemu obsahu.",
    features: [
      "Komunita+ — přístup k fóru a galerii",
      "VIP Insider — vše + exkluzivní obsah",
      "Aktuálně 50% sleva na první měsíc",
      "Zrušení kdykoliv bez poplatku",
    ],
    cta: "Zobrazit nabídky",
    ctaLink: "/#pricing",
    gradient: "from-rose-500/20 via-pink-500/10 to-transparent",
    illustration: "⭐",
  },
];

export function OnboardingWizard() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<"next" | "prev">("next");

  const { data: onboardingStatus, isLoading } =
    trpc.onboarding.getStatus.useQuery(undefined, {
      enabled: isAuthenticated,
    });

  const completeMutation = trpc.onboarding.complete.useMutation({
    onSuccess: () => {
      setIsVisible(false);
    },
  });

  useEffect(() => {
    if (!isLoading && onboardingStatus && !onboardingStatus.completed && isAuthenticated) {
      const timer = setTimeout(() => setIsVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, [isLoading, onboardingStatus, isAuthenticated]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setDirection("next");
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep((s) => s + 1);
        setIsAnimating(false);
      }, 200);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setDirection("prev");
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep((s) => s - 1);
        setIsAnimating(false);
      }, 200);
    }
  };

  const handleSkip = () => {
    completeMutation.mutate();
  };

  const handleFinish = () => {
    completeMutation.mutate();
  };

  const handleCtaClick = () => {
    const step = STEPS[currentStep];
    if (step.ctaLink) {
      completeMutation.mutate();
      setTimeout(() => navigate(step.ctaLink), 300);
    } else {
      handleNext();
    }
  };

  if (!isVisible || isLoading || !onboardingStatus || onboardingStatus.completed) {
    return null;
  }

  const step = STEPS[currentStep];
  const progress = ((currentStep + 1) / STEPS.length) * 100;
  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={handleSkip}
      />

      {/* Wizard Card */}
      <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 z-10 p-1.5 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Přeskočit"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Step indicator */}
        <div className="absolute top-4 left-4 z-10 text-xs text-muted-foreground font-medium">
          {currentStep + 1} / {STEPS.length}
        </div>

        {/* Content */}
        <div
          className={`p-8 pt-12 transition-all duration-200 ${
            isAnimating
              ? direction === "next"
                ? "opacity-0 translate-x-4"
                : "opacity-0 -translate-x-4"
              : "opacity-100 translate-x-0"
          }`}
        >
          {/* Gradient background */}
          <div
            className={`absolute inset-0 bg-gradient-to-br ${step.gradient} pointer-events-none`}
          />

          {/* Illustration */}
          <div className="relative text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
              <span className="text-4xl">{step.illustration}</span>
            </div>
          </div>

          {/* Icon + Title */}
          <div className="relative text-center mb-6">
            <div className="inline-flex items-center gap-2 text-emerald-400 mb-2">
              {step.icon}
              <span className="text-sm font-medium uppercase tracking-wider">
                {step.subtitle}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-foreground">{step.title}</h2>
          </div>

          {/* Description */}
          <p className="relative text-center text-muted-foreground mb-6 leading-relaxed">
            {step.description}
          </p>

          {/* Features */}
          <div className="relative space-y-2.5 mb-8">
            {step.features.map((feature, i) => (
              <div
                key={i}
                className="flex items-start gap-3 text-sm"
              >
                <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Star className="h-3 w-3 text-emerald-400" />
                </div>
                <span className="text-foreground/80">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="relative px-8 pb-6 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="text-muted-foreground"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Zpět
          </Button>

          {/* Step dots */}
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setDirection(i > currentStep ? "next" : "prev");
                  setIsAnimating(true);
                  setTimeout(() => {
                    setCurrentStep(i);
                    setIsAnimating(false);
                  }, 200);
                }}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i === currentStep
                    ? "w-6 bg-emerald-500"
                    : i < currentStep
                    ? "bg-emerald-500/40"
                    : "bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>

          {isLastStep ? (
            <Button
              size="sm"
              onClick={handleFinish}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Dokončit
              <Sparkles className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleNext}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Další
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>

        {/* CTA Button */}
        <div className="relative px-8 pb-8">
          <Button
            onClick={handleCtaClick}
            variant="outline"
            className="w-full border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
          >
            {step.cta}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
