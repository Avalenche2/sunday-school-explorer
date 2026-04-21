import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { resetPasswordSchema } from "@/lib/passwordValidation";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ResetPassword = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [hasRecovery, setHasRecovery] = useState<boolean | null>(null);

  useEffect(() => {
    // Le lien email pose un fragment #type=recovery. Supabase établit
    // automatiquement la session via onAuthStateChange (event PASSWORD_RECOVERY).
    const hashType = window.location.hash.includes("type=recovery");
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setHasRecovery(true);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session || hashType) setHasRecovery(true);
      else setHasRecovery(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = resetPasswordSchema.safeParse({ password, confirm });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        if (i.path[0]) errs[String(i.path[0])] = i.message;
      });
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    setSubmitting(false);

    if (error) {
      toast({
        title: "Mise à jour impossible",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setDone(true);
    toast({ title: "Mot de passe modifié", description: "Tu peux te reconnecter." });
    setTimeout(() => navigate("/connexion", { replace: true }), 1500);
  };

  return (
    <AuthLayout
      title="Nouveau mot de passe"
      subtitle="Choisis un mot de passe sécurisé."
      footer={
        <Link
          to="/connexion"
          className="text-foreground font-medium hover:text-accent transition-colors"
        >
          Retour à la connexion
        </Link>
      }
    >
      {done ? (
        <div className="text-center space-y-4 py-4">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
            <CheckCircle2 className="h-6 w-6" strokeWidth={1.8} />
          </div>
          <p className="text-sm text-muted-foreground">
            Mot de passe mis à jour. Redirection vers la connexion…
          </p>
        </div>
      ) : hasRecovery === false ? (
        <div className="text-center space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Ce lien n'est plus valide ou a expiré. Demande un nouveau lien depuis la page
            « Mot de passe oublié ».
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link to="/mot-de-passe-oublie">Demander un nouveau lien</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="password">Nouveau mot de passe</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
            {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirmer le mot de passe</Label>
            <Input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
            />
            {errors.confirm && <p className="text-xs text-destructive">{errors.confirm}</p>}
          </div>

          <Button
            type="submit"
            className="w-full mt-2"
            size="lg"
            disabled={submitting || hasRecovery === null}
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Mettre à jour
          </Button>
        </form>
      )}
    </AuthLayout>
  );
};

export default ResetPassword;
