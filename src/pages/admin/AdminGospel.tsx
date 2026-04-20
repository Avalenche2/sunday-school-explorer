import { useEffect, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { BookOpen, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const today = () => new Date().toISOString().slice(0, 10);

interface Row {
  id: string;
  reference: string;
  verse: string;
  commentary: string | null;
  gospel_date: string;
}

const AdminGospel = () => {
  const [date, setDate] = useState(today());
  const [reference, setReference] = useState("");
  const [verse, setVerse] = useState("");
  const [commentary, setCommentary] = useState("");
  const [existingId, setExistingId] = useState<string | null>(null);
  const [recent, setRecent] = useState<Row[]>([]);
  const [saving, setSaving] = useState(false);

  const loadForDate = async (d: string) => {
    const { data } = await supabase
      .from("daily_gospel")
      .select("*")
      .eq("gospel_date", d)
      .maybeSingle();
    if (data) {
      setExistingId(data.id);
      setReference(data.reference);
      setVerse(data.verse);
      setCommentary(data.commentary ?? "");
    } else {
      setExistingId(null);
      setReference("");
      setVerse("");
      setCommentary("");
    }
  };

  const loadRecent = async () => {
    const { data } = await supabase
      .from("daily_gospel")
      .select("*")
      .order("gospel_date", { ascending: false })
      .limit(8);
    setRecent((data ?? []) as Row[]);
  };

  useEffect(() => {
    loadForDate(date);
  }, [date]);

  useEffect(() => {
    loadRecent();
  }, []);

  const handleSave = async () => {
    if (!reference.trim() || !verse.trim()) return toast.error("Référence et verset requis");
    setSaving(true);
    const payload = {
      reference: reference.trim(),
      verse: verse.trim(),
      commentary: commentary.trim() || null,
      gospel_date: date,
    };
    const { error } = existingId
      ? await supabase.from("daily_gospel").update(payload).eq("id", existingId)
      : await supabase.from("daily_gospel").insert(payload);
    setSaving(false);
    if (error) return toast.error("Échec", { description: error.message });
    toast.success("Évangile publié");
    loadForDate(date);
    loadRecent();
  };

  return (
    <div className="space-y-6">
      <h2 className="font-serif text-2xl font-semibold">Évangile du jour</h2>

      <Card className="shadow-soft">
        <CardContent className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reference">Référence</Label>
            <Input
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Ex. Jean 3, 16"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="verse">Verset</Label>
            <Textarea
              id="verse"
              value={verse}
              onChange={(e) => setVerse(e.target.value)}
              rows={4}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="commentary">Commentaire (optionnel)</Label>
            <Textarea
              id="commentary"
              value={commentary}
              onChange={(e) => setCommentary(e.target.value)}
              rows={3}
            />
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {existingId ? "Mettre à jour" : "Publier"}
          </Button>
        </CardContent>
      </Card>

      {recent.length > 0 && (
        <div>
          <h3 className="font-serif text-lg font-semibold mb-3">Évangiles récents</h3>
          <div className="space-y-2">
            {recent.map((r) => (
              <Card
                key={r.id}
                className="shadow-soft cursor-pointer hover:shadow-elevated transition-shadow"
                onClick={() => setDate(r.gospel_date)}
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <BookOpen className="h-4 w-4 text-accent mt-1 shrink-0" strokeWidth={1.8} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs uppercase tracking-wider text-accent font-semibold">
                      {format(new Date(r.gospel_date), "d MMMM yyyy", { locale: fr })}
                    </p>
                    <p className="font-medium mt-0.5">{r.reference}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{r.verse}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminGospel;
