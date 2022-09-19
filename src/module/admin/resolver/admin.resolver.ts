import {
  Arg,
  Ctx,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import Context from "../../../interface/context";
import { User } from "../../user/schema/user.schema";
import { AdminLoginInput, AdminRegisterInput } from "../interface/admin.input";
import { Admin } from "../schema/admin.schema";
import AdminService from "../service/admin.service";
import { DashboardInterfaceClass } from "../interface/dashboard.interface";
import { isAdmin, isAuth } from "../../../middleware/auth";
@Resolver()
export default class AdminResolver {
  constructor(private service: AdminService) {
    this.service = new AdminService();
  }

  @Query(() => [User])
  getAllUser(): Promise<User[]> {
    return this.service.getAllUser();
  }

  @Query(() => Boolean)
  @UseMiddleware(isAuth, isAdmin)
  resetPassword(
    @Arg("id") id: string,
    @Arg("password") password: string
  ): Promise<boolean> {
    return this.service.resetPassword(id, password);
  }

  @Query(() => Admin, { nullable: true })
  meAdmin(@Ctx() context: Context): Promise<Admin | null> {
    return this.service.meAdmin(context);
  }

  @Mutation(() => String)
  addUser(
    @Arg("input") input: AdminRegisterInput,
    @Ctx() context: Context
  ): Promise<String> {
    return this.service.createAdmin(input, context);
  }

  @Query(() => [Admin])
  allAdmins(): Promise<Admin[]> {
    return this.service.allAdmin();
  }

  @Query(() => [Admin])
  allEmployee(): Promise<Admin[]> {
    return this.service.allEmployees();
  }

  @Query(() => Boolean)
  adminLogin(
    @Arg("input") input: AdminLoginInput,
    @Ctx() context: Context
  ): Promise<boolean> {
    return this.service.loginAdmin(input, context);
  }

  @Query(() => Boolean)
  adminLogout(@Ctx() context: Context) {
    return this.service.logoutAdmin(context);
  }

  @Query(() => [DashboardInterfaceClass])
  dashboardMet() {
    return this.service.dashboardMet();
  }

  // Admin allEmployees
  // Admin number of services not yet started from client
  // Admin number of services not yet started from employee
  // Admin number of services completed
  // Admin number of services total
}
