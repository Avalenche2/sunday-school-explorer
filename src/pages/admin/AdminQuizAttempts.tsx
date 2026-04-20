import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, ChevronDown, Loader2, Users, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface QuestionRow {
  id: string;
  position: number;
  prompt: string;
  options: string[];
  correct_index: number;
}

interface AttemptRow {
  id: string;
  user_id: string;
  score: number;
  total: number;
  completed_at: string;
}

interface AnswerRow {
  attempt_id: string;
  question_id: string;
  selected_index: number;
  is_correct: boolean;
}

interface ProfileRow {
  id: string;
  first_name: string;
  last_name: string;
}

interface AttemptDetail extends AttemptRow {
  child: ProfileRow | null;
  answers: AnswerRow[];
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

interface Props {
  quizId: string;
}

export const AdminQuizAttempts = ({ quizId }: Props) => {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [attempts, setAttempts] = useState<AttemptDetail[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const { data: qData } = await supabase
        .from("questions")
        .select("id, position, prompt, options, correct_index")
        .eq("quiz_id", quizId)
        .order("position", { ascending: true });

      const qs: QuestionRow[] = (qData ?? []).map((q) => ({
        id: q.id,
        position: q.position,
        prompt: q.prompt,
        options: Array.isArray(q.options) ? (q.options as string[]) : [],
        correct_index: q.correct_index,
      }));
      setQuestions(qs);

      const { data: aData } = await supabase
        .from("quiz_attempts")
        .select("id, user_id, score, total, completed_at")
        .eq("quiz_id", quizId)
        .order("completed_at", { ascending: false });

      const attemptsBase = (aData ?? []) as AttemptRow[];
      if (attemptsBase.length === 0) {
        setAttempts([]);
        setLoading(false);
        return;
      }

      const attemptIds = attemptsBase.map((a) => a.id);
      const userIds = Array.from(new Set(attemptsBase.map((a) => a.user_id)));

      const [{ data: ansData }, { data: profData }] = await Promise.all([
        supabase
          .from("attempt_answers")
          .select("attempt_id, question_id, selected_index, is_correct")
          .in("attempt_id", attemptIds),
        supabase.from("profiles").select("id, first_name, last_name").in("id", userIds),
      ]);

      const profilesMap = new Map<string, ProfileRow>(
        (profData ?? []).map((p) => [p.id, p as ProfileRow])
      );
      const ansByAttempt = new Map<string, AnswerRow[]>();
      (ansData ?? []).forEach((a) => {
        const list = ansByAttempt.get(a.attempt_id) ?? [];
        list.push(a as AnswerRow);
        ansByAttempt.set(a.attempt_id, list);
      });

      setAttempts(
        attemptsBase.map((a) => ({
          ...a,
          child: profilesMap.get(a.user_id) ?? null,
          answers: ansByAttempt.get(a.id) ?? [],
        }))
      );
      setLoading(false);
    };
    load();
  }, [quizId]);

  const stats = useMemo(() => {
    if (attempts.length === 0) return { count: 0, avg: 0, perfect: 0 };
    const sum = attempts.reduce((s, a) => s + (a.total ? a.score / a.total : 0), 0);
    return {
      count: attempts.length,
      avg: Math.round((sum / attempts.length) * 100),
      perfect: attempts.filter((a) => a.total > 0 && a.score === a.total).length,
    };
  }, [attempts]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="font-serif text-xl font-semibold flex items-center gap-2">
          <Users className="h-5 w-5 text-accent" strokeWidth={1.6} />
          Réponses des enfants
        </h3>
        {attempts.length > 0 && (
          <div className="flex gap-2 text-xs">
            <Badge variant="secondary">{stats.count} participation(s)</Badge>
            <Badge variant="secondary">Moyenne {stats.avg}%</Badge>
            <Badge variant="secondary">{stats.perfect} sans-faute</Badge>
          </div>
        )}
      </div>

      {attempts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-6 text-sm text-muted-foreground text-center">
            Aucun enfant n'a encore tenté ce quizz.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {attempts.map((a) => {
            const pct = a.total ? Math.round((a.score / a.total) * 100) : 0;
            const childName = a.child
              ? `${a.child.first_name} ${a.child.last_name}`.trim() || "Anonyme"
              : "Anonyme";
            return (
              <Collapsible key={a.id}>
                <Card className="shadow-soft">
                  <CollapsibleTrigger asChild>
                    <button className="w-full text-left">
                      <CardContent className="p-4 flex items-center gap-3 hover:bg-secondary/30 rounded-lg transition-colors">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-xs font-semibold shrink-0">
                          {childName
                            .split(" ")
                            .map((s) => s[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{childName}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(a.completed_at)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-serif text-lg font-semibold leading-none">
                            {a.score}/{a.total}
                          </p>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                            {pct}%
                          </p>
                        </div>
                        <ChevronDown
                          className="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]>div>&]:rotate-180"
                          strokeWidth={1.6}
                        />
                      </CardContent>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="border-t border-border/60 p-4 space-y-3 bg-secondary/20">
                      {questions.map((q) => {
                        const ans = a.answers.find((x) => x.question_id === q.id);
                        const selected = ans?.selected_index ?? -1;
                        const ok = ans?.is_correct ?? false;
                        return (
                          <div key={q.id} className="space-y-1.5">
                            <p className="text-xs uppercase tracking-wider text-muted-foreground">
                              Question {q.position}
                            </p>
                            <p className="text-sm font-medium">{q.prompt}</p>
                            <div className="grid sm:grid-cols-2 gap-1.5">
                              {q.options.map((opt, i) => {
                                const isCorrect = i === q.correct_index;
                                const isSelected = i === selected;
                                return (
                                  <div
                                    key={i}
                                    className={cn(
                                      "flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs",
                                      isCorrect && "border-accent/60 bg-accent/10",
                                      isSelected && !isCorrect &&
                                        "border-destructive/60 bg-destructive/10",
                                      !isCorrect && !isSelected && "border-border/60"
                                    )}
                                  >
                                    <span className="font-semibold w-4">
                                      {String.fromCharCode(65 + i)}
                                    </span>
                                    <span className="flex-1">{opt}</span>
                                    {isCorrect && (
                                      <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                                    )}
                                    {isSelected && !isCorrect && (
                                      <XCircle className="h-3.5 w-3.5 text-destructive" />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            {!ans && (
                              <p className="text-xs italic text-muted-foreground">
                                Pas de réponse enregistrée.
                              </p>
                            )}
                            <div className="flex items-center gap-1.5 text-xs">
                              {ok ? (
                                <span className="text-accent font-medium">
                                  ✓ Bonne réponse
                                </span>
                              ) : (
                                <span className="text-destructive font-medium">
                                  ✗ Réponse incorrecte
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      )}
    </div>
  );
};

/** Page standalone /admin/quizz/:id/reponses (utilisée si route séparée) */
const AdminQuizAttemptsPage = () => {
  const { id } = useParams<{ id: string }>();
  if (!id) return null;
  return (
    <div className="space-y-6">
      <Link
        to={`/admin/quizz/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Retour à l'éditeur
      </Link>
      <AdminQuizAttempts quizId={id} />
    </div>
  );
};

export default AdminQuizAttemptsPage;
