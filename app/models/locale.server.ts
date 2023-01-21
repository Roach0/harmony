import { prisma } from "~/db.server";

export function getLocaleList() {
  return prisma.locale.findMany({
    orderBy: { name: "desc" },
  });
}

export function getLocaleById(id: string) {
  return prisma.locale.findUnique({
    where: { id },
  });
}
