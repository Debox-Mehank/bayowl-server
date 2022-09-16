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
import {
  UserServices,
  UserServicesInput,
} from "../../user/interface/user.interface";
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

  @Mutation(() => Boolean)
  @UseMiddleware([isAdmin])
  assignService(
    @Arg("serviceId") serviceId: String,
    @Arg("adminId") adminId: String,
    @Ctx() context: Context
  ) {
    return this.service.assignService(serviceId, adminId, context);
  }

  @Query(() => [Services])
  // @UseMiddleware([isAdmin])
  getAllService() {
    return this.service.getAllService();
  }

  @Query(() => [UserServices])
  // @UseMiddleware([isAdmin])
  getAllServiceForEmployee() {
    return this.service.getAllServiceForEmployee();
  }

  @Query(() => [Services])
  getServiceDetails(@Arg("input") input: ServicesDetailInput) {
    return this.service.getServicesDetail(input);
  }

  @Query(() => Boolean)
  @UseMiddleware([isAuth, isAdmin])
  requestReupload(
    @Arg("userId") userId: string,
    @Arg("serviceId") serviceId: string,
    @Arg("reuploadNote") reuploadNote: string
  ): Promise<Boolean> {
    return this.service.requestReupload(userId, serviceId, reuploadNote);
  }
}
