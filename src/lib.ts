import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

// 1. Database (Prisma)
export const prisma = new PrismaClient();
export default prisma;

// 2. JWT Secrets
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "access_secret";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh_secret";

// 3. Token Helpers
export const generateAccessToken = (userId: string, role: string) => {
  return jwt.sign({ userId, role }, ACCESS_SECRET, { expiresIn: "15m" });
};

export const generateRefreshToken = (userId: string) => {
  return jwt.sign({ userId }, REFRESH_SECRET, { expiresIn: "7d" });
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, ACCESS_SECRET) as { userId: string; role: string };
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, REFRESH_SECRET) as { userId: string };
};

// 4. Response Helpers
export const sendSuccess = (
  res: Response,
  data: any,
  message: string = "Success",
  status: number = 200,
) => {
  return res.status(status).json({ success: true, data, message });
};

export const sendError = (
  res: Response,
  message: string,
  status: number = 500,
  errors: any[] = [],
) => {
  return res.status(status).json({ success: false, message, errors });
};

// 5. Auth Middleware
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return sendError(res, "Unauthorized: No token provided", 401);
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return sendError(res, "Unauthorized: Invalid or expired token", 401);
  }
};

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return sendError(
        res,
        "Forbidden: You don't have permission to access this resource",
        403,
      );
    }
    next();
  };
};

// 6. Cloudinary Configuration
import { v2 as cloudinary } from "cloudinary";
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
export { cloudinary };

// 7. Resend Configuration
import { Resend } from "resend";

// ✅ Correct — only called when actually needed
function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  return new Resend(key);
}

export const sendOtpEmail = async (email: string, otp: string) => {
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  try {
    const resend = getResend();

    // Await the email send so it doesn't get cancelled by serverless environments
    await resend.emails
      .send({
        from: `CiviLink <${fromEmail}>`,
        to: email,
        subject: "Your CiviLink Verification Code",
        html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #141414; border-radius: 16px; overflow: hidden;">
        <div style="padding: 40px 32px; text-align: center;">
          <h1 style="color: #E4E3E0; font-size: 28px; font-weight: 900; text-transform: uppercase; letter-spacing: -1px; margin: 0 0 8px 0;">CiviLink</h1>
          <p style="color: #999; font-size: 12px; text-transform: uppercase; letter-spacing: 4px; margin: 0;">Verification Code</p>
        </div>
        <div style="background: #1a1a1a; padding: 40px 32px; text-align: center; border-top: 1px solid #333; border-bottom: 1px solid #333;">
          <p style="color: #999; font-size: 14px; margin: 0 0 20px 0;">Your one-time access code is:</p>
          <div style="background: #E4E3E0; color: #141414; font-size: 36px; font-weight: 900; letter-spacing: 12px; padding: 20px 32px; border-radius: 12px; display: inline-block;">${otp}</div>
          <p style="color: #666; font-size: 12px; margin: 20px 0 0 0;">This code expires in <strong style="color: #999;">5 minutes</strong></p>
        </div>
        <div style="padding: 24px 32px; text-align: center;">
          <p style="color: #555; font-size: 11px; margin: 0;">If you didn't request this code, please ignore this email.</p>
          <p style="color: #333; font-size: 10px; margin: 12px 0 0 0; text-transform: uppercase; letter-spacing: 2px;">© 2026 CiviLink — Intelligent Civic Action</p>
        </div>
      </div>
    `,
      });
  } catch (err) {
    console.error(`[RESEND] Failed to send OTP email:`, (err as Error).message);
  }
};

// 8. Multer (Upload) Configuration
import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname),
    );
  },
});

const fileFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only images are allowed"), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// --- GLOBAL SERVICES ---

// 8. Points Service
export const awardPoints = async (
  userId: string,
  points: number,
  reason: string,
) => {
  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { points: { increment: points } },
      }),
      prisma.pointTransaction.create({
        data: {
          userId,
          points,
          reason,
        },
      }),
    ]);
  } catch (error) {
    console.error("Points Service Error:", error);
  }
};

// 9. Notification Service
export const createNotification = async (
  userId: string,
  message: string,
  type: string,
  io?: any,
) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        message,
        type,
      },
    });

    if (io) {
      io.to(`user_${userId}`).emit("notification", notification);
    }

    return notification;
  } catch (error) {
    console.error("Notification Service Error:", error);
  }
};
