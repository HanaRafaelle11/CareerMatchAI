import type { SubscriptionPlan } from './IBillingProvider';

export interface ISubscriptionService {
  getActivePlan(userId: string): Promise<SubscriptionPlan | null>;
  isEligibleForUpgrade(userId: string): Promise<boolean>;
}
