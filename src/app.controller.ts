import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('OIDC Wrapper')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/health')
  @ApiOperation({ summary: 'to prove the live status of website' })
  @ApiResponse({ status: 200, description: 'live status confirmed' })
  async getRoutesInfo() {
    return {
      status: 'live',
    };
  }

  @Post('/admin')
  async createAdmin(
    @Body('data') data: { username: string; password: string },
  ) {
    return await this.appService.createAdmin(data);
  }
}
