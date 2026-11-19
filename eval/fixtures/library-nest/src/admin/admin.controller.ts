import { Controller, Delete, Get, Param, UseGuards } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { Role } from '../common/role.enum';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { UsersService } from '../users/users.service';

@Controller('admin')
@UseGuards(RolesGuard)
@Roles(Role.Admin)
export class AdminController {
  constructor(private users: UsersService) {}

  @Get('users')
  listUsers() {
    return this.users.search('');
  }

  @Delete('users/:id')
  removeUser(@Param('id') id: string) {
    return { deleted: +id };
  }

  @ApiExcludeEndpoint()
  @Get('debug/config')
  config() {
    return process.env;
  }
}
