import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async create(@Body() dto: CreateOrderDto, @Request() req: any) {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    return this.ordersService.createOrder({
      userId,
      userRole,
      planId: dto.planId,
      planSlug: dto.planSlug,
      billingCycle: dto.billingCycle || 'monthly',
    });
  }
}
