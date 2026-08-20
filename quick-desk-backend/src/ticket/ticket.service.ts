import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTicketDto } from './dtos/create-ticket.dto';
import { ResolveTicketDto } from './dtos/resolve-ticket.dto';
import { TicketStatus } from 'src/common/enums/ticket-status.enum';
import { TicketCategory } from 'src/common/enums/ticket-category.enum';
import { TicketPriority } from 'src/common/enums/ticket-priority.enum';
import { isValidFilterParam } from 'src/common/helpers/filter.helper';
import { Prisma, Ticket } from '@prisma/client';

@Injectable()
export class TicketService {
    constructor(private readonly prisma: PrismaService) { }

    async getAllTicketsForEmployee(
        employeeId: string,
        take: number = 10,
        lastSeenId?: string,
        status?: string,
        orderBy: 'asc' | 'desc' = 'desc',
    ) {
        const where: Prisma.TicketWhereInput = {
            employeeId,
            ...(isValidFilterParam(status) && { status: status.toUpperCase() as TicketStatus }),
        };

        const tickets = await this.prisma.ticket.findMany({
            where,
            take: take + 1,
            ...(lastSeenId && {
                cursor: { id: lastSeenId },
                skip: 1,
            }),
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
        });

        const hasNextPage = tickets.length > take;
        if (hasNextPage) tickets.pop();

        const lastTicket = tickets.length > 0 ? tickets[tickets.length - 1] : null;

        return {
            tickets,
            hasNextPage,
            nextCursor: hasNextPage && lastTicket ? lastTicket.id : null,
        };
    }

    async getAllTicketsForAgents(
        take: number = 10,
        lastSeenId?: string,
        status?: string,
        category?: string,
        priority?: string,
        search?: string,
        orderBy: 'asc' | 'desc' = 'desc',
    ) {
        const where: Prisma.TicketWhereInput = {
            ...(isValidFilterParam(status) && { status: status.toUpperCase() as TicketStatus }),
            ...(isValidFilterParam(category) && { category: category.toUpperCase() as TicketCategory }),
            ...(isValidFilterParam(priority) && { priority: priority.toUpperCase() as TicketPriority }),
            ...(search && search.trim() !== '' && {
                title: { contains: search.trim(), mode: 'insensitive' },
            }),
        };

        const tickets = await this.prisma.ticket.findMany({
            where,
            take: take + 1,
            ...(lastSeenId && {
                cursor: { id: lastSeenId },
                skip: 1,
            }),
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
        });

        const hasNextPage = tickets.length > take;
        if (hasNextPage) tickets.pop();

        const lastTicket = tickets.length > 0 ? tickets[tickets.length - 1] : null;

        return {
            tickets,
            hasNextPage,
            nextCursor: hasNextPage && lastTicket ? lastTicket.id : null,
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
        await this.prisma.ticket.create({
            data: {
                title: dto.title,
                description: dto.description,
                attachments: dto.attachments,
                employeeId,
            }
        });
    }

    async resolveTicket(agentId: string, ticketId: string, dto: ResolveTicketDto) {
        return this.prisma.$transaction(async (tx) => {
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
                    reply: dto.reply
                }
            });
            const auditTicketLOgs: Prisma.AuditLogCreateManyInput[] = [];
            if (ticket.aiCategory !== dto.category) {
                auditTicketLOgs.push({
                    ticketId,
                    agentId,
                    field: 'CATEGORY',
                    oldValue: ticket.aiCategory,
                    newValue: dto.category
                });
            }
            if (ticket.aiPriority !== dto.priority) {
                auditTicketLOgs.push({
                    ticketId,
                    agentId,
                    field: 'PRIORITY',
                    oldValue: ticket.aiPriority,
                    newValue: dto.priority
                });
            }
            if (ticket.aiDraftReply !== dto.reply) {
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
    }
}
