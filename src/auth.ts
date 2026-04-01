import { Router, Request, Response } from "express";
import { z } from "zod";
import {
  prisma,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  sendSuccess,
  sendError,
  authenticate,
  sendOtpEmail
} from "./lib";

const router = Router();

// --- VALIDATION SCHEMAS ---
export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email("Please enter a valid email address"),
  otp: z.string().length(6),
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/, "Phone must be in international format (e.g., +91...)").optional().or(z.literal("")).transform(v => v === "" ? undefined : v),
  avatarUrl: z.string().url().optional().or(z.literal("")).transform(v => v === "" ? undefined : v)
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  otp: z.string().length(6),
});

// --- AUTH LOGIC (CONTROLLERS) ---

export const sendOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return sendError(res, "Email is required", 400);

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return sendError(res, "Invalid email format", 400);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Batch delete + create in a single DB transaction (one roundtrip)
    await prisma.$transaction([
      prisma.otp.deleteMany({ where: { email } }),
      prisma.otp.create({
        data: {
          code: otp,
          email,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        },
      }),
    ]);

    // Fire-and-forget — email sends in the background, response returns instantly
    sendOtpEmail(email, otp);

    console.log(`\n[EMAIL] OTP for ${email}: ${otp}\n`);
    return sendSuccess(res, null, "OTP sent to your email successfully");
  } catch (error: any) {
    console.error("Send OTP Error:", error);
    return sendError(res, "Failed to send OTP. Please try again.");
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const { name, email, otp, phone, avatarUrl } = validatedData; 

    // Verify OTP first
    const storedOtp = await prisma.otp.findFirst({
      where: { email, code: otp, expiresAt: { gte: new Date() } }
    });
    if (!storedOtp) return sendError(res, "Invalid or expired OTP", 400);

    const existingUser = await prisma.user.findFirst({ where: { email } });
    if (existingUser) return sendError(res, "User already exists with this email", 400);

    const user = await prisma.user.create({
      data: {
        name, email, phone, avatarUrl,
        passwordHash: null
      },
    });

    // Clean up used OTP
    await prisma.otp.deleteMany({ where: { email } });

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);

    return sendSuccess(res, { user: { id: user.id, name, email, phone, role: user.role, avatarUrl: user.avatarUrl }, accessToken, refreshToken }, "User registered successfully");
  } catch (error: any) {
    if (error.errors) return sendError(res, "Validation failed", 400, error.errors);
    return sendError(res, error.message);
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return sendError(res, "Email and OTP are required", 400);

    const storedOtp = await prisma.otp.findFirst({
      where: { email, code: otp, expiresAt: { gte: new Date() } }
    });
    if (!storedOtp) return sendError(res, "Invalid or expired OTP", 400);

    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) return sendError(res, "User not found. Please register first.", 404);

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);

    // Clean up used OTP
    await prisma.otp.deleteMany({ where: { email } });

    return sendSuccess(res, { user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, avatarUrl: user.avatarUrl }, accessToken, refreshToken }, "Login successful");
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    const { token } = req.body;
    if (token) {
      await prisma.refreshToken.deleteMany({ where: { token, userId } });
    } else {
      await prisma.refreshToken.deleteMany({ where: { userId } });
    }
    return sendSuccess(res, null, "Logged out successfully");
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) return sendError(res, "Refresh token required", 400);

    const decoded = verifyRefreshToken(token);
    const storedToken = await prisma.refreshToken.findUnique({ where: { token } });

    if (!storedToken || storedToken.userId !== decoded.userId || storedToken.expiresAt < new Date()) {
      if (storedToken) await prisma.refreshToken.delete({ where: { id: storedToken.id } });
      return sendError(res, "Invalid or expired refresh token", 401);
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) return sendError(res, "User not found", 404);

    const accessToken = generateAccessToken(user.id, user.role);
    return sendSuccess(res, { accessToken }, "Token refreshed");
  } catch (error: any) {
    return sendError(res, "Invalid refresh token", 401);
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, points: true, avatarUrl: true, phone: true }
    });
    return sendSuccess(res, user);
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

// --- ROUTES ---

router.post("/send-otp", sendOtp);
router.post("/register", register);
router.post("/login", login);
router.post("/logout", authenticate, logout);
router.post("/refresh-token", refresh);
router.get("/me", authenticate, getMe);

export default router;
