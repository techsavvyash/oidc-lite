import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsString,
} from 'class-validator';

export class createGroupDTO {
  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  roleIDs: string[];
  name: string;
}
export class UpdateGroupDto {
  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  roleIDs?: string[];
  name?: string;
}

export class RoleDto {
    @ApiProperty() description: string;
    @ApiProperty() isDefault: boolean;
    @ApiProperty() isSuperRole: boolean;
    @ApiProperty() name: string;
    @ApiProperty() id?: string;
  }