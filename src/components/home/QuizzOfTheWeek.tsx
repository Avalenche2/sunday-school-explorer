import { Link } from "react-router-dom";
import { ArrowRight, BookMarked, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const QuizzOfTheWeek = () => {
  const quizz = {
    title: "Les paraboles de Jésus",
    description: "10 questions pour redécouvrir les enseignements du Christ à travers ses récits.",
    questions: 10,
    duration: "≈ 8 min",
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 md:p-8 shadow-soft transition-smooth hover:shadow-elevated">
      <div className="absolute top-0 right-0 h-32 w-32 -translate-y-12 translate-x-12 rounded-full bg-gold/10 blur-2xl" aria-hidden />

      <div className="relative flex flex-col h-full">
        <div className="flex items-start justify-between gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-gold shadow-gold">
            <BookMarked className="h-5 w-5 text-primary" strokeWidth={1.5} />
          </span>
          <Badge className="bg-accent text-accent-foreground hover:bg-accent">
            Nouveau
          </Badge>
        </div>

        <h3 className="mt-5 font-serif text-2xl font-semibold">
          Quizz du dimanche
        </h3>
        <p className="mt-1 font-serif text-lg text-accent italic">
          {quizz.title}
        </p>

        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          {quizz.description}
        </p>

        <div className="mt-5 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <BookMarked className="h-3.5 w-3.5" strokeWidth={1.5} />
            {quizz.questions} questions
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" strokeWidth={1.5} />
            {quizz.duration}
          </span>
        </div>

        <Button asChild className="mt-6 w-full group" size="lg">
          <Link to="/quizz">
            Commencer le quizz
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </div>
    </div>
  );
};
