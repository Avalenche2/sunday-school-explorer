import { CalendarClock, MapPin } from "lucide-react";

const schedules = [
  { day: "Dimanche", time: "9h00 — 10h30", group: "Tous les enfants", location: "Salle principale" },
  { day: "Mercredi", time: "16h00 — 17h00", group: "Étude biblique juniors", location: "Salle 2" },
];

export const Schedules = () => {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-soft">
      <div className="flex items-center gap-2 text-accent">
        <CalendarClock className="h-4 w-4" strokeWidth={1.5} />
        <span className="text-xs uppercase tracking-[0.2em] font-medium">
          Horaires
        </span>
      </div>
      <h2 className="mt-2 font-serif text-2xl font-semibold">
        Nos rendez-vous
      </h2>

      <div className="mt-6 space-y-3">
        {schedules.map((s, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/60 bg-background/40 p-4 transition-smooth hover:border-accent/40"
          >
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-serif text-lg font-semibold">{s.day}</p>
              <p className="text-sm font-medium text-accent">{s.time}</p>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{s.group}</p>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" strokeWidth={1.5} />
              {s.location}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
