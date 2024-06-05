{
  "accessControlConfiguration": {},
  "captchaConfiguration": {
    "captchaMethod": "GoogleRecaptchaV3",
    "enabled": false,
    "threshold": 0.5
  },
  "configured": false,
  "data": {},
  "emailConfiguration": {
    "debug": false,
    "defaultFromEmail": "change-me@example.com",
    "defaultFromName": "FusionAuth",
    "host": "localhost",
    "implicitEmailVerificationAllowed": true,
    "port": 25,
    "unverified": {
      "allowEmailChangeWhenGated": false,
      "behavior": "Allow"
    },
    "verifyEmail": false,
    "verifyEmailWhenChanged": false
  },
  "eventConfiguration": {},
  "externalIdentifierConfiguration": {
    "authorizationGrantIdTimeToLiveInSeconds": 30,
    "changePasswordIdGenerator": {
      "length": 32,
      "type": "randomBytes"
    },
    "changePasswordIdTimeToLiveInSeconds": 600,
    "deviceCodeTimeToLiveInSeconds": 300,
    "deviceUserCodeIdGenerator": {
      "length": 6,
      "type": "randomAlphaNumeric"
    },
    "emailVerificationIdGenerator": {
      "length": 32,
      "type": "randomBytes"
    },
    "emailVerificationIdTimeToLiveInSeconds": 86400,
    "emailVerificationOneTimeCodeGenerator": {
      "length": 6,
      "type": "randomAlphaNumeric"
    },
    "externalAuthenticationIdTimeToLiveInSeconds": 300,
    "oneTimePasswordTimeToLiveInSeconds": 60,
    "passwordlessLoginGenerator": {
      "length": 32,
      "type": "randomBytes"
    },
    "passwordlessLoginTimeToLiveInSeconds": 180,
    "pendingAccountLinkTimeToLiveInSeconds": 3600,
    "registrationVerificationIdGenerator": {
      "length": 32,
      "type": "randomBytes"
    },
    "registrationVerificationIdTimeToLiveInSeconds": 86400,
    "registrationVerificationOneTimeCodeGenerator": {
      "length": 6,
      "type": "randomAlphaNumeric"
    },
    "rememberOAuthScopeConsentChoiceTimeToLiveInSeconds": 2592000,
    "samlv2AuthNRequestIdTimeToLiveInSeconds": 300,
    "setupPasswordIdGenerator": {
      "length": 32,
      "type": "randomBytes"
    },
    "setupPasswordIdTimeToLiveInSeconds": 86400,
    "trustTokenTimeToLiveInSeconds": 180,
    "twoFactorIdTimeToLiveInSeconds": 300,
    "twoFactorOneTimeCodeIdGenerator": {
      "length": 6,
      "type": "randomDigits"
    },
    "twoFactorOneTimeCodeIdTimeToLiveInSeconds": 60,
    "twoFactorTrustIdTimeToLiveInSeconds": 2592000,
    "webAuthnAuthenticationChallengeTimeToLiveInSeconds": 180,
    "webAuthnRegistrationChallengeTimeToLiveInSeconds": 180
  },
  "failedAuthenticationConfiguration": {
    "actionCancelPolicy": {
      "onPasswordReset": false
    },
    "actionDuration": 3,
    "actionDurationUnit": "MINUTES",
    "emailUser": false,
    "resetCountInSeconds": 60,
    "tooManyAttempts": 5
  },
  "familyConfiguration": {
    "allowChildRegistrations": true,
    "deleteOrphanedAccounts": false,
    "deleteOrphanedAccountsDays": 30,
    "enabled": false,
    "maximumChildAge": 12,
    "minimumOwnerAge": 21,
    "parentEmailRequired": false
  },
  "formConfiguration": {},
  "httpSessionMaxInactiveInterval": 3600,
  "issuer": "localhost:9011",
  "jwtConfiguration": {
    "enabled": false,
    "refreshTokenExpirationPolicy": "Fixed",
    "refreshTokenRevocationPolicy": {
      "onLoginPrevented": true,
      "onMultiFactorEnable": false,
      "onPasswordChanged": true
    },
    "refreshTokenSlidingWindowConfiguration": {
      "maximumTimeToLiveInMinutes": 43200
    },
    "refreshTokenTimeToLiveInMinutes": 43200,
    "refreshTokenUsagePolicy": "Reusable",
    "timeToLiveInSeconds": 3600
  },
  "loginConfiguration": {
    "requireAuthentication": true
  },
  "maximumPasswordAge": {
    "days": 180,
    "enabled": false
  },
  "minimumPasswordAge": {
    "enabled": false,
    "seconds": 30
  },
  "multiFactorConfiguration": {
    "authenticator": {
      "algorithm": "HmacSHA1",
      "codeLength": 6,
      "enabled": true,
      "timeStep": 30
    },
    "email": {
      "enabled": false,
      "templateId": "730ceb15-bcdb-4942-b05b-9888dd97b8bf"
    },
    "loginPolicy": "Enabled",
    "sms": {
      "enabled": false
    }
  },
  "passwordEncryptionConfiguration": {
    "encryptionScheme": "salted-pbkdf2-hmac-sha256",
    "encryptionSchemeFactor": 24000,
    "modifyEncryptionSchemeOnLogin": false
  },
  "passwordValidationRules": {
    "breachDetection": {
      "enabled": false,
      "notifyUserEmailTemplateId": "48f30b57-7463-4aec-8f5e-4b529abe26e2"
    },
    "maxLength": 256,
    "minLength": 8,
    "rememberPreviousPasswords": {
      "count": 1,
      "enabled": false
    },
    "requireMixedCase": false,
    "requireNonAlpha": false,
    "requireNumber": false,
    "validateOnLogin": false
  },
  "rateLimitConfiguration": {
    "failedLogin": {
      "enabled": false,
      "limit": 5,
      "timePeriodInSeconds": 60
    },
    "forgotPassword": {
      "enabled": false,
      "limit": 5,
      "timePeriodInSeconds": 60
    },
    "sendEmailVerification": {
      "enabled": false,
      "limit": 5,
      "timePeriodInSeconds": 60
    },
    "sendPasswordless": {
      "enabled": false,
      "limit": 5,
      "timePeriodInSeconds": 60
    },
    "sendRegistrationVerification": {
      "enabled": false,
      "limit": 5,
      "timePeriodInSeconds": 60
    },
    "sendTwoFactor": {
      "enabled": false,
      "limit": 5,
      "timePeriodInSeconds": 60
    }
  },
  "registrationConfiguration": {},
  "scimServerConfiguration": {
    "enabled": false
  },
  "ssoConfiguration": {
    "deviceTrustTimeToLiveInSeconds": 31536000
  },
  "state": "Active",
  "userDeletePolicy": {
    "unverified": {
      "enabled": false,
      "numberOfDaysToRetain": 120
    }
  },
  "usernameConfiguration": {
    "unique": {
      "enabled": false,
      "numberOfDigits": 5,
      "separator": "#",
      "strategy": "OnCollision"
    }
  },
  "webAuthnConfiguration": {
    "bootstrapWorkflow": {
      "authenticatorAttachmentPreference": "any",
      "enabled": false,
      "userVerificationRequirement": "required"
    },
    "debug": false,
    "enabled": false,
    "reauthenticationWorkflow": {
      "authenticatorAttachmentPreference": "platform",
      "enabled": false,
      "userVerificationRequirement": "required"
    }
  }
}