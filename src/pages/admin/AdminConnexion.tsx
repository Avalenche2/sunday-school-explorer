import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { signInSchema } from "@/lib/validation";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const AdminConnexion = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  if (!authLoading && user && isAdmin) return <Navigate to="/admin" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        if (i.path[0]) fieldErrors[String(i.path[0])] = i.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error) {
      setSubmitting(false);
      const msg = error.message.includes("Invalid login credentials")
        ? "Email ou mot de passe incorrect."
        : error.message;
      toast({ title: "Connexion impossible", description: msg, variant: "destructive" });
      return;
    }

    // Vérifie le rôle admin
    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user!.id);

    const hasAdmin = rolesData?.some((r) => r.role === "admin");

    if (!hasAdmin) {
      await supabase.auth.signOut();
      setSubmitting(false);
      toast({
        title: "Accès non autorisé",
        description:
          "Ton compte n'a pas encore été validé comme moniteur. Patiente qu'un moniteur approuve ta demande.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(false);
    toast({ title: "Bienvenue moniteur", description: "Connexion réussie." });
    navigate("/admin", { replace: true });
  };

  return (
    <AuthLayout
      title="Espace moniteur"
      subtitle="Connexion réservée aux moniteurs."
      footer={
        <>
          Pas encore moniteur ?{" "}
          <Link
            to="/admin/inscription"
            className="text-foreground font-medium hover:text-accent transition-colors"
          >
            Demander un accès
          </Link>
        </>
      }
    >
      <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/5 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-accent">
        <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.8} />
        Accès moniteur
      </div>

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
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
        </div>

        <Button type="submit" className="w-full mt-2" size="lg" disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Se connecter
        </Button>
      </form>
    </AuthLayout>
  );
};

export default AdminConnexion;
