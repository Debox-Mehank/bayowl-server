import { mongoose } from "@typegoose/typegoose";
import { ApolloError } from "apollo-server-express";
import crypto from "crypto";
import Razorpay from "razorpay";
import Context from "../../../interface/context";
import { sendUserVerificationEmail, servicePurchaseMail } from "../../../mails";
import { getUserEmail } from "../../user/helper";
import {
  defaultStatus,
  ServiceStatusObjectState,
  UserServicesInput,
  UserServiceStatus,
} from "../../user/interface/user.interface";
import { UserModel } from "../../user/schema/user.schema";
import { Payment, PaymentModel } from "../schema/payment.schema";
import {
  PaymentConfig,
  PaymentConfigEnum,
  PaymentConfigInput,
  PaymentConfigModel,
} from "../schema/payment_config.schema";

class PaymentService {
  async initiatePayment(ctx: Context, service: UserServicesInput) {
    if (!service) {
      throw new ApolloError("Something went wrong, please try again later");
    }
    // Create rp instance
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    if (ctx.user) {
      // get email
      const email = await getUserEmail(ctx.user);

      // Check if free or not
      if (email?.free && service.price <= 0) {
        const finalService = {
          _id: new mongoose.Types.ObjectId(),
          ...service,
          paid: true,
        };

        await UserModel.findOneAndUpdate(
          { _id: ctx.user },
          {
            $addToSet: {
              services: {
                ...finalService,
                status: [
                  {
                    name: UserServiceStatus.pendingupload,
                    state: ServiceStatusObjectState.current,
                  },
                  {
                    name: UserServiceStatus.underreview,
                    state: ServiceStatusObjectState.pending,
                  },
                  {
                    name: UserServiceStatus.workinprogress,
                    state: ServiceStatusObjectState.pending,
                  },
                  {
                    name: UserServiceStatus.delivered,
                    state: ServiceStatusObjectState.pending,
                  },
                  {
                    name: UserServiceStatus.revisionrequest,
                    state: ServiceStatusObjectState.pending,
                  },
                  {
                    name: UserServiceStatus.revisiondelivered,
                    state: ServiceStatusObjectState.pending,
                  },
                  {
                    name: UserServiceStatus.completed,
                    state: ServiceStatusObjectState.pending,
                  },
                ],
                paidAt: new Date().toUTCString(),
              },
            },
          },
          { new: true }
        );

        await PaymentModel.create({
          email: email?.email,
          userServiceId: finalService._id,
          amount: finalService.price,
          status: "free",
          orderId: "",
        });

        return "free service";
      }

      // Create order options
      const options = {
        amount: service.price * 100,
        currency: "INR",
        receipt: crypto.randomBytes(10).toString("hex"),
      };
      try {
        // Create order
        const order = await instance.orders.create(options);
        if (!order)
          throw new ApolloError("Something went wrong, please try again later");

        const finalService = { _id: new mongoose.Types.ObjectId(), ...service };

        await UserModel.findOneAndUpdate(
          { _id: ctx.user },
          {
            $addToSet: {
              services: {
                ...finalService,
                status: [
                  {
                    name: UserServiceStatus.pendingupload,
                    state: ServiceStatusObjectState.current,
                  },
                  {
                    name: UserServiceStatus.underreview,
                    state: ServiceStatusObjectState.pending,
                  },
                  {
                    name: UserServiceStatus.workinprogress,
                    state: ServiceStatusObjectState.pending,
                  },
                  {
                    name: UserServiceStatus.delivered,
                    state: ServiceStatusObjectState.pending,
                  },
                  {
                    name: UserServiceStatus.revisionrequest,
                    state: ServiceStatusObjectState.pending,
                  },
                  {
                    name: UserServiceStatus.revisiondelivered,
                    state: ServiceStatusObjectState.pending,
                  },
                  {
                    name: UserServiceStatus.completed,
                    state: ServiceStatusObjectState.pending,
                  },
                ],
                paidAt: new Date().toUTCString(),
              },
            },
          },
          { new: true }
        );

        await PaymentModel.create({
          email: email?.email,
          userServiceId: finalService._id,
          amount: finalService.price,
          status: "created",
          orderId: order.id,
        });

        const resp = { ...order, serviceId: finalService._id };

        // await servicePurchaseMail(
        //   email?.email ?? "",
        //   email?.name ?? "",
        //   service.serviceName
        // );

        return JSON.stringify(resp);
      } catch (error: any) {
        console.error("ERROR_INITPAYMENT : " + error.toString());
        throw new ApolloError(error);
      }
    } else {
      throw new ApolloError("Something went wrong, please try again later");
    }
  }

  async removeService(serviceId: string, context: Context) {
    try {
      const update = await UserModel.updateOne(
        { _id: context.user },
        { $pull: { services: { _id: serviceId } } },
        { multi: true }
      );

      return update.acknowledged;
    } catch (error: any) {
      throw new ApolloError(error.toString());
    }
  }

  async getAllPayment(): Promise<Payment[]> {
    return await PaymentModel.find({});
  }

  async initiateAddOnPayment(amount: number, serviceId: string, ctx: Context) {
    if (!serviceId) {
      throw new ApolloError("Something went wrong, please try again later");
    }
    // Create rp instance
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    if (ctx.user) {
      // get email
      const email = await getUserEmail(ctx.user);

      // Create order options
      const options = {
        amount: amount * 100,
        currency: "INR",
        receipt: crypto.randomBytes(10).toString("hex"),
      };
      try {
        // Create order
        const order = await instance.orders.create(options);
        if (!order)
          throw new ApolloError("Something went wrong, please try again later");

        await PaymentModel.create({
          email: email?.email,
          userServiceId: serviceId,
          amount: amount,
          status: "created",
          orderId: order.id,
        });

        const resp = { ...order };

        return JSON.stringify(resp);
      } catch (error: any) {
        console.error("ERROR_INITPAYMENT_ADDON : " + error.toString());
        throw new ApolloError(error);
      }
    } else {
      throw new ApolloError("Something went wrong, please try again later");
    }
  }

  async getPaymentConfig(): Promise<PaymentConfig[]> {
    const data = await PaymentConfigModel.find({});
    return data;
  }

  async getGstStatus(): Promise<Boolean> {
    const data = await PaymentConfigModel.findOne({
      type: PaymentConfigEnum.gst,
    })
      .select("value")
      .lean();
    return data?.value && data.value > 0 ? true : false;
  }

  async addPaymentConfig(
    input: PaymentConfigInput,
    context: Context
  ): Promise<Boolean> {
    const data = await PaymentConfigModel.create({
      ...input,
      lastUpdatedBy: context.user,
    });
    return true;
  }

  async updatePaymentConfig(ctx: Context, gst: boolean): Promise<boolean> {
    const update = await PaymentConfigModel.updateMany(
      { type: PaymentConfigEnum.gst },
      {
        $set: {
          active: gst,
          lastUpdatedBy: ctx.user,
        },
      }
    );
    return update.acknowledged;
  }

  async updateFreeUser(
    ctx: Context,
    free: boolean,
    id: string
  ): Promise<boolean> {
    const update = await UserModel.updateOne(
      { _id: id },
      {
        $set: {
          free: free,
          lastUpdatedBy: ctx.user,
        },
      }
    );
    return update.acknowledged;
  }
}

export default PaymentService;
