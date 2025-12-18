export class CreateOrderDto {
  planId?: string;
  planSlug?: string;
  billingCycle: 'monthly' | 'hourly' = 'monthly';
}
