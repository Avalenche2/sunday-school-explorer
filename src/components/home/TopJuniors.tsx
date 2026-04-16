import { Trophy } from "lucide-react";

const juniors = [
  { rank: 1, name: "Marie K.", points: 480 },
  { rank: 2, name: "David N.", points: 445 },
  { rank: 3, name: "Esther M.", points: 410 },
  { rank: 4, name: "Samuel B.", points: 385 },
  { rank: 5, name: "Ruth A.", points: 360 },
];

const rankColors: Record<number, string> = {
  1: "bg-gradient-gold text-primary shadow-gold",
  2: "bg-secondary text-secondary-foreground",
  3: "bg-accent/30 text-accent-foreground",
};

export const TopJuniors = () => {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-soft">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-accent">
            <Trophy className="h-4 w-4" strokeWidth={1.5} />
            <span className="text-xs uppercase tracking-[0.2em] font-medium">
              Top juniors
            </span>
          </div>
          <h2 className="mt-2 font-serif text-2xl font-semibold">
            Les meilleurs du mois
          </h2>
        </div>
      </div>

      <ul className="mt-6 space-y-2">
        {juniors.map((j) => (
          <li
            key={j.rank}
            className="flex items-center gap-4 rounded-xl border border-border/60 bg-background/40 p-3 transition-smooth hover:border-accent/40 hover:bg-secondary/40"
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                rankColors[j.rank] ?? "bg-muted text-muted-foreground"
              }`}
            >
              {j.rank}
            </span>
            <span className="flex-1 font-medium">{j.name}</span>
            <span className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{j.points}</span> pts
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
};
