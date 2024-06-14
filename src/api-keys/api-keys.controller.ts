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
import {
  ApiResponse,
  ApiHeader,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ApiKeysService } from './api-keys.service';
import {
  CreateApiKeyDto,
  UpdateApiKeyDto,
  ApiKeyResponseDto,
} from 'src/api-keys/apiKey.dto';
import { randomUUID } from 'crypto';

@ApiTags('Authentication keys')
@Controller('api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post('/')
  @ApiOperation({ summary: 'Create an API Key with a random UUID' })
  @ApiBody({ type: CreateApiKeyDto })
  @ApiHeader({
    name: 'authorization',
    required: true,
    description: 'Authorization header',
  })
  @ApiResponse({
    status: 201,
    description: 'Api key successfully generated',
    type: ApiKeyResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async createAnApiKeyWithRandomUUID(
    @Body('data') data: CreateApiKeyDto,
    @Headers() headers: object,
  ) {
    const uuid = randomUUID();
    return await this.apiKeysService.createAnApiKey(uuid, data, headers);
  }

  @Post('/:id')
  @ApiOperation({ summary: 'Create an API Key with the given UUID' })
  @ApiBody({ type: CreateApiKeyDto })
  @ApiParam({ name: 'id', description: 'ID of the API Key', type: String })
  @ApiHeader({
    name: 'authorization',
    required: true,
    description: 'Authorization header',
  })
  @ApiResponse({
    status: 201,
    description: 'Api key successfully generated',
    type: ApiKeyResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async createAnApiKey(
    @Param('id') id: string,
    @Body('data') data: CreateApiKeyDto,
    @Headers() headers: object,
  ) {
    return await this.apiKeysService.createAnApiKey(id, data, headers);
  }

  @ApiOperation({ summary: 'Return an API Key by ID' })
  @ApiParam({ name: 'id', description: 'ID of the API Key', type: String })
  @ApiHeader({
    name: 'authorization',
    required: true,
    description: 'Authorization header',
  })
  @ApiResponse({
    status: 200,
    description: 'Api key successfully returned',
    type: ApiKeyResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @Get('/:id')
  async returnAnApiKey(@Param('id') id: string, @Headers() headers: object) {
    console.log(typeof headers);
    return await this.apiKeysService.returnAnApiKey(id, headers);
  }

  @Patch('/:id')
  @ApiOperation({ summary: 'Update an API Key by ID' })
  @ApiParam({ name: 'id', description: 'ID of the API Key', type: String })
  @ApiBody({ type: UpdateApiKeyDto })
  @ApiHeader({
    name: 'authorization',
    required: true,
    description: 'Authorization header',
  })
  @ApiResponse({
    status: 200,
    description: 'Key updated successfully',
    type: ApiKeyResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async updateAnApiKey(
    @Param('id') id: string,
    @Body('data') data: UpdateApiKeyDto,
    @Headers() headers: object,
  ) {
    return await this.apiKeysService.updateAnApiKey(id, data, headers);
  }

  @ApiOperation({ summary: 'Delete an API Key by ID' })
  @ApiParam({ name: 'id', description: 'ID of the API Key', type: String })
  @ApiHeader({
    name: 'authorization',
    required: true,
    description: 'Authorization header',
  })
  @ApiResponse({
    status: 200,
    description: 'Api key successfully deleted',
    type: ApiKeyResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @Delete('/:id')
  async deleteAnApiKey(@Param('id') id: string, @Headers() headers: object) {
    return await this.apiKeysService.deleteAnApiKey(id, headers);
  }
}
