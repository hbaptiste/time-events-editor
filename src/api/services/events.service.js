import Prisma from "@prisma/client";
const { PrismaClient } = Prisma;

const prisma = new PrismaClient();
const getAllEvents = async () => {
  const result = await prisma.event.findMany();
  return { result };
};

const getEventById = async (id) => {
  return prisma.event.findUnique({
    where: {
      id: parseInt(id),
    },
    include: {
      content: {
        include: {
          fromRelationShip: true,
        },
      },
    },
  });
};

const createEvent = async (data) => {
  return prisma.event.create({
    data: data,
    include: {
      content: true, // Include all posts in the returned object
    },
  });
};

const createContentNode = async (data) => {
  return prisma.content.create({
    value: "This my content. You better know !",
  });
};

export { getAllEvents, createEvent, getEventById };
