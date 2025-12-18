import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { CreatePromotionDto, UpdatePromotionDto } from '@zed-hosting/shared-types';
import { PromotionScope, GameType, UserRole } from '@zed-hosting/db';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Public()
  @Get('public')
  async getPublicPromotions(
    @Query('gameType') gameType?: GameType,
    @Query('planId') planId?: string,
  ) {
    return this.promotionsService.getActivePromotions(gameType, planId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  async findAll(
    @Query('scope') scope?: PromotionScope,
    @Query('active') active?: string,
    @Query('gameType') gameType?: GameType,
    @Query('planId') planId?: string,
    @Query('currentOnly') currentOnly?: string,
  ) {
    const activeFlag = active === undefined ? undefined : ['true', '1', 'yes'].includes(active.toLowerCase());
    const currentFlag = currentOnly ? ['true', '1', 'yes'].includes(currentOnly.toLowerCase()) : false;

    return this.promotionsService.findAll({
      scope,
      active: activeFlag,
      gameType,
      planId,
      currentOnly: currentFlag,
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  async findOne(@Param('id') id: string) {
    return this.promotionsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  async create(@Body() dto: CreatePromotionDto) {
    return this.promotionsService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdatePromotionDto) {
    return this.promotionsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.promotionsService.remove(id);
  }
}
