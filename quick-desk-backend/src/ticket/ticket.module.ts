import { Module } from '@nestjs/common';
import { TicketController } from './ticket.controller';
import { TicketService } from './ticket.service';
import { TicketGateway } from './ticket.gateway';
import { AiModule } from 'src/ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [TicketController],
  providers: [TicketService, TicketGateway],
})
export class TicketModule {}
