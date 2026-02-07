import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Users, CreditCard, UserPlus } from "lucide-react";

const CITIES = [
  "Praha", "Brno", "Ostrava", "Plzeň", "Liberec", "Olomouc",
  "České Budějovice", "Hradec Králové", "Pardubice", "Zlín",
  "Jihlava", "Karlovy Vary", "Opava", "Teplice", "Most",
  "Bratislava", "Košice", "Žilina", "Banská Bystrica", "Nitra",
  "Berlin", "Wien", "München", "Hamburg", "Warszawa",
];

const NAMES = [
  "Martin", "Lucie", "Jakub", "Tereza", "David", "Anna",
  "Petr", "Kateřina", "Tomáš", "Eva", "Jan", "Monika",
  "Filip", "Veronika", "Ondřej", "Barbora", "Marek", "Simona",
  "Lukáš", "Nikola", "Daniel", "Petra", "Adam", "Lenka",
];

const TIERS = ["Komunita+", "VIP Insider"];

interface SocialProofNotification {
  id: number;
  type: "signup" | "subscription" | "purchase";
  name: string;
  city: string;
  tier?: string;
  timeAgo: string;
}

function generateFakeEvent(): SocialProofNotification {
  const isSubscription = Math.random() > 0.6;
  return {
    id: Date.now() + Math.random(),
    type: isSubscription ? "subscription" : "signup",
    name: NAMES[Math.floor(Math.random() * NAMES.length)],
    city: CITIES[Math.floor(Math.random() * CITIES.length)],
    tier: isSubscription ? TIERS[Math.floor(Math.random() * TIERS.length)] : undefined,
    timeAgo: `${Math.floor(Math.random() * 15) + 1} min`,
  };
}

export function SocialProofWidget() {
  const { user } = useAuth();
  const [currentNotification, setCurrentNotification] = useState<SocialProofNotification | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Fetch real events for initial data
  const { data: realEvents } = trpc.socialProof.getRecent.useQuery(undefined, {
    refetchInterval: 60000,
  });

  const showNotification = useCallback(() => {
    if (dismissed) return;
    
    // Mix real and generated events
    let event: SocialProofNotification;
    if (realEvents && realEvents.length > 0 && Math.random() > 0.5) {
      const real = realEvents[Math.floor(Math.random() * realEvents.length)];
      event = {
        id: real.id,
        type: real.eventType as "signup" | "subscription",
        name: real.displayName,
        city: real.location || CITIES[Math.floor(Math.random() * CITIES.length)],
        tier: real.tierName || undefined,
        timeAgo: `${Math.floor(Math.random() * 30) + 1} min`,
      };
    } else {
      event = generateFakeEvent();
    }

    setCurrentNotification(event);
    setIsVisible(true);

    // Hide after 6 seconds
    setTimeout(() => {
      setIsVisible(false);
    }, 6000);
  }, [realEvents, dismissed]);

  useEffect(() => {
    // Don't show to logged-in users
    if (user) return;
    if (dismissed) return;

    // First notification after 8 seconds
    const initialTimeout = setTimeout(() => {
      showNotification();
    }, 8000);

    // Then every 20-40 seconds
    const interval = setInterval(() => {
      showNotification();
    }, 20000 + Math.random() * 20000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [user, showNotification, dismissed]);

  if (user || dismissed || !currentNotification) return null;

  const Icon = currentNotification.type === "subscription" ? CreditCard : 
               currentNotification.type === "signup" ? UserPlus : Users;

  return (
    <div
      className={`fixed bottom-4 left-4 z-50 max-w-sm transition-all duration-500 ease-out ${
        isVisible
          ? "translate-x-0 opacity-100"
          : "-translate-x-full opacity-0"
      }`}
    >
      <div className="relative bg-card/95 backdrop-blur-md border border-border/50 rounded-xl p-4 shadow-2xl shadow-emerald-500/10">
        {/* Close button */}
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 text-muted-foreground/50 hover:text-muted-foreground text-xs"
        >
          ✕
        </button>

        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            currentNotification.type === "subscription"
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-teal-500/20 text-teal-400"
          }`}>
            <Icon className="w-5 h-5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              <span className="text-emerald-400">{currentNotification.name}</span>
              {" z "}
              <span className="text-muted-foreground">{currentNotification.city}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {currentNotification.type === "subscription" ? (
                <>se připojil/a k <span className="text-emerald-400 font-medium">{currentNotification.tier}</span></>
              ) : (
                <>se právě zaregistroval/a</>
              )}
              {" · "}
              <span className="text-muted-foreground/70">před {currentNotification.timeAgo}</span>
            </p>
          </div>
        </div>

        {/* Subtle progress bar */}
        {isVisible && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-border/30 rounded-b-xl overflow-hidden">
            <div
              className="h-full bg-emerald-500/50 rounded-b-xl"
              style={{
                animation: "shrink 6s linear forwards",
              }}
            />
          </div>
        )}
      </div>

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
