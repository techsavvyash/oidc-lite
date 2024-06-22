import { Controller, Get, Req} from '@nestjs/common';
import {ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { DomainPinningService } from './domain-pinning/domain-pinning.service';

@ApiTags('OIDC Wrapper')
@Controller()
export class AppController {
  constructor(private readonly domainPinning: DomainPinningService) {}

  @Get('/health')
  @ApiOperation({ summary: 'to prove the live status of website' })
  @ApiResponse({ status: 200, description: 'live status confirmed' })
  async getRoutesInfo() {
    return {
      status: 'live',
    };
  }

  @Get('/cert')
  async getCertificate(@Req() req: Request){
    try {
      const data = await this.domainPinning.get(req.hostname);
    } catch (error) {
      console.log(error);
      return null
    }
  }
}
