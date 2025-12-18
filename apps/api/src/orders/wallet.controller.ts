import { Controller, Get, Post, Body, Request, UseGuards, Param } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@zed-hosting/db';

export class AddBalanceDto {
  userId: string;
  amount: number;
  reason: string;
}

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  async getBalance(@Request() req: any) {
    return this.walletService.getBalance(req.user?.id);
  }

  @Post('add')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  async addBalance(@Body() dto: AddBalanceDto, @Request() req: any) {
    return this.walletService.addBalance({
      userId: dto.userId,
      amount: dto.amount,
      reason: dto.reason,
      adminId: req.user?.id,
    });
  }
}
