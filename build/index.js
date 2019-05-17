"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_yoga_1 = require("graphql-yoga");
var typeorm_1 = require("typeorm");
var User_1 = require("./entities/User");
var typeDefs = "\n  type User {\n    id: ID!\n    name: String!\n    email: String!\n  }\n  type Query {\n    hello(name: String): String!\n    user(id: ID!): User!\n  }\n  type Mutation {\n    addUser(name: String!, email: String!): User\n  }\n";
var resolvers = {
    Query: {
        hello: function (_, _a) {
            var name = _a.name;
            return "Hello " + (name || 'World');
        },
        // this is the user resolver
        user: function (_, _a) {
            var id = _a.id;
            return typeorm_1.getRepository(User_1.User).findOne(id);
        },
    },
    Mutation: {
        // this is the addUser resolver
        addUser: function (_, _a) {
            var name = _a.name, email = _a.email;
            var user = new User_1.User();
            user.email = email;
            user.name = name;
            return typeorm_1.getRepository(User_1.User).save(user);
        },
    },
};
var server = new graphql_yoga_1.GraphQLServer({ typeDefs: typeDefs, resolvers: resolvers });
typeorm_1.createConnection().then(function () {
    server.start(function () { return console.log("Server is running on localhost:4000"); });
}).catch(function () {
    console.log("Couldn't connect to the database.");
});
//# sourceMappingURL=index.js.map