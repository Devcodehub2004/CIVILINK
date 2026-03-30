import { Router, Request, Response } from "express";
import { prisma, sendSuccess, sendError, authenticate, authorize } from "./lib";
import { generateAISummary } from "./gemini";

const router = Router();

// --- LOGIC ---

export const getStats = async (req: Request, res: Response) => {
  try {
    const totalIssues = await prisma.issue.count();
    const resolvedIssues = await prisma.issue.count({ where: { status: "RESOLVED" } });
    const activeUsers = await prisma.user.count();
    
    const resolvedIssuesData = await prisma.issue.findMany({
      where: { status: "RESOLVED" },
      select: { createdAt: true, resolvedAt: true }
    });

    let avgResolutionTime = 0;
    if (resolvedIssuesData.length > 0) {
      const totalTime = resolvedIssuesData.reduce((sum, issue) => {
        return sum + (issue.resolvedAt!.getTime() - issue.createdAt.getTime());
      }, 0);
      avgResolutionTime = totalTime / resolvedIssuesData.length / (1000 * 60 * 60); // In hours
    }

    return sendSuccess(res, {
      totalIssues,
      resolvedPercentage: totalIssues > 0 ? (resolvedIssues / totalIssues) * 100 : 0,
      activeUsers,
      avgResolutionTime
    });
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

export const assignIssue = async (req: Request, res: Response) => {
  try {
    const { issueId, authorityId } = req.body;
    const issue = await prisma.issue.update({
      where: { id: issueId },
      data: { assignedAuthorityId: authorityId, status: "IN_PROGRESS" }
    });
    return sendSuccess(res, issue, "Issue assigned to authority");
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const user = await prisma.user.update({
      where: { id },
      data: { role }
    });
    return sendSuccess(res, user, "User role updated");
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

export const getAISummary = async (req: Request, res: Response) => {
  try {
    const issues = await prisma.issue.findMany({
      where: { status: "OPEN" },
      take: 20,
    });

    if (issues.length === 0) {
      return sendSuccess(res, "No open issues to summarize.");
    }

    const summary = await generateAISummary(issues);
    return sendSuccess(res, summary);
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

// --- ROUTES ---

router.get("/stats", authenticate, authorize(["ADMIN"]), getStats);
router.get("/ai-summary", authenticate, authorize(["ADMIN"]), getAISummary);
router.post("/assign", authenticate, authorize(["ADMIN"]), assignIssue);
router.patch("/users/:id/role", authenticate, authorize(["ADMIN"]), updateUserRole);

export default router;
