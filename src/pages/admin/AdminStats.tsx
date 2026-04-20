import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, Award, Download, Loader2, Target, TrendingUp, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Attempt {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  total: number;
  completed_at: string;
}

interface Quiz {
  id: string;
  title: string;
}

interface Answer {
  question_id: string;
  is_correct: boolean;
}

interface Question {
  id: string;
  prompt: string;
  quiz_id: string;
}

const startOfWeek = (d: Date) => {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // lundi = 0
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - day);
  return date;
};

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

const fmtWeek = (d: Date) =>
  d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });

const fmtMonth = (d: Date) =>
  d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });

type PeriodKey = "7d" | "30d" | "90d" | "month" | "all";

const periodOptions: { value: PeriodKey; label: string }[] = [
  { value: "7d", label: "7 derniers jours" },
  { value: "30d", label: "30 derniers jours" },
  { value: "90d", label: "90 derniers jours" },
  { value: "month", label: "Mois en cours" },
  { value: "all", label: "Toute la période" },
];

const periodStart = (key: PeriodKey): Date | null => {
  const now = new Date();
  switch (key) {
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 3600 * 1000);
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 3600 * 1000);
    case "90d":
      return new Date(now.getTime() - 90 * 24 * 3600 * 1000);
    case "month":
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case "all":
    default:
      return null;
  }
};

const csvEscape = (val: string) => {
  if (/[",\n;]/.test(val)) return `"${val.replace(/"/g, '""')}"`;
  return val;
};

const AdminStats = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [profiles, setProfiles] = useState<Map<string, string>>(new Map());
  const [exportPeriod, setExportPeriod] = useState<PeriodKey>("30d");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [{ data: a }, { data: q }, { data: ans }, { data: qs }] =
        await Promise.all([
          supabase
            .from("quiz_attempts")
            .select("id, user_id, quiz_id, score, total, completed_at")
            .order("completed_at", { ascending: false })
            .limit(1000),
          supabase.from("quizzes").select("id, title"),
          supabase
            .from("attempt_answers")
            .select("question_id, is_correct")
            .limit(1000),
          supabase.from("questions").select("id, prompt, quiz_id"),
        ]);
      setAttempts((a ?? []) as Attempt[]);
      setQuizzes((q ?? []) as Quiz[]);
      setAnswers((ans ?? []) as Answer[]);
      setQuestions((qs ?? []) as Question[]);
      setLoading(false);
    };
    load();
  }, []);

  /** KPIs */
  const kpis = useMemo(() => {
    const total = attempts.length;
    const ratio =
      attempts.reduce((s, a) => s + (a.total ? a.score / a.total : 0), 0) /
      Math.max(total, 1);
    const weekStart = startOfWeek(new Date());
    const activeIds = new Set(
      attempts
        .filter((a) => new Date(a.completed_at) >= weekStart)
        .map((a) => a.user_id)
    );
    return {
      total,
      successRate: Math.round(ratio * 100),
      avgScore: total
        ? (attempts.reduce((s, a) => s + a.score, 0) / total).toFixed(1)
        : "0",
      activeWeek: activeIds.size,
    };
  }, [attempts]);

  /** Participations / semaine (12 dernières) */
  const weekly = useMemo(() => {
    const buckets = new Map<string, number>();
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = startOfWeek(new Date(now.getTime() - i * 7 * 24 * 3600 * 1000));
      buckets.set(d.toISOString(), 0);
    }
    attempts.forEach((a) => {
      const wk = startOfWeek(new Date(a.completed_at)).toISOString();
      if (buckets.has(wk)) buckets.set(wk, (buckets.get(wk) ?? 0) + 1);
    });
    return Array.from(buckets.entries()).map(([iso, count]) => ({
      label: fmtWeek(new Date(iso)),
      participations: count,
    }));
  }, [attempts]);

  /** Top quizz les plus joués */
  const topQuizzes = useMemo(() => {
    const counts = new Map<string, { count: number; sum: number; total: number }>();
    attempts.forEach((a) => {
      const cur = counts.get(a.quiz_id) ?? { count: 0, sum: 0, total: 0 };
      cur.count += 1;
      cur.sum += a.score;
      cur.total += a.total;
      counts.set(a.quiz_id, cur);
    });
    return Array.from(counts.entries())
      .map(([id, c]) => {
        const title = quizzes.find((q) => q.id === id)?.title ?? "Quizz supprimé";
        return {
          title: title.length > 24 ? title.slice(0, 24) + "…" : title,
          count: c.count,
          avg: c.total ? Math.round((c.sum / c.total) * 100) : 0,
        };
      })
      .sort((x, y) => y.count - x.count)
      .slice(0, 5);
  }, [attempts, quizzes]);

  /** Évolution mensuelle (6 derniers mois) */
  const monthly = useMemo(() => {
    const buckets = new Map<string, number>();
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = startOfMonth(new Date(now.getFullYear(), now.getMonth() - i, 1));
      buckets.set(d.toISOString(), 0);
    }
    attempts.forEach((a) => {
      const m = startOfMonth(new Date(a.completed_at)).toISOString();
      if (buckets.has(m)) buckets.set(m, (buckets.get(m) ?? 0) + 1);
    });
    return Array.from(buckets.entries()).map(([iso, count]) => ({
      label: fmtMonth(new Date(iso)),
      participations: count,
    }));
  }, [attempts]);

  /** Répartition des scores (en %) */
  const scoreDistribution = useMemo(() => {
    const buckets = [
      { label: "0-25%", min: 0, max: 25, count: 0 },
      { label: "26-50%", min: 26, max: 50, count: 0 },
      { label: "51-75%", min: 51, max: 75, count: 0 },
      { label: "76-99%", min: 76, max: 99, count: 0 },
      { label: "100%", min: 100, max: 100, count: 0 },
    ];
    attempts.forEach((a) => {
      if (!a.total) return;
      const pct = Math.round((a.score / a.total) * 100);
      const b = buckets.find((b) => pct >= b.min && pct <= b.max);
      if (b) b.count += 1;
    });
    return buckets;
  }, [attempts]);

  /** Top 5 questions les plus ratées */
  const hardestQuestions = useMemo(() => {
    const counts = new Map<string, { wrong: number; total: number }>();
    answers.forEach((a) => {
      const c = counts.get(a.question_id) ?? { wrong: 0, total: 0 };
      c.total += 1;
      if (!a.is_correct) c.wrong += 1;
      counts.set(a.question_id, c);
    });
    return Array.from(counts.entries())
      .filter(([, c]) => c.total >= 1)
      .map(([id, c]) => {
        const q = questions.find((qq) => qq.id === id);
        const quizTitle = q ? quizzes.find((z) => z.id === q.quiz_id)?.title : "";
        return {
          prompt: q?.prompt ?? "Question supprimée",
          quiz: quizTitle ?? "",
          failRate: Math.round((c.wrong / c.total) * 100),
          attempts: c.total,
        };
      })
      .sort((a, b) => b.failRate - a.failRate)
      .slice(0, 5);
  }, [answers, questions, quizzes]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  const kpiCards = [
    { label: "Participations totales", value: kpis.total, icon: Activity },
    { label: "Taux de réussite global", value: `${kpis.successRate}%`, icon: Target },
    { label: "Score moyen", value: kpis.avgScore, icon: Award },
    { label: "Enfants actifs cette semaine", value: kpis.activeWeek, icon: Users },
  ];

  const tooltipStyle = {
    background: "hsl(var(--background))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 8,
    fontSize: 12,
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpiCards.map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label} className="shadow-soft">
              <CardContent className="p-4">
                <Icon className="h-4 w-4 text-accent mb-2" strokeWidth={1.8} />
                <p className="font-serif text-2xl font-semibold leading-none">
                  {k.value}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1.5">
                  {k.label}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="shadow-soft">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-lg font-semibold">
              Participations par semaine
            </h3>
            <span className="text-xs text-muted-foreground">12 dernières semaines</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekly} margin={{ left: -16, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(var(--secondary))" }} />
                <Bar
                  dataKey="participations"
                  fill="hsl(var(--accent))"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="shadow-soft">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-accent" strokeWidth={1.8} />
                Évolution mensuelle
              </h3>
              <span className="text-xs text-muted-foreground">6 mois</span>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthly} margin={{ left: -16, right: 8, top: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line
                    type="monotone"
                    dataKey="participations"
                    stroke="hsl(var(--accent))"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "hsl(var(--accent))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="p-5">
            <h3 className="font-serif text-lg font-semibold mb-4">
              Répartition des scores
            </h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={scoreDistribution}
                  margin={{ left: -16, right: 8, top: 8, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(var(--secondary))" }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {scoreDistribution.map((_, i) => (
                      <Cell
                        key={i}
                        fill={
                          [
                            "hsl(0 70% 55%)",
                            "hsl(25 80% 55%)",
                            "hsl(45 85% 55%)",
                            "hsl(140 50% 50%)",
                            "hsl(var(--accent))",
                          ][i]
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-soft">
        <CardContent className="p-5">
          <h3 className="font-serif text-lg font-semibold mb-4">
            Top 5 — Quizz les plus joués
          </h3>
          {topQuizzes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune participation pour l'instant.</p>
          ) : (
            <ul className="space-y-2">
              {topQuizzes.map((q, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/40"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/15 text-accent text-xs font-semibold shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{q.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {q.count} participation(s) · moyenne {q.avg}%
                    </p>
                  </div>
                  <div className="w-24 h-2 rounded-full bg-muted overflow-hidden shrink-0">
                    <div
                      className="h-full bg-accent"
                      style={{
                        width: `${(q.count / topQuizzes[0].count) * 100}%`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardContent className="p-5">
          <h3 className="font-serif text-lg font-semibold mb-4">
            Top 5 — Questions les plus ratées
          </h3>
          {hardestQuestions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Pas assez de données.</p>
          ) : (
            <ul className="space-y-2">
              {hardestQuestions.map((q, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-lg bg-secondary/40"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-destructive/15 text-destructive text-xs font-semibold shrink-0">
                    {q.failRate}%
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-2">{q.prompt}</p>
                    <p className="text-xs text-muted-foreground">
                      {q.quiz} · {q.attempts} réponse(s)
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStats;
