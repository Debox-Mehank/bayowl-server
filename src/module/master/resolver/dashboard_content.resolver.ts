import { Arg, Ctx, Query, Resolver, UseMiddleware } from "type-graphql";
import Context from "../../../interface/context";
import { isAuth, isAdmin } from "../../../middleware/auth";
import { DashboardContentInput } from "../interface/dashboard_content.interface";
import { DashboardContent } from "../schema/dashboard_content.schema";
import DashboardContentService from "../service/dashboard_content.service";

@Resolver()
export default class DashboardContentResolver {
  constructor(private service: DashboardContentService) {
    this.service = new DashboardContentService();
  }

  @Query(() => [DashboardContent])
  @UseMiddleware([isAuth, isAdmin])
  allDashboardContent() {
    return this.service.getAll();
  }

  @Query(() => [DashboardContent])
  @UseMiddleware([isAuth])
  activeDashboardContent() {
    return this.service.getActive();
  }

  @Query(() => DashboardContent)
  @UseMiddleware([isAuth, isAdmin])
  addDashboardContent(
    @Arg("input") input: DashboardContentInput,
    @Ctx() context: Context
  ) {
    return this.service.addDashboardContent(input, context);
  }

  @Query(() => Boolean)
  @UseMiddleware([isAuth, isAdmin])
  toggleDashboardContent(@Arg("id") id: string): Promise<boolean> {
    return this.service.toggleDashboardContent(id);
  }

  @Query(() => Boolean)
  @UseMiddleware([isAuth, isAdmin])
  deleteDashboardContent(
    @Arg("id") id: string,
    @Arg("image") image: string
  ): Promise<boolean> {
    return this.service.deleteDashboardContent(id, image);
  }

  @Query(() => String)
  @UseMiddleware([isAuth, isAdmin])
  getContentUploadUrl(@Arg("fileName") fileName: string) {
    return this.service.getContentUploadUrl(fileName);
  }
}
