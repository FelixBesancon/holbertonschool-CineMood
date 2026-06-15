/**
 * Shared UI constants kept in sync with backend enum values.
 *
 * PRESTIGE_TIERS: ordered best → worst, ids match PrestigeTier enum values
 * from backend/app/models/prestige_tier.py ("Platinum", "Gold", …).
 * PRESTIGE_RECORD: fast lookup by id for display in cards and badges.
 * PRESTIGE_RANK: numeric rank for sorting (lower = better).
 */

export interface PrestigeTier {
  id: string
  label: string
  emoji: string
}

export const PRESTIGE_TIERS: PrestigeTier[] = [
  { id: "Platinum", label: "Platinum", emoji: "💎" },
  { id: "Gold",     label: "Gold",     emoji: "🥇" },
  { id: "Silver",   label: "Silver",   emoji: "🥈" },
  { id: "Bronze",   label: "Bronze",   emoji: "🥉" },
  { id: "Coal",     label: "Coal",     emoji: "⚫" },
  { id: "Trash",    label: "Trash",    emoji: "🗑️" },
]

export const PRESTIGE_RECORD: Record<string, PrestigeTier> = Object.fromEntries(
  PRESTIGE_TIERS.map((tier) => [tier.id, tier])
)

export const PRESTIGE_RANK: Record<string, number> = Object.fromEntries(
  PRESTIGE_TIERS.map((tier, i) => [tier.id, i])
)
