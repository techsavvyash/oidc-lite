import { Body, Controller,Get,Post, Res } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from 'src/dto/user.dto';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
@ApiTags("User")
@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService){}

    @Get('/all')
    @ApiOperation({summary : "verifies the generated jwt token"})
  @ApiResponse({
    status : 200,
    description : 'jwt token verified'
  })
  @ApiResponse({
    status : 401,
    description : 'No token is given'
  })
  @ApiResponse({
    status : 500,
    description : 'Internal server error'
  })
  async getAllUsers(){
        return this.userService.allUsers();
    }
}
