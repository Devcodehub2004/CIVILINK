import { Router, Request, Response } from "express";
import { prisma, sendSuccess, sendError, authenticate, authorize } from "./lib";

const router = Router();

// --- LOGIC ---

export const listUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, points: true, createdAt: true }
    });
    return sendSuccess(res, users);
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, points: true, avatarUrl: true, phone: true, createdAt: true }
    });
    if (!user) return sendError(res, "User not found", 404);
    return sendSuccess(res, user);
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = (req as any).user;
    const { name, phone, avatarUrl, removeAvatar } = req.body;

    if (id !== userId) return sendError(res, "Unauthorized", 403);
    
    if (phone && !/^\+[1-9]\d{1,14}$/.test(phone)) {
      return sendError(res, "Phone must be in international format (e.g., +91...)", 400);
    }

    const updateData: any = { name };
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
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const topUsers = await prisma.user.findMany({
      orderBy: { points: "desc" },
      take: 10,
      select: { id: true, name: true, avatarUrl: true, points: true }
    });
    return sendSuccess(res, topUsers);
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

export const getUserIssues = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const issues = await prisma.issue.findMany({
      where: { reporterId: id },
      orderBy: { createdAt: "desc" }
    });
    return sendSuccess(res, issues);
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

export const getPointHistory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const history = await prisma.pointTransaction.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" }
    });
    return sendSuccess(res, history);
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

// --- ROUTES ---

router.get("/", authenticate, authorize(["ADMIN"]), listUsers);
router.get("/leaderboard", getLeaderboard);
router.get("/:id", getUserProfile);
router.put("/:id", authenticate, updateProfile);
router.get("/:id/issues", getUserIssues);
router.get("/:id/points", authenticate, getPointHistory);

export default router;
