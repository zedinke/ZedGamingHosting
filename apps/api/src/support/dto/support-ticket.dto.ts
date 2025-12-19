import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_CUSTOMER = 'WAITING_CUSTOMER',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export class CreateSupportTicketDto {
  @IsString()
  subject: string = '';

  @IsString()
  description: string = '';

  @IsEnum(TicketPriority)
  priority: TicketPriority = TicketPriority.MEDIUM;

  @IsOptional()
  @IsString()
  category?: string;
}

export class UpdateTicketDto {
  @IsOptional()
  @IsString()
  response?: string;

  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;
}

export class AddCommentDto {
  @IsString()
  message: string = '';
}
