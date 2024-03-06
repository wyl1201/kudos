import * as bcrypt from 'bcrypt'
import { prisma } from './prisma.server'
import type { RegisterForm } from './types.server'

export const createUser = async (user: RegisterForm) => {
  const passwordHash = await bcrypt.hash(user.password, 10)
  const newUser = await prisma.user.create({
    data: {
      email: user.email,
      password: passwordHash,
      profile: {
        firstName: user.firstName,
        lastName: user.lastName,
      },
    },
  })
  return { id: newUser.id, email: newUser.email }
}

export const getOtherUsers = async (userId: string) => {
  const users = await prisma.user.findMany({
    where: { id: { not: userId } },
    orderBy: { profile: { firstName: 'asc' } },
  })
  return users
}
