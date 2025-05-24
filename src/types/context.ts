import { PrismaClient } from "../generated/prisma";


type AnonymousGraphQLContext = {
  prisma: PrismaClient;
};

type AuthorizedGraphQLContext = {
  user: {
    email: string;
    email_verified: boolean;
  };
  prisma: PrismaClient;
};

export type { AnonymousGraphQLContext, AuthorizedGraphQLContext };
