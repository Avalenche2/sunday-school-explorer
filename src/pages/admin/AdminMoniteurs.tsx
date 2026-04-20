import { useEffect, useState } from "react";
import { Loader2, ShieldCheck, ShieldOff, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { isSuperAdmin } from "@/lib/superAdmin";

interface Moniteur {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  approved_at: string | null;
}

const AdminMoniteurs = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [moniteurs, setMoniteurs] = useState<Moniteur[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Moniteur | null>(null);

  const load = async () => {
    setLoading(true);

    // Tous les user_ids ayant le rôle admin
    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (rolesError || !roles) {
      setLoading(false);
      return;
    }

    const ids = [...new Set(roles.map((r) => r.user_id))];
    if (ids.length === 0) {
      setMoniteurs([]);
      setLoading(false);
      return;
    }

    // Profils + emails (via admin_requests qui contient l'email)
    const [{ data: profiles }, { data: requests }] = await Promise.all([
      supabase.from("profiles").select("id, first_name, last_name").in("id", ids),
      supabase
        .from("admin_requests")
        .select("user_id, email, reviewed_at, status")
        .in("user_id", ids),
    ]);

    const list: Moniteur[] = ids.map((id) => {
      const p = profiles?.find((pr) => pr.id === id);
      const r = requests?.find((rq) => rq.user_id === id);
      return {
        user_id: id,
        first_name: p?.first_name ?? "—",
        last_name: p?.last_name ?? "",
        email: r?.email ?? "—",
        approved_at: r?.reviewed_at ?? null,
      };
    });

    // Tri : super admin en premier, puis alphabétique
    list.sort((a, b) => {
      if (isSuperAdmin(a.email)) return -1;
      if (isSuperAdmin(b.email)) return 1;
      return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
    });

    setMoniteurs(list);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const revoke = async (m: Moniteur) => {
    setRevoking(m.user_id);
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", m.user_id)
      .eq("role", "admin");

    setRevoking(null);
    setConfirmTarget(null);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }

    toast({
      title: "Rôle révoqué",
      description: `${m.first_name} ${m.last_name} n'est plus moniteur.`,
    });
    setMoniteurs((prev) => prev.filter((x) => x.user_id !== m.user_id));
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-accent font-medium">
          Gestion des accès
        </p>
        <h2 className="mt-2 font-serif text-2xl md:text-3xl font-semibold">
          Moniteurs actifs
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Liste de tous les comptes ayant les privilèges moniteur. Le super admin ne peut pas être révoqué.
        </p>
      </div>

      <Card className="shadow-soft">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-10 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-accent" />
            </div>
          ) : moniteurs.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              Aucun moniteur pour le moment.
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {moniteurs.map((m) => {
                const superAdm = isSuperAdmin(m.email);
                const isSelf = user?.id === m.user_id;
                return (
                  <li
                    key={m.user_id}
                    className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">
                          {m.first_name} {m.last_name}
                        </p>
                        {superAdm && (
                          <Badge className="bg-accent text-accent-foreground hover:bg-accent gap-1 h-5 px-2 text-[10px] uppercase tracking-wider">
                            <Crown className="h-3 w-3" strokeWidth={2} />
                            Super admin
                          </Badge>
                        )}
                        {isSelf && !superAdm && (
                          <Badge variant="secondary" className="h-5 px-2 text-[10px] uppercase tracking-wider">
                            Vous
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                      {m.approved_at && (
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
                          Validé le{" "}
                          {new Date(m.approved_at).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      )}
                    </div>

                    <div>
                      {superAdm ? (
                        <Badge variant="outline" className="gap-1 text-[11px]">
                          <ShieldCheck className="h-3 w-3" strokeWidth={1.8} />
                          Protégé
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setConfirmTarget(m)}
                          disabled={revoking === m.user_id}
                          className="text-destructive hover:text-destructive"
                        >
                          {revoking === m.user_id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <ShieldOff className="h-3.5 w-3.5" />
                          )}
                          Révoquer
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!confirmTarget} onOpenChange={(o) => !o && setConfirmTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Révoquer le rôle moniteur ?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmTarget && (
                <>
                  <span className="font-medium text-foreground">
                    {confirmTarget.first_name} {confirmTarget.last_name}
                  </span>{" "}
                  perdra immédiatement l'accès à l'espace moniteur. Son compte enfant restera intact.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmTarget && revoke(confirmTarget)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Révoquer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminMoniteurs;
