import { Module } from '@nestjs/common';
import { TestUsersController } from './test-users.controller';
import { TestUsersService } from './test-users.service';

@Module({
  controllers: [TestUsersController],
  providers: [TestUsersService],
})
export class TestUsersModule {}
