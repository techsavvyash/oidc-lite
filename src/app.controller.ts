import { Controller, Get} from '@nestjs/common';
import {ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('OIDC Wrapper')
@Controller()
export class AppController {
  constructor() {}

  @Get('/health')
  @ApiOperation({ summary: 'to prove the live status of website' })
  @ApiResponse({ status: 200, description: 'live status confirmed' })
  async getRoutesInfo() {
    return {
      status: 'live',
    };
  }
}
