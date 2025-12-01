import { IsString, IsNotEmpty } from 'class-validator';

export class CreateDiaryDto {
    @IsString()
    @IsNotEmpty()
    treeId: string;

    @IsString()
    @IsNotEmpty()
    content: string;
}
