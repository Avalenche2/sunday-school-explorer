import { useEffect, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

interface Row {
  id: string;
  title: string;
  content: string;
  published_at: string;
}

const AdminAnnouncements = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("announcements")
      .select("*")
      .order("published_at", { ascending: false });
    setRows((data ?? []) as Row[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async () => {
    if (!title.trim() || !content.trim()) return toast.error("Titre et contenu requis");
    setSaving(true);
    const { error } = await supabase
      .from("announcements")
      .insert({ title: title.trim(), content: content.trim() });
    setSaving(false);
    if (error) return toast.error("Échec", { description: error.message });
    toast.success("Annonce publiée");
    setTitle("");
    setContent("");
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) return toast.error("Échec", { description: error.message });
    toast.success("Annonce supprimée");
    load();
  };

  return (
    <div className="space-y-6">
      <h2 className="font-serif text-2xl font-semibold">Annonces</h2>

      <Card className="shadow-soft">
        <CardContent className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Titre</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="content">Contenu</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
            />
          </div>
          <Button onClick={handleAdd} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Publier
          </Button>
        </CardContent>
      </Card>

      <div>
        <h3 className="font-serif text-lg font-semibold mb-3">
          Annonces publiées {rows.length > 0 && `(${rows.length})`}
        </h3>
        {loading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : rows.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              Aucune annonce.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => (
              <Card key={r.id} className="shadow-soft">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{r.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(r.published_at), "d MMMM yyyy", { locale: fr })}
                    </p>
                    <p className="text-sm mt-2 whitespace-pre-wrap">{r.content}</p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer cette annonce ?</AlertDialogTitle>
                        <AlertDialogDescription>Cette action est définitive.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={() => remove(r.id)}>Supprimer</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAnnouncements;
