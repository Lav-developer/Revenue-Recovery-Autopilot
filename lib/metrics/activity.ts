import type { ActivityItem } from "./types";
export function recentActivity(items: readonly ActivityItem[], limit = 20): ActivityItem[] { return [...items].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit); }
