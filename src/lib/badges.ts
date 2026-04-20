import {
  Award,
  Crown,
  Flame,
  Medal,
  Sparkles,
  Star,
  Target,
  Trophy,
  type LucideIcon,
} from "lucide-react";

export type BadgeCategory = "participation" | "performance" | "regularite" | "podium";

export interface BadgeDef {
  id: string;
  name: string;
  description: string;
  category: BadgeCategory;
  icon: LucideIcon;
  /** "or" = doré, "argent" = secondaire, "bronze" = subtil */
  tier: "or" | "argent" | "bronze";
}

export interface AttemptLite {
  id: string;
  quiz_id: string;
  score: number;
  total: number;
  completed_at: string;
}

export interface MonthlyRankInfo {
  /** rang dans le classement du mois en cours, 1-based, ou null si non classé */
  rank: number | null;
}

export const BADGES: BadgeDef[] = [
  // Participation
  { id: "first_quiz", name: "Premier pas", description: "Termine ton premier quizz", category: "participation", icon: Sparkles, tier: "bronze" },
  { id: "five_quiz", name: "Apprenti fidèle", description: "Termine 5 quizz", category: "participation", icon: Star, tier: "argent" },
  { id: "ten_quiz", name: "Disciple assidu", description: "Termine 10 quizz", category: "participation", icon: Award, tier: "argent" },
  { id: "twenty_five_quiz", name: "Pèlerin", description: "Termine 25 quizz", category: "participation", icon: Trophy, tier: "or" },

  // Performance
  { id: "perfect_score", name: "Sans-faute", description: "Obtiens 100% sur un quizz", category: "performance", icon: Target, tier: "argent" },
  { id: "ten_out_of_ten", name: "10 sur 10", description: "Réussis un quizz d'au moins 10 questions à 100%", category: "performance", icon: Medal, tier: "or" },
  { id: "three_perfect_streak", name: "Trio parfait", description: "3 sans-faute d'affilée", category: "performance", icon: Flame, tier: "or" },

  // Régularité
  { id: "two_weeks_streak", name: "Régularité", description: "Quizz fait 2 semaines de suite", category: "regularite", icon: Flame, tier: "argent" },
  { id: "four_weeks_streak", name: "Constance", description: "Quizz fait 4 semaines de suite", category: "regularite", icon: Flame, tier: "or" },

  // Podium (mensuel)
  { id: "monthly_top_3", name: "Top 3 du mois", description: "Termine dans le top 3 mensuel", category: "podium", icon: Medal, tier: "argent" },
  { id: "monthly_first", name: "Champion du mois", description: "1er du classement mensuel", category: "podium", icon: Crown, tier: "or" },
];

const startOfWeekMonday = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay(); // 0 dim - 6 sam
  const diff = (day + 6) % 7; // jours depuis lundi
  x.setDate(x.getDate() - diff);
  return x;
};

const weekKey = (d: Date) => {
  const m = startOfWeekMonday(d);
  return `${m.getFullYear()}-${m.getMonth()}-${m.getDate()}`;
};

const consecutiveWeeks = (attempts: AttemptLite[]): number => {
  if (attempts.length === 0) return 0;
  const weeks = new Set(attempts.map((a) => weekKey(new Date(a.completed_at))));
  let count = 0;
  let cursor = startOfWeekMonday(new Date());
  while (weeks.has(weekKey(cursor))) {
    count += 1;
    cursor.setDate(cursor.getDate() - 7);
  }
  return count;
};

const longestPerfectStreak = (attempts: AttemptLite[]): number => {
  const sorted = [...attempts].sort(
    (a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime()
  );
  let best = 0;
  let cur = 0;
  for (const a of sorted) {
    if (a.total > 0 && a.score === a.total) {
      cur += 1;
      best = Math.max(best, cur);
    } else {
      cur = 0;
    }
  }
  return best;
};

export const computeUnlockedBadges = (
  attempts: AttemptLite[],
  monthly?: MonthlyRankInfo
): Set<string> => {
  const unlocked = new Set<string>();
  const count = attempts.length;

  if (count >= 1) unlocked.add("first_quiz");
  if (count >= 5) unlocked.add("five_quiz");
  if (count >= 10) unlocked.add("ten_quiz");
  if (count >= 25) unlocked.add("twenty_five_quiz");

  const anyPerfect = attempts.some((a) => a.total > 0 && a.score === a.total);
  if (anyPerfect) unlocked.add("perfect_score");

  const tenOutTen = attempts.some((a) => a.total >= 10 && a.score === a.total);
  if (tenOutTen) unlocked.add("ten_out_of_ten");

  if (longestPerfectStreak(attempts) >= 3) unlocked.add("three_perfect_streak");

  const streak = consecutiveWeeks(attempts);
  if (streak >= 2) unlocked.add("two_weeks_streak");
  if (streak >= 4) unlocked.add("four_weeks_streak");

  if (monthly?.rank) {
    if (monthly.rank <= 3) unlocked.add("monthly_top_3");
    if (monthly.rank === 1) unlocked.add("monthly_first");
  }

  return unlocked;
};
