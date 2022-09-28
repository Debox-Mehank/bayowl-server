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
import { AdminModel, AdminRole } from "../../admin/schema/admin.schema";
import { isDocument } from "@typegoose/typegoose";
import { addToCommunicationsQueue } from "../../../bull";
import { EmailTriggerTypeEnum } from "../../../interface/bull";

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
      const internalAdmin = await AdminModel.findOne({ _id: assignId })
        .lean()
        .select("name email");

      const usersevice = await UserModel.findOne({
        "services._id": serviceId,
      }).select("services name");

      const service = usersevice?.services?.find(
        (el) => String(el._id) === serviceId
      );

      if (!service || !usersevice) {
        throw new ApolloError("Something went wrong, try again later");
      }

      await UserModel.findOneAndUpdate(
        { "services._id": serviceId },
        {
          $set: {
            "services.$.assignedTo": assignId,
            "services.$.assignedBy": ctx.user,
            "services.$.assignedTime": new Date().toUTCString(),
          },
        }
      );

      await addToCommunicationsQueue({
        email: internalAdmin?.email ?? "",
        service: service.subService ? service.subService : service.serviceName,
        type: EmailTriggerTypeEnum.serviceassign,
        customer: usersevice.name ?? "",
        engineer: internalAdmin?.name ?? "",
        project: service.projectName,
      });
      return true;
    } catch (error) {
      throw new ApolloError(error as string);
    }
  }

  async getAllService(): Promise<Services[]> {
    return await ServicesModel.find({}).lean();
  }

  async getAllServiceForEmployee(ctx: Context) {
    if (ctx.role !== AdminRole.employee) {
      throw new ApolloError("You are not authorized to access this.");
    }
    const newU = await UserModel.find({
      services: { $exists: true, $not: { $size: 0 } },
    })
      .populate("services.assignedTo services.assignedBy")
      .select("services");
    const respArr: UserServices[] = [];
    newU.map((el) =>
      el.services.map(
        (elem) =>
          // elem.projectName &&
          // elem.statusType === UserServiceStatus.underreview &&
          isDocument(elem.assignedTo) &&
          elem.assignedTo._id.toString() === ctx.user &&
          respArr.push(elem)
      )
    );
    respArr.sort((a, b) => b.paidAt.valueOf() - a.paidAt.valueOf());
    return respArr;
  }

  async getAllServiceForMaster() {
    // console.log("first");
    const newU = await UserModel.find({
      services: { $exists: true, $not: { $size: 0 } },
    })
      .populate("services.assignedTo services.assignedBy")
      .select("services");
    const respArr: UserServices[] = [];
    newU.map((el) =>
      el.services.map((elem) =>
        // elem.projectName &&
        // elem.statusType === UserServiceStatus.underreview &&
        respArr.push(elem)
      )
    );
    respArr.sort((a, b) => b.paidAt.valueOf() - a.paidAt.valueOf());
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
    reuploadNote: string,
    ctx: Context
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
    // const referenceFileName = `referenceFiles_${serviceId}.zip`;

    // Deleting from S3
    try {
      const { Deleted, Errors } = await s3
        .deleteObjects({
          Bucket: bucketName,
          Delete: {
            Objects: [{ Key: uploadFileName }],
            Quiet: false,
          },
        })
        .promise();

      if (Errors && Errors.length > 0)
        throw new ApolloError(Errors.map((el) => el.Message ?? "").join(","));

      if (!Deleted) {
        return false;
      }

      const internalAdmin = await AdminModel.findOne({ _id: ctx.user })
        .lean()
        .select("name email");

      const usersevice = await UserModel.findOne({
        "services._id": serviceId,
      }).select("services name email");

      const service = usersevice?.services?.find(
        (el) => String(el._id) === serviceId
      );

      if (!service || !usersevice) {
        throw new ApolloError("Something went wrong, try again later");
      }

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
            // "services.$.referenceFiles": [],
            "services.$.statusType": UserServiceStatus.pendingupload,
            "services.$.status": [
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
            "services.$.reuploadNote": reuploadNote,
            "services.$.reupload": new Date().toUTCString(),
          },
          $inc: {
            "services.$.requestReuploadCounter": 1,
          },
        }
      );

      await addToCommunicationsQueue({
        email: usersevice.email ?? "",
        service: service.subService ? service.subService : service.serviceName,
        type: EmailTriggerTypeEnum.servicereuploadrequest,
        customer: usersevice.name ?? "",
        engineer: internalAdmin?.name ?? "",
        project: service.projectName,
        notes: reuploadNote,
      });

      return updateUser.acknowledged;
    } catch (error: any) {
      throw new ApolloError(error.toString());
    }
  }

  async confirmUpload(
    serviceId: string,
    deliveryDays: number,
    ctx: Context
  ): Promise<boolean> {
    try {
      const estDeliveryTime = moment()
        .add(deliveryDays, "days")
        .toDate()
        .toUTCString();

      const internalAdmin = await AdminModel.findOne({ _id: ctx.user })
        .lean()
        .select("name email");

      const usersevice = await UserModel.findOne({
        "services._id": serviceId,
      }).select("services name email");

      const service = usersevice?.services?.find(
        (el) => String(el._id) === serviceId
      );

      if (!service || !usersevice) {
        throw new ApolloError("Something went wrong, try again later");
      }

      await addToCommunicationsQueue({
        email: usersevice.email ?? "",
        service: service.subService ? service.subService : service.serviceName,
        type: EmailTriggerTypeEnum.servicereview,
        customer: usersevice.name ?? "",
        engineer: internalAdmin?.name ?? "",
        project: service.projectName,
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
            "services.$.statusType": UserServiceStatus.workinprogress,
            "services.$.status": [
              {
                name: UserServiceStatus.pendingupload,
                state: ServiceStatusObjectState.completed,
              },
              {
                name: UserServiceStatus.underreview,
                state: ServiceStatusObjectState.completed,
              },
              {
                name: UserServiceStatus.workinprogress,
                state: ServiceStatusObjectState.current,
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
