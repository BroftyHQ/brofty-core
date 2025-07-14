-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "text" TEXT NOT NULL,
    "by" TEXT NOT NULL,
    "createdAt" BIGINT NOT NULL,
    "updatedAt" BIGINT NOT NULL,
    "files" JSONB
);

-- CreateTable
CREATE TABLE "UserPreference" (
    "preferenceKey" TEXT NOT NULL PRIMARY KEY,
    "preferenceValue" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Tool" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL PRIMARY KEY,
    "description" TEXT NOT NULL,
    "defination" JSONB NOT NULL,
    "mcpServer" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "MCPServer" (
    "name" TEXT NOT NULL PRIMARY KEY,
    "description" TEXT,
    "command" TEXT NOT NULL,
    "args" JSONB,
    "envs" JSONB,
    "status" TEXT NOT NULL DEFAULT 'stopped'
);

-- CreateTable
CREATE TABLE "MessageSummary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "summary" TEXT NOT NULL,
    "firstMessageId" TEXT NOT NULL,
    "lastMessageId" TEXT NOT NULL,
    "createdAt" BIGINT NOT NULL
);

-- CreateTable
CREATE TABLE "Memories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "index" TEXT NOT NULL,
    "createdAt" BIGINT NOT NULL
);

-- CreateTable
CREATE TABLE "File" (
    "path" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "size" BIGINT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "encoding" TEXT NOT NULL,
    "createdAt" BIGINT NOT NULL
);
