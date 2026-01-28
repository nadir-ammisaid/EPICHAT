import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Check DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error("Error: DATABASE_URL is not defined");
  process.exit(1);
}

const dbUrl = process.env.DATABASE_URL;
const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ":***@");
console.log(`Database connection: ${maskedUrl}\n`);

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting database seed...\n");

  // Clean database
  try {
    await prisma.message.deleteMany();
    await prisma.invite.deleteMany();
    await prisma.channel.deleteMany();
    await prisma.serverMember.deleteMany();
    await prisma.server.deleteMany();
    await prisma.user.deleteMany();
    console.log("Database cleaned\n");
  } catch (error: any) {
    if (error.code === "P2021" || error.message?.includes("does not exist")) {
      throw new Error("Database schema not found. Run `npx prisma db push` first.");
    }
    throw error;
  }

  // Create users
  console.log("Creating users...");
  const passwordHash = await bcrypt.hash("password123", 10);

  const alice = await prisma.user.create({
    data: {
      email: "alice@example.com",
      username: "alice",
      passwordHash,
    },
  });

  const bob = await prisma.user.create({
    data: {
      email: "bob@example.com",
      username: "bob",
      passwordHash,
    },
  });

  const charlie = await prisma.user.create({
    data: {
      email: "charlie@example.com",
      username: "charlie",
      passwordHash,
    },
  });

  const diana = await prisma.user.create({
    data: {
      email: "diana@example.com",
      username: "diana",
      passwordHash,
    },
  });

  console.log("Users created\n");

  // Create servers
  console.log("Creating servers...");
  const gamingServer = await prisma.server.create({
    data: {
      name: "Gaming Community",
      ownerId: alice.id,
    },
  });

  const devServer = await prisma.server.create({
    data: {
      name: "Developers Hub",
      ownerId: bob.id,
    },
  });

  const musicServer = await prisma.server.create({
    data: {
      name: "Music Lovers",
      ownerId: charlie.id,
    },
  });

  console.log("Servers created\n");

  // Add members
  console.log("Adding server members...");

  await prisma.serverMember.create({
    data: {
      serverId: gamingServer.id,
      userId: alice.id,
      role: "owner",
    },
  });
  await prisma.serverMember.create({
    data: {
      serverId: gamingServer.id,
      userId: bob.id,
      role: "admin",
    },
  });
  await prisma.serverMember.create({
    data: {
      serverId: gamingServer.id,
      userId: charlie.id,
      role: "member",
    },
  });

  await prisma.serverMember.create({
    data: {
      serverId: devServer.id,
      userId: bob.id,
      role: "owner",
    },
  });
  await prisma.serverMember.create({
    data: {
      serverId: devServer.id,
      userId: alice.id,
      role: "admin",
    },
  });
  await prisma.serverMember.create({
    data: {
      serverId: devServer.id,
      userId: charlie.id,
      role: "member",
    },
  });
  await prisma.serverMember.create({
    data: {
      serverId: devServer.id,
      userId: diana.id,
      role: "member",
    },
  });

  await prisma.serverMember.create({
    data: {
      serverId: musicServer.id,
      userId: charlie.id,
      role: "owner",
    },
  });
  await prisma.serverMember.create({
    data: {
      serverId: musicServer.id,
      userId: diana.id,
      role: "member",
    },
  });

  console.log("Members added\n");

  // Create channels
  console.log("Creating channels...");

  const gamingGeneral = await prisma.channel.create({
    data: {
      serverId: gamingServer.id,
      name: "general",
      createdBy: alice.id,
    },
  });

  await prisma.channel.create({
    data: {
      serverId: gamingServer.id,
      name: "announcements",
      createdBy: alice.id,
    },
  });

  const devGeneral = await prisma.channel.create({
    data: {
      serverId: devServer.id,
      name: "general",
      createdBy: bob.id,
    },
  });

  const devHelp = await prisma.channel.create({
    data: {
      serverId: devServer.id,
      name: "help",
      createdBy: bob.id,
    },
  });

  const musicGeneral = await prisma.channel.create({
    data: {
      serverId: musicServer.id,
      name: "general",
      createdBy: charlie.id,
    },
  });

  console.log("Channels created\n");

  // Create messages
  console.log("Creating messages...");

  await prisma.message.create({
    data: {
      channelId: gamingGeneral.id,
      authorId: alice.id,
      content: "Bienvenue sur le serveur Gaming Community !",
    },
  });

  await prisma.message.create({
    data: {
      channelId: gamingGeneral.id,
      authorId: bob.id,
      content: "Salut tout le monde ! Qui veut jouer ce soir ?",
    },
  });

  await prisma.message.create({
    data: {
      channelId: gamingGeneral.id,
      authorId: charlie.id,
      content: "Je suis partant ! Quel jeu on fait ?",
    },
  });

  await prisma.message.create({
    data: {
      channelId: devGeneral.id,
      authorId: bob.id,
      content: "Bienvenue dans le Developers Hub !",
    },
  });

  await prisma.message.create({
    data: {
      channelId: devGeneral.id,
      authorId: alice.id,
      content: "Super serveur ! J'ai hâte de partager mes projets.",
    },
  });

  await prisma.message.create({
    data: {
      channelId: devHelp.id,
      authorId: diana.id,
      content: "Quelqu'un peut m'aider avec Prisma ?",
    },
  });

  await prisma.message.create({
    data: {
      channelId: devHelp.id,
      authorId: bob.id,
      content: "Bien sûr ! Qu'est-ce que tu veux savoir ?",
    },
  });

  await prisma.message.create({
    data: {
      channelId: musicGeneral.id,
      authorId: charlie.id,
      content: "Quelles sont vos musiques préférées en ce moment ?",
    },
  });

  await prisma.message.create({
    data: {
      channelId: musicGeneral.id,
      authorId: diana.id,
      content: "J'écoute beaucoup de jazz en ce moment !",
    },
  });

  console.log("Messages created\n");

  // Create invites
  console.log("Creating invites...");

  await prisma.invite.create({
    data: {
      serverId: gamingServer.id,
      code: "GAMING2024",
      createdBy: alice.id,
      maxUses: 10,
      uses: 0,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.invite.create({
    data: {
      serverId: devServer.id,
      code: "DEVHUB",
      createdBy: bob.id,
      maxUses: 5,
      uses: 2,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.invite.create({
    data: {
      serverId: musicServer.id,
      code: "MUSICFOREVER",
      createdBy: charlie.id,
      maxUses: null,
      uses: 0,
      expiresAt: null,
    },
  });

  console.log("Seed completed successfully\n");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
