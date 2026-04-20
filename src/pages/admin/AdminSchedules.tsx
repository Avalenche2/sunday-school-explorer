import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const DAYS = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
];

interface Row {
  id: string;
  day_of_week: string;
  time: string;
  description: string | null;
  location: string | null;
  position: number;
}

const AdminSchedules = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [day, setDay] = useState("Dimanche");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("schedules")
      .select("*")
      .order("position", { ascending: true });
    setRows((data ?? []) as Row[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async () => {
    if (!day || !time.trim()) return toast.error("Jour et heure requis");
    setSaving(true);
    const nextPos = rows.length ? Math.max(...rows.map((r) => r.position)) + 1 : 1;
    const { error } = await supabase.from("schedules").insert({
      day_of_week: day,
      time: time.trim(),
      location: location.trim() || null,
      description: description.trim() || null,
      position: nextPos,
    });
    setSaving(false);
    if (error) return toast.error("Échec", { description: error.message });
    toast.success("Horaire ajouté");
    setTime("");
    setLocation("");
    setDescription("");
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("schedules").delete().eq("id", id);
    if (error) return toast.error("Échec", { description: error.message });
    toast.success("Horaire supprimé");
    load();
  };

  return (
    <div className="space-y-6">
      <h2 className="font-serif text-2xl font-semibold">Horaires</h2>

      <Card className="shadow-soft">
        <CardContent className="p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Jour</Label>
              <Select value={day} onValueChange={setDay}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="time">Heure</Label>
              <Input id="time" value={time} onChange={(e) => setTime(e.target.value)} placeholder="10h00 - 11h30" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location">Lieu (optionnel)</Label>
              <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="description">Description (optionnel)</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
          </div>
          <Button onClick={handleAdd} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Ajouter
          </Button>
        </CardContent>
      </Card>

      <div>
        <h3 className="font-serif text-lg font-semibold mb-3">Horaires actuels</h3>
        {loading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : rows.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              Aucun horaire.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => (
              <Card key={r.id} className="shadow-soft">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">
                      {r.day_of_week} <span className="text-muted-foreground">·</span> {r.time}
                    </p>
                    {r.location && (
                      <p className="text-xs text-muted-foreground mt-0.5">{r.location}</p>
                    )}
                    {r.description && (
                      <p className="text-sm mt-1">{r.description}</p>
                    )}
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer cet horaire ?</AlertDialogTitle>
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

export default AdminSchedules;
