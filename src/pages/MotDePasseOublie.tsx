import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, MailCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { forgotPasswordSchema } from "@/lib/passwordValidation";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  admin?: boolean;
}

const MotDePasseOublie = ({ admin = false }: Props) => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Email invalide");
      return;
    }

    setSubmitting(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);

    if (err) {
      toast({
        title: "Envoi impossible",
        description: err.message,
        variant: "destructive",
      });
      return;
    }

    setSent(true);
    toast({
      title: "Email envoyé",
      description: "Vérifie ta boîte mail pour réinitialiser ton mot de passe.",
    });
  };

  const loginPath = admin ? "/admin/connexion" : "/connexion";

  return (
    <AuthLayout
      title="Mot de passe oublié"
      subtitle="Reçois un lien pour le réinitialiser."
      footer={
        <>
          Tu te souviens de ton mot de passe ?{" "}
          <Link
            to={loginPath}
            className="text-foreground font-medium hover:text-accent transition-colors"
          >
            Retour à la connexion
          </Link>
        </>
      }
    >
      {sent ? (
        <div className="text-center space-y-4 py-4">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
            <MailCheck className="h-6 w-6" strokeWidth={1.8} />
          </div>
          <p className="text-sm text-muted-foreground">
            Si un compte existe avec <span className="font-medium text-foreground">{email}</span>,
            tu vas recevoir un email avec les instructions pour choisir un nouveau mot de passe.
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link to={loginPath}>Retour à la connexion</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <Button type="submit" className="w-full mt-2" size="lg" disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Envoyer le lien
          </Button>
        </form>
      )}
    </AuthLayout>
  );
};

export default MotDePasseOublie;
