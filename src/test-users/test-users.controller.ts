import { Controller, Get } from '@nestjs/common';
import { TestUsersService } from './test-users.service';

@Controller('test-users')
export class TestUsersController {
  constructor(private readonly userService: TestUsersService) {}
  @Get('register')
  async registerUsers() {
    const users = await this.userService.registerUsers();
    return users.map((response) => response.data);
  }
}
