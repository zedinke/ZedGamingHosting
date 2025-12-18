import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PlansService } from './plans.service';
import { CreatePlanDto, UpdatePlanDto } from '@zed-hosting/shared-types';
import { PlanStatus, GameType, UserRole } from '@zed-hosting/db';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  /**
   * Public: Get all active plans (optionally filtered by game type)
   */
  @Get('public')
  async getPublicPlans(@Query('gameType') gameType?: GameType) {
    return this.plansService.findAll(gameType, PlanStatus.ACTIVE);
  }

  /**
   * Public: Get plans for specific game type
   */
  @Get('public/game/:gameType')
  async getByGameType(@Param('gameType') gameType: GameType) {
    return this.plansService.getByGameType(gameType);
  }

  /**
   * Public: Get single plan by slug
   */
  @Get('public/:slug')
  async getPublicPlan(@Param('slug') slug: string) {
    return this.plansService.findOne(slug);
  }

  /**
   * Admin: Get all plans (with filters)
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async findAll(
    @Query('gameType') gameType?: GameType,
    @Query('status') status?: PlanStatus,
  ) {
    return this.plansService.findAll(gameType, status);
  }

  /**
   * Admin: Get single plan by ID
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async findOne(@Param('id') id: string) {
    return this.plansService.findOne(id);
  }

  /**
   * Admin: Create new plan
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(@Body() createPlanDto: CreatePlanDto) {
    return this.plansService.create(createPlanDto);
  }

  /**
   * Admin: Update plan
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updatePlanDto: UpdatePlanDto,
  ) {
    return this.plansService.update(id, updatePlanDto);
  }

  /**
   * Admin: Delete/Archive plan
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.plansService.remove(id);
  }
}
