-- CreateTable
CREATE TABLE "ApplicationOauthScope" (
    "id" TEXT NOT NULL,
    "applicationsId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "ApplicationOauthScope_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationRole" (
    "id" TEXT NOT NULL,
    "applicationsId" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDefault" BOOLEAN NOT NULL,
    "isSuperRole" BOOLEAN NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,

    CONSTRAINT "ApplicationRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "accessTokenSigningKeysId" TEXT,
    "active" BOOLEAN NOT NULL,
    "data" TEXT NOT NULL,
    "idTokenSigningKeysId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupApplicationRole" (
    "id" TEXT NOT NULL,
    "applicationRolesId" TEXT NOT NULL,
    "groupsId" TEXT NOT NULL,

    CONSTRAINT "GroupApplicationRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "GroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Key" (
    "id" TEXT NOT NULL,
    "algorithm" TEXT,
    "certificate" TEXT,
    "expiry" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "issuer" TEXT,
    "kid" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "privateKey" TEXT,
    "publicKey" TEXT,
    "secret" TEXT,
    "type" TEXT NOT NULL,
    "data" TEXT NOT NULL,

    CONSTRAINT "Key_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "accessTokenSigningKeysId" TEXT NOT NULL,
    "data" TEXT,
    "idTokenSigningKeysId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRegistration" (
    "id" TEXT NOT NULL,
    "applicationsId" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "data" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginInstant" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "usersId" TEXT NOT NULL,

    CONSTRAINT "UserRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL,
    "data" TEXT NOT NULL,
    "expiry" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthenticationKey" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "keyManager" BOOLEAN NOT NULL,
    "keyValue" TEXT NOT NULL,
    "permissions" TEXT,
    "metaData" TEXT,
    "tenantsId" TEXT,

    CONSTRAINT "AuthenticationKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "PublicKeys" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "hostname" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "oidc_model" (
    "id" TEXT NOT NULL,
    "type" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "grantId" TEXT,
    "userCode" TEXT,
    "uid" TEXT,
    "expiresAt" TIMESTAMP(3),
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oidc_model_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationOauthScope_applicationsId_name_key" ON "ApplicationOauthScope"("applicationsId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationRole_name_applicationsId_key" ON "ApplicationRole"("name", "applicationsId");

-- CreateIndex
CREATE INDEX "applications_i_1" ON "Application"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Application_name_tenantId_key" ON "Application"("name", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupApplicationRole_groupsId_applicationRolesId_key" ON "GroupApplicationRole"("groupsId", "applicationRolesId");

-- CreateIndex
CREATE INDEX "group_members_i_1" ON "GroupMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupMember_groupId_userId_key" ON "GroupMember"("groupId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Group_name_tenantId_key" ON "Group"("name", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Key_kid_key" ON "Key"("kid");

-- CreateIndex
CREATE UNIQUE INDEX "Key_name_key" ON "Key"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_name_key" ON "Tenant"("name");

-- CreateIndex
CREATE INDEX "user_registrations_i_2" ON "UserRegistration"("usersId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRegistration_applicationsId_usersId_key" ON "UserRegistration"("applicationsId", "usersId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AuthenticationKey_keyValue_key" ON "AuthenticationKey"("keyValue");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_username_key" ON "Admin"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_password_key" ON "Admin"("password");

-- CreateIndex
CREATE UNIQUE INDEX "PublicKeys_id_key" ON "PublicKeys"("id");

-- CreateIndex
CREATE UNIQUE INDEX "PublicKeys_applicationId_hostname_key" ON "PublicKeys"("applicationId", "hostname");

-- CreateIndex
CREATE UNIQUE INDEX "oidc_model_uid_key" ON "oidc_model"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "oidc_model_id_type_key" ON "oidc_model"("id", "type");

-- AddForeignKey
ALTER TABLE "ApplicationOauthScope" ADD CONSTRAINT "ApplicationOauthScope_applicationsId_fkey" FOREIGN KEY ("applicationsId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationRole" ADD CONSTRAINT "ApplicationRole_applicationsId_fkey" FOREIGN KEY ("applicationsId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_accessTokenSigningKeysId_fkey" FOREIGN KEY ("accessTokenSigningKeysId") REFERENCES "Key"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_idTokenSigningKeysId_fkey" FOREIGN KEY ("idTokenSigningKeysId") REFERENCES "Key"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupApplicationRole" ADD CONSTRAINT "GroupApplicationRole_applicationRolesId_fkey" FOREIGN KEY ("applicationRolesId") REFERENCES "ApplicationRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupApplicationRole" ADD CONSTRAINT "GroupApplicationRole_groupsId_fkey" FOREIGN KEY ("groupsId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_accessTokenSigningKeysId_fkey" FOREIGN KEY ("accessTokenSigningKeysId") REFERENCES "Key"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_idTokenSigningKeysId_fkey" FOREIGN KEY ("idTokenSigningKeysId") REFERENCES "Key"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRegistration" ADD CONSTRAINT "UserRegistration_applicationsId_fkey" FOREIGN KEY ("applicationsId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRegistration" ADD CONSTRAINT "UserRegistration_usersId_fkey" FOREIGN KEY ("usersId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthenticationKey" ADD CONSTRAINT "AuthenticationKey_tenantsId_fkey" FOREIGN KEY ("tenantsId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicKeys" ADD CONSTRAINT "PublicKeys_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
