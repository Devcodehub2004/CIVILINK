import { Router, Request, Response } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import axios from "axios";
import {
  prisma,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  sendSuccess,
  sendError,
  authenticate,
  sendOtpEmail,
  AuthRequest,
} from "./lib";

const router = Router();

// Google OAuth Client ID
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";

// --- VALIDATION SCHEMAS ---
export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  phone: z
    .string()
    .regex(/^\+[1-9]\d{1,14}$/, "Phone must be in international format (e.g., +91...)")
    .optional()
    .or(z.literal(""))
    .transform((value) => (value === "" ? undefined : value)),
  avatarUrl: z
    .string()
    .url()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value === "" ? undefined : value)),
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const otpLoginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

export const resetPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  otp: z.string().length(6, "OTP must be 6 digits"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

const formatZodError = (error: z.ZodError) => {
  const issues = error.issues.map((issue) => ({
    path: issue.path,
    message: issue.message,
    code: issue.code,
  }));

  const message = issues
    .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
    .join(", ");

  return {
    message,
    issues,
  };
};

// --- AUTH LOGIC (CONTROLLERS) ---

export const sendOtp = async (req: Request, res: Response) => {
  try {
    const emailResult = z.string().email("Invalid email format").safeParse(req.body?.email);
    if (!emailResult.success) {
      return sendError(res, emailResult.error.issues[0]?.message || "Invalid email format", 400);
    }

    const email = emailResult.data;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await prisma.$transaction([
      prisma.otp.deleteMany({ where: { email } }),
      prisma.otp.create({
        data: {
          code: otp,
          email,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        },
      }),
    ]);

    await sendOtpEmail(email, otp);

    console.log(`\n[EMAIL] OTP for ${email}: ${otp}\n`);
    return sendSuccess(res, null, "OTP sent to your email successfully");
  } catch (error: unknown) {
    console.error("Send OTP Error:", error);
    const message = error instanceof Error ? error.message : "Failed to send OTP. Please try again.";
    return sendError(res, message);
  }
};

// --- PASSWORD-BASED REGISTRATION ---
export const register = async (req: Request, res: Response) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const { name, email, password, phone, avatarUrl } = validatedData;

    const existingUser = await prisma.user.findFirst({ where: { email } });
    if (existingUser) return sendError(res, "User already exists with this email", 400);

    // Hash the password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        avatarUrl,
        passwordHash,
      },
    });

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
          avatarUrl: user.avatarUrl,
        },
        accessToken,
        refreshToken,
      },
      "User registered successfully",
    );
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const formatted = formatZodError(error);
      return sendError(res, formatted.message, 400, formatted.issues);
    }

    return sendError(res, error instanceof Error ? error.message : "Internal server error");
  }
};

// --- PASSWORD-BASED LOGIN (direct login, OTP is optional 2FA) ---
export const login = async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const { email, password } = validatedData;

    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) return sendError(res, "Invalid email or password", 401);

    // If user registered via Google (no password), block password login
    if (!user.passwordHash) {
      return sendError(
        res,
        "This account was created with Google. Please use Google Sign-In.",
        400,
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) return sendError(res, "Invalid email or password", 401);

    // Direct login — issue tokens immediately
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
          avatarUrl: user.avatarUrl,
        },
        accessToken,
        refreshToken,
      },
      "Login successful",
    );
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const formatted = formatZodError(error);
      return sendError(res, formatted.message, 400, formatted.issues);
    }

    return sendError(res, error instanceof Error ? error.message : "Internal server error");
  }
};

// --- OTP-BASED LOGIN (email + OTP, no password needed) ---
export const otpLogin = async (req: Request, res: Response) => {
  try {
    const validatedData = otpLoginSchema.parse(req.body);
    const { email, otp } = validatedData;

    const storedOtp = await prisma.otp.findFirst({
      where: { email, code: otp, expiresAt: { gte: new Date() } },
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
          avatarUrl: user.avatarUrl,
        },
        accessToken,
        refreshToken,
      },
      "Login successful",
    );
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const formatted = formatZodError(error);
      return sendError(res, formatted.message, 400, formatted.issues);
    }
    return sendError(res, error instanceof Error ? error.message : "Internal server error");
  }
};

// --- FORGOT PASSWORD (send OTP to email) ---
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const emailResult = z.string().email("Invalid email format").safeParse(req.body?.email);
    if (!emailResult.success) {
      return sendError(res, emailResult.error.issues[0]?.message || "Invalid email format", 400);
    }

    const email = emailResult.data;
    const user = await prisma.user.findFirst({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user || !user.passwordHash) {
      return sendSuccess(res, null, "If an account exists with this email, a reset code has been sent.");
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await prisma.$transaction([
      prisma.otp.deleteMany({ where: { email } }),
      prisma.otp.create({
        data: { code: otp, email, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
      }),
    ]);

    await sendOtpEmail(email, otp);
    console.log(`\n[EMAIL] Password Reset OTP for ${email}: ${otp}\n`);

    return sendSuccess(res, null, "If an account exists with this email, a reset code has been sent.");
  } catch (error: unknown) {
    console.error("Forgot Password Error:", error);
    return sendError(res, error instanceof Error ? error.message : "Failed to process request");
  }
};

// --- RESET PASSWORD (verify OTP + set new password) ---
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const validatedData = resetPasswordSchema.parse(req.body);
    const { email, otp, newPassword } = validatedData;

    const storedOtp = await prisma.otp.findFirst({
      where: { email, code: otp, expiresAt: { gte: new Date() } },
    });
    if (!storedOtp) return sendError(res, "Invalid or expired reset code", 400);

    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) return sendError(res, "User not found", 404);

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    await prisma.otp.deleteMany({ where: { email } });

    return sendSuccess(res, null, "Password reset successfully. You can now log in with your new password.");
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const formatted = formatZodError(error);
      return sendError(res, formatted.message, 400, formatted.issues);
    }
    return sendError(res, error instanceof Error ? error.message : "Internal server error");
  }
};

// --- GOOGLE SIGN-IN ---

export const googleSignIn = async (req: Request, res: Response) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return sendError(res, "Google credential token is required", 400);
    }

    if (!GOOGLE_CLIENT_ID) {
      return sendError(res, "Google Sign-In is not configured on the server", 500);
    }

    // Verify the Google access token by accessing userinfo
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

    // Check if user already exists
    let user = await prisma.user.findFirst({ where: { email } });

    if (!user) {
      // Auto-register new Google user
      user = await prisma.user.create({
        data: {
          name: name || email.split("@")[0],
          email,
          avatarUrl: picture || null,
          passwordHash: null,
        },
      });
      console.log(`[GOOGLE AUTH] New user registered: ${email}`);
    } else {
      // Optionally update avatar if user doesn't have one
      if (!user.avatarUrl && picture) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { avatarUrl: picture },
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
          avatarUrl: user.avatarUrl,
        },
        accessToken,
        refreshToken,
      },
      "Google sign-in successful",
    );
  } catch (error: unknown) {
    console.error("Google Sign-In Error:", error);
    const message = error instanceof Error ? error.message : "Google sign-in failed";
    return sendError(res, message);
  }
};

export const logout = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, "Unauthorized", 401);

    const { token } = req.body as { token?: string };

    if (token) {
      await prisma.refreshToken.deleteMany({ where: { token, userId } });
    } else {
      await prisma.refreshToken.deleteMany({ where: { userId } });
    }

    return sendSuccess(res, null, "Logged out successfully");
  } catch (error: unknown) {
    return sendError(res, error instanceof Error ? error.message : "Internal server error");
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const tokenResult = z.string().min(1, "Refresh token required").safeParse(req.body?.token);
    if (!tokenResult.success) {
      return sendError(res, tokenResult.error.issues[0]?.message || "Refresh token required", 400);
    }

    const token = tokenResult.data;
    const decoded = verifyRefreshToken(token);
    const storedToken = await prisma.refreshToken.findUnique({ where: { token } });

    if (!storedToken || storedToken.userId !== decoded.userId || storedToken.expiresAt < new Date()) {
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

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, "Unauthorized", 401);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, points: true, avatarUrl: true, phone: true },
    });

    return sendSuccess(res, user);
  } catch (error: unknown) {
    return sendError(res, error instanceof Error ? error.message : "Internal server error");
  }
};

// --- ROUTES ---

router.post("/send-otp", sendOtp);
router.post("/register", register);
router.post("/login", login);
router.post("/otp-login", otpLogin);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/google", googleSignIn);
router.post("/logout", authenticate, logout);
router.post("/refresh-token", refresh);
router.get("/me", authenticate, getMe);

export default router;