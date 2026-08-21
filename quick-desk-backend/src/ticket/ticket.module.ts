import { Module } from '@nestjs/common';
import { TicketController } from './ticket.controller';
import { TicketService } from './ticket.service';
import { GeminiService } from 'src/ai/gemini/gemini.service';
import { TicketGateway } from './ticket.gateway';

@Module({
  controllers: [TicketController],
  providers: [TicketService, GeminiService, TicketGateway]
})
export class TicketModule { }
