import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, Megaphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Announcement {
  id: string;
  title: string;
  content: string;
  published_at: string;
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const Annonces = () => {
  const [list, setList] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("announcements")
        .select("id, title, content, published_at")
        .order("published_at", { ascending: false });
      setList((data ?? []) as Announcement[]);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container max-w-3xl py-12 md:py-16">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-accent transition-smooth mb-6"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          Retour à l'accueil
        </Link>

        <div className="flex items-center gap-2 text-accent">
          <Megaphone className="h-4 w-4" strokeWidth={1.5} />
          <span className="text-xs uppercase tracking-[0.2em] font-medium">
            Annonces
          </span>
        </div>
        <h1 className="mt-2 font-serif text-3xl md:text-4xl font-semibold">
          Toutes les annonces
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Retrouve ici l'historique complet des annonces de la paroisse.
        </p>

        {loading ? (
          <div className="mt-12 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-accent" />
          </div>
        ) : list.length === 0 ? (
          <p className="mt-12 text-center text-sm text-muted-foreground">
            Aucune annonce pour le moment.
          </p>
        ) : (
          <div className="mt-10 space-y-6">
            {list.map((a) => (
              <article
                key={a.id}
                className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-soft transition-smooth hover:shadow-elevated"
              >
                <p className="text-xs text-muted-foreground">
                  {fmtDate(a.published_at)}
                </p>
                <h2 className="mt-1 font-serif text-xl md:text-2xl font-semibold">
                  {a.title}
                </h2>
                <p className="mt-3 text-sm md:text-base text-muted-foreground leading-relaxed whitespace-pre-line">
                  {a.content}
                </p>
              </article>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Annonces;
