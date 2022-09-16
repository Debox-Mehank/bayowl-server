import { ApolloError } from "apollo-server-express";
import { DashboardContentInput } from "../interface/dashboard_content.interface";
import {
  DashboardContent,
  DashboardContentModel,
} from "../schema/dashboard_content.schema";

class DashboardContentService {
  async getAll(): Promise<DashboardContent[]> {
    try {
      const all = await DashboardContentModel.find({});
      return all;
    } catch (error: any) {
      throw new ApolloError(error.toString());
    }
  }

  async getActive(): Promise<DashboardContent[]> {
    try {
      const active = await DashboardContentModel.find({});
      return active;
    } catch (error: any) {
      throw new ApolloError(error.toString());
    }
  }

  async addDashboardContent(
    input: DashboardContentInput
  ): Promise<DashboardContent> {
    try {
      const addedContent = await DashboardContentModel.create(input);
      return addedContent;
    } catch (error: any) {
      throw new ApolloError(error.toString());
    }
  }

  async updateDashboardContent(
    id: string,
    input: DashboardContentInput
  ): Promise<boolean> {
    try {
      const updatedContent = await DashboardContentModel.updateOne(
        { _id: id },
        { $set: { text: input.text, image: input.image } }
      );
      return updatedContent.acknowledged;
    } catch (error: any) {
      throw new ApolloError(error.toString());
    }
  }

  async toggleDashboardContent(id: string): Promise<boolean> {
    try {
      const updatedContent = await DashboardContentModel.updateOne(
        { _id: id },
        { $set: { active: { $not: "$active" } } }
      );
      return updatedContent.acknowledged;
    } catch (error: any) {
      throw new ApolloError(error.toString());
    }
  }
}

export default DashboardContentService;
