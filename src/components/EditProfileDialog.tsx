import { useState } from "react";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { profileUpdateSchema } from "@/lib/validation";
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

interface Props {
  initial: { firstName: string; lastName: string; age: number | null };
  onSaved: (next: { firstName: string; lastName: string; age: number | null }) => void;
}

export const EditProfileDialog = ({ initial, onSaved }: Props) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState(initial.firstName);
  const [lastName, setLastName] = useState(initial.lastName);
  const [age, setAge] = useState<string>(initial.age?.toString() ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setErrors({});

    const parsed = profileUpdateSchema.safeParse({
      firstName,
      lastName,
      age: Number(age),
    });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        errs[i.path[0] as string] = i.message;
      });
      setErrors(errs);
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: parsed.data.firstName,
        last_name: parsed.data.lastName,
        age: parsed.data.age,
      })
      .eq("id", user.id);
    setSaving(false);

    if (error) {
      toast.error("Impossible de sauvegarder.", { description: error.message });
      return;
    }

    toast.success("Profil mis à jour");
    onSaved({
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      age: parsed.data.age,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="mt-4">
          <Pencil className="h-3.5 w-3.5" /> Modifier
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Mon profil</DialogTitle>
          <DialogDescription>
            Mets à jour ton prénom, ton nom et ton âge.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="firstName">Prénom</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
            />
            {errors.firstName && (
              <p className="text-xs text-destructive">{errors.firstName}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lastName">Nom</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
            />
            {errors.lastName && (
              <p className="text-xs text-destructive">{errors.lastName}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="age">Âge</Label>
            <Input
              id="age"
              type="number"
              inputMode="numeric"
              min={4}
              max={18}
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
            {errors.age && <p className="text-xs text-destructive">{errors.age}</p>}
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
