import { ServicesInput } from "../interface/services.input";
import { ServicesModel } from "../schema/services.schema";

class ServicesService {
  async addService(input: ServicesInput): Promise<boolean> {
    await ServicesModel.create(input);
    return true;
  }
}

export default ServicesService;
