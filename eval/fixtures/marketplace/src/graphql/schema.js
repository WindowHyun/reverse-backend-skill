module.exports = `
  directive @admin on FIELD_DEFINITION

  type Product { id: ID!, title: String!, price: Float!, sellerId: ID }
  type User { id: ID!, email: String!, name: String, role: String, phone: String, passwordHash: String }
  type Order { id: ID!, buyerId: ID!, total: Float!, status: String! }
  type Review { id: ID!, productId: ID!, rating: Int!, body: String }

  input UserInput { name: String, phone: String, role: String }

  type Query {
    product(id: ID!): Product
    products(limit: Int): [Product!]!
    me: User
    user(id: ID!): User
    orders: [Order!]!
    order(id: ID!): Order
    allOrders: [Order!]! @admin
  }

  type Mutation {
    createOrder(items: [String!]!): Order
    cancelOrder(id: ID!): Order
    updateUser(id: ID!, input: UserInput!): User
    addReview(productId: ID!, rating: Int!, body: String): Review
  }
`;
