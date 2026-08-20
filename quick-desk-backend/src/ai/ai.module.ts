import { Module } from '@nestjs/common';
import { GeminiService } from './gemini/gemini.service';
import { RagService } from './rag/rag.service';
import { RagLoaderService } from './rag/rag-loader.service';
import { EmbeddingsService } from './rag/embeddings.service';

@Module({
  providers: [GeminiService, RagService, RagLoaderService, EmbeddingsService]
})
export class AiModule {}
