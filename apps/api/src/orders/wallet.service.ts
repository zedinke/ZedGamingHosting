import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@zed-hosting/db';
import { AuditService } from '../audit/audit.service';

interface AddBalanceInput {
  userId: string;
  amount: number;
  reason: string;
  adminId?: string;
}

@Injectable()
export class WalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Add balance to user wallet
   */
  async addBalance(input: AddBalanceInput) {
    const { userId, amount, reason, adminId } = input;

    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        balance: user.balance + amount,
      },
    });

    if (adminId) {
      await this.auditService.createLog({
        action: 'ADD_BALANCE',
        resourceId: userId,
        userId: adminId,
        ipAddress: 'system',
        details: { amount, reason, previousBalance: user.balance, newBalance: updatedUser.balance },
      });
    }

    return updatedUser;
  }

  /**
   * Deduct balance from user wallet (e.g., for order payment)
   */
  async deductBalance(userId: string, amount: number, reason: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.balance < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        balance: user.balance - amount,
      },
    });

    await this.auditService.createLog({
      action: 'DEDUCT_BALANCE',
      resourceId: userId,
      userId,
      ipAddress: 'system',
      details: { amount, reason, previousBalance: user.balance, newBalance: updatedUser.balance },
    });

    return updatedUser;
  }

  /**
   * Get user balance
   */
  async getBalance(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, balance: true, email: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
