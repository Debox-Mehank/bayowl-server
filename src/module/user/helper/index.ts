import { UserModel } from "../schema/user.schema";
import bcrypt from "bcrypt";

// Check if user exists for given email or number
export const emailAndNumberChecker = async (
  email: string,
  number: string
): Promise<Boolean> => {
  const check = await UserModel.countDocuments({
    $or: [{ email: { $eq: email } }, { number: { $eq: number } }],
  })
    .lean()
    .select("_id");

  return check > 0 ? true : false;
};

// Check if user exists for given email and password
export const emailAndPasswordChecker = async (
  email: string,
  password: string
): Promise<{
  status: Boolean;
  user?: { _id: string; accountVerified: boolean };
}> => {
  const check = await UserModel.findOne({
    email: { $eq: email },
  })
    .lean()
    .select("_id accountVerified password");

  if (!check) {
    return { status: false, user: undefined };
  }

  if (!check.password) {
    return { status: false, user: undefined };
  }

  const checkPass = await bcrypt.compare(password, check.password);

  return {
    status: checkPass === true,
    user: {
      _id: check._id,
      accountVerified: check.accountVerified,
    },
  };
};

export const getUserByEmail = async (email: string) => {
  const user = await UserModel.findOne({ email: email })
    .lean()
    .select("name _id accountVerified");
  return user;
};

export const getUserEmail = async (_id: string) => {
  const user = await UserModel.findOne({ _id: _id })
    .lean()
    .select("_id email name");
  return user;
};
