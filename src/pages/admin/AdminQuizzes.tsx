import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarClock, CheckCircle2, Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface QuizRow {
  id: string;
  title: string;
  publish_date: string;
  is_published: boolean;
  bible_reference: string | null;
}

const AdminQuizzes = () => {
  const [quizzes, setQuizzes] = useState<QuizRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("quizzes")
      .select("id, title, publish_date, is_published, bible_reference")
      .order("publish_date", { ascending: false });
    setQuizzes((data ?? []) as QuizRow[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const togglePublished = async (q: QuizRow) => {
    const { error } = await supabase
      .from("quizzes")
      .update({ is_published: !q.is_published })
      .eq("id", q.id);
    if (error) return toast.error("Échec", { description: error.message });
    toast.success(q.is_published ? "Quizz dépublié" : "Quizz publié");
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("quizzes").delete().eq("id", id);
    if (error) return toast.error("Échec", { description: error.message });
    toast.success("Quizz supprimé");
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl font-semibold">Tous les quizz</h2>
        <Button asChild>
          <Link to="/admin/quizz/nouveau">
            <Plus className="h-4 w-4" /> Nouveau quizz
          </Link>
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : quizzes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-10 text-center text-muted-foreground text-sm">
            Aucun quizz. Crée le premier !
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {quizzes.map((q) => {
            const todayStr = new Date().toISOString().slice(0, 10);
            const isScheduled = q.is_published && q.publish_date > todayStr;
            return (
            <Card key={q.id} className="shadow-soft">
              <CardContent className="p-4 flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium">{q.title}</p>
                    {isScheduled ? (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-gold font-semibold">
                        <CalendarClock className="h-3 w-3" /> programmé
                      </span>
                    ) : q.is_published ? (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-accent font-semibold">
                        <CheckCircle2 className="h-3 w-3" /> publié
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                        brouillon
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isScheduled ? "Visible le " : ""}
                    {format(new Date(q.publish_date), "d MMMM yyyy", { locale: fr })}
                    {q.bible_reference && ` · ${q.bible_reference}`}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => togglePublished(q)}>
                    {q.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button asChild variant="ghost" size="sm">
                    <Link to={`/admin/quizz/${q.id}`}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer ce quizz ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Cette action est définitive. Les questions seront aussi supprimées.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={() => remove(q.id)}>
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminQuizzes;
