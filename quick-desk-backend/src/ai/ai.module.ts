import { Module } from '@nestjs/common';
import { GeminiService } from './gemini/gemini.service';
import { RagService } from './rag/rag.service';

@Module({
  providers: [GeminiService, RagService],
  exports: [GeminiService, RagService],
})
export class AiModule {}
