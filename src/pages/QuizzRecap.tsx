import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen, Check, Loader2, Sparkles, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuizRecap {
  id: string;
  title: string;
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

interface AnswerRow {
  question_id: string;
  selected_index: number;
  is_correct: boolean;
}

const QuizzRecap = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const [quiz, setQuiz] = useState<QuizRecap | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, AnswerRow>>({});
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!id || !user) return;
    const load = async () => {
      setLoading(true);

      const { data: attempt } = await supabase
        .from("quiz_attempts")
        .select("id, score, total")
        .eq("user_id", user.id)
        .eq("quiz_id", id)
        .maybeSingle();

      if (!attempt) {
        setMissing(true);
        setLoading(false);
        return;
      }

      setScore(attempt.score);
      setTotal(attempt.total);

      const [{ data: q }, { data: qs }, { data: ans }] = await Promise.all([
        supabase.from("quizzes").select("id, title, bible_reference").eq("id", id).maybeSingle(),
        supabase.from("questions").select("*").eq("quiz_id", id).order("position", { ascending: true }),
        supabase.from("attempt_answers").select("question_id, selected_index, is_correct").eq("attempt_id", attempt.id),
      ]);

      setQuiz(q as QuizRecap | null);
      setQuestions(
        (qs ?? []).map((row) => ({
          ...row,
          options: Array.isArray(row.options) ? (row.options as string[]) : [],
        })) as Question[]
      );
      const map: Record<string, AnswerRow> = {};
      (ans ?? []).forEach((a) => (map[a.question_id] = a));
      setAnswers(map);
      setLoading(false);
    };
    load();
  }, [id, user]);

  if (!authLoading && !user) return <Navigate to="/connexion" replace />;

  const percent = total > 0 ? Math.round((score / total) * 100) : 0;
  const tone =
    percent >= 80 ? "Excellent ! 🌟" : percent >= 50 ? "Beau travail !" : "Continue, tu progresses !";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {loading || authLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
          </div>
        ) : missing ? (
          <div className="container py-16 max-w-xl text-center">
            <p className="text-muted-foreground">Tu n'as pas encore terminé ce quizz.</p>
            <div className="mt-4 flex gap-2 justify-center">
              <Button asChild variant="ghost">
                <Link to="/quizz"><ArrowLeft className="h-4 w-4" /> Retour</Link>
              </Button>
              <Button asChild>
                <Link to={`/quizz/${id}`}>Faire le quizz</Link>
              </Button>
            </div>
          </div>
        ) : (
          <section className="container py-8 md:py-12 max-w-3xl">
            <Link
              to="/quizz"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="h-4 w-4" /> Tous les quizz
            </Link>

            {/* Score héro */}
            <Card className="border-border/60 shadow-elevated overflow-hidden">
              <div className="bg-gradient-night text-primary-foreground p-8 md:p-10 text-center relative">
                <div className="absolute inset-0 opacity-[0.08]" style={{
                  backgroundImage: 'radial-gradient(circle at 50% 30%, hsl(var(--gold)) 0%, transparent 60%)'
                }} />
                <div className="relative">
                  <p className="text-xs uppercase tracking-[0.3em] text-gold/80 font-medium">
                    Récapitulatif
                  </p>
                  <h1 className="mt-2 font-serif text-2xl md:text-3xl">
                    {quiz?.title}
                  </h1>
                  {quiz?.bible_reference && (
                    <p className="mt-1 text-sm text-gold-soft flex items-center justify-center gap-1.5">
                      <BookOpen className="h-4 w-4" strokeWidth={1.5} /> {quiz.bible_reference}
                    </p>
                  )}

                  <div className="mt-6 flex items-center justify-center gap-3">
                    <Sparkles className="h-5 w-5 text-gold" />
                    <span className="font-serif text-5xl md:text-6xl font-semibold text-gold">
                      {score}
                    </span>
                    <span className="font-serif text-2xl text-primary-foreground/60">/ {total}</span>
                  </div>
                  <p className="mt-2 text-sm text-gold-soft">{tone} ({percent}%)</p>
                </div>
              </div>
            </Card>

            {/* Détail */}
            <h2 className="mt-10 mb-4 font-serif text-2xl">Détail des réponses</h2>
            <div className="space-y-4">
              {questions.map((q, i) => {
                const ans = answers[q.id];
                const correct = ans?.is_correct ?? false;
                return (
                  <Card
                    key={q.id}
                    className={cn(
                      "border-border/60 shadow-soft",
                      correct ? "border-l-4 border-l-accent" : "border-l-4 border-l-destructive/70"
                    )}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <p className="text-xs uppercase tracking-wider text-muted-foreground">
                            Question {i + 1}
                          </p>
                          <h3 className="mt-1 font-serif text-lg leading-snug">{q.prompt}</h3>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full",
                            correct
                              ? "bg-accent/15 text-accent"
                              : "bg-destructive/10 text-destructive"
                          )}
                        >
                          {correct ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                          {correct ? "Correct" : "Incorrect"}
                        </span>
                      </div>

                      <ul className="space-y-2 mt-4">
                        {q.options.map((opt, idx) => {
                          const isCorrect = idx === q.correct_index;
                          const isChosen = ans?.selected_index === idx;
                          return (
                            <li
                              key={idx}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm border",
                                isCorrect
                                  ? "border-accent/40 bg-accent/10"
                                  : isChosen
                                    ? "border-destructive/30 bg-destructive/5"
                                    : "border-border bg-card"
                              )}
                            >
                              <span
                                className={cn(
                                  "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold shrink-0",
                                  isCorrect
                                    ? "bg-accent text-accent-foreground"
                                    : isChosen
                                      ? "bg-destructive text-destructive-foreground"
                                      : "bg-secondary text-muted-foreground"
                                )}
                              >
                                {String.fromCharCode(65 + idx)}
                              </span>
                              <span className="flex-1">{opt}</span>
                              {isCorrect && (
                                <span className="text-[11px] text-accent font-medium">Bonne réponse</span>
                              )}
                              {isChosen && !isCorrect && (
                                <span className="text-[11px] text-destructive font-medium">Ta réponse</span>
                              )}
                            </li>
                          );
                        })}
                      </ul>

                      {q.bible_reference && (
                        <p className="mt-4 flex items-center gap-1.5 text-xs text-accent font-medium tracking-wide pt-3 border-t border-border/60">
                          <BookOpen className="h-3.5 w-3.5" strokeWidth={1.5} /> {q.bible_reference}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="mt-10 flex justify-center gap-3">
              <Button asChild variant="ghost">
                <Link to="/quizz"><ArrowLeft className="h-4 w-4" /> Retour au calendrier</Link>
              </Button>
              <Button asChild>
                <Link to="/classement">Voir le classement</Link>
              </Button>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default QuizzRecap;
