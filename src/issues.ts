import { Router, Request, Response } from "express";
import { z } from "zod";
import fs from "fs";
import {
  prisma,
  sendSuccess,
  sendError,
  authenticate,
  authorize,
  cloudinary,
  upload,
  awardPoints,
  createNotification
} from "./lib";

const router = Router();

// --- VALIDATION ---
export const issueSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(10),
  category: z.enum(["ROAD", "WATER", "ELECTRICITY", "SANITATION", "OTHER"]),
  latitude: z.preprocess((val) => Number(val), z.number()),
  longitude: z.preprocess((val) => Number(val), z.number()),
  address: z.string(),
  imageUrl: z.string().url().optional().nullable(),
});

// --- LOGIC ---
export const createIssue = async (req: Request, res: Response) => {
  try {
    const validatedData = issueSchema.parse(req.body);
    const { userId } = (req as any).user;
    const category = validatedData.category;
    const isCritical = false;

    let imageUrl = validatedData.imageUrl || null;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "civilink/issues",
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
        imageUrl,
      } as any,
    });

    await awardPoints(userId, 10, "Reported a new issue");
    await createNotification(userId, "You earned 10 points for reporting a new issue!", "POINTS", (req as any).io);

    return sendSuccess(res, issue, "Issue reported successfully", 201);
  } catch (error: any) {
    if (error.errors) return sendError(res, "Validation failed", 400, error.errors);
    return sendError(res, error.message);
  }
};

export const listIssues = async (req: Request, res: Response) => {
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

    const where: any = {};
    if (category) where.category = category;
    if (status) where.status = status;
    if (reporterId) where.reporterId = reporterId;
    if (assignedAuthorityId) where.assignedAuthorityId = assignedAuthorityId;
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { address: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    // Standard Query without location
    if (!lat || !lng) {
      const [issues, total] = await prisma.$transaction([
        prisma.issue.findMany({
          where,
          orderBy: { [sortBy as string]: order },
          include: { 
            reporter: { select: { name: true, avatarUrl: true, points: true } },
            comments: { include: { user: { select: { name: true, avatarUrl: true, points: true, role: true } } }, orderBy: { createdAt: "desc" } }
          },
          skip,
          take,
        }),
        prisma.issue.count({ where })
      ]);

      return sendSuccess(res, { issues, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) });
    }

    // Location-based filtering (requires fetching more and filtering manually for now)
    // In a real production app, we would use PostGIS or a fast geospatial index.
    const userLat = Number(lat);
    const userLng = Number(lng);
    const userRadius = Number(radius);

    // Fetch all matching items (up to a reasonable limit for small-scale apps)
    // For large scale, this must be optimized with raw SQL and geospatial functions.
    const allMatchingIssues = await prisma.issue.findMany({
      where,
      orderBy: { [sortBy as string]: order },
      include: { 
        reporter: { select: { name: true, avatarUrl: true, points: true } },
        comments: { include: { user: { select: { name: true, avatarUrl: true, points: true, role: true } } }, orderBy: { createdAt: "desc" } }
      }
    });

    const filteredIssues = allMatchingIssues.filter((issue) => {
      const R = 6371; // Earth radius in km
      const dLat = (issue.latitude - userLat) * (Math.PI / 180);
      const dLng = (issue.longitude - userLng) * (Math.PI / 180);
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + 
                Math.cos(userLat * (Math.PI / 180)) * Math.cos(issue.latitude * (Math.PI / 180)) * 
                Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return (R * c) <= userRadius;
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
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

export const getIssueDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const issue = await prisma.issue.findUnique({
      where: { id },
      include: {
        reporter: { select: { id: true, name: true, avatarUrl: true, points: true } },
        comments: { include: { user: { select: { name: true, avatarUrl: true, points: true, role: true } } }, orderBy: { createdAt: "desc" } },
        _count: { select: { upvotes: true, participants: true } }
      }
    });

    if (!issue) return sendError(res, "Issue not found", 404);
    return sendSuccess(res, issue);
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

export const upvoteIssue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = (req as any).user;

    const existingUpvote = await prisma.upvote.findUnique({
      where: { issueId_userId: { issueId: id, userId } }
    });

    if (existingUpvote) {
      const [, updatedIssue] = await prisma.$transaction([
        prisma.upvote.delete({ where: { id: existingUpvote.id } }),
        prisma.issue.update({ where: { id }, data: { upvotesCount: { decrement: 1 } } })
      ]);
      return sendSuccess(res, { upvotesCount: updatedIssue.upvotesCount, action: "removed" }, "Upvote removed");
    }

    const [, issue] = await prisma.$transaction([
      prisma.upvote.create({ data: { issueId: id, userId } }),
      prisma.issue.update({ where: { id }, data: { upvotesCount: { increment: 1 } } })
    ]);

    if (issue.upvotesCount === 10 || issue.upvotesCount === 50 || issue.upvotesCount === 100) {
      await createNotification(issue.reporterId, `Your issue reached ${issue.upvotesCount} upvotes!`, "MILESTONE", (req as any).io);
      if (issue.upvotesCount === 10) await awardPoints(issue.reporterId, 5, "Issue reached 10 upvotes milestone");
    }

    return sendSuccess(res, { upvotesCount: issue.upvotesCount, action: "added" }, "Issue upvoted");
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

export const joinIssue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = (req as any).user;

    const existingParticipant = await prisma.issueParticipant.findUnique({
      where: { issueId_userId: { issueId: id, userId } }
    });

    if (existingParticipant) return sendError(res, "Already joined this issue", 400);

    await prisma.issueParticipant.create({ data: { issueId: id, userId } });
    await awardPoints(userId, 2, "Joined a community issue campaign");

    const issue = await prisma.issue.findUnique({ where: { id } });
    if (issue) await createNotification(issue.reporterId, "Someone joined your reported issue!", "PARTICIPANT", (req as any).io);

    return sendSuccess(res, null, "Joined issue campaign successfully");
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

export const addComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = (req as any).user;
    const { content } = req.body;
    if (!content) return sendError(res, "Comment content is required", 400);

    const comment = await prisma.comment.create({
      data: { content, issueId: id, userId },
      include: { user: { select: { name: true, avatarUrl: true, points: true, role: true } } }
    });

    return sendSuccess(res, comment, "Comment added");
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

export const updateStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { userId, role } = (req as any).user;

    const issue = await prisma.issue.findUnique({ where: { id } });
    if (!issue) return sendError(res, "Issue not found", 404);

    if (issue.reporterId !== userId && role !== "ADMIN") {
      return sendError(res, "Only the original reporter can update the status", 403);
    }

    const updatedIssue = await prisma.issue.update({
      where: { id },
      data: { status, resolvedAt: status === "RESOLVED" ? new Date() : null }
    });

    if (status === "RESOLVED" && issue.status !== "RESOLVED") {
      await awardPoints(issue.reporterId, 20, "Your reported issue was marked as resolved");
      await createNotification(issue.reporterId, "Your reported issue has been resolved! +20 points awarded.", "RESOLVED", (req as any).io);
    } // Skip notification about other status changes if it's the reporter making them!

    return sendSuccess(res, updatedIssue, "Status updated");
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

export const deleteIssue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId, role } = (req as any).user;

    const issue = await prisma.issue.findUnique({ where: { id } });
    if (!issue) return sendError(res, "Issue not found", 404);

    if (issue.reporterId !== userId && role !== "ADMIN") {
      return sendError(res, "Unauthorized to delete this issue", 403);
    }

    await prisma.issue.delete({ where: { id } });
    return sendSuccess(res, null, "Issue deleted successfully");
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

// --- ROUTES ---

router.post("/", authenticate, upload.single("image"), createIssue);
router.get("/", listIssues);
router.get("/:id", getIssueDetails);
router.post("/:id/upvote", authenticate, upvoteIssue);
router.post("/:id/join", authenticate, joinIssue);
router.post("/:id/comments", authenticate, addComment);
router.patch("/:id/status", authenticate, updateStatus);
router.delete("/:id", authenticate, deleteIssue);

export default router;
