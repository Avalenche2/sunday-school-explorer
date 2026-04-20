import { useEffect, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarClock, Loader2, Pencil, Plus, Save, Trash2, X } from "lucide-react";
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

const todayLocalDate = () => {
  const d = new Date();
  const tz = d.getTimezoneOffset();
  return new Date(d.getTime() - tz * 60000).toISOString().slice(0, 10);
};

const AdminAnnouncements = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [publishDate, setPublishDate] = useState(todayLocalDate());
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

  const reset = () => {
    setEditingId(null);
    setTitle("");
    setContent("");
    setPublishDate(todayLocalDate());
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return toast.error("Titre et contenu requis");
    setSaving(true);

    // Convertit la date locale en timestamp ISO (midi local pour éviter les sauts de fuseau)
    const publishedAt = new Date(`${publishDate}T12:00:00`).toISOString();

    const payload = {
      title: title.trim(),
      content: content.trim(),
      published_at: publishedAt,
    };

    const { error } = editingId
      ? await supabase.from("announcements").update(payload).eq("id", editingId)
      : await supabase.from("announcements").insert(payload);

    setSaving(false);
    if (error) return toast.error("Échec", { description: error.message });

    const isFuture = new Date(publishedAt) > new Date();
    toast.success(
      editingId
        ? "Annonce mise à jour"
        : isFuture
          ? "Annonce programmée"
          : "Annonce publiée"
    );
    reset();
    load();
  };

  const startEdit = (r: Row) => {
    setEditingId(r.id);
    setTitle(r.title);
    setContent(r.content);
    setPublishDate(r.published_at.slice(0, 10));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) return toast.error("Échec", { description: error.message });
    toast.success("Annonce supprimée");
    if (editingId === id) reset();
    load();
  };

  const isFutureDate = publishDate > todayLocalDate();
  const nowIso = new Date().toISOString();

  return (
    <div className="space-y-6">
      <h2 className="font-serif text-2xl font-semibold">Annonces</h2>

      <Card className="shadow-soft">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-serif text-lg">
              {editingId ? "Modifier l'annonce" : "Nouvelle annonce"}
            </h3>
            {editingId && (
              <Button variant="ghost" size="sm" onClick={reset}>
                <X className="h-3.5 w-3.5" /> Annuler
              </Button>
            )}
          </div>

          <div className="grid md:grid-cols-[1fr_180px] gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Titre</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="publishDate">Date de publication</Label>
              <Input
                id="publishDate"
                type="date"
                value={publishDate}
                onChange={(e) => setPublishDate(e.target.value)}
              />
            </div>
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

          {isFutureDate && (
            <div className="rounded-lg border border-gold/40 bg-gold/5 p-3 text-xs text-foreground flex items-start gap-2">
              <CalendarClock className="h-4 w-4 text-gold shrink-0 mt-0.5" strokeWidth={1.8} />
              <div>
                <strong className="text-gold">Publication programmée.</strong> Cette annonce sera
                visible par les enfants à partir du{" "}
                <strong>
                  {new Date(`${publishDate}T12:00:00`).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </strong>
                .
              </div>
            </div>
          )}

          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : editingId ? (
              <Save className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {editingId ? "Mettre à jour" : isFutureDate ? "Programmer" : "Publier"}
          </Button>
        </CardContent>
      </Card>

      <div>
        <h3 className="font-serif text-lg font-semibold mb-3">
          Annonces {rows.length > 0 && `(${rows.length})`}
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
            {rows.map((r) => {
              const scheduled = r.published_at > nowIso;
              return (
                <Card key={r.id} className="shadow-soft">
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{r.title}</p>
                        {scheduled && (
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-gold font-semibold">
                            <CalendarClock className="h-3 w-3" /> programmée
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {scheduled ? "Visible le " : ""}
                        {format(new Date(r.published_at), "d MMMM yyyy", { locale: fr })}
                      </p>
                      <p className="text-sm mt-2 whitespace-pre-wrap">{r.content}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(r)}
                        aria-label="Modifier"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer cette annonce ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette action est définitive.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => remove(r.id)}>
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAnnouncements;
