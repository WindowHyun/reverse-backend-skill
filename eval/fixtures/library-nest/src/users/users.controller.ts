import { Body, ClassSerializerInterceptor, Controller, Get, Param, Patch, Query, Req, UseInterceptors } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(private users: UsersService) {}

  @Get('me')
  me(@Req() req) {
    return this.users.findOne(req.user.id);
  }

  @Get('search')
  search(@Query('q') q: string) {
    return this.users.search(q);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.users.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.users.update(+id, dto);
  }
}
