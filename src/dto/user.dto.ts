import { ApiProperty } from '@nestjs/swagger';

class Membership {
  @ApiProperty() groupId: string;
}
export class UserData{
  @ApiProperty() username: string;
  @ApiProperty() firstname?: string;
  @ApiProperty() lastname?: string;
  @ApiProperty() email: string;
  @ApiProperty() password: string;
}

export class CreateUserDto {
  @ApiProperty() active: boolean;
  @ApiProperty() additionalData?: object | string;
  @ApiProperty() applicationId: string;
  @ApiProperty() tenantId: string;
  @ApiProperty() membership: Membership[];
  @ApiProperty() userData: UserData;
}
export class UpdateUserDto {
  @ApiProperty() active?: boolean;
  @ApiProperty() additionalData?: object | string;
  @ApiProperty() applicationId: string;
  @ApiProperty() membership?: Membership[];
  @ApiProperty() userData: UserData;
}


export class CreateUserRegistrationDto{
  @ApiProperty() applicationsId: string
  @ApiProperty() data?: string
  @ApiProperty() usersID: string
  @ApiProperty() roles: string[]
}

export class UpdateUserRegistrationDto{

}
