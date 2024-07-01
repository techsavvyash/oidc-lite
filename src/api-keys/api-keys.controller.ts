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
} from './apiKey.dto';
import { randomUUID } from 'crypto';

@ApiTags('Authentication keys')
@Controller('api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  /**
   * Create an API Key with a random UUID
   *
   * @param data - The data for creating the API Key
   * @param headers - The headers object containing the authorization header
   * @returns The generated API Key response
   */
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
    description: 'Api key successwfully generated',
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

  /**
   * Create an API Key with the given UUID
   *
   * @param id - The ID of the API Key
   * @param data - The data for creating the API Key
   * @param headers - The headers object containing the authorization header
   * @returns The generated API Key response
   */
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

  /**
   * Return an API Key by ID
   *
   * @param id - The ID of the API Key
   * @param headers - The headers object containing the authorization header
   * @returns The API Key response
   */
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
    return await this.apiKeysService.returnAnApiKey(id, headers);
  }

  /**
   * Update an API Key by ID
   *
   * @param id - The ID of the API Key
   * @param data - The data for updating the API Key
   * @param headers - The headers object containing the authorization header
   * @returns The updated API Key response
   */
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

  /**
   * Delete an API Key by ID
   *
   * @param id - The ID of the API Key
   * @param headers - The headers object containing the authorization header
   * @returns The deleted API Key response
   */
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

/**
 * Tests performed in the `ApiKeysController` class:
 *
 * - Create an API Key with a random UUID
 * - Create an API Key with the given UUID
 * - Return an API Key by ID
 * - Update an API Key by ID
 * - Delete an API Key by ID
 */
