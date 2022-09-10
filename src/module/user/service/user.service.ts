import { ApolloError } from "apollo-server-express";
import Joi from "joi";
import Razorpay from "razorpay";
import bcrypt from "bcrypt";
import Context from "../../../interface/context";
import { signJwt, verifyJwt } from "../../../utils/auth";
import {
  emailAndNumberChecker,
  emailAndPasswordChecker,
  getUserByEmail,
} from "../helper";
import { User, UserModel } from "../schema/user.schema";
import { OAuth2Client } from "google-auth-library";
import { sendUserVerificationEmail } from "../../../mails";
import { VerificationTokenType } from "../../../interface/jwt";
import { PaymentModel } from "../../payment/schema/payment.schema";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client({
  clientId: GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
});

class UserService {
  async login(
    input: { email: string; password: string; token?: string },
    context: Context
  ) {
    // Gmail Login Checker
    if (input.token) {
      // Login with Gmail
      const { email_verified, email } = await client.getTokenInfo(input.token);

      if (!email_verified) {
        throw new ApolloError(
          "Looks like your email or password is incorrect."
        );
      }

      const user = await getUserByEmail(email!);

      if (!user) {
        throw new ApolloError("No account found for this email id");
      }

      // check user email verification status
      if (!user.accountVerified) {
        throw new ApolloError("Looks like your email is not yet verified.");
      }

      // create jwt
      const authToken = signJwt({
        user: user._id,
        role: "user",
      });

      // create cookie
      if (process.env.NODE_ENV === "production") {
        context.res!.cookie("accessToken", authToken, {
          maxAge: 3.154e10,
          httpOnly: true,
          sameSite: "none",
          secure: true,
          domain: ".bayowl.studio",
          path: "/",
        });
      } else {
        context.res!.cookie("accessToken", authToken, {
          maxAge: 3.154e10,
          httpOnly: true,
        });
      }

      await UserModel.findOneAndUpdate(
        { _id: user._id },
        { $set: { lastLoggedIn: new Date() } }
      );

      return true;
    }

    const joiSchema = Joi.object({
      email: Joi.string().required().email().messages({
        "string.empty": "You have not entered your email id.",
        "string.email": "You have entered an invalid email id.",
      }),
      password: Joi.string().required().messages({
        "string.empty": "You have not entered your password.",
      }),
    });

    // Schema Validation
    const { error } = joiSchema.validate({
      email: input.email,
      password: input.password,
    });

    if (error) {
      throw new ApolloError(error.message.toString());
    }

    const { status, user } = await emailAndPasswordChecker(
      input.email,
      input.password
    );

    // Checking for existing user
    if (!status || !user) {
      throw new ApolloError("Looks like your email or password is incorrect.");
    }

    // check user email verification status
    if (!user.accountVerified) {
      throw new ApolloError("Looks like your email is not yet verified.");
    }

    // create jwt
    const authToken = signJwt({
      user: user._id,
      role: "user",
    });

    // create cookie
    if (process.env.NODE_ENV === "production") {
      context.res!.cookie("accessToken", authToken, {
        maxAge: 3.154e10,
        httpOnly: true,
        sameSite: "none",
        secure: true,
        domain: ".bayowl.studio",
        path: "/",
      });
    } else {
      context.res!.cookie("accessToken", authToken, {
        maxAge: 3.154e10,
        httpOnly: true,
      });
    }

    await UserModel.findOneAndUpdate(
      { _id: user._id },
      { $set: { lastLoggedIn: new Date() } }
    );

    return true;
  }

  async logout(context: Context) {
    if (process.env.NODE_ENV === "production") {
      context.res!.cookie("accessToken", "", {
        maxAge: 3.154e10,
        httpOnly: true,
        sameSite: "none",
        secure: true,
        domain: ".bayowl.studio",
        path: "/",
        expires: new Date(0),
      });
    } else {
      context.res!.cookie("accessToken", "", {
        maxAge: 0,
        httpOnly: true,
        expires: new Date(0),
      });
    }

    await UserModel.findOneAndUpdate(
      { _id: context.user },
      { $set: { lastLoggedOut: new Date() } }
    );

    return true;
  }

  async me(ctx: Context): Promise<User> {
    const user = await UserModel.findById(ctx.user).lean<User>();

    if (!user) {
      throw new ApolloError("Something went wrong, try again later.");
    }

    return user;
  }

  async register(
    input: {
      name: string;
      number: string;
      email: string;
      password: string;
      token?: string;
    },
    context: Context
  ): Promise<Boolean> {
    try {
      // Gmail Signup Checker
      if (input.token) {
        // Signup with Gmail
        const { email_verified, email } = await client.getTokenInfo(
          input.token
        );

        if (!email_verified) {
          throw new ApolloError(
            "Looks like your email or password is incorrect."
          );
        }

        const user = await getUserByEmail(email!);

        if (user) {
          throw new ApolloError("Account already exists, try to login");
        }

        const createdUser = await UserModel.create({
          name: input.name,
          email: email,
          accountVerified: true,
        });

        // create jwt
        const authToken = signJwt({
          user: createdUser._id,
          role: "user",
        });

        // create cookie
        if (process.env.NODE_ENV === "production") {
          context.res!.cookie("accessToken", authToken, {
            maxAge: 3.154e10,
            httpOnly: true,
            sameSite: "none",
            secure: true,
            domain: ".bayowl.studio",
            path: "/",
          });
        } else {
          context.res!.cookie("accessToken", authToken, {
            maxAge: 3.154e10,
            httpOnly: true,
          });
        }

        await UserModel.findOneAndUpdate(
          { _id: createdUser._id },
          { $set: { lastLoggedIn: new Date() } }
        );

        return true;
      }

      // Validations on input
      const joiSchema = Joi.object({
        name: Joi.string().required().messages({
          "string.empty": "You have not entered your name.",
        }),
        email: Joi.string().required().email().messages({
          "string.empty": "You have not entered your email id.",
          "string.email": "You have entered an invalid email id.",
        }),
        number: Joi.string()
          .length(10)
          .pattern(/^[0-9]+$/)
          .messages({
            "string.empty": "You have not entered your phone number.",
            "string.length": "You have entered an invalid phone number.",
            "string.pattern": "You have entered an invalid phone number.",
          }),
        password: Joi.string()
          .required()
          .messages({ "string.empty": "You have not entered your password." }),
      });

      // Schema Validation
      const { error } = joiSchema.validate({
        name: input.name,
        number: input.number,
        email: input.email,
        password: input.password,
      });

      if (error) {
        throw new ApolloError(error.message.toString());
      }

      const checkUserExists = await emailAndNumberChecker(
        input.email,
        input.number
      );

      // Checking for existing user
      if (checkUserExists) {
        throw new ApolloError(
          "Looks like your number or email is already registered with us."
        );
      }

      const createdUser = await UserModel.create({
        name: input.name,
        email: input.email,
        number: input.number,
        password: input.password,
      });

      // send verify mail
      await sendUserVerificationEmail({
        email: input.email,
        userId: createdUser._id,
      });

      return true;
    } catch (error) {
      console.log("ERROR in register" + error);
      throw new ApolloError(error as string);
    }
  }

  async completeAccount(input: {
    name: string;
    number: string;
    email: string;
    password: string;
    token: string;
  }) {
    try {
      // Validations on input
      const joiSchema = Joi.object({
        name: Joi.string().required().messages({
          "string.empty": "You have not entered your name.",
        }),
        email: Joi.string().required().email().messages({
          "string.empty": "You have not entered your email id.",
          "string.email": "You have entered an invalid email id.",
        }),
        number: Joi.string()
          .length(10)
          .pattern(/^[0-9]+$/)
          .messages({
            "string.empty": "You have not entered your phone number.",
            "string.length": "You have entered an invalid phone number.",
            "string.pattern": "You have entered an invalid phone number.",
          }),
        password: Joi.string()
          .required()
          .messages({ "string.empty": "You have not entered your password." }),
      });

      // Schema Validation
      const { error } = joiSchema.validate({
        name: input.name,
        number: input.number,
        email: input.email,
        password: input.password,
      });

      if (error) {
        throw new ApolloError(error.message.toString());
      }

      // Validate Token
      const payload = verifyJwt<VerificationTokenType>(input.token);

      if (!payload) {
        throw new ApolloError("The link is expired.");
      }

      const user = await UserModel.findById(payload.id).select(
        "name email accountVerified services"
      );

      if (user?.name) {
        throw new ApolloError(
          "Your account is already created, try to login with your credentials."
        );
      }

      // hash password
      const salt = await bcrypt.genSalt(10);
      const hash = bcrypt.hashSync(input.password, salt);

      await UserModel.updateOne(
        {
          email: input.email,
        },
        {
          $set: {
            name: input.name,
            number: input.number,
            password: hash,
          },
        }
      );

      return true;
    } catch (error) {
      console.log("ERROR in register" + error);
      throw new ApolloError(error as string);
    }
  }

  async verifyEmail(token: string): Promise<Boolean> {
    const payload = verifyJwt<VerificationTokenType>(token);

    if (!payload) {
      throw new ApolloError("The verification link is expired.");
    }

    const user = await UserModel.findById(payload.id).select(
      "name email accountVerified services"
    );

    if (!user) {
      throw new ApolloError("Something went wrong!");
    }

    if (user.accountVerified) {
      throw new ApolloError(
        "Your account is already verified, try to login with your credentials."
      );
    }

    try {
      await UserModel.updateOne(
        { _id: payload.id },
        { $set: { accountVerified: true } }
      );

      const payment = await PaymentModel.findOne({ email: user.email });

      // Create rp instance
      const instance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });

      const allservices = [...user.services];

      const service = allservices.find(
        (el) => el._id.toString() === payment?.userServiceId
      );

      if (service && payment) {
        console.log("here");
        const paylink = await instance.paymentLink.create({
          amount: service.price * 100,
          currency: "INR",
          customer: {
            email: user.email,
          },
          notify: {
            email: true,
          },
          callback_url: `${process.env.CALLBACK_URL}`,
          callback_method: "get",
        });

        await PaymentModel.updateOne(
          { _id: payment._id },
          { $set: { paymentLinkId: paylink.id } }
        );
      }

      return true;
    } catch (error) {
      console.log(error);
      throw new ApolloError(error as string);
    }
  }
}

export default UserService;
