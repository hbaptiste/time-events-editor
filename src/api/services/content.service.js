import Prisma from "@prisma/client";
const { PrismaClient } = Prisma;

const prisma = new PrismaClient();

export const getContentById = async (id) => {
  return await prisma.content.findUnique({
    where: { id: parseInt(id) },
    select: {
      id: true,
      value: true,
      event: true,
    },
  });
};

export const createContent = async (data) => {
  return await prisma.content.create({
    data: data,
  });
};
