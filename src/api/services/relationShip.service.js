import Prisma from "@prisma/client";
const { PrismaClient } = Prisma;

const prisma = new PrismaClient();

export const createRelationShip = async (data) => {
  console.log(data);
  return await prisma.relationShip.create({ data });
};
