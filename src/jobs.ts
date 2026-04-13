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
    // Now organically noticed, just notify the reporter that their issue is gaining traction
    await createNotification(issue.reporterId, `Your issue "${issue.title}" has 50+ upvotes and is now tracked as IN_PROGRESS based on community attention.`, "ESCALATION");
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
    // Notify the reporter that it reached critical mass
    await createNotification(issue.reporterId, `Your issue "${issue.title}" has reached CRITICAL mass (100+ upvotes)! The community is prioritizing it.`, "CRITICAL");
  }
});
