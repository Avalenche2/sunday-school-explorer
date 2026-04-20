import { Link, NavLink } from "react-router-dom";
import { BookOpen, LogOut, Menu, User as UserIcon, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const baseNavItems = [
  { to: "/", label: "Accueil" },
  { to: "/quizz", label: "Quizz" },
  { to: "/citations", label: "Citations" },
  { to: "/classement", label: "Classement" },
];

export const Header = () => {
  const [open, setOpen] = useState(false);
  const { user, signOut, isAdmin } = useAuth();
  const { toast } = useToast();
  const navItems = user
    ? [
        ...baseNavItems,
        { to: "/profil", label: "Mon profil" },
        ...(isAdmin ? [{ to: "/admin", label: "Admin" }] : []),
      ]
    : baseNavItems;

  const handleSignOut = async () => {
    await signOut();
    toast({ title: "À bientôt !", description: "Tu es déconnecté." });
    setOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-night shadow-soft">
            <BookOpen className="h-4 w-4 text-gold" strokeWidth={1.5} />
          </span>
          <span className="font-serif text-xl font-semibold tracking-tight">
            École du Dimanche
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "text-sm font-medium transition-colors relative py-1",
                  isActive
                    ? "text-foreground after:absolute after:-bottom-0.5 after:left-0 after:right-0 after:h-px after:bg-accent"
                    : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <UserIcon className="h-4 w-4" strokeWidth={1.5} />
                {user.email}
              </span>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                Déconnexion
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/connexion">Connexion</Link>
              </Button>
              <Button asChild size="sm" className="bg-primary hover:bg-primary/90">
                <Link to="/inscription">S'inscrire</Link>
              </Button>
            </>
          )}
        </div>

        <button
          className="md:hidden p-2 -mr-2"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border/60 bg-background">
          <div className="container py-4 flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "px-3 py-2 rounded-md text-sm font-medium",
                    isActive ? "bg-secondary text-foreground" : "text-muted-foreground"
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
            <div className="flex gap-2 pt-3 mt-2 border-t border-border/60">
              {user ? (
                <Button variant="outline" size="sm" className="flex-1" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
                  Déconnexion
                </Button>
              ) : (
                <>
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link to="/connexion" onClick={() => setOpen(false)}>Connexion</Link>
                  </Button>
                  <Button asChild size="sm" className="flex-1">
                    <Link to="/inscription" onClick={() => setOpen(false)}>S'inscrire</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
