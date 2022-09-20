import nodemailer, { SendMailOptions } from "nodemailer";
import hbs, {
  HbsTransporter,
  NodemailerExpressHandlebarsOptions,
  TemplateOptions,
} from "nodemailer-express-handlebars";
import path from "path";
import { signJwt } from "../utils/auth";

const MANAGEMENT_MAIL = process.env.MANAGEMENT_MAIL;
const MASTER_MAIL = process.env.MASTER_MAIL;

const transporter: HbsTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.AUTH_EMAIL,
    pass: process.env.AUTH_PASS,
  },
});

const hbsOptions: NodemailerExpressHandlebarsOptions = {
  extName: ".hbs",
  viewEngine: {
    extname: ".html",
    partialsDir: path.join(__dirname),
    defaultLayout: false,
  },
  viewPath: path.join(__dirname),
};

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
    html: `<a href=${verificationLink}>Click here</a>`,
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

export const servicePurchaseMail = async (
  email: string,
  customer: string,
  service: string
) => {
  const mailOptions: SendMailOptions | TemplateOptions = {
    from: process.env.AUTH_EMAIL,
    to: email,
    template: "servicepurchase",
    subject: "Service Purchased",
    context: {
      customer: customer,
      service: service,
    },
  };
  const mailOptionsAdmin: SendMailOptions | TemplateOptions = {
    from: process.env.AUTH_EMAIL,
    to: MASTER_MAIL,
    template: "servicepurchasea",
    subject: "Service Purchased",
    context: {
      customer: customer,
      service: service,
    },
  };
  try {
    await transporter.sendMail(mailOptions);
    await transporter.sendMail(mailOptionsAdmin);
  } catch (error) {
    console.log("Error in sending mail: " + error);
  }
};
