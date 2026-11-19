import { Exclude } from 'class-transformer';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Role } from '../common/role.enum';

@Entity()
export class User {
  @PrimaryGeneratedColumn() id: number;
  @Column({ unique: true }) email: string;
  @Column() name: string;
  @Column({ default: Role.User }) role: Role;
  @Exclude() @Column() passwordHash: string;
}
