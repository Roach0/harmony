import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seed() {
  const LANGUAGE_OPTIONS = [
    { discordId: "zh-CN", name: "Chinese, China" },
    { discordId: "zh-TW", name: "Chinese, Taiwan" },
    { discordId: "en-US", name: "English, US" },
    { discordId: "en-GB", name: "English, UK" },
    { discordId: "fr", name: "French" },
    { discordId: "de", name: "German" },
    { discordId: "it", name: "Italian" },
    { discordId: "ja", name: "Japanese" },
    { discordId: "ko", name: "Korean" },
    { discordId: "pt-BR", name: "Portuguese" },
    { discordId: "ru", name: "Russian" },
    { discordId: "es-ES", name: "Spanish" },
  ];

  for (const { discordId, name } of LANGUAGE_OPTIONS) {
    const exists = await prisma.locale.findUnique({
      where: { discordId },
    });

    if (exists) {
      console.log(`Locale ${discordId} already exists. Skipping...`);
      continue;
    }

    await prisma.locale.create({
      data: {
        discordId,
        name,
      },
    });

    console.log(`Database has been seeded. 🌱`);
  }
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
