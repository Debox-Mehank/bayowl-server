import { Arg, Mutation, Query, Resolver } from "type-graphql";
import { ServicesInput } from "../interface/services.input";
import ServicesService from "../service/services.service";

@Resolver()
export default class ServicesResolver {
  constructor(private service: ServicesService) {
    this.service = new ServicesService();
  }

  @Mutation(() => Boolean)
  addService(@Arg("input") input: ServicesInput) {
    return this.service.addService(input);
  }

  @Query(() => Boolean)
  testQuery() {
    return true;
  }
}
