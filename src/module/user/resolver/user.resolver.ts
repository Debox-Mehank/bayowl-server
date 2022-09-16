import { Arg, Ctx, Query, Resolver, UseMiddleware } from "type-graphql";
import Context from "../../../interface/context";
import { isAuth } from "../../../middleware/auth";
import {
  FileUploadResponse,
  FinalMultipartUploadInput,
  MultipartSignedUrlResponse,
  UserServices,
} from "../interface/user.interface";
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

  @Query(() => UserServices, { nullable: true })
  @UseMiddleware([isAuth])
  getUserServiceDetailsById(
    @Arg("serviceId") serviceId: string,
    @Ctx() context: Context
  ): Promise<UserServices | null> {
    return this.service.getServiceDetails(serviceId, context);
  }

  @Query(() => FileUploadResponse)
  @UseMiddleware([isAuth])
  initFileUpload(
    @Arg("fileName") fileName: string
  ): Promise<FileUploadResponse> {
    return this.service.initFileUpload(fileName);
  }

  @Query(() => [MultipartSignedUrlResponse])
  @UseMiddleware([isAuth])
  getMultipartPreSignedUrls(
    @Arg("fileId") fileId: string,
    @Arg("fileKey") fileKey: string,
    @Arg("parts") parts: number
  ): Promise<MultipartSignedUrlResponse[]> {
    return this.service.getMultipartPreSignedUrls(fileId, fileKey, parts);
  }

  @Query(() => String, { nullable: true })
  @UseMiddleware([isAuth])
  finalizeMultipartUpload(
    @Arg("input") input: FinalMultipartUploadInput
  ): Promise<String | undefined> {
    return this.service.finalizeMultipartUpload(input);
  }

  @Query(() => String)
  @UseMiddleware([isAuth])
  getS3SignedURL(@Arg("fileName") fileName: string): Promise<string> {
    return this.service.getS3SignedURL(fileName);
  }

  @Query(() => Boolean)
  @UseMiddleware([isAuth])
  uploadFilesForService(
    @Ctx() context: Context,
    @Arg("serviceId") serviceId: string,
    @Arg("uplodedFiles", () => [String]) uplodedFiles: string[],
    @Arg("referenceUploadedFiles", () => [String])
    referenceUploadedFiles?: string[]
  ): Promise<boolean> {
    return this.service.uploadFilesForService(
      context,
      serviceId,
      uplodedFiles,
      referenceUploadedFiles
    );
  }
}
