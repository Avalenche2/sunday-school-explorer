import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { ReactNode } from "react";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

export const AuthLayout = ({ title, subtitle, children, footer }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Côté visuel — bleu nuit + or */}
      <aside className="hidden md:flex md:w-2/5 lg:w-1/2 bg-gradient-night text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: 'radial-gradient(circle at 30% 20%, hsl(var(--gold)) 0%, transparent 50%), radial-gradient(circle at 70% 80%, hsl(var(--gold)) 0%, transparent 50%)'
        }} />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link to="/" className="flex items-center gap-2.5 group">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/20 backdrop-blur-sm">
              <BookOpen className="h-5 w-5 text-gold" strokeWidth={1.5} />
            </span>
            <span className="font-serif text-xl">École du Dimanche</span>
          </Link>

          <div className="space-y-6 max-w-md">
            <div className="h-px w-12 bg-gold/60" />
            <p className="verse-quote text-gold-soft">
              « Laissez venir à moi les petits enfants,
              et ne les en empêchez pas ; car le royaume
              de Dieu est pour ceux qui leur ressemblent. »
            </p>
            <p className="text-sm text-gold/80 font-medium tracking-wide">
              — Marc 10 : 14
            </p>
          </div>

          <p className="text-xs text-primary-foreground/50 tracking-wider">
            Grandir dans la foi, ensemble.
          </p>
        </div>
      </aside>

      {/* Formulaire */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Link
            to="/"
            className="md:hidden flex items-center gap-2 mb-8"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-night">
              <BookOpen className="h-4 w-4 text-gold" strokeWidth={1.5} />
            </span>
            <span className="font-serif text-lg">École du Dimanche</span>
          </Link>

          <div className="mb-8">
            <h1 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight">
              {title}
            </h1>
            <p className="mt-2 text-muted-foreground text-sm">{subtitle}</p>
            <div className="mt-4 h-px w-12 bg-accent" />
          </div>

          {children}

          <div className="mt-8 pt-6 border-t border-border/60 text-center text-sm text-muted-foreground">
            {footer}
          </div>
        </div>
      </main>
    </div>
  );
};
