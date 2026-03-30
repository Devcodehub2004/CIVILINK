import { Role, Category, IssueStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib";

async function main() {
  // Clear existing data
  await prisma.pointTransaction.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.authorityRating.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.upvote.deleteMany();
  await prisma.issueParticipant.deleteMany();
  await prisma.issue.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  // Create Users
  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@civilink.gov",
      passwordHash: null,
      phone: "+1111111111",
      role: Role.ADMIN,
    },
  });

  const authority = await prisma.user.create({
    data: {
      name: "City Water Dept",
      email: "water@city.gov",
      passwordHash: null,
      phone: "+2222222222",
      role: Role.AUTHORITY,
    },
  });

  const citizen = await prisma.user.create({
    data: {
      name: "Arjun Kumar",
      email: "arjun@example.com",
      passwordHash: null,
      phone: "+3333333333",
      role: Role.CITIZEN,
      points: 50,
    },
  });

  // Create Issues
  const issue1 = await prisma.issue.create({
    data: {
      title: "Broken Water Pipe",
      description: "A major water pipe is leaking on Main Street, causing flooding.",
      category: Category.WATER,
      status: IssueStatus.OPEN,
      latitude: 28.6139,
      longitude: 77.2090,
      address: "Main Street, New Delhi",
      reporterId: citizen.id,
      upvotesCount: 15,
    },
  });

  const issue2 = await prisma.issue.create({
    data: {
      title: "Pothole on 5th Avenue",
      description: "Large pothole causing traffic delays and risk of accidents.",
      category: Category.ROAD,
      status: IssueStatus.IN_PROGRESS,
      latitude: 28.6200,
      longitude: 77.2100,
      address: "5th Avenue, New Delhi",
      reporterId: citizen.id,
      assignedAuthorityId: authority.id,
      upvotesCount: 60,
    },
  });

  // Create Upvotes
  await prisma.upvote.create({
    data: {
      issueId: issue1.id,
      userId: admin.id,
    },
  });

  // Create Comments
  await prisma.comment.create({
    data: {
      content: "This needs urgent attention!",
      issueId: issue1.id,
      userId: admin.id,
    },
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
