import aws from "aws-sdk";
import { ApolloError } from "apollo-server-express";
import Context from "../../../interface/context";
import {
  defaultStatus,
  ServiceStatusObjectState,
  UserServices,
  UserServicesInput,
  UserServiceStatus,
} from "../../user/interface/user.interface";
import { UserModel } from "../../user/schema/user.schema";
import UserService from "../../user/service/user.service";
import {
  ServicesDetailInput,
  ServicesInput,
} from "../interface/services.input";
import { Services, ServicesModel } from "../schema/services.schema";
import moment from "moment";

const region = "ap-south-1";
const bucketName = "bayowl-online-services";
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const accessKeySecret = process.env.AWS_ACCESS_KEY_SECRET;

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
    const newU = await UserModel.find({
      services: { $exists: true, $not: { $size: 0 } },
    })
      .populate("services.assignedTo services.assignedBy")
      .select("services");
    const respArr: UserServices[] = [];
    newU.map((el) => el.services.map((elem) => respArr.push(elem)));
    return respArr;
    // const users = await UserModel.aggregate([
    //   { $unwind: "$services" },
    //   {
    //     $replaceRoot: {
    //       newRoot: "$services",
    //     },
    //   },
    // ]);
    // await UserModel.populate(users, {
    //   path: "services.assignedTo.name",
    // });

    // return users;
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

  async requestReupload(
    serviceId: string,
    reuploadNote: string
  ): Promise<boolean> {
    // Delete previously uploaded files, reference files for this service id from s3 and mongodb
    // change the status back to pending upload with reupload note and reupload date

    // Initializing S3
    const s3 = new aws.S3({
      region,
      accessKeyId,
      secretAccessKey: accessKeySecret,
      signatureVersion: "v4",
    });

    // Getting File Name
    const uploadFileName = `uploadedFiles_${serviceId}.zip`;
    const referenceFileName = `referenceFiles_${serviceId}.zip`;

    // Deleting from S3
    try {
      const { Deleted, Errors } = await s3
        .deleteObjects({
          Bucket: bucketName,
          Delete: {
            Objects: [{ Key: uploadFileName }, { Key: referenceFileName }],
            Quiet: false,
          },
        })
        .promise();

      if (Errors && Errors.length > 0)
        throw new ApolloError(Errors.map((el) => el.Message ?? "").join(","));

      if (!Deleted) {
        return false;
      }

      // Update users collection
      let newStatus = [...defaultStatus];

      newStatus.forEach((element) => {
        if (element.name === UserServiceStatus.pendingupload) {
          element.state = ServiceStatusObjectState.current;
        }
        if (element.name === UserServiceStatus.underreview) {
          element.state = ServiceStatusObjectState.pending;
        }
      });

      const updateUser = await UserModel.updateOne(
        {
          services: {
            $elemMatch: {
              _id: serviceId,
            },
          },
        },
        {
          $set: {
            "services.$.uploadedFiles": [],
            "services.$.referenceFiles": [],
            "services.$.statusType": UserServiceStatus.pendingupload,
            "services.$.status": newStatus,
            "services.$.reuploadNote": reuploadNote,
            "services.$.reupload": new Date().toUTCString(),
          },
        }
      );

      return updateUser.acknowledged;
    } catch (error: any) {
      throw new ApolloError(error.toString());
    }
  }

  async confirmUpload(
    serviceId: string,
    deliveryDays: number
  ): Promise<boolean> {
    try {
      // Update users collection
      let newStatus = [...defaultStatus];

      newStatus.forEach((element) => {
        if (element.name === UserServiceStatus.pendingupload) {
          element.state = ServiceStatusObjectState.completed;
        }
        if (element.name === UserServiceStatus.underreview) {
          element.state = ServiceStatusObjectState.completed;
        }
        if (element.name === UserServiceStatus.workinprogress) {
          element.state = ServiceStatusObjectState.current;
        }
      });

      const estDeliveryTime = moment()
        .add(deliveryDays, "days")
        .toDate()
        .toUTCString();

      const updateUser = await UserModel.updateOne(
        {
          services: {
            $elemMatch: {
              _id: serviceId,
            },
          },
        },
        {
          $set: {
            "services.$.statusType": UserServiceStatus.workinprogress,
            "services.$.status": newStatus,
            "services.$.estDeliveryDate": estDeliveryTime,
          },
        }
      );

      return updateUser.acknowledged;
    } catch (error: any) {
      throw new ApolloError(error.toString());
    }
  }
}

export default ServicesService;
