const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

// Prisma Client singleton to avoid creating multiple instances during development
// (especially relevant for hot-reloading).
let prisma;
let pool;

function getPrisma() {
  if (!prisma) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });
  }
  return prisma;
}

module.exports = { getPrisma };
