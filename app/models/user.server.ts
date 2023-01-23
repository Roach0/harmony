import type { User } from "@prisma/client";

import { prisma } from "~/db.server";
import { getSessionDiscordId } from "~/session.server";

export type { User } from "@prisma/client";

export async function getUserById(id: User["id"]) {
  return prisma.user.findUnique({ where: { id } });
}

export async function getUserByDiscordId(
  discordId: User["discordId"] | undefined
) {
  return prisma.user.findUnique({ where: { discordId } });
}

export async function createUser(
  discordId: User["discordId"],
  localeId: User["localeId"]
) {
  const locale = await prisma.locale.findUnique({
    where: { discordId: localeId },
  });
  if (!locale) {
    throw new Error("Locale not found");
  }
  return prisma.user.create({
    data: {
      discordId,
      locale: {
        connect: {
          id: locale.id,
        },
      },
    },
  });
}

export async function updateUserLocale(
  request: Request,
  localeId: User["localeId"]
) {
  const discordId = await getSessionDiscordId(request);
  const locale = await prisma.locale.findUnique({
    where: { id: localeId },
  });

  if (!locale) {
    throw new Error("Locale not found");
  }

  return prisma.user.update({
    where: { discordId },
    data: {
      locale: {
        connect: {
          id: locale.id,
        },
      },
    },
  });
}
