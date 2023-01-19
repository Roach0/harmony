import type { User, Tag } from "@prisma/client";

import { prisma } from "~/db.server";

export type { Tag } from "@prisma/client";

export function getTag({
  id,
  userId,
}: Pick<Tag, "id"> & {
  userId: User["id"];
}) {
  return prisma.tag.findFirst({
    select: { id: true, name: true },
    where: { id, userId },
  });
}

export function getTagListItems({ userId }: { userId: User["id"] }) {
  return prisma.tag.findMany({
    where: { userId },
    select: { id: true, name: true },
    orderBy: { updatedAt: "desc" },
  });
}

export function createTag({
  name,
  userId,
}: Pick<Tag, "name"> & {
  userId: User["id"];
}) {
  return prisma.tag.create({
    data: {
      name,
      user: {
        connect: {
          id: userId,
        },
      },
    },
  });
}

export function deleteTag({
  id,
  userId,
}: Pick<Tag, "id"> & { userId: User["id"] }) {
  return prisma.tag.deleteMany({
    where: { id, userId },
  });
}
