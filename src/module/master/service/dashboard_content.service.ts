import { ApolloError } from "apollo-server-express";
import Context from "../../../interface/context";
import aws from "aws-sdk";
import { DashboardContentInput } from "../interface/dashboard_content.interface";
import {
  DashboardContent,
  DashboardContentModel,
} from "../schema/dashboard_content.schema";

const region = "ap-south-1";
const bucketName = "bayowl-online-services";
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const accessKeySecret = process.env.AWS_ACCESS_KEY_SECRET;

class DashboardContentService {
  async getAll(): Promise<DashboardContent[]> {
    try {
      const all = await DashboardContentModel.find({});
      const final = all.map((el) => ({
        ...el.toObject(),
        image: `${process.env.AWS_CLOUDFRONT}/${el.image}`,
      }));
      return final;
    } catch (error: any) {
      throw new ApolloError(error.toString());
    }
  }

  async getActive(): Promise<DashboardContent[]> {
    try {
      const active = await DashboardContentModel.find({ active: true }).lean();
      return active.map((el) => ({
        ...el,
        image: `${process.env.AWS_CLOUDFRONT}/${el.image}`,
      }));
    } catch (error: any) {
      throw new ApolloError(error.toString());
    }
  }

  async addDashboardContent(
    input: DashboardContentInput,
    ctx: Context
  ): Promise<DashboardContent> {
    try {
      const addedContent = await DashboardContentModel.create({
        ...input,
        image: `${input.image}`,
        lastUpdatedBy: ctx.user,
        createdBy: ctx.user,
      });
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
        { $set: { image: input.image } }
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
        [{ $set: { active: { $not: "$active" } } }]
      );
      return updatedContent.acknowledged;
    } catch (error: any) {
      throw new ApolloError(error.toString());
    }
  }

  async deleteDashboardContent(id: string, image: string): Promise<boolean> {
    try {
      const s3 = new aws.S3({
        region,
        accessKeyId,
        secretAccessKey: accessKeySecret,
        signatureVersion: "v4",
      });

      const { Deleted, Errors } = await s3
        .deleteObjects({
          Bucket: bucketName,
          Delete: {
            Objects: [{ Key: image.split("/")[1] }],
            Quiet: false,
          },
        })
        .promise();

      if (Errors && Errors.length > 0)
        throw new ApolloError(Errors.map((el) => el.Message ?? "").join(","));

      if (!Deleted) {
        return false;
      }

      const updatedContent = await DashboardContentModel.deleteOne({
        _id: id,
      });

      return updatedContent.acknowledged;
    } catch (error: any) {
      throw new ApolloError(error.toString());
    }
  }

  async getContentUploadUrl(fileName: string): Promise<string> {
    const s3 = new aws.S3({
      region,
      accessKeyId,
      secretAccessKey: accessKeySecret,
      signatureVersion: "v4",
    });

    const params = {
      Bucket: bucketName,
      Key: fileName,
      Expires: 60,
    };

    const uploadURL = await s3.getSignedUrlPromise("putObject", params);

    return uploadURL;
  }
}

export default DashboardContentService;
