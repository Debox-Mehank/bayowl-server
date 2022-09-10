import { Request, Response } from "express";
import { Admin } from "../module/admin/schema/admin.schema";

interface Context {
  req?: Request;
  res?: Response;
  role: Admin["type"] | "user" | undefined;
  user: string | undefined;
}

export default Context;
