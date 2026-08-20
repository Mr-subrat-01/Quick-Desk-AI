import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TicketService } from './ticket.service';
import { CreateTicketDto } from './dtos/create-ticket.dto';
import { ResolveTicketDto } from './dtos/resolve-ticket.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@Controller('ticket')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Post()
  @Roles(UserRole.EMPLOYEE)
  async createTicket(
    @CurrentUser('id') employeeId: string,
    @Body() dto: CreateTicketDto,
  ) {
    const ticket = await this.ticketService.createTicket(employeeId, dto);
    return {
      message: 'Ticket rised successfully',
      ticket,
    };
  }

  @Get()
  async getAllTickets(
    @CurrentUser() user: { id: string; role: string },
    @Query('take', new DefaultValuePipe(10), ParseIntPipe) take: number,
    @Query('lastSeenId') lastSeenId?: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('priority') priority?: string,
    @Query('search') search?: string,
    @Query('orderBy') orderBy?: 'asc' | 'desc',
  ) {
    if (user.role === UserRole.EMPLOYEE) {
      return this.ticketService.getAllTicketsForEmployee(
        user.id,
        take,
        lastSeenId,
        status,
        orderBy,
      );
    }
    return this.ticketService.getAllTicketsForAgents(
      take,
      lastSeenId,
      status,
      category,
      priority,
      search,
      orderBy,
    );
  }

  @Get(':id')
  async getTicketById(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.ticketService.getTicketById(id, user.id, user.role);
  }

  @Patch(':id/resolve')
  @Roles(UserRole.AGENT)
  async resolveTicket(
    @Param('id') id: string,
    @CurrentUser('id') agentId: string,
    @Body() dto: ResolveTicketDto,
  ) {
    const ticket = await this.ticketService.resolveTicket(agentId, id, dto);
    return {
      message: 'Ticket resolved successfully',
      ticket,
    };
  }
}
