import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast as sonnerToast } from "sonner";
import { BookOpen, Check, Loader2, Sparkles, Sun, X, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BADGES,
  computeUnlockedBadges,
  longestDailyChallengeStreak,
  type AttemptLite,
  type DailyChallengeAttemptLite,
} from "@/lib/badges";

interface Challenge {
  id: string;
  challenge_date: string;
  prompt: string;
  options: string[];
  correct_index?: number;
  bible_reference: string | null;
}

interface Attempt {
  selected_index: number;
  is_correct: boolean;
}

const todayStr = () => new Date().toISOString().slice(0, 10);

export const DailyChallenge = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [streak, setStreak] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    const today = todayStr();

    // Use the public view (no correct_index) for initial load
    const { data: c } = await supabase
      .from("daily_challenges_public" as any)
      .select("*")
      .eq("challenge_date", today)
      .maybeSingle();

    const raw = c as Record<string, any> | null;
    const ch: Challenge | null = raw
      ? {
          id: raw.id,
          challenge_date: raw.challenge_date,
          prompt: raw.prompt,
          options: Array.isArray(raw.options) ? (raw.options as string[]) : [],
          bible_reference: raw.bible_reference ?? null,
        }
      : null;
    setChallenge(ch);

    if (user && ch) {
      const { data: a } = await supabase
        .from("daily_challenge_attempts")
        .select("selected_index, is_correct")
        .eq("user_id", user.id)
        .eq("challenge_id", ch.id)
        .maybeSingle();
      setAttempt(a as Attempt | null);
    } else {
      setAttempt(null);
    }

    if (user) {
      const { data: history } = await supabase
        .from("daily_challenge_attempts")
        .select("challenge_date, is_correct")
        .eq("user_id", user.id)
        .order("challenge_date", { ascending: false })
        .limit(60);
      setStreak(
        longestDailyChallengeStreak((history ?? []) as DailyChallengeAttemptLite[])
      );
    }

    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleSubmit = async () => {
    if (!user || !challenge || selected === null) return;
    setSubmitting(true);

    // État avant pour détecter nouveaux badges
    const [{ data: priorAttempts }, { data: priorChallenges }] = await Promise.all([
      supabase
        .from("quiz_attempts")
        .select("id, quiz_id, score, total, completed_at")
        .eq("user_id", user.id),
      supabase
        .from("daily_challenge_attempts")
        .select("challenge_date, is_correct")
        .eq("user_id", user.id),
    ]);
    const before = computeUnlockedBadges(
      (priorAttempts ?? []) as AttemptLite[],
      undefined,
      (priorChallenges ?? []) as DailyChallengeAttemptLite[]
    );

    // Submit via server-side function (correct_index never exposed to client)
    const { data: isCorrect, error } = await supabase.rpc("submit_daily_challenge", {
      _challenge_id: challenge.id,
      _selected_index: selected,
    });

    if (error) {
      setSubmitting(false);
      sonnerToast.error("Impossible d'enregistrer ta réponse");
      return;
    }

    const isCorrectBool = !!isCorrect;

    const after = computeUnlockedBadges(
      (priorAttempts ?? []) as AttemptLite[],
      undefined,
      [
        ...((priorChallenges ?? []) as DailyChallengeAttemptLite[]),
        { challenge_date: challenge.challenge_date, is_correct: isCorrectBool },
      ]
    );
    const newlyUnlocked = BADGES.filter((b) => after.has(b.id) && !before.has(b.id));

    setAttempt({ selected_index: selected, is_correct: isCorrectBool });
    setSubmitting(false);

    if (isCorrectBool) {
      sonnerToast.success("Bravo, bonne réponse ! 🌟");
    } else {
      sonnerToast("Pas tout à fait. Reviens demain pour un nouveau défi !");
    }

    newlyUnlocked.forEach((badge, i) => {
      setTimeout(() => {
        const Icon = badge.icon;
        sonnerToast.custom(
          (t) => (
            <div
              className="flex items-center gap-3 rounded-xl border border-accent/40 bg-card p-4 shadow-gold animate-fade-in-up min-w-[280px] cursor-pointer"
              onClick={() => sonnerToast.dismiss(t)}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-gold text-gold-foreground shrink-0">
                <Icon className="h-5 w-5" strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-accent font-semibold">
                  Nouveau badge
                </p>
                <p className="font-medium leading-tight mt-0.5">{badge.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{badge.description}</p>
              </div>
            </div>
          ),
          { duration: 5000 }
        );
      }, 400 + i * 600);
    });

    // Refresh streak
    load();
  };

  if (loading) {
    return (
      <Card className="shadow-soft border-accent/20">
        <CardContent className="p-6 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-accent" />
        </CardContent>
      </Card>
    );
  }

  if (!challenge) return null;

  return (
    <Card className="shadow-soft border-accent/30 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-accent font-semibold flex items-center gap-1.5">
              <Sun className="h-3.5 w-3.5" strokeWidth={2} />
              Défi du jour
            </p>
            <h3 className="mt-2 font-serif text-xl md:text-2xl leading-snug">
              {challenge.prompt}
            </h3>
            {challenge.bible_reference && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <BookOpen className="h-3.5 w-3.5 text-accent" strokeWidth={1.8} />
                {challenge.bible_reference}
              </p>
            )}
          </div>
          {user && streak > 0 && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-semibold shrink-0">
              <Zap className="h-3.5 w-3.5" strokeWidth={2} />
              Série de {streak} jour{streak > 1 ? "s" : ""}
            </div>
          )}
        </div>

        {!user ? (
          <div className="mt-5 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm text-muted-foreground">
              Connecte-toi pour répondre et débloquer des badges.
            </p>
            <Button asChild size="sm">
              <Link to="/connexion">Se connecter</Link>
            </Button>
          </div>
        ) : attempt ? (
          <div className="mt-5 space-y-3">
            {challenge.options.map((opt, idx) => {
              const isCorrect = idx === challenge.correct_index;
              const isPicked = idx === attempt.selected_index;
              return (
                <div
                  key={idx}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl border text-sm",
                    isCorrect
                      ? "border-accent bg-accent/10"
                      : isPicked
                        ? "border-destructive/60 bg-destructive/10"
                        : "border-border bg-card opacity-60"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold shrink-0",
                      isCorrect
                        ? "bg-accent text-accent-foreground"
                        : isPicked
                          ? "bg-destructive text-destructive-foreground"
                          : "bg-secondary text-muted-foreground"
                    )}
                  >
                    {isCorrect ? (
                      <Check className="h-4 w-4" />
                    ) : isPicked ? (
                      <X className="h-4 w-4" />
                    ) : (
                      String.fromCharCode(65 + idx)
                    )}
                  </span>
                  <span className="flex-1">{opt}</span>
                </div>
              );
            })}
            <p className="text-xs text-muted-foreground pt-1 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-accent" strokeWidth={1.8} />
              {attempt.is_correct
                ? "Excellente réponse ! Reviens demain pour prolonger ta série."
                : "Tu trouveras un nouveau défi demain."}
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-2.5">
            {challenge.options.map((opt, idx) => {
              const isSelected = selected === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelected(idx)}
                  className={cn(
                    "w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-sm",
                    "hover:border-accent/60 hover:bg-secondary/40",
                    isSelected
                      ? "border-accent bg-accent/10"
                      : "border-border bg-card"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold shrink-0 transition-colors",
                      isSelected
                        ? "bg-accent text-accent-foreground"
                        : "bg-secondary text-muted-foreground"
                    )}
                  >
                    {isSelected ? <Check className="h-4 w-4" /> : String.fromCharCode(65 + idx)}
                  </span>
                  <span>{opt}</span>
                </button>
              );
            })}
            <div className="flex justify-end pt-2">
              <Button
                onClick={handleSubmit}
                disabled={selected === null || submitting}
                size="sm"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Valider ma réponse
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
