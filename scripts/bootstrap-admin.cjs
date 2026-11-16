const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

async function main() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const name = process.env.BOOTSTRAP_ADMIN_NAME?.trim();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;

  if (!email || !email.includes('@') || !name || name.length < 2) {
    throw new Error('Set a valid BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_NAME.');
  }
  if (!password || password.length < 12 || password.length > 72) {
    throw new Error('BOOTSTRAP_ADMIN_PASSWORD must be between 12 and 72 characters.');
  }

  const prisma = new PrismaClient();
  try {
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { email: true },
    });
    if (existingAdmin) {
      throw new Error(`An administrator already exists (${existingAdmin.email}); refusing to create another.`);
    }

    const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existingUser) {
      throw new Error(`A user already exists with ${email}; choose a different administrator email.`);
    }

    await prisma.user.create({
      data: {
        email,
        name,
        passwordHash: await bcrypt.hash(password, 12),
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });
    console.log(`Created initial administrator: ${email}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Administrator bootstrap failed.');
  process.exitCode = 1;
});
