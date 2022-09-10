import nodemailer, { SendMailOptions } from "nodemailer";
import { signJwt } from "../utils/auth";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.AUTH_EMAIL,
    pass: process.env.AUTH_PASS,
  },
});

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
