import { ApolloError } from "apollo-server-express";
import { User, UserModel } from "../../user/schema/user.schema";
import { AdminLoginInput, AdminRegisterInput } from "../interface/admin.input";
import { Admin, AdminModel, AdminRole } from "../schema/admin.schema";
import bcrypt from "bcrypt";
import { signJwt } from "../../../utils/auth";
import Context from "../../../interface/context";
import { DashboardEnum } from "../interface/dashboard.interface";
import { UserServiceStatus } from "../../user/interface/user.interface";

class AdminService {
  async getAllUser(): Promise<User[]> {
    return await UserModel.find({}).lean();
  }

  async meAdmin(context: Context): Promise<Admin | null> {
    if (context.role !== "user") {
      return await AdminModel.findById(context.user);
    } else {
      throw new ApolloError("You are not authorized");
    }
  }

  async createAdmin(input: AdminRegisterInput, ctx: Context): Promise<string> {
    try {
      const newAdmin = await AdminModel.create({
        ...input,
        createdBy: ctx.user,
      });
      return newAdmin._id;
    } catch (error) {
      throw new ApolloError(error as string);
    }
  }

  async allAdmin(): Promise<Admin[]> {
    return await AdminModel.find({});
  }

  async allEmployees(): Promise<Admin[]> {
    return await AdminModel.find({ type: AdminRole.employee }).lean();
  }

  async dashboardMet() {
    return [
      {
        label: DashboardEnum.NumberOfCustomersRegistered,
        data: await UserModel.estimatedDocumentCount(),
      },
      {
        label: DashboardEnum.NumberOfCustomersWithPaidService,
        data: await UserModel.countDocuments({
          "services.paid": true,
        }),
      },
      {
        label: DashboardEnum.NumberOfServicesPendingAcceptance,
        data: await UserModel.countDocuments({
          $or: [
            { "services.statusType": UserServiceStatus.underreviewinternal },
            { "services.statusType": UserServiceStatus.underreview },
          ],
        }),
      },
      {
        label: DashboardEnum.NumberOfServicesInProgress,
        data: await UserModel.countDocuments({
          "services.statusType": UserServiceStatus.workinprogress,
        }),
      },
      {
        label: DashboardEnum.NumberOfServicesCompleted,
        data: await UserModel.countDocuments({
          "services.statusType": UserServiceStatus.completed,
        }),
      },
    ];
  }

  logoutAdmin(context: Context) {
    if (process.env.NODE_ENV === "production") {
      context.res!.cookie("accessToken", "", {
        httpOnly: true,
        sameSite: "none",
        secure: true,
        domain: ".bayowl.studio",
        path: "/",
        expires: new Date(0),
      });
    } else {
      context.res!.cookie("accessToken", "", {
        maxAge: 3.154e10,
        httpOnly: true,
        expires: new Date(0),
      });
    }

    return true;
  }

  async loginAdmin(input: AdminLoginInput, context: Context): Promise<boolean> {
    // get user
    const user = await AdminModel.findOne({ email: input.email }).lean();

    if (!user) {
      throw new ApolloError("Invalid email or password!");
    }

    // compare password
    const isPasswordValid = await bcrypt.compare(input.password, user.password);

    if (!isPasswordValid) {
      throw new ApolloError("Invalid email or password!");
    }

    // create jwt
    const token = signJwt({ role: user.type, user: user._id });

    // create cookie
    if (process.env.NODE_ENV === "production") {
      context.res!.cookie("accessToken", token, {
        maxAge: 3.154e10,
        httpOnly: true,
        sameSite: "none",
        secure: true,
        domain: ".bayowl.studio", //change to bayowl api server
        path: "/",
      });
    } else {
      context.res!.cookie("accessToken", token, {
        maxAge: 3.154e10,
        httpOnly: true,
      });
    }

    return true;
  }
}

export default AdminService;
