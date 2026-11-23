const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const typeDefs = require('./schema');
const rootValue = require('./resolvers');

module.exports = graphqlHTTP((req) => ({
  schema: buildSchema(typeDefs),
  rootValue,
  context: { user: req.user },
  graphiql: true,
}));
