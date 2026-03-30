import { Router, Request, Response } from "express";
import { prisma, sendSuccess, sendError, authenticate } from "./lib";

const router = Router();

// --- LOGIC ---

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
    return sendSuccess(res, notifications);
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = (req as any).user;
    const notification = await prisma.notification.update({
      where: { id, userId },
      data: { isRead: true }
    });
    return sendSuccess(res, notification, "Notification marked as read");
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });
    return sendSuccess(res, null, "All notifications marked as read");
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

// --- ROUTES ---

router.get("/", authenticate, getNotifications);
router.patch("/:id/read", authenticate, markAsRead);
router.patch("/read-all", authenticate, markAllAsRead);

export default router;
