type AnonymousGraphQLContext = {};
type AuthorizedGraphQLContext = {
  user: {
    token: string;
  };
};

export type { AnonymousGraphQLContext, AuthorizedGraphQLContext };
