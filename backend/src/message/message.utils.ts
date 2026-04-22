/** Réaction agrégée par emoji avec le nombre de votes et les IDs des votants. */
export type AggregatedReaction = {
  emoji: string;
  count: number;
  userIds: string[];
};

/**
 * Agrège une liste brute de réactions par emoji.
 * @param reactions - Liste de réactions brutes {emoji, userId}
 * @returns Liste agrégée [{emoji, count, userIds}]
 */
export function aggregateReactions(
  reactions: { emoji: string; userId: string }[],
): AggregatedReaction[] {
  const map = new Map<string, string[]>();
  for (const r of reactions) {
    if (!map.has(r.emoji)) map.set(r.emoji, []);
    map.get(r.emoji)!.push(r.userId);
  }
  return Array.from(map.entries()).map(([emoji, userIds]) => ({
    emoji,
    count: userIds.length,
    userIds,
  }));
}
