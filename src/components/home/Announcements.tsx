import { Megaphone } from "lucide-react";

const announcements = [
  {
    title: "Sortie du groupe junior",
    date: "20 avril 2026",
    body: "Rendez-vous à 14h devant l'église pour notre après-midi pique-nique et jeux bibliques.",
  },
  {
    title: "Concours de mémorisation",
    date: "27 avril 2026",
    body: "Apprends 5 versets et viens les réciter — de jolis prix à gagner !",
  },
  {
    title: "Nouveau cycle d'enseignement",
    date: "1er mai 2026",
    body: "Nous démarrons une série sur la vie de Joseph. Prépare ta Bible !",
  },
];

export const Announcements = () => {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-soft">
      <div className="flex items-center gap-2 text-accent">
        <Megaphone className="h-4 w-4" strokeWidth={1.5} />
        <span className="text-xs uppercase tracking-[0.2em] font-medium">
          Annonces
        </span>
      </div>
      <h2 className="mt-2 font-serif text-2xl font-semibold">À venir</h2>

      <div className="mt-6 space-y-4">
        {announcements.map((a, i) => (
          <article
            key={i}
            className="group relative pl-5 border-l-2 border-accent/30 transition-smooth hover:border-accent"
          >
            <p className="text-xs text-muted-foreground">{a.date}</p>
            <h3 className="mt-1 font-serif text-lg font-semibold">{a.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              {a.body}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
};
