import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SubdomainsService } from './subdomains.service';
import { CreateSubdomainDto } from './dto/create-subdomain.dto';
import { UpdateSubdomainDto } from './dto/update-subdomain.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('subdomains')
@UseGuards(JwtAuthGuard)
export class SubdomainsController {
  constructor(private readonly subdomainsService: SubdomainsService) {}

  @Post()
  async create(@Body() createDto: CreateSubdomainDto, @Request() req: any) {
    return await this.subdomainsService.create(createDto, req.user.id);
  }

  @Get()
  async findAll(@Request() req: any) {
    // TODO: Filter by user's servers based on req.user.role
    // For now, return all subdomains (admin-only endpoint)
    return await this.subdomainsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.subdomainsService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateSubdomainDto) {
    return await this.subdomainsService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.subdomainsService.remove(id);
    return { message: 'Subdomain deleted successfully' };
  }
}

