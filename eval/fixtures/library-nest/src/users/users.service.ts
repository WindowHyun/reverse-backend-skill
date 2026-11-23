import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  findByEmail(email: string) {
    return this.repo.findOneBy({ email });
  }

  findOne(id: number) {
    return this.repo.findOneByOrFail({ id });
  }

  create(data: Partial<User>) {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: number, dto: UpdateUserDto) {
    const user = await this.repo.findOneByOrFail({ id });
    Object.assign(user, dto);
    return this.repo.save(user);
  }

  search(q: string) {
    return this.repo.createQueryBuilder('u').where(`u.name LIKE '%${q}%'`).getRawMany();
  }
}
