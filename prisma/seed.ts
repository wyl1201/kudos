// prisma/seed.ts

import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

// initialize Prisma Client
const prisma = new PrismaClient()

const roundsOfHashing = 10

async function main() {
  // create two dummy users
  const passwordAlvin = await bcrypt.hash('password-alvin', roundsOfHashing)
  const passwordSabin = await bcrypt.hash('password-sabin', roundsOfHashing)
  const passwordAlex = await bcrypt.hash('password-alex', roundsOfHashing)

  const user1 = await prisma.user.upsert({
    where: { email: 'alvin.wang@wayz.ai' },
    update: {
      profile: {
        update: {
          department: 'HR',
        },
      },
    },
    create: {
      email: 'alvin.wang@wayz.ai',
      password: passwordAlvin,
      profile: {
        firstName: 'Alvin',
        lastName: 'Wang',
      },
    },
  })

  const user2 = await prisma.user.upsert({
    where: { email: 'sabin@adams.com' },
    update: {
      profile: {
        update: {
          department: 'HR',
        },
      },
    },
    create: {
      email: 'sabin@adams.com',
      password: passwordSabin,
      profile: {
        firstName: 'Sabin',
        lastName: 'Adams',
      },
    },
  })
  const user3 = await prisma.user.upsert({
    where: { email: 'alex@ruheni.com' },
    update: {
      profile: {
        update: {
          department: 'HR',
        },
      },
    },
    create: {
      email: 'alex@ruheni.com',
      password: passwordAlex,
      profile: {
        firstName: 'Alex',
        lastName: 'Ruheni',
        department: 'MARKETING',
      },
    },
  })

  console.log({ user1, user2, user3 })
}

// execute the main function
main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    // close Prisma Client at the end
    await prisma.$disconnect()
  })
