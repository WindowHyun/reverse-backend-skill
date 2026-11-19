import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail() email: string;
  @IsString() password: string;
}

export class RegisterDto {
  @IsEmail() email: string;
  @IsString() name: string;
  @IsString() password: string;
}
