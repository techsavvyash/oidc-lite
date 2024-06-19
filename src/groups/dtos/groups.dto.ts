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
  tenantId: string;
}
export class UpdateGroupDto {
  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  roleIDs?: string[];
  name?: string;
}

export class GroupPermissions {
  @ApiProperty() applicationId: string;
  @ApiProperty() applicationRole: {
    id: string;
    applicationsId: string;
    description: string;
    createdAt: Date;
    isDefault: boolean;
    isSuperRole: boolean;
    updatedAt: Date;
    name: string;
  };
}
