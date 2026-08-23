import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { ChatGoogle } from '@langchain/google';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { DirectoryLoader } from "@langchain/classic/document_loaders/fs/directory";
import { TextLoader } from "@langchain/classic/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

import path from 'path';
@Injectable()
export class RagService implements OnModuleInit {
    private readonly logger = new Logger(RagService.name);

    constructor(private readonly configService: ConfigService) { }
    private chatModel: ChatGoogle;
    private embeddings: GoogleGenerativeAIEmbeddings;
    private vectorStore: MemoryVectorStore;
    async onModuleInit() {
        const geminApiKey = this.configService.get<string>('GEMINI_API_KEY')
        const chatModelName = this.configService.get<string>('GEMINI_CHAT_MODEL')!;
        const embeddingModelName = this.configService.get<string>('GEMINI_EMBEDDING_MODEL')!;

        // 1.initialize ChatGoogle
        this.chatModel = new ChatGoogle({
            apiKey: geminApiKey,
            model: chatModelName,
        });
        // 2. Initialize GoogleGenerativeAIEmbeddings
        this.embeddings = new GoogleGenerativeAIEmbeddings({
            apiKey: geminApiKey,
            model: embeddingModelName,
        });
        this.logger.log('rag initialized')
        //4.Ingest knowledge base
        await this.ingestKnowledgeBase();
    }
 
    private async ingestKnowledgeBase() {
        // load files
        const kbPath = path.join(process.cwd(), 'knowledge-base');
        const loader = new DirectoryLoader(kbPath, {
            ".md": (path) => new TextLoader(path)
        });
        const docs = await loader.load()

        //split docuemnts into Chunks
        const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 700, chunkOverlap: 100 })
        const chunks = await splitter.splitDocuments(docs);

        // store in vector storE
        this.vectorStore = await MemoryVectorStore.fromDocuments(chunks, this.embeddings);
        this.logger.log('knowledge base ingested');
    }
    async generateDraftReply(title: string, description: string) {
        if (!this.vectorStore) {
            throw new Error(
                'RAG knowledge base has not been initialized',
            );
        }
        //sementic search with score
        const query = `${title}\n${description}`;
        const results = await this.vectorStore.similaritySearchWithScore(query, 3);
        
        const topDocuments = results
            .filter(([_, score]) => score > 0.6)
            .map(([doc]) => doc);
        
        if (topDocuments.length === 0) {
            return {
                draftReply: "No relevant information was found in the knowledge base to address this ticket.",
                citations: []
            }
        }

        const context = topDocuments
            .map((doc) => doc.pageContent)
            .join('\n\n');
        
        //generate reply
        const prompt = `You are a helpfull support agent. Generate a draft reply for this support ticket using ONLY the provided knowledge base context
        IMPORTANT RULES:
        - Use only information contained in the provided knowledge base.
        - If your can't find answer in the context return: "No relevant information was found in the knowledge base to address this ticket."
        - Do not invent troubleshooting steps.
        - Do not make assumptions.
        - Keep the response concise and professional.
        - Do not mention the knowledge base or RAG.
        - Do not use markdown formatting in the response.
        - Answer only in English language.
        Title:${title}
        Description:${description}
        Knowledge Base Context:${context}
        Generate the draft reply now:`;
        const response = await this.chatModel.invoke(prompt);
        //extract reply
        const citations = Array.from(new Set(topDocuments.map((doc) => path.basename(doc.metadata.source as string))));
        const draftReply = response.text;
        return {
            draftReply,
            citations
        }
    }
}
