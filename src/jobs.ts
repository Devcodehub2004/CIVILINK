import cron from "node-cron";
import { prisma, createNotification } from "./lib";

// Auto-escalation checker: Runs every hour
cron.schedule("0 * * * *", async () => {
  console.log("Running auto-escalation check...");
  const now = new Date();

  // 1. If an issue gets 50+ upvotes and is still "open" after 72 hours
  const seventyTwoHoursAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000);
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
    if (issue.assignedAuthorityId) {
      await createNotification(issue.assignedAuthorityId, `Issue escalated: ${issue.title} has 50+ upvotes and is pending for 72h.`, "ESCALATION");
    }
  }

  // 2. If unresolved after 7 days with 100+ upvotes
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
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
    // Notify all admins
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
    for (const admin of admins) {
      await createNotification(admin.id, `CRITICAL ISSUE: ${issue.title} has 100+ upvotes and is unresolved after 7 days.`, "CRITICAL");
    }
  }
});
