import { ArrayMaxSize, IsArray, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateTicketDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100, {message: "Title must be at most 100 characters long."})
    title: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(1000, {message: "Description must be at most 1000 characters long."})
    description: string;

    @IsArray()
    @IsOptional()
    @ArrayMaxSize(3, {message: "You can only attach 3 files at once."})
    @IsString({each:true})
    attachments?: string[]
}