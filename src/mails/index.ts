import nodemailer, { SendMailOptions } from "nodemailer";
import hbs, {
  HbsTransporter,
  NodemailerExpressHandlebarsOptions,
  TemplateOptions,
} from "nodemailer-express-handlebars";
import path from "path";
import { signJwt } from "../utils/auth";

// const MANAGEMENT_MAIL = process.env.MANAGEMENT_MAIL;
const MASTER_MAIL = process.env.MASTER_MAIL;

export const transporter: HbsTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.AUTH_EMAIL,
    pass: process.env.AUTH_PASS,
  },
});

export const hbsOptions: NodemailerExpressHandlebarsOptions = {
  extName: ".hbs",
  viewEngine: {
    extname: ".html",
    partialsDir: path.join(__dirname, "templates"),
    defaultLayout: false,
  },
  viewPath: path.join(__dirname, "templates"),
};

transporter.use("compile", hbs(hbsOptions));

export const sendUserVerificationEmail = async ({
  email,
  userId,
}: {
  email: string;
  userId: string;
}) => {
  const appUrl = process.env.APP_URL!;

  const token = signJwt({ id: userId }, { expiresIn: "1d" });

  const verificationLink = `${appUrl}/email-verification?userId=${userId}&token=${token}`;

  const mailOptions: SendMailOptions = {
    from: process.env.AUTH_EMAIL,
    to: email,
    subject: "Verify Your Email!",
    html: `<p style="white-space: pre-line;">Click on the link to verify your email id.</p><p>This link will <b>expire in 60 minutes.</b></p><a href='${verificationLink}' target='_blank'>Click Here</a>`,
  };
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log("Error in sending verification mail: " + error);
  }
};

export const sendUserCreateAccountMail = async ({
  email,
  userId,
}: {
  email: string;
  userId: string;
}) => {
  const appUrl = process.env.APP_URL!;

  const token = signJwt({ id: userId }, { expiresIn: "1d" });

  const verificationLink = `${appUrl}/complete-account?email=${email}&token=${token}`;

  const mailOptions: SendMailOptions = {
    from: process.env.AUTH_EMAIL,
    to: email,
    subject: "Create your account",
    html: `<a href=${verificationLink}>Click here</a>`,
  };
  try {
    await transporter.sendMail(mailOptions);
    return verificationLink;
  } catch (error) {
    console.log("Error in sending create account mail: " + error);
  }
};

export const sendResetPasswordLink = async (email: string, userId: string) => {
  const appUrl = process.env.APP_URL!;

  const token = signJwt({ id: userId }, { expiresIn: "1h" });

  const resetPasswordLink = `${appUrl}/reset-password?userId=${userId}&token=${token}`;

  const mailOptions: SendMailOptions | TemplateOptions = {
    from: process.env.AUTH_EMAIL,
    to: email,
    subject: "Reset Your Password!",
    html: `<p style="white-space: pre-line;">Click on the link to reset your password.</p><p>This link will <b>expire in 60 minutes.</b></p><a href='${resetPasswordLink}' target='_blank'>Click Here</a>`,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log("Mail sending error: " + error);
  }
};

export const servicePurchaseMail = async (
  email: string,
  customer: string,
  service: string,
  amount: number
) => {
  const mailOptions: SendMailOptions | TemplateOptions = {
    from: process.env.AUTH_EMAIL,
    to: email,
    template: "service-purchase-customer",
    subject: "Service Purchased",
    context: {
      customer: customer,
      service: service,
      amount: amount.toLocaleString("en-IN"),
      website: process.env.APP_URL,
    },
  };
  const mailOptionsAdmin: SendMailOptions | TemplateOptions = {
    from: process.env.AUTH_EMAIL,
    to: MASTER_MAIL,
    template: "service-purchase-admin",
    subject: "Service Purchased",
    context: {
      customer: customer,
      service: service,
      amount: amount.toLocaleString("en-IN"),
    },
  };
  try {
    await transporter.sendMail(mailOptions);
    await transporter.sendMail(mailOptionsAdmin);
  } catch (error) {
    console.log("Error in sending mail: " + error);
  }
};
