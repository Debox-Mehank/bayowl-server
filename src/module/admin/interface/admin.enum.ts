import { registerEnumType } from "type-graphql";

export enum AdminRole {
  master = "master",
  admin = "admin",
  normal = "normal",
}

registerEnumType(AdminRole, {
  name: "AdminRole",
  description: "Types of Admin Roles",
});
