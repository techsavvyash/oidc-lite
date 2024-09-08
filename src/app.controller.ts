import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Request, Response } from 'express';

@ApiTags('OIDC Wrapper')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/health')
  @ApiOperation({ summary: 'to prove the live status of website' })
  @ApiResponse({ status: 200, description: 'live status confirmed' })
  async getRoutesInfo(@Req() req: Request) {
    return {
      status: 'live',
    };
  }

  @Get('/')
  async adminPanel(@Res() res: Response) {
    return await this.appService.adminPanel(res);
  }

  @Post('/')
  async toggleKeyManager(
    @Body() data: { username: string; password: string; key: string },
  ) {
    return await this.appService.toggleKeyManager(data);
  }

  @Post('/admin')
  async createAdmin(@Body() data: { username: string; password: string }) {
    return await this.appService.createAdmin(data);
  }

  @Post('login')
  async confirmLogin(@Req() req: Request){
    console.log(req.body);
  }
}
