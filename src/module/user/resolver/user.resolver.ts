import {
  Arg,
  Ctx,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import Context from "../../../interface/context";
import { isAdmin, isAuth } from "../../../middleware/auth";
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

  @Query(() => Boolean)
  approveProject(@Arg("serviceId") serviceId: String) {
    return this.service.approveProject(serviceId);
  }

  @Query(() => Boolean)
  @UseMiddleware([isAuth])
  requestRevision(
    @Arg("serviceId") serviceId: string,
    @Arg("description") desc: string,
    @Arg("revisionNumber") rNum: number,
    @Arg("revisionForNumber") rforNum: number,
    @Ctx() context: Context
  ) {
    return this.service.requestRevision(
      serviceId,
      desc,
      rNum,
      rforNum,
      context
    );
  }

  @Mutation(() => Boolean)
  @UseMiddleware([isAdmin])
  uploadRevisionFiles(
    @Arg("serviceId") serviceId: string,
    @Arg("fileUrl") fileUrl: string,
    @Arg("revisionNumber") rNum: number,
    @Ctx() context: Context
  ) {
    return this.service.uploadRevisionFiles(serviceId, fileUrl, rNum, context);
  }

  @Query(() => Boolean)
  addRevisionNotesByMaster(
    @Arg("serviceId") serviceId: string,
    @Arg("note") note: string,
    @Ctx() context: Context
  ) {
    return this.service.addRevisionNotesByMaster(note, serviceId, context);
  }

  @Query(() => Boolean)
  @UseMiddleware([isAuth, isAdmin])
  addDeliverFiles(
    @Arg("serviceId") serviceId: string,
    @Arg("url") url: string
  ): Promise<Boolean> {
    return this.service.addDeliverFiles(serviceId, url);
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
  markCompleted(@Arg("serviceId") serviceId: string): Promise<boolean> {
    return this.service.markCompleted(serviceId);
  }

  @Query(() => Boolean)
  @UseMiddleware([isAuth])
  uploadFilesForService(
    @Ctx() context: Context,
    @Arg("serviceId") serviceId: string,
    @Arg("uplodedFiles", () => [String]) uplodedFiles: string[],
    @Arg("referenceUploadedFiles", () => [String], { nullable: true })
    referenceUploadedFiles?: string[],
    @Arg("notes", () => String, { nullable: true }) notes?: string,
    @Arg("isReupload", () => Boolean, { nullable: true }) isReupload?: boolean
  ): Promise<boolean> {
    return this.service.uploadFilesForService(
      context,
      serviceId,
      uplodedFiles,
      referenceUploadedFiles,
      notes,
      isReupload
    );
  }
}
