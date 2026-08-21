import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTicketDto } from './dtos/create-ticket.dto';
import { ResolveTicketDto } from './dtos/resolve-ticket.dto';
import { TicketStatus } from 'src/common/enums/ticket-status.enum';
import { TicketCategory } from 'src/common/enums/ticket-category.enum';
import { TicketPriority } from 'src/common/enums/ticket-priority.enum';
import { isValidFilterParam } from 'src/common/helpers/filter.helper';
import { Prisma, Ticket } from '@prisma/client';
import { GeminiService } from 'src/ai/gemini/gemini.service';
import { TicketGateway } from './ticket.gateway';

@Injectable()
export class TicketService {
    private readonly logger = new Logger(TicketService.name);
    constructor(private readonly prisma: PrismaService,
        private readonly geminiService: GeminiService,
        private readonly ticketGateway: TicketGateway
    ) { }

    async getAllTicketsForEmployee(
        employeeId: string,
        page: number = 1,
        limit: number = 10,
        status?: string,
        orderBy: 'asc' | 'desc' = 'desc',
    ) {
        const skip = (page - 1) * limit;
        const take = limit;

        const where: Prisma.TicketWhereInput = {
            employeeId,
            ...(isValidFilterParam(status) && { status: status.toUpperCase() as TicketStatus }),
        };

        const [tickets, total] = await Promise.all([
            this.prisma.ticket.findMany({
                where,
                skip,
                take,
                orderBy: [{ createdAt: orderBy }],
                select: {
                    id: true,
                    title: true,
                    description: true,
                    status: true,
                    priority: true,
                    category: true,
                    reply: true,
                    attachments: true,
                    createdAt: true,
                    updatedAt: true,
                    agent: {
                        select: {
                            firstName: true,
                        },
                    },
                },
            }),
            this.prisma.ticket.count({ where }),
        ]);

        return {
            tickets,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page * limit < total,
            hasPreviousPage: page > 1,
        };
    }

    async getAllTicketsForAgents(
        page: number = 1,
        limit: number = 10,
        status?: string,
        category?: string,
        priority?: string,
        search?: string,
        orderBy: 'asc' | 'desc' = 'desc',
    ) {
        const skip = (page - 1) * limit;
        const take = limit;

        const where: Prisma.TicketWhereInput = {
            ...(isValidFilterParam(status) && { status: status.toUpperCase() as TicketStatus }),
            ...(isValidFilterParam(category) && { category: category.toUpperCase() as TicketCategory }),
            ...(isValidFilterParam(priority) && { priority: priority.toUpperCase() as TicketPriority }),
            ...(search && search.trim() !== '' && {
                title: { contains: search.trim(), mode: 'insensitive' },
            }),
        };

        const [tickets, total] = await Promise.all([
            this.prisma.ticket.findMany({
                where,
                skip,
                take,
                orderBy: [{ createdAt: orderBy }],
                select: {
                    id: true,
                    title: true,
                    description: true,
                    status: true,
                    priority: true,
                    category: true,
                    aiPriority: true,
                    aiCategory: true,
                    aiDraftReply: true,
                    citations: true,
                    reply: true,
                    attachments: true,
                    createdAt: true,
                    updatedAt: true,
                    agent: {
                        select: {
                            firstName: true,
                        },
                    },
                    employee: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
            }),
            this.prisma.ticket.count({ where }),
        ]);

        return {
            tickets,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page * limit < total,
            hasPreviousPage: page > 1,
        };
    }

    async getTicketById(ticketId: string, userId: string, userRole: string) {
        const where: Prisma.TicketWhereInput = {
            id: ticketId,
            ...(userRole === 'EMPLOYEE' && { employeeId: userId }),
        };

        const ticket = await this.prisma.ticket.findFirst({
            where,
            select: {
                id: true,
                title: true,
                description: true,
                status: true,
                priority: true,
                category: true,
                aiPriority: true,
                aiCategory: true,
                aiDraftReply: true,
                citations: true,
                reply: true,
                attachments: true,
                employeeId: true,
                agentId: true,
                createdAt: true,
                updatedAt: true,
                agent: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                employee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                auditLogs: {
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        field: true,
                        oldValue: true,
                        newValue: true,
                        createdAt: true,
                        agent: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
            },
        });

        if (!ticket) {
            throw new NotFoundException('Ticket not found');
        }

        return ticket;
    }
    async createTicket(employeeId: string, dto: CreateTicketDto) {
        const ticket = await this.prisma.ticket.create({
            data: {
                title: dto.title,
                description: dto.description,
                attachments: dto.attachments,
                employeeId,
            }
        });
        this.processTicketAI(ticket.id, ticket.title, ticket.description);
        return ticket;
    }

    async resolveTicket(agentId: string, ticketId: string, dto: ResolveTicketDto, exceptSocketId?: string) {
        const updateTicketRecord = await this.prisma.$transaction(async (tx) => {
            const tickets = await tx.$queryRaw<Ticket[]>`
            select * from tickets where id=${ticketId} for update`;
            const ticket = tickets[0];
            if (!ticket) {
                throw new NotFoundException('Ticket not found');
            }
            if (ticket.status !== TicketStatus.OPEN) {
                throw new BadRequestException(`Cannot resolve ticket that is not in "${TicketStatus.OPEN}" status`);
            }
            const updateTicket = await tx.ticket.update({
                where: {
                    id: ticketId
                },
                data: {
                    agentId,
                    status: TicketStatus.RESOLVED,
                    category: dto.category,
                    priority: dto.priority,
                    reply: dto.reply,
                    resolvedAt: new Date()
                }
            });
            const auditTicketLOgs: Prisma.AuditLogCreateManyInput[] = [];
            if (ticket.aiCategory && (ticket.aiCategory  !== dto.category)) {
                auditTicketLOgs.push({
                    ticketId,
                    agentId,
                    field: 'CATEGORY',
                    oldValue: ticket.aiCategory,
                    newValue: dto.category
                });
            }
            if (ticket.aiPriority && (ticket.aiPriority !== dto.priority)) {
                auditTicketLOgs.push({
                    ticketId,
                    agentId,
                    field: 'PRIORITY',
                    oldValue: ticket.aiPriority,
                    newValue: dto.priority
                });
            }
            if (ticket.aiDraftReply && (ticket.aiDraftReply !== dto.reply)) {
                auditTicketLOgs.push({
                    ticketId,
                    agentId,
                    field: 'REPLY',
                    oldValue: ticket.aiDraftReply,
                    newValue: dto.reply
                });
            }
            if (auditTicketLOgs.length > 0) {
                await tx.auditLog.createMany({
                    data: auditTicketLOgs
                });
            }
            return updateTicket;
        });
        const payload = {
            ticketId: updateTicketRecord.id,
            title: updateTicketRecord.title,
            category: updateTicketRecord.category,
            priority: updateTicketRecord.priority,
        };
        this.ticketGateway.emitToEmploye('ticket:resolved',payload,updateTicketRecord.employeeId);
        this.ticketGateway.emitToAgents('ticket:resolved',payload,exceptSocketId);
        return updateTicketRecord;
    }

    private async processTicketAI(ticketId: string, title: string, description: string) {
        try {
            const { category, priority } = await this.geminiService.analyzeTicket(title, description);
            this.logger.log(`Ticket ${ticketId} processed with AI. Category: ${category}, Priority: ${priority}`);
            await this.prisma.ticket.update({
                where: { id: ticketId },
                data: {
                    aiCategory: category,
                    aiPriority: priority,
                },
            });
        } catch (error) {
            this.logger.error(`Failed to process ticket ${ticketId} with AI`, error);
        } finally {
            this.ticketGateway.emitToAgents('ticket:raised', { ticketId, title });
        }
    }
}
