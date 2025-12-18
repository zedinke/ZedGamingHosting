import { Body, Controller, Post, Request, UseGuards, Get, Param } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PaymentService } from './payment.service';
import { BillingCycle, CreateOrderDto } from './dto/create-order.dto';
import { InitiatePaymentDto } from './dto/payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly paymentService: PaymentService,
  ) {}

  @Post()
  async create(@Body() dto: CreateOrderDto, @Request() req: any) {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    return this.ordersService.createOrder({
      userId,
      userRole,
      planId: dto.planId,
      planSlug: dto.planSlug,
      billingCycle: dto.billingCycle || BillingCycle.MONTHLY,
    });
  }

  @Get()
  async list(@Request() req: any) {
    return this.ordersService.listOrders(req.user?.id);
  }

  @Get(':id')
  async getOne(@Param('id') id: string, @Request() req: any) {
    return this.ordersService.getOrderById(id, req.user?.id);
  }

  @Post(':id/payment')
  async initiatePayment(
    @Param('id') orderId: string,
    @Body() dto: InitiatePaymentDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id;

    if (dto.method === 'mock') {
      return this.paymentService.processMockPayment(orderId, userId);
    } else if (dto.method === 'barion') {
      return this.paymentService.generateBarionRedirect(orderId, userId);
    } else if (dto.method === 'stripe') {
      return this.paymentService.generateStripeSession(orderId, userId);
    }

    throw new Error('Unsupported payment method');
  }
}
