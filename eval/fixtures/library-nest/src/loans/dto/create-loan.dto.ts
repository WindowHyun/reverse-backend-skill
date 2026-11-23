import { IsInt } from 'class-validator';

export class CreateLoanDto {
  @IsInt() userId: number;
  @IsInt() bookId: number;
}
