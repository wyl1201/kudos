import * as bcrypt from 'bcrypt'
import { prisma } from './prisma.server'
import type { RegisterForm } from './types.server'
import { Profile } from '@prisma/client'

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

export const getUserById = async (id: string) => {
  return await prisma.user.findUnique({ where: { id } })
}

export const getOtherUsers = async (userId: string) => {
  const users = await prisma.user.findMany({
    where: { id: { not: userId } },
    orderBy: { profile: { firstName: 'asc' } },
  })
  return users
}

export const updateUser = async (userId: string, profile: Partial<Profile>) => {
  await prisma.user.update({
    where: { id: userId },
    data: {
      profile: {
        update: profile,
      },
    },
  })
}
