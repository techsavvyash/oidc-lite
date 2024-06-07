import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto, UpdateApiKeyDto } from 'src/dto/apiKey.dto';
import { randomUUID } from 'crypto';

@Controller('api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post('/')
  async createAnApiKeyWithRandomUUID(
    @Body('data') data: CreateApiKeyDto,
    @Headers() headers: object,
  ) {
    const uuid = randomUUID();
    return await this.apiKeysService.createAnApiKey(uuid, data, headers);
  }

  @Post('/:id')
  async createAnApiKey(
    @Param('id') id: string,
    @Body('data') data: CreateApiKeyDto,
    @Headers() headers: object,
  ) {
    return await this.apiKeysService.createAnApiKey(id, data, headers);
  }
  @Get('/:id')
  async returnAnApiKey(@Param('id') id: string, @Headers() headers: object) {
    console.log(typeof headers);
    return await this.apiKeysService.returnAnApiKey(id, headers);
  }
  @Patch('/:id')
  async updateAnApiKey(
    @Param('id') id: string,
    @Body('data') data: UpdateApiKeyDto,
    @Headers() headers: object,
  ) {
    return await this.apiKeysService.updateAnApiKey(id, data, headers);
  }
  @Delete('/:id')
  async deleteAnApiKey(@Param('id') id: string, @Headers() headers: object) {
    return await this.apiKeysService.deleteAnApiKey(id, headers);
  }
}
