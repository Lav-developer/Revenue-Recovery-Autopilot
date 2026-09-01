import { aggregateExecutiveMetrics } from "./aggregation";
import { buildRecoveryFunnel } from "./funnel";
import { recentActivity } from "./activity";
import type { ActivityItem, ExecutiveMetrics, FunnelStage, MetricCase, MetricIntervention, MetricOutcome } from "./types";

export interface MetricsRepository { loadCases(merchantId: string): Promise<MetricCase[]>; loadInterventions(merchantId: string): Promise<MetricIntervention[]>; loadOutcomes(merchantId: string): Promise<MetricOutcome[]>; loadActivity(merchantId: string, limit: number): Promise<ActivityItem[]>; }
export async function getExecutiveMetrics(repository: MetricsRepository, merchantId: string): Promise<ExecutiveMetrics> { const [cases, interventions, outcomes] = await Promise.all([repository.loadCases(merchantId), repository.loadInterventions(merchantId), repository.loadOutcomes(merchantId)]); return aggregateExecutiveMetrics(cases, interventions, outcomes); }
export async function getFunnel(repository: MetricsRepository, merchantId: string): Promise<FunnelStage[]> { const [cases, interventions, outcomes] = await Promise.all([repository.loadCases(merchantId), repository.loadInterventions(merchantId), repository.loadOutcomes(merchantId)]); return buildRecoveryFunnel(cases, interventions, outcomes); }
export async function getActivity(repository: MetricsRepository, merchantId: string, limit = 20): Promise<ActivityItem[]> { return recentActivity(await repository.loadActivity(merchantId, limit), limit); }
