import { useEffect, useState } from "react";
import { Check, Loader2, UserCheck, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AdminRequest {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
}

export const PendingAdminRequests = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const load = async () => {
    const { data, error } = await supabase
      .from("admin_requests")
      .select("id, user_id, first_name, last_name, email, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setRequests(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const approve = async (req: AdminRequest) => {
    setProcessing(req.id);

    // Ajout du rôle admin (upsert au cas où)
    const { error: roleError } = await supabase
      .from("user_roles")
      .insert({ user_id: req.user_id, role: "admin" });

    if (roleError && !roleError.message.includes("duplicate")) {
      setProcessing(null);
      toast({
        title: "Erreur",
        description: "Impossible d'attribuer le rôle moniteur.",
        variant: "destructive",
      });
      return;
    }

    const { error: updError } = await supabase
      .from("admin_requests")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id ?? null,
      })
      .eq("id", req.id);

    setProcessing(null);

    if (updError) {
      toast({ title: "Erreur", description: updError.message, variant: "destructive" });
      return;
    }

    toast({
      title: "Demande approuvée",
      description: `${req.first_name} ${req.last_name} est désormais moniteur.`,
    });
    setRequests((prev) => prev.filter((r) => r.id !== req.id));
  };

  const reject = async (req: AdminRequest) => {
    setProcessing(req.id);
    const { error } = await supabase
      .from("admin_requests")
      .update({
        status: "rejected",
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id ?? null,
      })
      .eq("id", req.id);
    setProcessing(null);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Demande refusée", description: `${req.first_name} ${req.last_name}.` });
    setRequests((prev) => prev.filter((r) => r.id !== req.id));
  };

  if (loading) {
    return (
      <Card className="shadow-soft">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-accent" />
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) return null;

  return (
    <Card className="shadow-soft border-accent/30">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <UserCheck className="h-4 w-4 text-accent" strokeWidth={1.8} />
          <h3 className="font-serif text-lg">Demandes de moniteurs</h3>
          <Badge variant="secondary" className="ml-1">
            {requests.length}
          </Badge>
        </div>

        <ul className="divide-y divide-border/60">
          {requests.map((req) => (
            <li
              key={req.id}
              className="py-3 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">
                  {req.first_name} {req.last_name}
                </p>
                <p className="text-xs text-muted-foreground truncate">{req.email}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
                  {new Date(req.created_at).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => reject(req)}
                  disabled={processing === req.id}
                >
                  <X className="h-3.5 w-3.5" />
                  Refuser
                </Button>
                <Button
                  size="sm"
                  onClick={() => approve(req)}
                  disabled={processing === req.id}
                >
                  {processing === req.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  Approuver
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};
