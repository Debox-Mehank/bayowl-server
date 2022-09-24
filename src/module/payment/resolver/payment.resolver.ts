import { Arg, Ctx, Query, Resolver, UseMiddleware } from "type-graphql";
import Context from "../../../interface/context";
import { isAdmin, isAuth } from "../../../middleware/auth";
import { UserServicesInput } from "../../user/interface/user.interface";
import { Payment } from "../schema/payment.schema";
import {
  PaymentConfig,
  PaymentConfigInput,
} from "../schema/payment_config.schema";
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
  @UseMiddleware([isAuth, isAdmin])
  getAllPayment(): Promise<Payment[]> {
    return this.service.getAllPayment();
  }

  @Query(() => [PaymentConfig])
  @UseMiddleware([isAuth, isAdmin])
  getAllPaymentConfig(): Promise<PaymentConfig[]> {
    return this.service.getPaymentConfig();
  }

  @Query(() => Boolean)
  @UseMiddleware([isAuth])
  getGstStatus(): Promise<Boolean> {
    return this.service.getGstStatus();
  }

  @Query(() => Boolean)
  @UseMiddleware([isAuth, isAdmin])
  addPaymentConfig(
    @Arg("input") input: PaymentConfigInput,
    @Ctx() ctx: Context
  ): Promise<Boolean> {
    return this.service.addPaymentConfig(input, ctx);
  }

  @Query(() => Boolean)
  @UseMiddleware([isAuth])
  updatePaymentConfig(@Ctx() ctx: Context, @Arg("gst") gst: boolean) {
    return this.service.updatePaymentConfig(ctx, gst);
  }

  @Query(() => Boolean)
  @UseMiddleware([isAuth, isAdmin])
  updateFreeUser(
    @Ctx() ctx: Context,
    @Arg("id") id: string,
    @Arg("free") free: boolean
  ) {
    return this.service.updateFreeUser(ctx, free, id);
  }
}
