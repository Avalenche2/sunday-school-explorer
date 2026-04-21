import { useState } from "react";
import { Loader2, Pencil } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const schema = z.object({
  firstName: z.string().trim().min(1, "Prénom requis").max(50, "Prénom trop long"),
  lastName: z.string().trim().min(1, "Nom requis").max(50, "Nom trop long"),
});

interface Props {
  initial: { firstName: string; lastName: string };
  onSaved: (next: { firstName: string; lastName: string }) => void;
}

export const EditAdminProfileDialog = ({ initial, onSaved }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState(initial.firstName);
  const [lastName, setLastName] = useState(initial.lastName);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setErrors({});

    const parsed = schema.safeParse({ firstName, lastName });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        if (i.path[0]) errs[String(i.path[0])] = i.message;
      });
      setErrors(errs);
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ first_name: parsed.data.firstName, last_name: parsed.data.lastName })
      .eq("id", user.id);
    setSaving(false);

    if (error) {
      toast({
        title: "Sauvegarde impossible",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Profil mis à jour" });
    onSaved({ firstName: parsed.data.firstName, lastName: parsed.data.lastName });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="h-3.5 w-3.5" strokeWidth={1.8} />
          Modifier le profil
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Modifier mon profil</DialogTitle>
          <DialogDescription>Mets à jour ton prénom et ton nom.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="admin-firstName">Prénom</Label>
            <Input
              id="admin-firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
            />
            {errors.firstName && (
              <p className="text-xs text-destructive">{errors.firstName}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="admin-lastName">Nom</Label>
            <Input
              id="admin-lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
            />
            {errors.lastName && (
              <p className="text-xs text-destructive">{errors.lastName}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Sauvegarder
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
