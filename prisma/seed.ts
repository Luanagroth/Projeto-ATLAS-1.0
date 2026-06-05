import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient, Role } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/auth-utils";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run the seed.");
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

const organizationSeed = {
  name: "Atlas Consultoria",
  slug: "atlas-consultoria",
};

const usersSeed = [
  {
    email: "admin@atlas.local",
    name: "Administrador Atlas",
    password: "Admin@123",
    role: Role.ADMIN,
  },
  {
    email: "consultor@atlas.local",
    name: "Consultor Atlas",
    password: "Consultor@123",
    role: Role.CONSULTANT,
  },
  {
    email: "cliente@atlas.local",
    name: "Cliente Atlas",
    password: "Cliente@123",
    role: Role.CLIENT,
  },
];

async function main() {
  const organization = await prisma.organization.upsert({
    where: {
      slug: organizationSeed.slug,
    },
    update: {
      name: organizationSeed.name,
    },
    create: organizationSeed,
  });

  for (const userSeed of usersSeed) {
    const passwordHash = await hashPassword(userSeed.password);

    const user = await prisma.user.upsert({
      where: {
        email: userSeed.email,
      },
      update: {
        name: userSeed.name,
      },
      create: {
        email: userSeed.email,
        name: userSeed.name,
        password: passwordHash,
      },
    });

    await prisma.organizationMembership.upsert({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: organization.id,
        },
      },
      update: {
        role: userSeed.role,
      },
      create: {
        userId: user.id,
        organizationId: organization.id,
        role: userSeed.role,
      },
    });
  }

  const [usersCount, membershipsCount] = await Promise.all([
    prisma.user.count({
      where: {
        email: {
          in: usersSeed.map((user) => user.email),
        },
      },
    }),
    prisma.organizationMembership.count({
      where: {
        organizationId: organization.id,
        user: {
          email: {
            in: usersSeed.map((user) => user.email),
          },
        },
      },
    }),
  ]);

  console.log("Seed completed.");
  console.log(`Organization: ${organization.name}`);
  console.log(`Users: ${usersCount}`);
  console.log(`Memberships: ${membershipsCount}`);
}

main()
  .catch((error) => {
    console.error("Seed failed.");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
