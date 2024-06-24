## User Registration routes errors -> 

1) Post('/registration/member')
error occured : data.userInfo do exist while sending reqeust but it gets caught on check of line 405  and sending the bad gateway request
data sent : {
    "data" : {
    "userInfo" : {
        "active" : false,
        "applicationId": "4515fd28-9d9f-455e-b942-1588d6e44530",
        "membership" : ["try with","genuine gp id"],
        "userData" : {
            "username" : "test",
            "email" : "testing@gmail.com",
            "password" : "Testing@123"
        },
        "email" : "testing@gmail.com"
    },
    "registrationInfo" : {
        "applicationId": "4515fd28-9d9f-455e-b942-1588d6e44530",
        "roles" : [
            {
                "roleId" : "2dcfe361-70f1-4457-bdb0-b4c21a4411ef"
            },{
                "roleId" : "6b0b22df-e388-4b9c-b575-83d3448458b8"
            }
        ]

    }
}
}

keyNote : comment out UseGuards() decorator while testing



2) Patch('registation/:userId/:applicationId')

(i) on line 222 change applicationId to !applicationId 
(ii) on line 268 userRegistration data could not be updated 
    error -> Invalid `this.prismaService.userRegistration.update()` invocation in
/home/ashuk/Desktop/stencil-oidc-wrapper/src/user/user-registration/user-registration.service.ts:268:74

  265   : oldUserRegistration.data;
  266 const token = data.roles ? randomUUID() : null; // genenrate a new token like jwks
  267 try {
→ 268   const userRegistration = await this.prismaService.userRegistration.update({
          where: {
            id: "f2c7e3ee-2206-4b8e-9b36-bf52396b1a64",
            applicationsId: "4515fd28-9d9f-455e-b942-1588d6e44530",
            password: "QfASCOurb9",
            data: null,
            createdAt: new Date("2024-06-24T16:46:19.559Z"),
            lastLoginInstant: null,
            updatedAt: new Date("2024-06-24T16:46:19.559Z"),
            usersId: "01ac66d2-93c0-4a3d-a649-6c155934dde2",
        +   authenticationToken: String
          },
          data: {
            data: null
          }
        })

Argument `authenticationToken` must not be null.
  }
(iii) kindly send correct msg while right spelling on line 287

@Delelte('/registration/:userId/:applicationId')
error occured while deleting userRegistration on line 336 
complete logged error -> 
    Invalid `this.prismaService.userRegistration.delete()` invocation in
/home/ashuk/Desktop/stencil-oidc-wrapper/src/user/user-registration/user-registration.service.ts:337:80

  334 }
  335 console.log(oldUserRegistration);
  336 try {
→ 337   const userRegistration = await this.prismaService.userRegistration.delete({
          where: {
            id: "f2c7e3ee-2206-4b8e-9b36-bf52396b1a64",
            applicationsId: "4515fd28-9d9f-455e-b942-1588d6e44530",
            password: "QfASCOurb9",
            data: null,
            createdAt: new Date("2024-06-24T16:46:19.559Z"),
            lastLoginInstant: null,
            updatedAt: new Date("2024-06-24T16:46:19.559Z"),
            usersId: "01ac66d2-93c0-4a3d-a649-6c155934dde2",
        +   authenticationToken: String
          }
        })

Argument `authenticationToken` must not be null.