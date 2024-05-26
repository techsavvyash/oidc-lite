

export class CreateApiDto {
    readonly username : string ;
    readonly password : string ;
    readonly gender : string ;
    readonly birthdate : string ;
    readonly email : string ;
    
}

export class LoginDTO{
    readonly username : string;
    readonly password : string;
    readonly scopes : string;

}