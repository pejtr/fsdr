/**
 * FEMSIDER Revenue Engine — ROI 888%+ Frontend Components
 * CountdownTimer | UpsellPopup | FlashSaleBanner | AffiliatePrizes
 */
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { X, Zap, Crown, Clock, TrendingUp, Trophy, Gift, Loader2, ArrowRight } from "lucide-react";

// ─── Countdown Timer ──────────────────────────────────────────────────────────

interface CountdownTimerProps {
  targetDate: Date;
  label?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function CountdownTimer({ targetDate, label, className = "", size = "md" }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const calc = () => {
      const diff = targetDate.getTime() - Date.now();
      if (diff <= 0) { setExpired(true); return; }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  if (expired) return null;

  const boxClass = size === "lg"
    ? "bg-black/40 border border-white/10 rounded-lg px-4 py-3 min-w-[64px] text-center"
    : size === "sm"
    ? "bg-black/40 border border-white/10 rounded px-2 py-1 min-w-[40px] text-center"
    : "bg-black/40 border border-white/10 rounded-lg px-3 py-2 min-w-[52px] text-center";

  const numClass = size === "lg" ? "text-3xl font-black text-white tabular-nums" :
    size === "sm" ? "text-lg font-bold text-white tabular-nums" :
    "text-2xl font-black text-white tabular-nums";

  const lblClass = size === "sm" ? "text-[9px] text-gray-400 uppercase tracking-wider" :
    "text-[10px] text-gray-400 uppercase tracking-wider";

  const units = timeLeft.days > 0
    ? [["days", timeLeft.days], ["hours", timeLeft.hours], ["min", timeLeft.minutes], ["sec", timeLeft.seconds]]
    : [["hours", timeLeft.hours], ["min", timeLeft.minutes], ["sec", timeLeft.seconds]];

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      {label && <p className="text-xs text-gray-400 uppercase tracking-widest">{label}</p>}
      <div className="flex items-center gap-2">
        {(units as [string, number][]).map(([unit, val], i) => (
          <div key={unit} className="flex items-center gap-2">
            <div className={boxClass}>
              <div className={numClass}>{String(val).padStart(2, "0")}</div>
              <div className={lblClass}>{unit}</div>
            </div>
            {i < units.length - 1 && (
              <span className="text-purple-400 font-black text-xl pb-3">:</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── End-of-Month Countdown (for pricing urgency) ─────────────────────────────

export function EndOfMonthCountdown({ className = "" }: { className?: string }) {
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0);
  return (
    <CountdownTimer
      targetDate={endOfMonth}
      label="Nabídka vyprší za"
      className={className}
      size="md"
    />
  );
}

// ─── Flash Sale Banner ────────────────────────────────────────────────────────

export function FlashSaleBanner() {
  const { data: sale } = trpc.revenue.getFlashSale.useQuery();
  const [dismissed, setDismissed] = useState(false);

  if (!sale || dismissed) return null;

  const endsAt = new Date(sale.endsAt);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white py-2 px-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Zap className="w-4 h-4 flex-shrink-0 animate-pulse" />
          <span className="font-bold text-sm truncate">
            ⚡ FLASH SALE: {sale.name} — {sale.discountPercent}% SLEVA
            {sale.stripePromoCode && (
              <span className="ml-2 bg-white/20 px-2 py-0.5 rounded text-xs font-mono">
                {sale.stripePromoCode}
              </span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <CountdownTimer targetDate={endsAt} size="sm" />
          <button onClick={() => setDismissed(true)} className="text-white/70 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Upsell Popup ─────────────────────────────────────────────────────────────

export function UpsellPopup() {
  const { isAuthenticated } = useAuth();
  const { data: offer } = trpc.revenue.getUpsellOffer.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
    staleTime: 60000,
  });
  const acceptMutation = trpc.revenue.acceptUpsellOffer.useMutation();
  const [dismissed, setDismissed] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (offer && !dismissed) {
      // Show after 3 seconds
      const t = setTimeout(() => setShown(true), 3000);
      return () => clearTimeout(t);
    }
  }, [offer, dismissed]);

  const handleAccept = useCallback(async () => {
    if (!offer) return;
    try {
      const { checkoutUrl } = await acceptMutation.mutateAsync({ offerId: offer.id });
      toast.success("Přesměrování na platbu...", { description: "Otevíráme Stripe checkout." });
      if (checkoutUrl) window.open(checkoutUrl, "_blank");
      setDismissed(true);
    } catch {
      toast.error("Chyba", { description: "Nepodařilo se zpracovat nabídku." });
    }
  }, [offer, acceptMutation]);

  if (!offer || dismissed || !shown) return null;

  const expiresAt = new Date(offer.expiresAt);
  const originalPrice = 9.99;
  const discountedPrice = (originalPrice * (1 - offer.discountPercent / 100)).toFixed(2);
  const savings = (originalPrice - parseFloat(discountedPrice)).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="group relative max-w-md w-full overflow-hidden bg-gradient-to-b from-[#1a0a2e] to-[#0d0d1a] border border-purple-500/30 rounded-2xl p-6 shadow-2xl shadow-purple-500/20 transition-all duration-300 hover:-translate-y-1 hover:border-purple-400/70 hover:shadow-purple-500/40">
        <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-purple-500/20 blur-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-40 w-40 rounded-full bg-fuchsia-500/10 blur-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        {/* Close button */}
        <button
          onClick={() => setDismissed(true)}
          aria-label="Zavřít nabídku"
          className="absolute top-4 right-4 z-10 text-gray-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 transition-all duration-200 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 hover:rotate-90"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-purple-500/20 border border-purple-500/30 rounded-full px-4 py-1.5 mb-4">
            <Zap className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-purple-300 text-xs font-bold uppercase tracking-wider">Exkluzivní nabídka</span>
          </div>
          <Crown className="relative w-12 h-12 text-yellow-400 mx-auto mb-3 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6" />
          <h2 className="text-2xl font-black text-white mb-2">Upgrade na VIP Insider</h2>
          <p className="text-gray-400 text-sm">Speciální nabídka jen pro tebe — platí 48 hodin</p>
        </div>

        {/* Price comparison */}
        <div className="relative bg-white/5 border border-white/10 rounded-xl p-4 mb-4 transition-colors duration-200 hover:bg-white/[0.08] hover:border-white/20">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">Normální cena</span>
            <span className="text-gray-500 line-through text-lg">${originalPrice}/měs</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-white font-bold">Tvoje cena dnes</span>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                UŠETŘÍŠ ${savings}
              </Badge>
            </div>
            <span className="text-purple-400 text-2xl font-black">${discountedPrice}/měs</span>
          </div>
        </div>

        {/* Features */}
        <ul className="space-y-2 mb-5">
          {["4K video kvalita", "Vlastní požadavky na obsah", "Přímý kontakt s tvůrci", "Behind-the-scenes přístup", "AI Video Studio (neomezeno)", "Affiliate bonus 30%"].map(f => (
            <li key={f} className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-gray-300 transition-colors duration-200 hover:bg-white/5 hover:text-white">
              <span className="text-green-400 text-base transition-transform duration-200 group-hover:scale-110">✓</span> {f}
            </li>
          ))}
        </ul>

        {/* Countdown */}
        <div className="mb-5">
          <CountdownTimer targetDate={expiresAt} label="Nabídka vyprší za" size="sm" className="items-center" />
        </div>

        {/* CTA */}
        <Button
          onClick={handleAccept}
          disabled={acceptMutation.isPending}
          aria-busy={acceptMutation.isPending}
          className="group/cta relative w-full overflow-hidden bg-gradient-to-r from-purple-600 via-fuchsia-600 to-violet-600 hover:from-purple-500 hover:via-fuchsia-500 hover:to-violet-500 focus-visible:ring-2 focus-visible:ring-purple-200 text-white font-black py-3 text-base rounded-xl shadow-lg shadow-purple-500/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-purple-500/50 active:translate-y-0"
        >
          <span className="pointer-events-none absolute inset-0 -translate-x-full bg-white/15 transition-transform duration-500 group-hover/cta:translate-x-full" />
          <span className="relative flex items-center justify-center gap-2">
            {acceptMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Zpracovávám…</> : <>Odemknout VIP za ${discountedPrice}/měsíc <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/cta:translate-x-1" /></>}
          </span>
        </Button>
        <p className="text-center text-xs text-gray-500 mt-3 transition-colors duration-200 group-hover:text-gray-300">Zrušení kdykoliv. Bez závazků.</p>
      </div>
    </div>
  );
}

// ─── Affiliate Cash Prizes Leaderboard ───────────────────────────────────────

const PRIZES = [
  { rank: 1, label: "🥇 1. místo", prize: "$500", color: "from-yellow-500/20 to-yellow-600/10", border: "border-yellow-500/30", text: "text-yellow-400" },
  { rank: 2, label: "🥈 2. místo", prize: "$250", color: "from-gray-400/20 to-gray-500/10", border: "border-gray-400/30", text: "text-gray-300" },
  { rank: 3, label: "🥉 3. místo", prize: "$100", color: "from-orange-600/20 to-orange-700/10", border: "border-orange-600/30", text: "text-orange-400" },
];

export function AffiliatePrizesWidget({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-gradient-to-b from-[#0d0820] to-[#0a0a1a] border border-purple-500/20 rounded-2xl p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-5">
        <Trophy className="w-6 h-6 text-yellow-400" />
        <div>
          <h3 className="text-white font-bold text-lg">Měsíční Cash Prizes</h3>
          <p className="text-gray-400 text-sm">Top 3 affiliate partneři vyhrávají každý měsíc</p>
        </div>
      </div>

      <div className="space-y-3 mb-5">
        {PRIZES.map(({ rank, label, prize, color, border, text }) => (
          <div key={rank} className={`bg-gradient-to-r ${color} border ${border} rounded-xl p-4 flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{label.split(" ")[0]}</span>
              <div>
                <p className={`font-bold ${text}`}>{label.split(" ").slice(1).join(" ")}</p>
                <p className="text-gray-400 text-xs">Nejvíce konverzí</p>
              </div>
            </div>
            <span className={`text-2xl font-black ${text}`}>{prize}</span>
          </div>
        ))}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-green-400" />
          <span className="text-white font-semibold text-sm">Tvůj výdělek z referrals</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <p className="text-2xl font-black text-green-400">30%</p>
            <p className="text-gray-400 text-xs">Komise VIP</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-blue-400">15%</p>
            <p className="text-gray-400 text-xs">2. úroveň</p>
          </div>
        </div>
      </div>

      <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Gift className="w-4 h-4 text-purple-400" />
          <span className="text-purple-300 font-semibold text-sm">Viral Referral Bonus</span>
        </div>
        <p className="text-gray-400 text-xs leading-relaxed">
          Pozvi 3 přátele → získej <strong className="text-white">1 měsíc zdarma</strong>. Pozvi 10 přátel → získej <strong className="text-white">VIP na 3 měsíce</strong>.
        </p>
      </div>
    </div>
  );
}

// ─── Instant Earnings Calculator ─────────────────────────────────────────────

export function EarningsCalculator({ className = "" }: { className?: string }) {
  const [referrals, setReferrals] = useState(10);
  const vipPrice = 9.99;
  const commissionRate = 0.30;
  const monthlyEarnings = referrals * vipPrice * commissionRate;
  const yearlyEarnings = monthlyEarnings * 12;

  return (
    <div className={`bg-gradient-to-b from-[#0a1a0a] to-[#0a0a1a] border border-green-500/20 rounded-2xl p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-5">
        <TrendingUp className="w-6 h-6 text-green-400" />
        <div>
          <h3 className="text-white font-bold text-lg">Kalkulátor výdělků</h3>
          <p className="text-gray-400 text-sm">Kolik můžeš vydělat?</p>
        </div>
      </div>

      <div className="mb-5">
        <label className="text-gray-400 text-sm mb-2 block">
          Počet aktivních referrals: <strong className="text-white">{referrals}</strong>
        </label>
        <input
          type="range"
          min={1}
          max={100}
          value={referrals}
          onChange={e => setReferrals(Number(e.target.value))}
          className="w-full accent-green-500"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>1</span><span>25</span><span>50</span><span>75</span><span>100</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
          <p className="text-gray-400 text-xs mb-1">Měsíčně</p>
          <p className="text-3xl font-black text-green-400">${monthlyEarnings.toFixed(0)}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
          <p className="text-gray-400 text-xs mb-1">Ročně</p>
          <p className="text-3xl font-black text-green-400">${yearlyEarnings.toFixed(0)}</p>
        </div>
      </div>

      <p className="text-gray-500 text-xs text-center mt-3">
        Výpočet: {referrals} referrals × $9.99 × 30% komise
      </p>
    </div>
  );
}
