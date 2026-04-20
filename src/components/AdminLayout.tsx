import { ReactNode } from "react";
import { Link, NavLink, Navigate, Outlet, useLocation } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  LayoutDashboard,
  Loader2,
  Megaphone,
  ScrollText,
  ShieldCheck,
  Sun,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { to: "/admin", label: "Tableau de bord", icon: LayoutDashboard, end: true },
  { to: "/admin/quizz", label: "Quizz", icon: ScrollText },
  { to: "/admin/defi", label: "Défi du jour", icon: Sun },
  { to: "/admin/statistiques", label: "Statistiques", icon: BarChart3 },
  { to: "/admin/evangile", label: "Évangile du jour", icon: BookOpen },
  { to: "/admin/annonces", label: "Annonces", icon: Megaphone },
  { to: "/admin/horaires", label: "Horaires", icon: CalendarDays },
];

const Shell = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen flex flex-col bg-background">
    <Header />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
);

export const AdminLayout = () => {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Shell>
        <div className="flex justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
        </div>
      </Shell>
    );
  }

  if (!user) {
    return <Navigate to="/connexion" replace state={{ from: location }} />;
  }

  if (!isAdmin) {
    return (
      <Shell>
        <section className="container py-16 max-w-xl">
          <Card className="border-border/60 shadow-soft">
            <CardContent className="p-10 text-center">
              <ShieldCheck className="h-10 w-10 mx-auto text-accent mb-3" strokeWidth={1.5} />
              <h2 className="font-serif text-2xl">Accès réservé</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Cet espace est réservé aux moniteurs.
              </p>
              <Button asChild className="mt-6">
                <Link to="/">Retour à l'accueil</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </Shell>
    );
  }

  return (
    <Shell>
      <section className="container py-8 md:py-12">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-accent font-medium">
            Espace moniteur
          </p>
          <h1 className="mt-2 font-serif text-3xl md:text-4xl font-semibold leading-[1.1]">
            Administration
          </h1>
          <div className="mt-5 h-px w-12 bg-accent" />
        </div>

        <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
          <aside>
            <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible -mx-4 px-4 lg:mx-0 lg:px-0 pb-2 lg:pb-0">
              {links.map((l) => {
                const Icon = l.icon;
                return (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    end={l.end}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                        isActive
                          ? "bg-secondary text-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                      )
                    }
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.8} />
                    {l.label}
                  </NavLink>
                );
              })}
            </nav>
          </aside>

          <div className="min-w-0">
            <Outlet />
          </div>
        </div>
      </section>
    </Shell>
  );
};
