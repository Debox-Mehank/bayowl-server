import { ApolloError } from "apollo-server-express";
import Context from "../../../interface/context";
import { UserServicesInput } from "../../user/interface/user.interface";
import { UserModel } from "../../user/schema/user.schema";
import UserService from "../../user/service/user.service";
import {
  ServicesDetailInput,
  ServicesInput,
} from "../interface/services.input";
import { Services, ServicesModel } from "../schema/services.schema";

class ServicesService {
  async addService(input: ServicesInput[]): Promise<boolean> {
    await ServicesModel.insertMany(input);
    return true;
  }

  async assignService(
    serviceId: String,
    assignId: String,
    ctx: Context
  ): Promise<boolean> {
    try {
      await UserModel.findOneAndUpdate(
        { "services._id": serviceId },
        {
          $set: {
            "services.$.assignedTo": assignId,
            "services.$.assignedBy": ctx.user,
          },
        }
      );
      return true;
    } catch (error) {
      throw new ApolloError(error as string);
    }
  }

  async getAllService(): Promise<Services[]> {
    return await ServicesModel.find({}).lean();
  }

  async getAllServiceForEmployee() {
    const users = await UserModel.aggregate([
      { $unwind: "$services" },
      {
        $replaceRoot: {
          newRoot: "$services",
        },
      },
    ]);
    return await UserModel.populate(users, {
      path: "assignedTo.name",
    });
  }

  async getServicesDetail(input: ServicesDetailInput): Promise<Services[]> {
    if (input.serviceName) {
      return await ServicesModel.find({
        mainCategory: input.mainCategory,
        subCategory: input.subCategory,
        serviceName: input.serviceName,
      }).lean();
    } else {
      return await ServicesModel.find({
        mainCategory: input.mainCategory,
        subCategory: input.subCategory,
      }).lean();
    }
  }

  async addUserService(service: UserServicesInput, context: Context) {
    if (context.role === "user") {
      await UserModel.findOneAndUpdate(
        { _id: context.user },
        {
          $addToSet: {
            services: service,
          },
        }
      );

      return true;
    }
    return false;
  }
}

export default ServicesService;
