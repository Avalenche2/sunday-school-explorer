import { Lock } from "lucide-react";
import { BADGES, type BadgeDef } from "@/lib/badges";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  unlocked: Set<string>;
  filter?: BadgeDef["category"];
}

const tierStyles: Record<BadgeDef["tier"], string> = {
  or: "bg-gradient-gold text-gold-foreground shadow-gold border-accent/40",
  argent: "bg-secondary text-foreground border border-accent/30",
  bronze: "bg-muted text-foreground border border-border",
};

export const BadgeGrid = ({ unlocked, filter }: Props) => {
  const list = filter ? BADGES.filter((b) => b.category === filter) : BADGES;

  return (
    <TooltipProvider delayDuration={150}>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {list.map((b) => {
          const isUnlocked = unlocked.has(b.id);
          const Icon = b.icon;
          return (
            <Tooltip key={b.id}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "group relative rounded-xl border p-4 flex flex-col items-center text-center gap-2 transition-all",
                    isUnlocked
                      ? "border-accent/40 bg-card hover:shadow-elevated"
                      : "border-dashed border-border bg-muted/40 opacity-70"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-full",
                      isUnlocked
                        ? tierStyles[b.tier]
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {isUnlocked ? (
                      <Icon className="h-5 w-5" strokeWidth={1.8} />
                    ) : (
                      <Lock className="h-4 w-4" strokeWidth={1.8} />
                    )}
                  </div>
                  <p className={cn(
                    "text-xs font-medium leading-tight",
                    !isUnlocked && "text-muted-foreground"
                  )}>
                    {b.name}
                  </p>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[200px] text-center">
                <p className="font-medium">{b.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{b.description}</p>
                {!isUnlocked && (
                  <p className="text-[10px] uppercase tracking-wider text-accent mt-2">
                    À débloquer
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
};
