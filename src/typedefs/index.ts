import types from './types.js';
import queries from './queries.js';
import mutations from './mutations.js';
import subscriptions from './subscriptions.js';

const typeDefs = [
  types,
  queries,
  mutations,
  subscriptions,
].join('\n');

export default typeDefs;
