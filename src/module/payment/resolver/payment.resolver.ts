import { Arg, Ctx, Query, Resolver, UseMiddleware } from "type-graphql";
import Context from "../../../interface/context";
import { isAuth } from "../../../middleware/auth";
import { UserServicesInput } from "../../user/interface/user.interface";
import PaymentService from "../service/payment.service";

@Resolver()
export default class PaymentResolver {
  constructor(private service: PaymentService) {
    this.service = new PaymentService();
  }

  // Initiate Payment
  @Query(() => String)
  initiatePayment(
    @Ctx() ctx: Context,
    @Arg("service") service: UserServicesInput,
    @Arg("email", { nullable: true }) email?: string
  ) {
    return this.service.initiatePayment(ctx, service, email);
  }
}
