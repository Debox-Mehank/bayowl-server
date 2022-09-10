import { Arg, Mutation, Query, Resolver } from "type-graphql";
import AdminService from "../service/admin.service";

@Resolver()
export default class AdminResolver {
  constructor(private service: AdminService) {
    this.service = new AdminService();
  }
  // Admin login
  // Admin addEmployee / addManager
  // Admin me
  // Admin logout
  // Admin allEmployees
  // Admin number of services not yet started from client
  // Admin number of services not yet started from employee
  // Admin number of services completed
  // Admin number of services total
}
