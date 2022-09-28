import { ApolloError } from "apollo-server-express";
import Joi from "joi";
import Razorpay from "razorpay";
import bcrypt from "bcrypt";
import aws from "aws-sdk";
import crypto from "crypto";
import { promisify } from "util";
import Context from "../../../interface/context";
import { signJwt, verifyJwt } from "../../../utils/auth";
import {
  emailAndNumberChecker,
  emailAndPasswordChecker,
  getUserByEmail,
} from "../helper";
import { User, UserModel } from "../schema/user.schema";
import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import {
  sendResetPasswordLink,
  sendUserVerificationEmail,
} from "../../../mails";
import { VerificationTokenType } from "../../../interface/jwt";
import { PaymentModel } from "../../payment/schema/payment.schema";
import {
  defaultStatus,
  FileUploadResponse,
  FinalMultipartUploadInput,
  MultipartSignedUrlResponse,
  ServiceStatusObjectState,
  UserServices,
  UserServiceStatus,
} from "../interface/user.interface";
import _ from "lodash";
import { CreateMultipartUploadRequest } from "aws-sdk/clients/s3";
import { AdminModel, AdminRole } from "../../admin/schema/admin.schema";
import moment from "moment";
import { addToCommunicationsQueue } from "../../../bull";
import { EmailTriggerTypeEnum } from "../../../interface/bull";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client({
  clientId: GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
});
const randomBytes = promisify(crypto.randomBytes);

const region = "ap-south-1";
const bucketName = "bayowl-online-services";
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const accessKeySecret = process.env.AWS_ACCESS_KEY_SECRET;

class UserService {
  private async setAuthCookie(id: string, context: Context) {
    const authToken = signJwt({
      user: id,
      role: "user",
    });

    // create cookie
    if (process.env.NODE_ENV === "production") {
      context.res!.cookie("accessToken", authToken, {
        maxAge: 3.154e10,
        httpOnly: true,
        sameSite: "none",
        secure: true,
        domain: ".bayowl.studio",
        path: "/",
      });
    } else {
      context.res!.cookie("accessToken", authToken, {
        maxAge: 3.154e10,
        httpOnly: true,
      });
    }
  }

  async login(
    input: { email: string; password: string; token?: string },
    context: Context
  ) {
    // Gmail Login Checker
    if (input.token) {
      // Login with Gmail
      const { email_verified, email } = await client.getTokenInfo(input.token);

      if (!email_verified) {
        throw new ApolloError(
          "Looks like your email or password is incorrect."
        );
      }

      const user = await getUserByEmail(email!);

      if (!user) {
        let OAuth2 = google.auth.OAuth2;
        let oauth2Client = new OAuth2();
        oauth2Client.setCredentials({ access_token: input.token ?? "" });
        let oauth2 = google.oauth2({
          auth: oauth2Client,
          version: "v2",
        });
        const {
          data: { name },
          status,
        } = await oauth2.userinfo.get();

        if (!name) {
          return false;
        }

        const createdUser = await UserModel.create({
          name: name,
          email: email,
          accountVerified: true,
        });

        await this.setAuthCookie(createdUser._id, context);

        await UserModel.findOneAndUpdate(
          { _id: createdUser._id },
          { $set: { lastLoggedIn: new Date() } }
        );

        return true;
      }

      // check user email verification status
      if (!user.accountVerified) {
        throw new ApolloError("Looks like your email is not yet verified.");
      }

      await this.setAuthCookie(user._id, context);

      await UserModel.findOneAndUpdate(
        { _id: user._id },
        { $set: { lastLoggedIn: new Date() } }
      );

      return true;
    }

    const joiSchema = Joi.object({
      email: Joi.string().required().email().messages({
        "string.empty": "You have not entered your email id.",
        "string.email": "You have entered an invalid email id.",
      }),
      password: Joi.string().required().messages({
        "string.empty": "You have not entered your password.",
      }),
    });

    // Schema Validation
    const { error } = joiSchema.validate({
      email: input.email,
      password: input.password,
    });

    if (error) {
      throw new ApolloError(error.message.toString());
    }

    const { status, user } = await emailAndPasswordChecker(
      input.email,
      input.password
    );

    // Checking for existing user
    if (!status || !user) {
      throw new ApolloError("Looks like your email or password is incorrect.");
    }

    // check user email verification status
    if (!user.accountVerified) {
      throw new ApolloError("Looks like your email is not yet verified.");
    }

    // create jwt
    const authToken = signJwt({
      user: user._id,
      role: "user",
    });

    // create cookie
    if (process.env.NODE_ENV === "production") {
      context.res!.cookie("accessToken", authToken, {
        maxAge: 3.154e10,
        httpOnly: true,
        sameSite: "none",
        secure: true,
        domain: ".bayowl.studio",
        path: "/",
      });
    } else {
      context.res!.cookie("accessToken", authToken, {
        maxAge: 3.154e10,
        httpOnly: true,
      });
    }

    await UserModel.findOneAndUpdate(
      { _id: user._id },
      { $set: { lastLoggedIn: new Date() } }
    );

    return true;
  }

  async logout(context: Context) {
    if (process.env.NODE_ENV === "production") {
      context.res!.cookie("accessToken", "", {
        maxAge: 3.154e10,
        httpOnly: true,
        sameSite: "none",
        secure: true,
        domain: ".bayowl.studio",
        path: "/",
        expires: new Date(0),
      });
    } else {
      context.res!.cookie("accessToken", "", {
        maxAge: 0,
        httpOnly: true,
        expires: new Date(0),
      });
    }

    await UserModel.findOneAndUpdate(
      { _id: context.user },
      { $set: { lastLoggedOut: new Date() } }
    );

    return true;
  }

  async me(ctx: Context): Promise<User> {
    const user = await UserModel.findById(ctx.user).lean<User>();

    if (!user) {
      throw new ApolloError("Something went wrong, try again later.");
    }

    return user;
  }

  async register(
    input: {
      name: string;
      number: string;
      email: string;
      password: string;
      token?: string;
    },
    context: Context
  ): Promise<Boolean> {
    try {
      // Gmail Signup Checker
      if (input.token) {
        // Signup with Gmail
        const { email_verified, email } = await client.getTokenInfo(
          input.token
        );

        if (!email_verified) {
          throw new ApolloError(
            "Looks like your email or password is incorrect."
          );
        }

        const user = await getUserByEmail(email!);

        if (user) {
          await this.setAuthCookie(user._id, context);

          await UserModel.findOneAndUpdate(
            { _id: user._id },
            { $set: { lastLoggedIn: new Date() } }
          );

          return true;
        }

        const createdUser = await UserModel.create({
          name: input.name,
          email: email,
          accountVerified: true,
        });

        await this.setAuthCookie(createdUser._id, context);

        await UserModel.findOneAndUpdate(
          { _id: createdUser._id },
          { $set: { lastLoggedIn: new Date() } }
        );

        return true;
      }

      // Validations on input
      const joiSchema = Joi.object({
        name: Joi.string().required().messages({
          "string.empty": "You have not entered your name.",
        }),
        email: Joi.string().required().email().messages({
          "string.empty": "You have not entered your email id.",
          "string.email": "You have entered an invalid email id.",
        }),
        // number: Joi.string()
        //   .length(10)
        //   .pattern(/^[0-9]+$/)
        //   .messages({
        //     "string.empty": "You have not entered your phone number.",
        //     "string.length": "You have entered an invalid phone number.",
        //     "string.pattern": "You have entered an invalid phone number.",
        //   }),
        password: Joi.string()
          .required()
          .messages({ "string.empty": "You have not entered your password." }),
      });

      // Schema Validation
      const { error } = joiSchema.validate({
        name: input.name,
        email: input.email,
        password: input.password,
      });

      if (error) {
        throw new ApolloError(error.message.toString());
      }

      const checkUserExists = await emailAndNumberChecker(
        input.email,
        input.number
      );

      // Checking for existing user
      if (checkUserExists) {
        throw new ApolloError(
          "Looks like your number or email is already registered with us."
        );
      }

      const createdUser = await UserModel.create({
        name: input.name,
        email: input.email,
        number: input.number,
        password: input.password,
      });

      // send verify mail
      await sendUserVerificationEmail({
        email: input.email,
        userId: createdUser._id,
      });

      return true;
    } catch (error) {
      console.log("ERROR in register" + error);
      throw new ApolloError(error as string);
    }
  }

  async completeAccount(input: {
    name: string;
    number: string;
    email: string;
    password: string;
    token: string;
  }) {
    try {
      // Validations on input
      const joiSchema = Joi.object({
        name: Joi.string().required().messages({
          "string.empty": "You have not entered your name.",
        }),
        email: Joi.string().required().email().messages({
          "string.empty": "You have not entered your email id.",
          "string.email": "You have entered an invalid email id.",
        }),
        number: Joi.string()
          .length(10)
          .pattern(/^[0-9]+$/)
          .messages({
            "string.empty": "You have not entered your phone number.",
            "string.length": "You have entered an invalid phone number.",
            "string.pattern": "You have entered an invalid phone number.",
          }),
        password: Joi.string()
          .required()
          .messages({ "string.empty": "You have not entered your password." }),
      });

      // Schema Validation
      const { error } = joiSchema.validate({
        name: input.name,
        number: input.number,
        email: input.email,
        password: input.password,
      });

      if (error) {
        throw new ApolloError(error.message.toString());
      }

      // Validate Token
      const payload = verifyJwt<VerificationTokenType>(input.token);

      if (!payload) {
        throw new ApolloError("The link is expired.");
      }

      const user = await UserModel.findById(payload.id).select(
        "name email accountVerified services"
      );

      if (user?.name) {
        throw new ApolloError(
          "Your account is already created, try to login with your credentials."
        );
      }

      // hash password
      const salt = await bcrypt.genSalt(10);
      const hash = bcrypt.hashSync(input.password, salt);

      await UserModel.updateOne(
        {
          email: input.email,
        },
        {
          $set: {
            name: input.name,
            number: input.number,
            password: hash,
          },
        }
      );

      return true;
    } catch (error) {
      console.log("ERROR in register" + error);
      throw new ApolloError(error as string);
    }
  }

  async verifyEmail(token: string): Promise<Boolean> {
    const payload = verifyJwt<VerificationTokenType>(token);

    if (!payload) {
      throw new ApolloError("The verification link is expired.");
    }

    const user = await UserModel.findById(payload.id).select(
      "name email accountVerified services"
    );

    if (!user) {
      throw new ApolloError("Something went wrong!");
    }

    if (user.accountVerified) {
      throw new ApolloError(
        "Your account is already verified, try to login with your credentials."
      );
    }

    try {
      await UserModel.updateOne(
        { _id: payload.id },
        { $set: { accountVerified: true } }
      );

      const payment = await PaymentModel.findOne({ email: user.email });

      // Create rp instance
      const instance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });

      const allservices = [...user.services];

      const service = allservices.find(
        (el) => el._id.toString() === payment?.userServiceId
      );

      if (service && payment) {
        console.log("here");
        const paylink = await instance.paymentLink.create({
          amount: service.price * 100,
          currency: "INR",
          customer: {
            email: user.email,
          },
          notify: {
            email: true,
          },
          callback_url: `${process.env.CALLBACK_URL}`,
          callback_method: "get",
        });

        await PaymentModel.updateOne(
          { _id: payment._id },
          { $set: { paymentLinkId: paylink.id } }
        );
      }

      return true;
    } catch (error) {
      console.log(error);
      throw new ApolloError(error as string);
    }
  }

  async requestPasswordReset(email: string): Promise<Boolean> {
    const user = await getUserByEmail(email);

    try {
      if (user) {
        await sendResetPasswordLink(email, user._id);
      }

      return true;
    } catch (error) {
      console.log(error);
      throw new ApolloError(error as string);
    }
  }

  async resetPassword(token: string, password: string) {
    const payload = verifyJwt<VerificationTokenType>(token);

    if (!payload) {
      throw new ApolloError("Verification link expired!");
    }

    const user = await UserModel.findById(payload.id).select("email");

    if (!user) {
      throw new ApolloError("Something went wrong!");
    }

    try {
      const salt = await bcrypt.genSalt(10);
      const hash = bcrypt.hashSync(password, salt);
      await UserModel.findByIdAndUpdate(payload.id, {
        $set: { password: hash, passwordResetDate: new Date().toUTCString() },
        $inc: { passwordResetCounter: 1 },
      });
      return true;
    } catch (error) {
      throw new ApolloError("Something went wrong!");
    }
  }

  async updatePorjectName(
    projectName: string,
    serviceId: string,
    context: Context
  ) {
    if (!projectName || !serviceId || !context.user) {
      throw new ApolloError("Something went wrong, try again later");
    }

    try {
      const find = await UserModel.findOne({
        _id: context.user,
        services: {
          $elemMatch: {
            _id: serviceId,
            projectName: null,
          },
        },
      })
        .lean()
        .select("_id");

      const services: UserServices[] = await UserModel.aggregate([
        { $unwind: "$services" },
        {
          $replaceRoot: {
            newRoot: "$services",
          },
        },
      ]);

      if (!find) {
        throw new ApolloError("Something went wrong, try again later");
      }

      if (services.filter((el) => el.projectName === projectName).length > 0) {
        throw new ApolloError("Project name already in use, try another name");
      }

      await UserModel.updateOne(
        {
          _id: context.user,
          services: {
            $elemMatch: {
              _id: serviceId,
              projectName: null,
            },
          },
        },
        { $set: { "services.$.projectName": projectName } }
      );

      return true;
    } catch (error: any) {
      console.log("error in updating project name - " + error.toString());
      throw new ApolloError(error.toString());
    }
  }

  async getServiceDetails(
    serviceId: string,
    ctx: Context
  ): Promise<UserServices | null> {
    const services = await UserModel.findOne({ _id: ctx.user }).select(
      "services"
    );

    if (!services) {
      return null;
    }

    const service = services.services.find(
      (el) => el._id.toString() === serviceId
    );

    if (!service) {
      return null;
    }

    return service;
  }

  async approveProject(serviceId: String): Promise<boolean> {
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
      type: EmailTriggerTypeEnum.servicedelivery,
      customer: usersevice.name ?? "",
      project: service.projectName,
    });

    await UserModel.findOneAndUpdate(
      { "services._id": serviceId },
      {
        $set: {
          "services.$.statusType": UserServiceStatus.delivered,
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
              state: ServiceStatusObjectState.completed,
            },
            {
              name: UserServiceStatus.delivered,
              state: ServiceStatusObjectState.completed,
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
          "services.$.masterProjectApprovalTime": new Date().toUTCString(),
        },
      }
    );
    return true;
  }

  async addDeliverFiles(serviceId: string, url: string) {
    const usersevice = await UserModel.findOne({
      "services._id": serviceId,
    }).select("services name email");

    const service = usersevice?.services?.find(
      (el) => String(el._id) === serviceId
    );

    if (!service || !usersevice) {
      throw new ApolloError("Something went wrong, try again later");
    }

    const internalAdmin = await AdminModel.findOne({
      _id: service.assignedTo,
    })
      .lean()
      .select("name email");

    await addToCommunicationsQueue({
      email: internalAdmin?.email ?? "",
      type: EmailTriggerTypeEnum.servicesubmitted,
      customer: usersevice.name ?? "",
      engineer: internalAdmin?.name ?? "",
      project: service.projectName,
    });

    const update = await UserModel.updateOne(
      { "services._id": serviceId },
      {
        $set: {
          "services.$.deliveredFiles": [url],
          "services.$.statusType": UserServiceStatus.underreviewinternal,
        },
      }
    );
    return update.acknowledged;
  }

  async markCompleted(serviceId: string, completedFor: number) {
    const usersevice = await UserModel.findOne({
      "services._id": serviceId,
    }).select("services");
    const service = usersevice?.services?.find(
      (el) => String(el._id) === serviceId
    );

    if (!service) {
      throw new ApolloError("Something went wrong, try again later");
    }

    let newStatus = [...service.status];

    newStatus.forEach((element) => {
      if (element.name === UserServiceStatus.completed) {
        element.state = ServiceStatusObjectState.completed;
      }
    });

    const update = await UserModel.updateOne(
      { "services._id": serviceId },
      {
        $set: {
          "services.$.statusType": UserServiceStatus.completed,
          "services.$.completionDate": new Date().toUTCString(),
          "services.$.status": newStatus,
          "services.$.completedFor": completedFor,
        },
      }
    );

    return update.acknowledged;
  }

  async requestRevision(
    serviceId: string,
    desc: string,
    rNum: number,
    revisionFor: number,
    ctx: Context
  ) {
    const usersevice = await UserModel.findOne({
      "services._id": serviceId,
    }).select("services");

    const service = usersevice?.services?.find(
      (el) => String(el._id) === serviceId
    );

    if (!service) {
      throw new ApolloError("Something went wrong, try again later");
    }

    if (rNum > service.setOfRevisions) {
      throw new ApolloError("You have exhausted all your revision requests");
    }

    if (service.revisionFiles.length + 1 !== rNum) {
      throw new ApolloError("Invalid request number");
    }

    const numOfService = await UserModel.findOne({
      _id: ctx.user,
      "services._id": serviceId,
    });

    if (!numOfService || numOfService.services.length === 0) {
      throw new ApolloError("You can't access this service");
    }

    let newStatus = [...service.status];

    newStatus.forEach((element) => {
      if (element.name === UserServiceStatus.revisionrequest) {
        element.state = ServiceStatusObjectState.current;
      }
      if (element.name === UserServiceStatus.revisiondelivered) {
        element.state = ServiceStatusObjectState.pending;
      }
    });

    const estDeliveryTime = moment(service.estDeliveryDate)
      .add(service.revisionsDelivery, "days")
      .toDate()
      .toUTCString();

    // const numberOfPrevRevision = await UserModel.findOne({
    //   "services._id": serviceId
    // }).select("services.")
    // Need to add check for number of revision is surpassed or not
    await UserModel.findOneAndUpdate(
      {
        "services._id": serviceId,
      },
      {
        $push: {
          "services.$.revisionFiles": {
            description: desc,
            revision: rNum,
            revisionFor: revisionFor,
            revisionTime: new Date().toUTCString(),
          },
        },
        $set: {
          "services.$.statusType": UserServiceStatus.revisionrequest,
          "services.$.status": newStatus,
          "services.$.estDeliveryDate": estDeliveryTime,
        },
      }
    );
    return true;
  }

  async uploadRevisionFiles(
    serviceId: string,
    fileUrl: string,
    rNum: number,
    ctx: Context
  ) {
    // const numberOfPrevRevision = await UserModel.findOne({
    //   "services._id": serviceId
    // }).select("services.")
    // Need to add check for number of revision is surpassed or not
    const usersevice = await UserModel.findOne({
      "services._id": serviceId,
    });

    const service = usersevice?.services?.find(
      (el) => String(el._id) === serviceId
    );

    if (!service) {
      throw new ApolloError("Service not found");
    }

    const revision = [...service!.revisionFiles];

    revision.forEach((ind) => {
      if (ind.revision === rNum) ind.file = fileUrl;
    });

    let newStatus = [...service.status];

    newStatus.forEach((element) => {
      if (element.name === UserServiceStatus.revisionrequest) {
        element.state = ServiceStatusObjectState.completed;
      }
      if (element.name === UserServiceStatus.revisiondelivered) {
        element.state = ServiceStatusObjectState.completed;
      }
    });

    if (!revision) {
      throw new ApolloError("Revision not found");
    }
    await UserModel.findOneAndUpdate(
      {
        "services._id": serviceId,
      },
      {
        $set: {
          "services.$.revisionFiles": revision,
          "services.$.statusType": UserServiceStatus.revisiondelivered,
          "services.$.status": newStatus,
        },
      }
    );
    return true;
  }

  async uploadWorkingFiles(serviceId: string, fileUrl: string, ctx: Context) {
    const usersevice = await UserModel.findOne({
      "services._id": serviceId,
    });

    const service = usersevice?.services?.find(
      (el) => String(el._id) === serviceId
    );

    if (!service) {
      throw new ApolloError("Service not found");
    }

    await UserModel.findOneAndUpdate(
      {
        "services._id": serviceId,
      },
      {
        $set: {
          "services.$.workingFile": fileUrl,
        },
      }
    );
    return true;
  }

  async uploadBusFiles(serviceId: string, fileUrl: string, ctx: Context) {
    const usersevice = await UserModel.findOne({
      "services._id": serviceId,
    });

    const service = usersevice?.services?.find(
      (el) => String(el._id) === serviceId
    );

    if (!service) {
      throw new ApolloError("Service not found");
    }

    await UserModel.findOneAndUpdate(
      {
        "services._id": serviceId,
      },
      {
        $set: {
          "services.$.stemsFiles": fileUrl,
        },
      }
    );
    return true;
  }

  async uploadMultitrackFiles(
    serviceId: string,
    fileUrl: string,
    ctx: Context
  ) {
    const usersevice = await UserModel.findOne({
      "services._id": serviceId,
    });

    const service = usersevice?.services?.find(
      (el) => String(el._id) === serviceId
    );

    if (!service) {
      throw new ApolloError("Service not found");
    }

    await UserModel.findOneAndUpdate(
      {
        "services._id": serviceId,
      },
      {
        $set: {
          "services.$.multitrackFile": fileUrl,
        },
      }
    );
    return true;
  }

  async addRevisionNotesByMaster(
    note: string,
    serviceId: string,
    ctx: Context
  ) {
    if (ctx.role === AdminRole.employee)
      throw new ApolloError("You are unauthorized");

    const s3 = new aws.S3({
      region,
      accessKeyId,
      secretAccessKey: accessKeySecret,
      signatureVersion: "v4",
    });

    // Getting File Name
    const deliveredFileName = `deliveredFiles_${serviceId}.zip`;

    // Deleting from S3
    try {
      const { Deleted, Errors } = await s3
        .deleteObjects({
          Bucket: bucketName,
          Delete: {
            Objects: [{ Key: deliveredFileName }],
            Quiet: false,
          },
        })
        .promise();

      if (Errors && Errors.length > 0)
        throw new ApolloError(Errors.map((el) => el.Message ?? "").join(","));

      if (!Deleted) {
        return false;
      }

      const usersevice = await UserModel.findOne({
        "services._id": serviceId,
      }).select("services name email");

      const service = usersevice?.services?.find(
        (el) => String(el._id) === serviceId
      );

      if (!service || !usersevice) {
        throw new ApolloError("Something went wrong, try again later");
      }

      const internalAdmin = await AdminModel.findOne({
        _id: service.assignedTo,
      })
        .lean()
        .select("name email");

      await addToCommunicationsQueue({
        email: internalAdmin?.email ?? "",
        service: service.subService ? service.subService : service.serviceName,
        type: EmailTriggerTypeEnum.servicerejected,
        customer: usersevice.name ?? "",
        engineer: internalAdmin?.name ?? "",
        project: service.projectName,
        notes: note,
      });

      await UserModel.findOneAndUpdate(
        {
          "services._id": serviceId,
        },
        {
          $set: {
            "services.$.deliveredFiles": [],
            "services.$.revisionNotesByMaster": note,
            "services.$.revisionTimeByMaster": new Date(),
            "services.$.statusType": UserServiceStatus.workinprogress,
          },
          $inc: {
            "services.$.numberOfRevisionsByMaster": 1,
          },
        }
      );
      return true;
    } catch (error: any) {
      throw new ApolloError(error.toString());
    }
  }

  async initFileUpload(fileName: string): Promise<FileUploadResponse> {
    const s3 = new aws.S3({
      region,
      accessKeyId,
      secretAccessKey: accessKeySecret,
      signatureVersion: "v4",
    });
    const multipartParams: CreateMultipartUploadRequest = {
      Bucket: bucketName,
      Key: fileName,
      // ACL: "public-read",
    };
    const multipartUpload = await s3
      .createMultipartUpload(multipartParams)
      .promise();

    const resp = new FileUploadResponse();
    resp.fileId = multipartUpload.UploadId;
    resp.fileKey = multipartUpload.Key;

    return resp;
  }

  async getMultipartPreSignedUrls(
    fileId: string,
    fileKey: string,
    parts: number
  ): Promise<MultipartSignedUrlResponse[]> {
    const s3 = new aws.S3({
      region,
      accessKeyId,
      secretAccessKey: accessKeySecret,
      signatureVersion: "v4",
    });
    const multipartParams = {
      Bucket: bucketName,
      Key: fileKey,
      UploadId: fileId,
    };

    const promises = [];
    for (let index = 0; index < parts; index++) {
      promises.push(
        s3.getSignedUrlPromise("uploadPart", {
          ...multipartParams,
          PartNumber: index + 1,
        })
      );
    }
    const signedUrls = await Promise.all(promises);

    const partSignedUrlList = signedUrls.map((signedUrl, index) => {
      const resp = new MultipartSignedUrlResponse();
      resp.signedUrl = signedUrl;
      resp.PartNumber = index + 1;
      return resp;
    });

    return partSignedUrlList;
  }

  async finalizeMultipartUpload(
    input: FinalMultipartUploadInput
  ): Promise<String | undefined> {
    const s3 = new aws.S3({
      region,
      accessKeyId,
      secretAccessKey: accessKeySecret,
      signatureVersion: "v4",
    });
    const multipartParams: aws.S3.CompleteMultipartUploadRequest = {
      Bucket: bucketName,
      Key: input.fileKey,
      UploadId: input.fileId,
      MultipartUpload: {
        Parts: _.orderBy(input.parts, ["PartNumber"], ["asc"]),
      },
    };

    try {
      const completeMultipartUploadOutput = await s3
        .completeMultipartUpload(multipartParams)
        .promise();

      return completeMultipartUploadOutput.Location;
    } catch (error: any) {
      console.log(error);
      throw new ApolloError(error.toString());
    }
  }

  async getS3SignedURL(fileName: string): Promise<string> {
    const s3 = new aws.S3({
      region,
      accessKeyId,
      secretAccessKey: accessKeySecret,
      signatureVersion: "v4",
    });

    // const rawBytes = await randomBytes(16);
    // const imageName = rawBytes.toString("hex");

    const params = {
      Bucket: bucketName,
      Key: fileName + ".zip",
      Expires: 60,
    };

    const uploadURL = await s3.getSignedUrlPromise("putObject", params);

    return uploadURL;
  }

  async uploadFilesForService(
    ctx: Context,
    serviceId: string,
    uplodedFiles: string[],
    referenceUploadedFiles?: string[],
    notes?: string,
    isReupload?: boolean
  ): Promise<boolean> {
    // Check if reference urls there or not
    // Update the status from pending upload to under review
    // Send mails accordingly

    if (!ctx.user || !serviceId || uplodedFiles.length <= 0) {
      throw new ApolloError("Something went wrong, try again later.");
    }

    if (isReupload) {
      const usersevice = await UserModel.findOne({
        "services._id": serviceId,
      }).select("services name email");

      const service = usersevice?.services?.find(
        (el) => String(el._id) === serviceId
      );

      if (!service || !usersevice) {
        throw new ApolloError("Something went wrong, try again later");
      }

      const internalAdmin = await AdminModel.findOne({
        _id: service.assignedTo,
      })
        .lean()
        .select("name email");

      await addToCommunicationsQueue({
        email: internalAdmin?.email ?? "",
        service: service.subService ? service.subService : service.serviceName,
        type: EmailTriggerTypeEnum.servicereupload,
        customer: usersevice.name ?? "",
        engineer: internalAdmin?.name ?? "",
        project: service.projectName,
      });
    }

    await UserModel.updateOne(
      {
        _id: ctx.user,
        services: {
          $elemMatch: {
            _id: serviceId,
          },
        },
      },
      {
        $set: {
          "services.$.uploadedFiles": uplodedFiles,
          "services.$.referenceFiles": referenceUploadedFiles ?? [],
          "services.$.statusType": UserServiceStatus.underreview,
          "services.$.status": [
            {
              name: UserServiceStatus.pendingupload,
              state: ServiceStatusObjectState.completed,
            },
            {
              name: UserServiceStatus.underreview,
              state: ServiceStatusObjectState.current,
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
          "services.$.notes": notes ?? null,
          "services.$.submissionDate": new Date().toUTCString(),
          "services.$.reupload": isReupload ? new Date().toUTCString() : null,
        },
      }
    );

    return true;
  }
}

export default UserService;
