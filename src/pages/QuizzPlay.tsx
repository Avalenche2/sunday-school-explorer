import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpen, Check, Loader2 } from "lucide-react";
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
import { BADGES, computeUnlockedBadges, type AttemptLite } from "@/lib/badges";

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
  correct_index: number;
  bible_reference: string | null;
  position: number;
}

const QuizzPlay = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyDone, setAlreadyDone] = useState(false);

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
  const allAnswered = total > 0 && answeredCount === total;

  const select = (qid: string, idx: number) => {
    setAnswers((prev) => ({ ...prev, [qid]: idx }));
  };

  const handleSubmit = async () => {
    if (!user || !id || !allAnswered) return;
    setSubmitting(true);

    const score = questions.reduce(
      (acc, q) => acc + (answers[q.id] === q.correct_index ? 1 : 0),
      0
    );

    const { data: priorAttempts } = await supabase
      .from("quiz_attempts")
      .select("id, quiz_id, score, total, completed_at")
      .eq("user_id", user.id);
    const before = computeUnlockedBadges((priorAttempts ?? []) as AttemptLite[]);

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

    const after = computeUnlockedBadges([
      ...((priorAttempts ?? []) as AttemptLite[]),
      { id: attempt.id, quiz_id: id, score, total, completed_at: attempt.completed_at },
    ]);
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
  };

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

        {/* Progression */}
        <div className="mb-6 space-y-2">
          <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
            <span>Question {current + 1} / {total}</span>
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
              disabled={!allAnswered || submitting}
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
