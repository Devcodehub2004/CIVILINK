import { Router, Request, Response } from "express";
import { prisma, sendSuccess, sendError, authenticate, awardPoints } from "./lib";

const router = Router();

// --- LOGIC ---

export const listAuthorities = async (req: Request, res: Response) => {
  try {
    const authorities = await prisma.user.findMany({
      where: { role: "AUTHORITY" },
      select: { id: true, name: true, avatarUrl: true }
    });
    return sendSuccess(res, authorities);
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

export const rateAuthority = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = (req as any).user;
    const { issueId, rating, feedback } = req.body;

    if (!rating || rating < 1 || rating > 5) return sendError(res, "Rating must be between 1 and 5", 400);

    const authorityRating = await prisma.authorityRating.create({
      data: {
        authorityId: id,
        ratedById: userId,
        issueId,
        rating,
        feedback
      }
    });

    await awardPoints(userId, 3, "Rated an authority's resolution");
    return sendSuccess(res, authorityRating, "Rating submitted successfully");
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

export const getPerformance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const ratings = await prisma.authorityRating.findMany({ where: { authorityId: id } });
    const avgRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length : 0;

    const resolvedCount = await prisma.issue.count({
      where: { assignedAuthorityId: id, status: "RESOLVED" }
    });

    const resolvedIssues = await prisma.issue.findMany({
      where: { assignedAuthorityId: id, status: "RESOLVED" },
      select: { createdAt: true, resolvedAt: true }
    });

    let avgResolutionTime = 0;
    if (resolvedIssues.length > 0) {
      const totalTime = resolvedIssues.reduce((sum, issue) => {
        return sum + (issue.resolvedAt!.getTime() - issue.createdAt.getTime());
      }, 0);
      avgResolutionTime = totalTime / resolvedIssues.length / (1000 * 60 * 60); // In hours
    }

    return sendSuccess(res, { avgRating, resolvedCount, avgResolutionTime });
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

// --- ROUTES ---

router.get("/", listAuthorities);
router.post("/:id/rate", authenticate, rateAuthority);
router.get("/:id/performance", getPerformance);

export default router;
