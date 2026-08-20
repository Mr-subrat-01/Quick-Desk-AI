import { IsEnum, IsNotEmpty, IsString, MaxLength } from "class-validator";
import { TicketCategory } from "src/common/enums/ticket-category.enum";
import { TicketPriority } from "src/common/enums/ticket-priority.enum";

export class ResolveTicketDto {
    @IsNotEmpty()
    @IsEnum(TicketCategory)
    category: string;

    @IsNotEmpty()
    @IsEnum(TicketPriority)
    priority: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(2000, {message: "Reply must be at most 2000 characters long."})
    reply: string;
}   