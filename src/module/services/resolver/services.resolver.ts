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
  @UseMiddleware([isAuth, isAdmin])
  getAllServiceForEmployee(@Ctx() context: Context) {
    return this.service.getAllServiceForEmployee(context);
  }

  @Query(() => [UserServices])
  @UseMiddleware([isAuth, isAdmin])
  getAllServiceForMaster() {
    return this.service.getAllServiceForMaster();
  }

  @Query(() => [Services])
  getServiceDetails(@Arg("input") input: ServicesDetailInput) {
    return this.service.getServicesDetail(input);
  }

  @Query(() => Boolean)
  @UseMiddleware([isAuth, isAdmin])
  requestReupload(
    @Arg("serviceId") serviceId: string,
    @Arg("reuploadNote") reuploadNote: string,
    @Ctx() context: Context
  ): Promise<Boolean> {
    return this.service.requestReupload(serviceId, reuploadNote, context);
  }

  @Query(() => Boolean)
  @UseMiddleware([isAuth, isAdmin])
  confirmUpload(
    @Arg("serviceId") serviceId: string,
    @Arg("deliveryDays") deliveryDays: number,
    @Ctx() context: Context
  ): Promise<Boolean> {
    return this.service.confirmUpload(serviceId, deliveryDays, context);
  }
}
