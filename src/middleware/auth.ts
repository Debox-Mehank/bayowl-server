import { ApolloError } from "apollo-server-express";
import { MiddlewareFn } from "type-graphql";
import Context from "../interface/context";

// Check if user is logged in or not
export const isAuth: MiddlewareFn<Context> = async ({ context }, next) => {
  if (!context.user) {
    throw new ApolloError("You are not authenticated!");
  }
  return await next();
};

// Check if user is admin or not
export const isAdmin: MiddlewareFn<Context> = async ({ context }, next) => {
  if (context.role === "user") {
    throw new ApolloError("You are not authorized!");
  }

  return await next();
};
