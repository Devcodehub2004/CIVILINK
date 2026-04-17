// server.ts
import dotenv from "dotenv";
import express from "express";
import { createServer as createViteServer } from "vite";
import path2 from "path";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { createServer } from "http";
import { Server } from "socket.io";

// src/auth.ts
import { Router } from "express";
import { z } from "zod";
import axios from "axios";

// src/lib.ts
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import { Resend } from "resend";
import multer from "multer";
import path from "path";
var prisma = new PrismaClient();
var ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "access_secret";
var REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh_secret";
var generateAccessToken = (userId, role) => {
  return jwt.sign({ userId, role }, ACCESS_SECRET, { expiresIn: "15m" });
};
var generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, REFRESH_SECRET, { expiresIn: "7d" });
};
var verifyAccessToken = (token) => {
  return jwt.verify(token, ACCESS_SECRET);
};
var verifyRefreshToken = (token) => {
  return jwt.verify(token, REFRESH_SECRET);
};
var sendSuccess = (res, data, message = "Success", status = 200) => {
  return res.status(status).json({ success: true, data, message });
};
var sendError = (res, message, status = 500, errors = []) => {
  return res.status(status).json({ success: false, message, errors });
};
var authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return sendError(res, "Unauthorized: No token provided", 401);
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return sendError(res, "Unauthorized: No token provided", 401);
  }
  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch {
    return sendError(res, "Unauthorized: Invalid or expired token", 401);
  }
};
var authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return sendError(
        res,
        "Forbidden: You don't have permission to access this resource",
        403
      );
    }
    next();
  };
};
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  return new Resend(key);
}
var sendOtpEmail = async (email, otp) => {
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const resend = getResend();
  const { data, error } = await resend.emails.send({
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
      <p style="color: #333; font-size: 10px; margin: 12px 0 0 0; text-transform: uppercase; letter-spacing: 2px;">\xA9 2026 CiviLink \u2014 Intelligent Civic Action</p>
    </div>
  </div>
`
  });
  if (error) {
    console.error(`[RESEND ERROR]:`, error);
    throw new Error(`Email sending failed: ${error.message}`);
  }
  return data;
};
var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  }
});
var fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only images are allowed"));
  }
};
var upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});
var awardPoints = async (userId, points, reason) => {
  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { points: { increment: points } }
      }),
      prisma.pointTransaction.create({
        data: {
          userId,
          points,
          reason
        }
      })
    ]);
  } catch (error) {
    console.error("Points Service Error:", error);
  }
};
var createNotification = async (userId, message, type, io) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        message,
        type
      }
    });
    if (io?.to) {
      io.to(`user_${userId}`).emit("notification", notification);
    }
    return notification;
  } catch (error) {
    console.error("Notification Service Error:", error);
  }
};

// src/auth.ts
var router = Router();
var GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
var registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email("Please enter a valid email address"),
  otp: z.string().length(6),
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/, "Phone must be in international format (e.g., +91...)").optional().or(z.literal("")).transform((value) => value === "" ? void 0 : value),
  avatarUrl: z.string().url().optional().or(z.literal("")).transform((value) => value === "" ? void 0 : value)
});
var loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  otp: z.string().length(6)
});
var formatZodError = (error) => {
  const issues = error.issues.map((issue) => ({
    path: issue.path,
    message: issue.message,
    code: issue.code
  }));
  const message = issues.map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`).join(", ");
  return {
    message,
    issues
  };
};
var sendOtp = async (req, res) => {
  try {
    const emailResult = z.string().email("Invalid email format").safeParse(req.body?.email);
    if (!emailResult.success) {
      return sendError(res, emailResult.error.issues[0]?.message || "Invalid email format", 400);
    }
    const email = emailResult.data;
    const otp = Math.floor(1e5 + Math.random() * 9e5).toString();
    await prisma.$transaction([
      prisma.otp.deleteMany({ where: { email } }),
      prisma.otp.create({
        data: {
          code: otp,
          email,
          expiresAt: new Date(Date.now() + 5 * 60 * 1e3)
        }
      })
    ]);
    await sendOtpEmail(email, otp);
    console.log(`
[EMAIL] OTP for ${email}: ${otp}
`);
    return sendSuccess(res, null, "OTP sent to your email successfully");
  } catch (error) {
    console.error("Send OTP Error:", error);
    const message = error instanceof Error ? error.message : "Failed to send OTP. Please try again.";
    return sendError(res, message);
  }
};
var register = async (req, res) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const { name, email, otp, phone, avatarUrl } = validatedData;
    const storedOtp = await prisma.otp.findFirst({
      where: { email, code: otp, expiresAt: { gte: /* @__PURE__ */ new Date() } }
    });
    if (!storedOtp) return sendError(res, "Invalid or expired OTP", 400);
    const existingUser = await prisma.user.findFirst({ where: { email } });
    if (existingUser) return sendError(res, "User already exists with this email", 400);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        avatarUrl,
        passwordHash: null
      }
    });
    await prisma.otp.deleteMany({ where: { email } });
    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);
    return sendSuccess(
      res,
      {
        user: {
          id: user.id,
          name,
          email,
          phone,
          role: user.role,
          avatarUrl: user.avatarUrl
        },
        accessToken,
        refreshToken
      },
      "User registered successfully"
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formatted = formatZodError(error);
      return sendError(res, formatted.message, 400, formatted.issues);
    }
    return sendError(res, error instanceof Error ? error.message : "Internal server error");
  }
};
var login = async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const { email, otp } = validatedData;
    const storedOtp = await prisma.otp.findFirst({
      where: { email, code: otp, expiresAt: { gte: /* @__PURE__ */ new Date() } }
    });
    if (!storedOtp) return sendError(res, "Invalid or expired OTP", 400);
    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) return sendError(res, "User not found. Please register first.", 404);
    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);
    await prisma.otp.deleteMany({ where: { email } });
    return sendSuccess(
      res,
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatarUrl: user.avatarUrl
        },
        accessToken,
        refreshToken
      },
      "Login successful"
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formatted = formatZodError(error);
      return sendError(res, formatted.message, 400, formatted.issues);
    }
    return sendError(res, error instanceof Error ? error.message : "Internal server error");
  }
};
var googleSignIn = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return sendError(res, "Google credential token is required", 400);
    }
    if (!GOOGLE_CLIENT_ID) {
      return sendError(res, "Google Sign-In is not configured on the server", 500);
    }
    const response = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${credential}` }
    });
    const payload = response.data;
    if (!payload || !payload.email) {
      return sendError(res, "Invalid Google token payload", 400);
    }
    const { email, name, picture, email_verified } = payload;
    if (!email_verified) {
      return sendError(res, "Google email is not verified", 400);
    }
    let user = await prisma.user.findFirst({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: name || email.split("@")[0],
          email,
          avatarUrl: picture || null,
          passwordHash: null
        }
      });
      console.log(`[GOOGLE AUTH] New user registered: ${email}`);
    } else {
      if (!user.avatarUrl && picture) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { avatarUrl: picture }
        });
      }
      console.log(`[GOOGLE AUTH] Existing user logged in: ${email}`);
    }
    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);
    return sendSuccess(
      res,
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatarUrl: user.avatarUrl
        },
        accessToken,
        refreshToken
      },
      "Google sign-in successful"
    );
  } catch (error) {
    console.error("Google Sign-In Error:", error);
    const message = error instanceof Error ? error.message : "Google sign-in failed";
    return sendError(res, message);
  }
};
var logout = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, "Unauthorized", 401);
    const { token } = req.body;
    if (token) {
      await prisma.refreshToken.deleteMany({ where: { token, userId } });
    } else {
      await prisma.refreshToken.deleteMany({ where: { userId } });
    }
    return sendSuccess(res, null, "Logged out successfully");
  } catch (error) {
    return sendError(res, error instanceof Error ? error.message : "Internal server error");
  }
};
var refresh = async (req, res) => {
  try {
    const tokenResult = z.string().min(1, "Refresh token required").safeParse(req.body?.token);
    if (!tokenResult.success) {
      return sendError(res, tokenResult.error.issues[0]?.message || "Refresh token required", 400);
    }
    const token = tokenResult.data;
    const decoded = verifyRefreshToken(token);
    const storedToken = await prisma.refreshToken.findUnique({ where: { token } });
    if (!storedToken || storedToken.userId !== decoded.userId || storedToken.expiresAt < /* @__PURE__ */ new Date()) {
      if (storedToken) {
        await prisma.refreshToken.delete({ where: { id: storedToken.id } });
      }
      return sendError(res, "Invalid or expired refresh token", 401);
    }
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) return sendError(res, "User not found", 404);
    const accessToken = generateAccessToken(user.id, user.role);
    return sendSuccess(res, { accessToken }, "Token refreshed");
  } catch {
    return sendError(res, "Invalid refresh token", 401);
  }
};
var getMe = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, "Unauthorized", 401);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, points: true, avatarUrl: true, phone: true }
    });
    return sendSuccess(res, user);
  } catch (error) {
    return sendError(res, error instanceof Error ? error.message : "Internal server error");
  }
};
router.post("/send-otp", sendOtp);
router.post("/register", register);
router.post("/login", login);
router.post("/google", googleSignIn);
router.post("/logout", authenticate, logout);
router.post("/refresh-token", refresh);
router.get("/me", authenticate, getMe);
var auth_default = router;

// src/users.ts
import { Router as Router2 } from "express";
var router2 = Router2();
var listUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, points: true, createdAt: true }
    });
    return sendSuccess(res, users);
  } catch (error) {
    return sendError(res, error.message);
  }
};
var getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, points: true, avatarUrl: true, phone: true, createdAt: true }
    });
    if (!user) return sendError(res, "User not found", 404);
    return sendSuccess(res, user);
  } catch (error) {
    return sendError(res, error.message);
  }
};
var updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    const { name, phone, avatarUrl, removeAvatar } = req.body;
    if (id !== userId) return sendError(res, "Unauthorized", 403);
    if (phone && !/^\+[1-9]\d{1,14}$/.test(phone)) {
      return sendError(res, "Phone must be in international format (e.g., +91...)", 400);
    }
    const updateData = { name };
    if (phone) updateData.phone = phone;
    if (removeAvatar) {
      updateData.avatarUrl = null;
    } else if (avatarUrl) {
      updateData.avatarUrl = avatarUrl;
    }
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, points: true, avatarUrl: true, phone: true }
    });
    return sendSuccess(res, user, "Profile updated");
  } catch (error) {
    return sendError(res, error.message);
  }
};
var getLeaderboard = async (req, res) => {
  try {
    const topUsers = await prisma.user.findMany({
      orderBy: { points: "desc" },
      take: 10,
      select: { id: true, name: true, avatarUrl: true, points: true }
    });
    return sendSuccess(res, topUsers);
  } catch (error) {
    return sendError(res, error.message);
  }
};
var getUserIssues = async (req, res) => {
  try {
    const { id } = req.params;
    const issues = await prisma.issue.findMany({
      where: { reporterId: id },
      orderBy: { createdAt: "desc" }
    });
    return sendSuccess(res, issues);
  } catch (error) {
    return sendError(res, error.message);
  }
};
var getPointHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const history = await prisma.pointTransaction.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" }
    });
    return sendSuccess(res, history);
  } catch (error) {
    return sendError(res, error.message);
  }
};
router2.get("/", authenticate, authorize(["ADMIN"]), listUsers);
router2.get("/leaderboard", getLeaderboard);
router2.get("/:id", getUserProfile);
router2.put("/:id", authenticate, updateProfile);
router2.get("/:id/issues", getUserIssues);
router2.get("/:id/points", authenticate, getPointHistory);
var users_default = router2;

// src/issues.ts
import { Router as Router3 } from "express";
import { z as z2 } from "zod";
import fs from "fs";
var router3 = Router3();
var issueSchema = z2.object({
  title: z2.string().min(5),
  description: z2.string().min(10),
  category: z2.enum(["ROAD", "WATER", "ELECTRICITY", "SANITATION", "OTHER"]),
  latitude: z2.preprocess((value) => Number(value), z2.number().finite()),
  longitude: z2.preprocess((value) => Number(value), z2.number().finite()),
  address: z2.string(),
  imageUrl: z2.string().url().optional().nullable()
});
var formatZodError2 = (error) => {
  const issues = error.issues.map((issue) => ({
    path: issue.path,
    message: issue.message,
    code: issue.code
  }));
  const message = issues.map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`).join(", ");
  return {
    message,
    issues
  };
};
var createIssue = async (req, res) => {
  try {
    const validatedData = issueSchema.parse(req.body);
    const userId = req.user?.userId;
    if (!userId) return sendError(res, "Unauthorized", 401);
    const category = validatedData.category;
    const isCritical = false;
    let imageUrl = validatedData.imageUrl || null;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "civilink/issues"
      });
      imageUrl = result.secure_url;
      fs.unlinkSync(req.file.path);
    }
    const issue = await prisma.issue.create({
      data: {
        ...validatedData,
        category,
        isCritical,
        reporter: { connect: { id: userId } },
        imageUrl
      }
    });
    await awardPoints(userId, 10, "Reported a new issue");
    await createNotification(
      userId,
      "You earned 10 points for reporting a new issue!",
      "POINTS",
      req.app.get("io")
    );
    return sendSuccess(res, issue, "Issue reported successfully", 201);
  } catch (error) {
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch {
      }
    }
    if (error instanceof z2.ZodError) {
      const formatted = formatZodError2(error);
      return sendError(res, formatted.message, 400, formatted.issues);
    }
    return sendError(
      res,
      error instanceof Error ? error.message : "Internal server error"
    );
  }
};
var listIssues = async (req, res) => {
  try {
    const {
      search,
      category,
      status,
      lat,
      lng,
      radius = 10,
      sortBy = "createdAt",
      order = "desc",
      page = 1,
      limit = 10,
      reporterId,
      assignedAuthorityId
    } = req.query;
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skip = (pageNum - 1) * limitNum;
    const take = limitNum;
    const where = {};
    if (category) where.category = category;
    if (status) where.status = status;
    if (reporterId) where.reporterId = reporterId;
    if (assignedAuthorityId) where.assignedAuthorityId = assignedAuthorityId;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } }
      ];
    }
    const sortField = typeof sortBy === "string" ? sortBy : "createdAt";
    const sortOrder = order === "asc" ? "asc" : "desc";
    if (!lat || !lng) {
      const [issues, total2] = await prisma.$transaction([
        prisma.issue.findMany({
          where,
          orderBy: { [sortField]: sortOrder },
          include: {
            reporter: { select: { name: true, avatarUrl: true, points: true } },
            comments: {
              include: {
                user: {
                  select: {
                    name: true,
                    avatarUrl: true,
                    points: true,
                    role: true
                  }
                }
              },
              orderBy: { createdAt: "desc" }
            }
          },
          skip,
          take
        }),
        prisma.issue.count({ where })
      ]);
      return sendSuccess(res, {
        issues,
        total: total2,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total2 / limitNum)
      });
    }
    const userLat = Number(lat);
    const userLng = Number(lng);
    const userRadius = Number(radius);
    const allMatchingIssues = await prisma.issue.findMany({
      where,
      orderBy: { [sortField]: sortOrder },
      include: {
        reporter: { select: { name: true, avatarUrl: true, points: true } },
        comments: {
          include: {
            user: {
              select: { name: true, avatarUrl: true, points: true, role: true }
            }
          },
          orderBy: { createdAt: "desc" }
        }
      }
    });
    const filteredIssues = allMatchingIssues.filter((issue) => {
      const earthRadiusKm = 6371;
      const dLat = (issue.latitude - userLat) * (Math.PI / 180);
      const dLng = (issue.longitude - userLng) * (Math.PI / 180);
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(userLat * (Math.PI / 180)) * Math.cos(issue.latitude * (Math.PI / 180)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return earthRadiusKm * c <= userRadius;
    });
    const total = filteredIssues.length;
    const paginatedIssues = filteredIssues.slice(skip, skip + take);
    return sendSuccess(res, {
      issues: paginatedIssues,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    return sendError(
      res,
      error instanceof Error ? error.message : "Internal server error"
    );
  }
};
var getIssueDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const issue = await prisma.issue.findUnique({
      where: { id },
      include: {
        reporter: {
          select: { id: true, name: true, avatarUrl: true, points: true }
        },
        comments: {
          include: {
            user: {
              select: { name: true, avatarUrl: true, points: true, role: true }
            }
          },
          orderBy: { createdAt: "desc" }
        },
        _count: { select: { upvotes: true, participants: true } }
      }
    });
    if (!issue) return sendError(res, "Issue not found", 404);
    return sendSuccess(res, issue);
  } catch (error) {
    return sendError(
      res,
      error instanceof Error ? error.message : "Internal server error"
    );
  }
};
var upvoteIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    if (!userId) return sendError(res, "Unauthorized", 401);
    const existingUpvote = await prisma.upvote.findUnique({
      where: { issueId_userId: { issueId: id, userId } }
    });
    if (existingUpvote) {
      const [, updatedIssue] = await prisma.$transaction([
        prisma.upvote.delete({ where: { id: existingUpvote.id } }),
        prisma.issue.update({
          where: { id },
          data: { upvotesCount: { decrement: 1 } }
        })
      ]);
      return sendSuccess(
        res,
        { upvotesCount: updatedIssue.upvotesCount, action: "removed" },
        "Upvote removed"
      );
    }
    const [, issue] = await prisma.$transaction([
      prisma.upvote.create({ data: { issueId: id, userId } }),
      prisma.issue.update({
        where: { id },
        data: { upvotesCount: { increment: 1 } }
      })
    ]);
    if (issue.upvotesCount === 10 || issue.upvotesCount === 50 || issue.upvotesCount === 100) {
      await createNotification(
        issue.reporterId,
        `Your issue reached ${issue.upvotesCount} upvotes!`,
        "MILESTONE",
        req.app.get("io")
      );
      if (issue.upvotesCount === 10) {
        await awardPoints(
          issue.reporterId,
          5,
          "Issue reached 10 upvotes milestone"
        );
      }
    }
    return sendSuccess(
      res,
      { upvotesCount: issue.upvotesCount, action: "added" },
      "Issue upvoted"
    );
  } catch (error) {
    return sendError(
      res,
      error instanceof Error ? error.message : "Internal server error"
    );
  }
};
var joinIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    if (!userId) return sendError(res, "Unauthorized", 401);
    const existingParticipant = await prisma.issueParticipant.findUnique({
      where: { issueId_userId: { issueId: id, userId } }
    });
    if (existingParticipant)
      return sendError(res, "Already joined this issue", 400);
    await prisma.issueParticipant.create({ data: { issueId: id, userId } });
    await awardPoints(userId, 2, "Joined a community issue campaign");
    const issue = await prisma.issue.findUnique({ where: { id } });
    if (issue) {
      await createNotification(
        issue.reporterId,
        "Someone joined your reported issue!",
        "PARTICIPANT",
        req.app.get("io")
      );
    }
    return sendSuccess(res, null, "Joined issue campaign successfully");
  } catch (error) {
    return sendError(
      res,
      error instanceof Error ? error.message : "Internal server error"
    );
  }
};
var addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    if (!userId) return sendError(res, "Unauthorized", 401);
    const contentResult = z2.string().min(1, "Comment content is required").safeParse(req.body?.content);
    if (!contentResult.success) {
      return sendError(
        res,
        contentResult.error.issues[0]?.message || "Comment content is required",
        400
      );
    }
    const comment = await prisma.comment.create({
      data: { content: contentResult.data, issueId: id, userId },
      include: {
        user: {
          select: { name: true, avatarUrl: true, points: true, role: true }
        }
      }
    });
    return sendSuccess(res, comment, "Comment added");
  } catch (error) {
    return sendError(
      res,
      error instanceof Error ? error.message : "Internal server error"
    );
  }
};
var updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const statusResult = z2.enum(["OPEN", "IN_PROGRESS", "RESOLVED"]).safeParse(req.body?.status);
    if (!statusResult.success) {
      return sendError(
        res,
        statusResult.error.issues[0]?.message || "Invalid status",
        400
      );
    }
    const userId = req.user?.userId;
    const role = req.user?.role;
    if (!userId || !role) return sendError(res, "Unauthorized", 401);
    const status = statusResult.data;
    const issue = await prisma.issue.findUnique({ where: { id } });
    if (!issue) return sendError(res, "Issue not found", 404);
    if (issue.reporterId !== userId && role !== "ADMIN") {
      return sendError(
        res,
        "Only the original reporter can update the status",
        403
      );
    }
    const updatedIssue = await prisma.issue.update({
      where: { id },
      data: { status, resolvedAt: status === "RESOLVED" ? /* @__PURE__ */ new Date() : null }
    });
    if (status === "RESOLVED" && issue.status !== "RESOLVED") {
      await awardPoints(
        issue.reporterId,
        20,
        "Your reported issue was marked as resolved"
      );
      await createNotification(
        issue.reporterId,
        "Your reported issue has been resolved! +20 points awarded.",
        "RESOLVED",
        req.app.get("io")
      );
    }
    return sendSuccess(res, updatedIssue, "Status updated");
  } catch (error) {
    return sendError(
      res,
      error instanceof Error ? error.message : "Internal server error"
    );
  }
};
var deleteIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const role = req.user?.role;
    if (!userId || !role) return sendError(res, "Unauthorized", 401);
    const issue = await prisma.issue.findUnique({ where: { id } });
    if (!issue) return sendError(res, "Issue not found", 404);
    if (issue.reporterId !== userId && role !== "ADMIN") {
      return sendError(res, "Unauthorized to delete this issue", 403);
    }
    await prisma.issue.delete({ where: { id } });
    return sendSuccess(res, null, "Issue deleted successfully");
  } catch (error) {
    return sendError(
      res,
      error instanceof Error ? error.message : "Internal server error"
    );
  }
};
router3.post("/", authenticate, upload.single("image"), createIssue);
router3.get("/", listIssues);
router3.get("/:id", getIssueDetails);
router3.post("/:id/upvote", authenticate, upvoteIssue);
router3.post("/:id/join", authenticate, joinIssue);
router3.post("/:id/comments", authenticate, addComment);
router3.patch("/:id/status", authenticate, updateStatus);
router3.delete("/:id", authenticate, deleteIssue);
var issues_default = router3;

// src/notifications.ts
import { Router as Router4 } from "express";
var router4 = Router4();
var getNotifications = async (req, res) => {
  try {
    const { userId } = req.user;
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
    return sendSuccess(res, notifications);
  } catch (error) {
    return sendError(res, error.message);
  }
};
var markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    const notification = await prisma.notification.update({
      where: { id, userId },
      data: { isRead: true }
    });
    return sendSuccess(res, notification, "Notification marked as read");
  } catch (error) {
    return sendError(res, error.message);
  }
};
var markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.user;
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });
    return sendSuccess(res, null, "All notifications marked as read");
  } catch (error) {
    return sendError(res, error.message);
  }
};
router4.get("/", authenticate, getNotifications);
router4.patch("/:id/read", authenticate, markAsRead);
router4.patch("/read-all", authenticate, markAllAsRead);
var notifications_default = router4;

// src/jobs.ts
import cron from "node-cron";
cron.schedule("0 * * * *", async () => {
  console.log("Running auto-escalation check...");
  const now = /* @__PURE__ */ new Date();
  const seventyTwoHoursAgo = new Date(now.getTime() - 72 * 60 * 60 * 1e3);
  const issuesToEscalate = await prisma.issue.findMany({
    where: {
      status: "OPEN",
      upvotesCount: { gte: 50 },
      createdAt: { lte: seventyTwoHoursAgo }
    }
  });
  for (const issue of issuesToEscalate) {
    await prisma.issue.update({
      where: { id: issue.id },
      data: { status: "IN_PROGRESS" }
    });
    await createNotification(issue.reporterId, `Your issue "${issue.title}" has 50+ upvotes and is now tracked as IN_PROGRESS based on community attention.`, "ESCALATION");
  }
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1e3);
  const criticalIssues = await prisma.issue.findMany({
    where: {
      status: { not: "RESOLVED" },
      upvotesCount: { gte: 100 },
      createdAt: { lte: sevenDaysAgo },
      isCritical: false
    }
  });
  for (const issue of criticalIssues) {
    await prisma.issue.update({
      where: { id: issue.id },
      data: { isCritical: true }
    });
    await createNotification(issue.reporterId, `Your issue "${issue.title}" has reached CRITICAL mass (100+ upvotes)! The community is prioritizing it.`, "CRITICAL");
  }
});

// server.ts
dotenv.config();
async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
  app.set("trust proxy", 1);
  app.use(
    helmet({
      contentSecurityPolicy: false
      // Disable for Vite dev
    })
  );
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1e3,
    // 15 minutes
    limit: 100,
    // Limit each IP to 100 requests per windowMs
    standardHeaders: "draft-7",
    legacyHeaders: false
  });
  app.use("/api", limiter);
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);
    socket.on("join_issue", (issueId) => {
      socket.join(`issue_${issueId}`);
    });
    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });
  app.use((req, res, next) => {
    req.io = io;
    next();
  });
  app.use("/api/auth", auth_default);
  app.use("/api/users", users_default);
  app.use("/api/issues", issues_default);
  app.use("/api/notifications", notifications_default);
  app.get("/api/health", (req, res) => {
    res.json({ success: true, message: "Server is healthy" });
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path2.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path2.join(distPath, "index.html"));
    });
  }
  app.use(
    (err, req, res, next) => {
      console.error(err.stack);
      res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
        errors: err.errors || []
      });
    }
  );
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
