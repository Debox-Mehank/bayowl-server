import Context from "../../../interface/context";
import { UserServicesInput } from "../../user/interface/user.interface";
import { UserModel } from "../../user/schema/user.schema";
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

  async getAllService(): Promise<Services[]> {
    return await ServicesModel.find({}).lean();
  }

  async getServicesDetail(input: ServicesDetailInput): Promise<Services[]> {
    if (input.subService) {
      return await ServicesModel.find({
        mainCategory: input.mainCategory,
        subCategory: input.subCategory,
        serviceName: input.serviceName,
        subService: input.subService,
      }).lean();
    } else {
      return await ServicesModel.find({
        mainCategory: input.mainCategory,
        subCategory: input.subCategory,
        serviceName: input.serviceName,
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
