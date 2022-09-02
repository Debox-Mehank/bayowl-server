import { ServicesInput } from "../interface/services.input";
import { Services, ServicesModel } from "../schema/services.schema";

class ServicesService {
  async addService(input: ServicesInput): Promise<boolean> {
    await ServicesModel.create(input);
    return true;
  }

  async getAllService(): Promise<Services[]> {
    return await ServicesModel.find({}).lean();
  }
}

export default ServicesService;
