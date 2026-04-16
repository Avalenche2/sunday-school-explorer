import { Link } from "react-router-dom";
import { ArrowRight, History } from "lucide-react";

const recent = [
  { date: "06 avril", title: "Les miracles de Jésus", participants: 24 },
  { date: "30 mars", title: "Le Sermon sur la montagne", participants: 22 },
  { date: "23 mars", title: "Les apôtres", participants: 27 },
];

export const RecentQuizzes = () => {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-accent">
            <History className="h-4 w-4" strokeWidth={1.5} />
            <span className="text-xs uppercase tracking-[0.2em] font-medium">
              Historique
            </span>
          </div>
          <h2 className="mt-2 font-serif text-2xl font-semibold">
            Les derniers quizz
          </h2>
        </div>
        <Link
          to="/quizz"
          className="hidden sm:flex items-center gap-1 text-sm text-accent hover:text-accent/80 transition-colors"
        >
          Tout voir <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-6 divide-y divide-border/60">
        {recent.map((q, i) => (
          <Link
            key={i}
            to="/quizz"
            className="flex items-center gap-4 py-3 group transition-smooth hover:pl-2"
          >
            <span className="text-xs font-medium text-muted-foreground w-16">
              {q.date}
            </span>
            <span className="flex-1 font-medium group-hover:text-accent transition-colors">
              {q.title}
            </span>
            <span className="text-xs text-muted-foreground">
              {q.participants} juniors
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
};
