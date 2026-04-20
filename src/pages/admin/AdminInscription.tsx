import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { adminSignUpSchema } from "@/lib/validation";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const AdminInscription = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!authLoading && user && isAdmin) return <Navigate to="/admin" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = adminSignUpSchema.safeParse({ firstName, lastName, email, password });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        if (i.path[0]) fieldErrors[String(i.path[0])] = i.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    const redirectUrl = `${window.location.origin}/admin/connexion`;
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: parsed.data.firstName,
          last_name: parsed.data.lastName,
          requested_role: "admin",
        },
      },
    });

    if (error) {
      setSubmitting(false);
      const msg = error.message.includes("already registered")
        ? "Un compte existe déjà avec cet email."
        : error.message;
      toast({ title: "Inscription impossible", description: msg, variant: "destructive" });
      return;
    }

    if (data.user) {
      // Crée la demande d'accès moniteur
      const { error: reqError } = await supabase.from("admin_requests").insert({
        user_id: data.user.id,
        first_name: parsed.data.firstName,
        last_name: parsed.data.lastName,
        email: parsed.data.email,
      });

      if (reqError) {
        console.error("admin_requests insert error", reqError);
      }
    }

    setSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <AuthLayout
        title="Demande envoyée"
        subtitle="Ta demande est en cours d'examen."
        footer={
          <Link
            to="/admin/connexion"
            className="text-foreground font-medium hover:text-accent transition-colors"
          >
            Retour à la connexion
          </Link>
        }
      >
        <div className="text-center py-4">
          <CheckCircle2 className="h-10 w-10 mx-auto text-accent mb-3" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground leading-relaxed">
            Ta demande d'accès moniteur a bien été enregistrée.
            <br />
            Un moniteur déjà actif doit la valider avant que tu puisses accéder à
            l'espace d'administration.
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Demande d'accès moniteur"
      subtitle="Crée ta demande de compte moniteur."
      footer={
        <>
          Déjà moniteur ?{" "}
          <Link
            to="/admin/connexion"
            className="text-foreground font-medium hover:text-accent transition-colors"
          >
            Se connecter
          </Link>
        </>
      }
    >
      <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/5 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-accent">
        <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.8} />
        Espace moniteur
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="firstName">Prénom</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
              required
            />
            {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lastName">Nom</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
              required
            />
            {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
          </div>
        </div>

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
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Mot de passe</Label>
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

        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Ta demande sera examinée par un moniteur déjà actif avant d'obtenir l'accès.
        </p>

        <Button type="submit" className="w-full mt-2" size="lg" disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Envoyer ma demande
        </Button>
      </form>
    </AuthLayout>
  );
};

export default AdminInscription;
