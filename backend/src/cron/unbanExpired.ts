import cron from "node-cron";
import { prisma } from "../prisma/client.js";


 
export function startUnbanCron(io: any) {
  cron.schedule("* * * * *", async () => {
    const now = new Date();

    const expiredBans = await prisma.ban.findMany({
      where: {
        permanent: false,
        expiresAt: { lte: now }
      }
    });

    if (expiredBans.length === 0) return;

    await prisma.ban.deleteMany({
      where: {
        permanent: false,
        expiresAt: { lte: now }
      }
    });

    expiredBans.forEach(ban => {
      io.to(ban.serverId).emit("member:unbanned", {
        userId: ban.userId,
        auto: true
      });
    });

    console.log(`Auto-unban: ${expiredBans.length} users`);
  });
}
