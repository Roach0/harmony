import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seed() {
  const discordId = "1";

  // cleanup the existing database
  await prisma.user.delete({ where: { discordId } }).catch(() => {
    // no worries if it doesn't exist yet
  });

  await prisma.user.create({
    data: {
      discordId,
    },
  });

  console.log(`Database has been seeded. 🌱`);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
