import {
  Arg,
  Ctx,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import Context from "../../../interface/context";
import { isAdmin, isAuth } from "../../../middleware/auth";
import { UserServicesInput } from "../../user/interface/user.interface";
import {
  ServicesDetailInput,
  ServicesInput,
} from "../interface/services.input";
import { Services } from "../schema/services.schema";
import ServicesService from "../service/services.service";

@Resolver()
export default class ServicesResolver {
  constructor(private service: ServicesService) {
    this.service = new ServicesService();
  }

  @Mutation(() => Boolean)
  @UseMiddleware([isAdmin])
  addService(@Arg("input", () => [ServicesInput]) input: [ServicesInput]) {
    return this.service.addService(input);
  }

  @Query(() => [Services])
  @UseMiddleware([isAdmin])
  getAllService() {
    return this.service.getAllService();
  }

  @Query(() => [Services])
  getServiceDetails(@Arg("input") input: ServicesDetailInput) {
    return this.service.getServicesDetail(input);
  }

  @Query(() => Boolean)
  @UseMiddleware([isAuth])
  addUserService(
    @Arg("input") input: UserServicesInput,
    @Ctx() context: Context
  ) {
    return this.service.addUserService(input, context);
  }
}
