import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  IsOptional,
  ValidateNested,
} from 'class-validator';

class JwtConfiguration {
  @ApiProperty({
    description: 'ID for the access token signing keys',
    type: String,
    example: 'access-key-id-123',
  })
  @IsString({ message: 'Access token signing keys ID must be a string' })
  @IsNotEmpty({ message: 'Access token signing keys ID must not be empty' })
  accessTokenKeyID: string;

  @ApiProperty({
    description: 'Time to live for refresh tokens in minutes',
    type: Number,
    example: 1440,
  })
  @IsInt({ message: 'Refresh token time to live must be an integer' })
  @Min(1, { message: 'Refresh token time to live must be at least 1 minute' })
  refreshTokenTimeToLiveInMinutes: number;

  @ApiProperty({
    description: 'Time to live for access tokens in seconds',
    type: Number,
    example: 3600,
  })
  @IsInt({ message: 'Time to live must be an integer' })
  @Min(1, { message: 'Time to live must be at least 1 second' })
  timeToLiveInSeconds: number;

  @ApiProperty({
    description: 'ID for the ID token signing keys',
    type: String,
    example: 'id-key-id-456',
  })
  @IsString({ message: 'ID token signing keys ID must be a string' })
  @IsNotEmpty({ message: 'ID token signing keys ID must not be empty' })
  idTokenKeyID: string;
}

export class CreateTenantDto {
  @ApiProperty({
    description: 'Name of the tenant',
    type: String,
    example: 'TenantName',
  })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name must not be empty' })
  name: string;

  @ApiProperty({
    description: 'JWT configuration for the tenant',
    type: JwtConfiguration,
  })
  @ValidateNested()
  @Type(() => JwtConfiguration)
  jwtConfiguration: JwtConfiguration;

  @ApiProperty({
    description: 'Additional data for the tenant',
    type: 'string | JSON',
    example: '{"key": "value"}',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Data must be a string' })
  data?: string | JSON;
}

export class UpdateTenantDto {
  @ApiProperty({
    description: 'JWT configuration for the tenant (optional)',
    type: JwtConfiguration,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => JwtConfiguration)
  jwtConfiguration?: JwtConfiguration;

  @ApiProperty({
    description: 'Name of the tenant (optional)',
    type: String,
    example: 'UpdatedTenantName',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  name?: string;

  @ApiProperty({
    description: 'Additional data for the tenant (optional)',
    type: 'string | JSON',
    example: '{"key": "value"}',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Data must be a string' })
  data?: string | JSON;
}
