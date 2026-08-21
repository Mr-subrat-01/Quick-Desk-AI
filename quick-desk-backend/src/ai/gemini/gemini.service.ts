import { GoogleGenAI } from '@google/genai';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TicketCategory } from 'src/common/enums/ticket-category.enum';
import { TicketPriority } from 'src/common/enums/ticket-priority.enum';

@Injectable()
export class GeminiService implements OnModuleInit {
    private ai: GoogleGenAI;
    private readonly categories = Object.values(TicketCategory).join(' | ');
    private readonly priorities = Object.values(TicketPriority).join(' | ');
    private model: string;
    constructor(
        private configService: ConfigService,
    ) {}
    onModuleInit() {
        this.ai = new GoogleGenAI();
        this.model = this.configService.get<string>('GEMINI_MODEL')!;
    }
    async analyzeTicket(title: string, description: string) {
        const response = await this.ai.models.generateContent({
            model: this.model,
            contents: `Analyze this support ticket. Title: ${title} Description: ${description}`,
            config: {
                systemInstruction: `
                    You are an AI support ticket analyzer.
                    Classify the ticket into one of the allowed categories and one of the allowed priorities.
                    Categories: ${this.categories}
                    Priorities: ${this.priorities}
                `,
                responseMimeType: "application/json",
                responseSchema: {
                    type: "object",
                    properties: {
                        category: {
                            type: "string",
                            enum: Object.values(TicketCategory)
                        },
                        priority: {
                            type: "string",
                            enum: Object.values(TicketPriority)
                        }
                    },
                    required: ["category", "priority"]
                }
            }
        });

        const text = response.text;
        if (!text) {
            throw new Error("AI response text is missing");
        }
        const data = JSON.parse(text);
        return {
            category: data.category as TicketCategory,
            priority: data.priority as TicketPriority
        }
    }
}
