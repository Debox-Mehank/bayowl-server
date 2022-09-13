import { Arg, Ctx, Query, Resolver, UseMiddleware } from "type-graphql";
import Context from "../../../interface/context";
import { isAuth } from "../../../middleware/auth";
import { User } from "../schema/user.schema";
import UserService from "../service/user.service";

@Resolver()
export default class UserResolver {
  constructor(private service: UserService) {
    this.service = new UserService();
  }
  // User signin
  @Query(() => Boolean)
  login(
    @Arg("email") email: string,
    @Arg("password") password: string,
    @Ctx() context: Context,
    @Arg("token", { nullable: true }) token?: string
  ): Promise<Boolean> {
    return this.service.login(
      { email: email, password: password, token: token },
      context
    );
  }

  // User signup
  @Query(() => Boolean)
  register(
    @Arg("name") name: string,
    @Arg("number") number: string,
    @Arg("email") email: string,
    @Arg("password") password: string,
    @Ctx() context: Context,
    @Arg("token", { nullable: true }) token?: string
  ): Promise<Boolean> {
    return this.service.register(
      {
        name: name,
        number: number,
        email: email,
        password: password,
        token: token,
      },
      context
    );
  }

  // User Complete Account
  @Query(() => Boolean)
  completeAccount(
    @Arg("name") name: string,
    @Arg("number") number: string,
    @Arg("email") email: string,
    @Arg("password") password: string,
    @Arg("token") token: string
  ): Promise<Boolean> {
    return this.service.completeAccount({
      name: name,
      number: number,
      email: email,
      password: password,
      token: token,
    });
  }

  // User me
  @Query(() => User)
  @UseMiddleware([isAuth])
  me(@Ctx() context: Context): Promise<User> {
    return this.service.me(context);
  }

  // User logout
  @Query(() => Boolean)
  @UseMiddleware([isAuth])
  logout(@Ctx() context: Context): Promise<Boolean> {
    return this.service.logout(context);
  }

  // User forgot password
  // User reset password
  // User verification
  @Query(() => Boolean)
  verifyUser(@Arg("token") token: string): Promise<Boolean> {
    return this.service.verifyEmail(token);
  }
  // User update project name
  @Query(() => Boolean)
  @UseMiddleware([isAuth])
  updatePorjectName(
    @Arg("projectName") projectName: string,
    @Arg("serviceId") serviceId: string,
    @Ctx() context: Context
  ): Promise<Boolean> {
    return this.service.updatePorjectName(projectName, serviceId, context);
  }
}
