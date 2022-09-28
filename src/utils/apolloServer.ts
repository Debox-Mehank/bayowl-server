import { buildTypeDefsAndResolvers } from "type-graphql";
import { Server } from "http";
import { Application } from "express";
import { ApolloServer } from "apollo-server-express";
import {
  ApolloServerPluginLandingPageLocalDefault,
  ApolloServerPluginLandingPageProductionDefault,
  ApolloServerPluginDrainHttpServer,
} from "apollo-server-core";
import { resolvers as typedResolvers } from "../resolvers/index.resolver";
import { makeExecutableSchema } from "@graphql-tools/schema";
import Context from "../interface/context";
import { verifyJwt } from "./auth";
import { TokenType } from "../interface/jwt";
import { GraphQLError } from "graphql";

const apolloServerConfig = async (httpServer: Server, app: Application) => {
  // Build the graphql schema
  const { typeDefs, resolvers } = await buildTypeDefsAndResolvers({
    resolvers: typedResolvers,
  });
  const schema = makeExecutableSchema({ typeDefs, resolvers });

  // Apollo Server
  const server = new ApolloServer({
    debug: false,
    schema,
    csrfPrevention: true,
    cache: "bounded",
    formatError: (err: GraphQLError) => {
      return new Error(err.message);
    },

    context: (ctx: Context) => {
      const context = ctx;
      if (context.req?.cookies.accessToken) {
        const user = verifyJwt<TokenType>(ctx.req?.cookies.accessToken);
        context.user = user?.user;
        context.role = user?.role;
      }
      return context;
    },
    plugins: [
      process.env.NODE_ENV === "production"
        ? ApolloServerPluginLandingPageLocalDefault({ embed: true })
        : ApolloServerPluginLandingPageLocalDefault({ embed: true }),

      // Proper shutdown for the HTTP server.
      ApolloServerPluginDrainHttpServer({ httpServer }),
    ],
  });

  await server.start();

  server.applyMiddleware({
    app,
    cors: {
      credentials: true,
      origin: [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "https://www.bayowl.studio",
        "https://bayowl.studio",
        "https://admin.bayowl.studio",
      ],
    },
  });
};

export default apolloServerConfig;
