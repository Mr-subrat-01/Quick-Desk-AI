import { Test, TestingModule } from '@nestjs/testing';
import { RagLoaderService } from './rag-loader.service';

describe('RagLoaderService', () => {
  let service: RagLoaderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RagLoaderService],
    }).compile();

    service = module.get<RagLoaderService>(RagLoaderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
