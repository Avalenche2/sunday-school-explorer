import { useCallback, useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpen, Check, Loader2, Timer } from "lucide-react";
import { toast as sonnerToast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { BADGES, computeUnlockedBadges, type AttemptLite, type DailyChallengeAttemptLite } from "@/lib/badges";

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  bible_reference: string | null;
}

interface Question {
  id: string;
  prompt: string;
  options: string[];
  bible_reference: string | null;
  position: number;
}

const QuizzPlay = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const QUESTION_DURATION = 40; // secondes par question

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUESTION_DURATION);
  const submittedRef = useRef(false);
  const warningTriggeredRef = useRef(false);

  // Son discret + vibration quand le timer passe sous 5s
  useEffect(() => {
    if (timeLeft === 5 && !warningTriggeredRef.current) {
      warningTriggeredRef.current = true;
      // Vibration sur mobile (si supportée)
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
      // Petit bip discret avec Web Audio API
      try {
        const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContext) {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = 880; // La4, note aiguë discrète
          gain.gain.value = 0.05; // Volume très bas
          osc.start();
          osc.stop(ctx.currentTime + 0.08); // 80ms max
        }
      } catch {
        // Silencieux si Web Audio non supporté
      }
    }
  }, [timeLeft]);

  // Reset du warning quand on change de question
  useEffect(() => {
    warningTriggeredRef.current = false;
  }, [current]);

  useEffect(() => {
    if (!id || !user) return;
    const load = async () => {
      setLoading(true);

      // déjà fait ?
      const { data: existing } = await supabase
        .from("quiz_attempts")
        .select("id")
        .eq("user_id", user.id)
        .eq("quiz_id", id)
        .maybeSingle();

      if (existing) {
        setAlreadyDone(true);
        setLoading(false);
        return;
      }

      const [{ data: q }, { data: qs }] = await Promise.all([
        supabase.from("quizzes").select("id, title, description, bible_reference").eq("id", id).maybeSingle(),
        supabase.from("questions").select("*").eq("quiz_id", id).order("position", { ascending: true }),
      ]);

      setQuiz(q as Quiz | null);
      setQuestions(
        (qs ?? []).map((row) => ({
          ...row,
          options: Array.isArray(row.options) ? (row.options as string[]) : [],
        })) as Question[]
      );
      setLoading(false);
    };
    load();
  }, [id, user]);

  const currentQ = questions[current];
  const total = questions.length;
  const answeredCount = Object.keys(answers).length;
  const progress = total > 0 ? ((current + 1) / total) * 100 : 0;

  const select = (qid: string, idx: number) => {
    setAnswers((prev) => ({ ...prev, [qid]: idx }));
  };

  const handleSubmit = useCallback(async () => {
    if (!user || !id) return;
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);

    const score = questions.reduce(
      (acc, q) => acc + (answers[q.id] === q.correct_index ? 1 : 0),
      0
    );

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
    const challengeLite = (priorChallenges ?? []) as DailyChallengeAttemptLite[];
    const before = computeUnlockedBadges(
      (priorAttempts ?? []) as AttemptLite[],
      undefined,
      challengeLite
    );

    const { data: attempt, error: attemptErr } = await supabase
      .from("quiz_attempts")
      .insert({ user_id: user.id, quiz_id: id, score, total })
      .select("id, completed_at")
      .single();

    if (attemptErr || !attempt) {
      setSubmitting(false);
      toast({
        title: "Oups",
        description: "Impossible d'enregistrer ton quizz. Réessaye.",
        variant: "destructive",
      });
      return;
    }

    const rows = questions.map((q) => ({
      attempt_id: attempt.id,
      question_id: q.id,
      selected_index: answers[q.id],
      is_correct: answers[q.id] === q.correct_index,
    }));
    await supabase.from("attempt_answers").insert(rows);

    const after = computeUnlockedBadges(
      [
        ...((priorAttempts ?? []) as AttemptLite[]),
        { id: attempt.id, quiz_id: id, score, total, completed_at: attempt.completed_at },
      ],
      undefined,
      challengeLite
    );
    const newlyUnlocked = BADGES.filter((b) => after.has(b.id) && !before.has(b.id));

    setSubmitting(false);
    toast({ title: "Bravo !", description: `Score : ${score} / ${total}` });

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

    navigate(`/quizz/${id}/recap`, { replace: true });
  }, [user, id, questions, answers, navigate, toast]);

  // Reset du chronomètre à chaque changement de question
  useEffect(() => {
    setTimeLeft(QUESTION_DURATION);
  }, [current, QUESTION_DURATION]);

  // Décompte 1s par 1s
  useEffect(() => {
    if (loading || alreadyDone || submittedRef.current || total === 0) return;
    if (timeLeft <= 0) return;
    const id = window.setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => window.clearTimeout(id);
  }, [timeLeft, loading, alreadyDone, total]);

  // Au passage à 0 → question suivante (ou soumission auto sur la dernière)
  useEffect(() => {
    if (timeLeft !== 0) return;
    if (loading || alreadyDone || submittedRef.current) return;
    if (current < total - 1) {
      setCurrent((c) => Math.min(total - 1, c + 1));
    } else {
      handleSubmit();
    }
  }, [timeLeft, current, total, loading, alreadyDone, handleSubmit]);

  if (!authLoading && !user) return <Navigate to="/connexion" replace />;

  if (loading || authLoading) {
    return (
      <PageShell>
        <div className="flex justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
        </div>
      </PageShell>
    );
  }

  if (alreadyDone) {
    return (
      <PageShell>
        <div className="container py-16 max-w-xl">
          <Card className="border-border/60 shadow-soft">
            <CardContent className="p-10 text-center">
              <Check className="h-10 w-10 mx-auto text-accent mb-3" strokeWidth={1.5} />
              <h2 className="font-serif text-2xl">Tu as déjà fait ce quizz</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Tu peux consulter ton récapitulatif.
              </p>
              <div className="mt-6 flex gap-2 justify-center">
                <Button asChild variant="ghost">
                  <Link to="/quizz">Retour aux quizz</Link>
                </Button>
                <Button asChild>
                  <Link to={`/quizz/${id}/recap`}>Voir le récapitulatif</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageShell>
    );
  }

  if (!quiz || !currentQ) {
    return (
      <PageShell>
        <div className="container py-16 text-center text-muted-foreground">
          Ce quizz n'existe pas ou n'est plus disponible.
          <div className="mt-4">
            <Button asChild variant="ghost">
              <Link to="/quizz"><ArrowLeft className="h-4 w-4" /> Retour</Link>
            </Button>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <section className="container py-8 md:py-12 max-w-3xl">
        <Link
          to="/quizz"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Tous les quizz
        </Link>

        {/* En-tête */}
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-accent font-medium">
            Quizz du jour
          </p>
          <h1 className="mt-2 font-serif text-3xl md:text-4xl font-semibold leading-tight">
            {quiz.title}
          </h1>
          {quiz.bible_reference && (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
              <BookOpen className="h-4 w-4 text-accent" strokeWidth={1.5} />
              {quiz.bible_reference}
            </p>
          )}
        </div>

        {/* Progression + chronomètre */}
        <div className="mb-6 space-y-2">
          <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-wider text-muted-foreground">
            <span>Question {current + 1} / {total}</span>
            <div
              className={cn(
                "flex items-center gap-1.5 font-mono tabular-nums px-2.5 py-1 rounded-full border transition-colors",
                timeLeft <= 10
                  ? "border-destructive/50 bg-destructive/10 text-destructive animate-pulse"
                  : timeLeft <= 20
                    ? "border-accent/40 bg-accent/10 text-accent"
                    : "border-border bg-card"
              )}
              aria-live="polite"
              aria-label={`Temps restant : ${timeLeft} secondes`}
            >
              <Timer className="h-3.5 w-3.5" strokeWidth={1.8} />
              {String(timeLeft).padStart(2, "0")}s
            </div>
            <span>{answeredCount} / {total} répondues</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        {/* Question */}
        <Card key={currentQ.id} className="border-border/60 shadow-soft animate-fade-in">
          <CardContent className="p-6 md:p-8">
            <h2 className="font-serif text-xl md:text-2xl leading-snug">
              {currentQ.prompt}
            </h2>
            {currentQ.bible_reference && (
              <p className="mt-1 text-xs text-accent font-medium tracking-wide">
                {currentQ.bible_reference}
              </p>
            )}

            <div className="mt-6 space-y-3">
              {currentQ.options.map((opt, idx) => {
                const selected = answers[currentQ.id] === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => select(currentQ.id, idx)}
                    className={cn(
                      "w-full text-left flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all",
                      "hover:border-accent/60 hover:bg-secondary/40",
                      selected
                        ? "border-accent bg-accent/10 shadow-soft"
                        : "border-border bg-card"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold shrink-0 transition-colors",
                        selected
                          ? "bg-accent text-accent-foreground"
                          : "bg-secondary text-muted-foreground"
                      )}
                    >
                      {selected ? <Check className="h-4 w-4" /> : String.fromCharCode(65 + idx)}
                    </span>
                    <span className="text-sm md:text-base">{opt}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            disabled={current === 0}
          >
            <ArrowLeft className="h-4 w-4" /> Précédent
          </Button>

          {current < total - 1 ? (
            <Button onClick={() => setCurrent((c) => Math.min(total - 1, c + 1))}>
              Suivant <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Terminer le quizz
            </Button>
          )}
        </div>

        {/* Mini-navigation par numéros */}
        <div className="mt-8 flex flex-wrap gap-2 justify-center">
          {questions.map((q, i) => {
            const answered = answers[q.id] !== undefined;
            return (
              <button
                key={q.id}
                onClick={() => setCurrent(i)}
                className={cn(
                  "h-8 w-8 rounded-full text-xs font-medium transition-all border",
                  i === current
                    ? "bg-primary text-primary-foreground border-primary"
                    : answered
                      ? "bg-accent/15 text-accent border-accent/30"
                      : "bg-card text-muted-foreground border-border hover:border-accent/40"
                )}
                aria-label={`Question ${i + 1}`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </section>
    </PageShell>
  );
};

const PageShell = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex flex-col bg-background">
    <Header />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
);

export default QuizzPlay;
