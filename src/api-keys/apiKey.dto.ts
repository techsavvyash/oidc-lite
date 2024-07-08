import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

class Endpoints {
  @ApiProperty()
  @IsUrl()
  url: string;

  @ApiProperty()
  @IsEnum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], {
    message:
      'Invalid HTTP method. Must be one of GET, POST, PUT, DELETE, PATCH',
  })
  methods: string;
}

export class Permissions {
  @ApiProperty()
  @IsArray()
  endpoints: Endpoints[];
}

export class CreateApiKeyDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  key?: string;

  @ApiProperty()
  permissions?: Permissions;

  @ApiProperty()
  @IsOptional()
  metaData?: string | JSON;

  @ApiProperty()
  @IsString()
  @IsOptional()
  tenantId?: string;
}
class UpdataPermissionsDto {
  @ApiProperty()
  @IsArray()
  @IsOptional()
  endpoints?: Endpoints[];
}
export class UpdateApiKeyDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  key?: string;

  @ApiProperty()
  @IsOptional()
  permissions?: UpdataPermissionsDto;

  @ApiProperty()
  @IsOptional()
  metaData?: string | JSON;
}

class ApiKey {
  @ApiProperty()
  id: string;

  @ApiProperty()
  @IsDate()
  createdAt: Date;

  @ApiProperty()
  @IsDate()
  updatedAt: Date;

  @ApiProperty()
  @IsBoolean()
  keyManager: boolean;

  @ApiProperty()
  @IsString()
  keyValue: string;

  @ApiProperty()
  permissions: string | Permissions; //check 2

  @ApiProperty()
  @IsString()
  metaData: string;

  @ApiProperty()
  @IsString()
  tenantsId: string;
}
export class ApiKeyResponseDto {
  @ApiProperty()
  @IsBoolean()
  success: boolean;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiProperty()
  @IsOptional()
  data?: ApiKey;
}
