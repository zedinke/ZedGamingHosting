import { IsEnum } from 'class-validator';

export enum PaymentMethod {
  MOCK = 'mock',
  BARION = 'barion',
  STRIPE = 'stripe',
}

export class InitiatePaymentDto {
  @IsEnum(PaymentMethod)
  method!: PaymentMethod;
}
