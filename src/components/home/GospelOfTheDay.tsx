import { Sparkles } from "lucide-react";

export const GospelOfTheDay = () => {
  // Données factices — seront remplacées par Lovable Cloud
  const gospel = {
    reference: "Jean 3:16",
    verse:
      "Car Dieu a tant aimé le monde qu'il a donné son Fils unique, afin que quiconque croit en lui ne périsse point, mais qu'il ait la vie éternelle.",
    commentary:
      "Ce verset nous rappelle l'immensité de l'amour de Dieu pour chacun de nous. Aujourd'hui, prends un instant pour remercier le Seigneur de ce don inestimable.",
    date: new Date().toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }),
  };

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-night text-primary-foreground shadow-elevated">
      {/* Décor */}
      <div className="absolute inset-0 opacity-[0.07]" aria-hidden>
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-gold blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-gold blur-3xl" />
      </div>

      <div className="relative p-8 md:p-12">
        <div className="flex items-center gap-2 text-gold">
          <Sparkles className="h-4 w-4 animate-shimmer" strokeWidth={1.5} />
          <span className="text-xs uppercase tracking-[0.2em] font-medium">
            Évangile du jour
          </span>
        </div>

        <p className="mt-2 text-sm text-primary-foreground/60 capitalize">
          {gospel.date}
        </p>

        <blockquote className="mt-6 verse-quote text-primary-foreground/95 max-w-3xl">
          « {gospel.verse} »
        </blockquote>

        <p className="mt-4 text-sm font-medium text-gold">
          — {gospel.reference}
        </p>

        <div className="mt-6 gold-divider" />

        <p className="mt-6 text-sm md:text-base text-primary-foreground/80 leading-relaxed max-w-2xl">
          {gospel.commentary}
        </p>
      </div>
    </section>
  );
};
