import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowDown, ArrowLeft, ArrowUp, FileJson, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { AdminQuizAttempts } from "./AdminQuizAttempts";

interface QuestionDraft {
  /** id de la BDD si déjà persistée, sinon null */
  id: string | null;
  prompt: string;
  options: [string, string, string, string];
  correct_index: number;
  bible_reference: string;
}

const emptyQuestion = (): QuestionDraft => ({
  id: null,
  prompt: "",
  options: ["", "", "", ""],
  correct_index: 0,
  bible_reference: "",
});

const today = () => new Date().toISOString().slice(0, 10);

const AdminQuizEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isNew = !id || id === "nouveau";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [bibleRef, setBibleRef] = useState("");
  const [publishDate, setPublishDate] = useState(today());
  const [isPublished, setIsPublished] = useState(false);
  const [questions, setQuestions] = useState<QuestionDraft[]>([emptyQuestion()]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");

  useEffect(() => {
    if (isNew) return;
    const load = async () => {
      setLoading(true);
      const { data: q } = await supabase
        .from("quizzes")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (!q) {
        toast.error("Quizz introuvable");
        navigate("/admin/quizz");
        return;
      }
      setTitle(q.title);
      setDescription(q.description ?? "");
      setBibleRef(q.bible_reference ?? "");
      setPublishDate(q.publish_date);
      setIsPublished(q.is_published);

      const { data: qs } = await supabase
        .from("questions")
        .select("*")
        .eq("quiz_id", id!)
        .order("position", { ascending: true });
      setQuestions(
        (qs ?? []).map((row) => {
          const opts = Array.isArray(row.options) ? (row.options as string[]) : [];
          return {
            id: row.id,
            prompt: row.prompt,
            options: [opts[0] ?? "", opts[1] ?? "", opts[2] ?? "", opts[3] ?? ""],
            correct_index: row.correct_index,
            bible_reference: row.bible_reference ?? "",
          };
        })
      );
      setLoading(false);
    };
    load();
  }, [id, isNew, navigate]);

  const updateQuestion = (idx: number, patch: Partial<QuestionDraft>) => {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  };

  const updateOption = (qIdx: number, oIdx: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const next = [...q.options] as QuestionDraft["options"];
        next[oIdx] = value;
        return { ...q, options: next };
      })
    );
  };

  const move = (idx: number, dir: -1 | 1) => {
    setQuestions((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const remove = (idx: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importText);
      if (!Array.isArray(parsed)) throw new Error("Le JSON doit être un tableau de questions");
      const drafts: QuestionDraft[] = parsed.map((p, i) => {
        if (typeof p.prompt !== "string") throw new Error(`Question ${i + 1} : "prompt" requis`);
        if (!Array.isArray(p.options) || p.options.length !== 4) {
          throw new Error(`Question ${i + 1} : 4 "options" requises`);
        }
        if (typeof p.correct_index !== "number" || p.correct_index < 0 || p.correct_index > 3) {
          throw new Error(`Question ${i + 1} : "correct_index" entre 0 et 3`);
        }
        return {
          id: null,
          prompt: p.prompt,
          options: [p.options[0], p.options[1], p.options[2], p.options[3]] as QuestionDraft["options"],
          correct_index: p.correct_index,
          bible_reference: typeof p.bible_reference === "string" ? p.bible_reference : "",
        };
      });
      setQuestions(drafts);
      setImportOpen(false);
      setImportText("");
      toast.success(`${drafts.length} question(s) importée(s)`);
    } catch (e) {
      toast.error("JSON invalide", { description: (e as Error).message });
    }
  };

  const validate = (): string | null => {
    if (!title.trim()) return "Le titre est requis";
    if (questions.length === 0) return "Ajoute au moins une question";
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.prompt.trim()) return `Question ${i + 1} : la question est vide`;
      if (q.options.some((o) => !o.trim())) return `Question ${i + 1} : toutes les options doivent être remplies`;
    }
    return null;
  };

  const handleSave = async () => {
    if (!user) return;
    const err = validate();
    if (err) return toast.error(err);
    setSaving(true);

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      bible_reference: bibleRef.trim() || null,
      publish_date: publishDate,
      is_published: isPublished,
      created_by: user.id,
    };

    let quizId = id && !isNew ? id : null;

    if (isNew) {
      const { data, error } = await supabase
        .from("quizzes")
        .insert(payload)
        .select("id")
        .single();
      if (error || !data) {
        setSaving(false);
        return toast.error("Échec", { description: error?.message });
      }
      quizId = data.id;
    } else {
      const { error } = await supabase.from("quizzes").update(payload).eq("id", quizId!);
      if (error) {
        setSaving(false);
        return toast.error("Échec", { description: error.message });
      }
      // Stratégie simple : on supprime les anciennes questions et on ré-insère.
      await supabase.from("questions").delete().eq("quiz_id", quizId!);
    }

    const rows = questions.map((q, i) => ({
      quiz_id: quizId!,
      prompt: q.prompt.trim(),
      options: q.options.map((o) => o.trim()),
      correct_index: q.correct_index,
      bible_reference: q.bible_reference.trim() || null,
      position: i + 1,
    }));
    const { error: qErr } = await supabase.from("questions").insert(rows);

    setSaving(false);
    if (qErr) return toast.error("Échec questions", { description: qErr.message });

    toast.success(isNew ? "Quizz créé" : "Quizz mis à jour");
    navigate("/admin/quizz");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to="/admin/quizz"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Tous les quizz
      </Link>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-serif text-2xl font-semibold">
          {isNew ? "Nouveau quizz" : "Modifier le quizz"}
        </h2>
        <div className="flex gap-2">
          <Dialog open={importOpen} onOpenChange={setImportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <FileJson className="h-4 w-4" /> Importer JSON
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Import en masse</DialogTitle>
                <DialogDescription>
                  Colle un tableau JSON de questions. Format attendu :
                </DialogDescription>
              </DialogHeader>
              <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto">
{`[
  {
    "prompt": "Combien de disciples Jésus avait-il ?",
    "options": ["10", "12", "7", "70"],
    "correct_index": 1,
    "bible_reference": "Matthieu 10:1"
  }
]`}
              </pre>
              <Textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                rows={10}
                placeholder="Colle ton JSON ici…"
                className="font-mono text-xs"
              />
              <DialogFooter>
                <Button variant="ghost" onClick={() => setImportOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleImport}>Importer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Enregistrer
          </Button>
        </div>
      </div>

      <Card className="shadow-soft">
        <CardContent className="p-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="title">Titre</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bibleRef">Référence biblique principale</Label>
              <Input
                id="bibleRef"
                value={bibleRef}
                onChange={(e) => setBibleRef(e.target.value)}
                placeholder="Ex. Jean 3"
              />
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
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div className="flex items-center gap-3 md:col-span-2">
              <Switch id="published" checked={isPublished} onCheckedChange={setIsPublished} />
              <Label htmlFor="published" className="cursor-pointer">
                Publié (visible par les enfants)
              </Label>
            </div>
            {isPublished && publishDate > today() && (
              <div className="md:col-span-2 rounded-lg border border-gold/40 bg-gold/5 p-3 text-xs text-foreground">
                <strong className="text-gold">Publication programmée.</strong> Ce quizz sera
                automatiquement visible par les enfants à partir du{" "}
                <strong>
                  {new Date(publishDate).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </strong>
                .
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-xl font-semibold">
            Questions <span className="text-muted-foreground text-base">({questions.length})</span>
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuestions((q) => [...q, emptyQuestion()])}
          >
            <Plus className="h-4 w-4" /> Ajouter
          </Button>
        </div>

        {questions.map((q, qIdx) => (
          <Card key={qIdx} className="shadow-soft">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <span className="text-xs uppercase tracking-wider text-accent font-semibold pt-2">
                  Question {qIdx + 1}
                </span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => move(qIdx, -1)} disabled={qIdx === 0}>
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => move(qIdx, 1)} disabled={qIdx === questions.length - 1}>
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => remove(qIdx)}
                    disabled={questions.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Textarea
                placeholder="Énoncé de la question"
                value={q.prompt}
                onChange={(e) => updateQuestion(qIdx, { prompt: e.target.value })}
                rows={2}
              />

              <div className="grid sm:grid-cols-2 gap-2">
                {q.options.map((opt, oIdx) => {
                  const isCorrect = q.correct_index === oIdx;
                  return (
                    <button
                      key={oIdx}
                      type="button"
                      onClick={() => updateQuestion(qIdx, { correct_index: oIdx })}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border p-2 text-left transition-colors",
                        isCorrect
                          ? "border-accent bg-accent/10"
                          : "border-border hover:border-accent/40"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold shrink-0",
                          isCorrect ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
                        )}
                      >
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <Input
                        value={opt}
                        onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                        className="border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 h-auto"
                      />
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Clique sur une option pour la marquer comme bonne réponse.
              </p>

              <Input
                placeholder="Référence biblique (optionnel)"
                value={q.bible_reference}
                onChange={(e) => updateQuestion(qIdx, { bible_reference: e.target.value })}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {!isNew && id && (
        <div className="pt-6 border-t border-border/60">
          <AdminQuizAttempts quizId={id} />
        </div>
      )}
    </div>
  );
};

export default AdminQuizEditor;
