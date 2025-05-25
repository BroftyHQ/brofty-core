type AnonymousGraphQLContext = {};
type AuthorizedGraphQLContext = {
  user: {
    email: string;
    email_verified: boolean;
  };
};

export type { AnonymousGraphQLContext, AuthorizedGraphQLContext };
