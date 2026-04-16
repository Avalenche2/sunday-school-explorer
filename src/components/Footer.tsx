import { Heart } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="border-t border-border/60 bg-gradient-soft">
      <div className="container py-10">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="gold-divider" />
          <p className="font-serif text-lg italic text-muted-foreground">
            « Laissez venir à moi les petits enfants. »
          </p>
          <p className="text-xs text-muted-foreground/80">— Marc 10:14</p>
          <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
            Fait avec <Heart className="h-3 w-3 text-accent fill-accent" /> pour les juniors
          </p>
        </div>
      </div>
    </footer>
  );
};
