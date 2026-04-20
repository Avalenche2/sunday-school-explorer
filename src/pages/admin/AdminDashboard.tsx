import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, CalendarDays, Megaphone, ScrollText, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";

interface Stats {
  quizzes: number;
  attempts: number;
  announcements: number;
  schedules: number;
  users: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const load = async () => {
      const [q, a, an, s, u] = await Promise.all([
        supabase.from("quizzes").select("id", { count: "exact", head: true }),
        supabase.from("quiz_attempts").select("id", { count: "exact", head: true }),
        supabase.from("announcements").select("id", { count: "exact", head: true }),
        supabase.from("schedules").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);
      setStats({
        quizzes: q.count ?? 0,
        attempts: a.count ?? 0,
        announcements: an.count ?? 0,
        schedules: s.count ?? 0,
        users: u.count ?? 0,
      });
    };
    load();
  }, []);

  const cards = [
    { label: "Quizz", value: stats?.quizzes, icon: ScrollText, to: "/admin/quizz" },
    { label: "Participations", value: stats?.attempts, icon: Users, to: "/admin/quizz" },
    { label: "Annonces", value: stats?.announcements, icon: Megaphone, to: "/admin/annonces" },
    { label: "Horaires", value: stats?.schedules, icon: CalendarDays, to: "/admin/horaires" },
    { label: "Enfants inscrits", value: stats?.users, icon: BookOpen, to: "/admin" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.label} to={c.to}>
              <Card className="shadow-soft hover:shadow-elevated transition-shadow">
                <CardContent className="p-5">
                  <Icon className="h-4 w-4 text-accent mb-2" strokeWidth={1.8} />
                  <p className="font-serif text-3xl font-semibold leading-none">
                    {c.value ?? "—"}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                    {c.label}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card className="border-dashed">
        <CardContent className="p-6 text-sm text-muted-foreground">
          Bienvenue dans l'espace moniteur. Utilise le menu pour gérer les quizz,
          publier l'évangile du jour, ajouter des annonces ou modifier les horaires.
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
