import { Arg, Ctx, Query, Resolver, UseMiddleware } from "type-graphql";
import Context from "../../../interface/context";
import { isAuth } from "../../../middleware/auth";
import { UserServicesInput } from "../../user/interface/user.interface";
import { Payment } from "../schema/payment.schema";
import PaymentService from "../service/payment.service";

@Resolver()
export default class PaymentResolver {
  constructor(private service: PaymentService) {
    this.service = new PaymentService();
  }

  // Initiate Payment
  @Query(() => String)
  @UseMiddleware([isAuth])
  initiatePayment(
    @Ctx() ctx: Context,
    @Arg("service") service: UserServicesInput
  ) {
    return this.service.initiatePayment(ctx, service);
  }

  // Remove Service
  @Query(() => Boolean)
  @UseMiddleware([isAuth])
  removeService(@Ctx() ctx: Context, @Arg("serviceId") serviceId: string) {
    return this.service.removeService(serviceId, ctx);
  }

  @Query(() => [Payment])
  getAllPayment(): Promise<Payment[]> {
    return this.service.getAllPayment();
  }
}
