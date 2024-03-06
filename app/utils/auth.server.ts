import { createCookieSessionStorage, json, redirect } from '@remix-run/node'
import * as bcrypt from 'bcrypt'
import { prisma } from './prisma.server'
import { LoginForm, RegisterForm } from './types.server'
import { createUser } from './user.server'

const sessionSecret = process.env.SESSION_SECRET

if (!sessionSecret) {
  throw new Error('SESSION_SECRET must be set')
}

const storage = createCookieSessionStorage({
  cookie: {
    name: '__session',
    secure: process.env.NODE_ENV === 'production',
    secrets: [sessionSecret],
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    httpOnly: true,
  },
})

export async function createUserSession(userId: string, redirectTo: string) {
  const session = await storage.getSession()
  session.set('userId', userId)
  return redirect(redirectTo, {
    headers: {
      'Set-Cookie': await storage.commitSession(session),
    },
  })
}

export async function requireUserId(
  request: Request,
  redirectTo: string = new URL(request.url).pathname
) {
  const userId = await getUserId(request)
  if (!userId || typeof userId !== 'string') {
    const searchParams = new URLSearchParams([['redirectTo', redirectTo]])
    throw redirect(`/login?${searchParams}`)
  }
  return userId
}

export async function getUserSession(request: Request) {
  return storage.getSession(request.headers.get('Cookie'))
}

export async function getUserId(request: Request) {
  const session = await getUserSession(request)
  const userId = session.get('userId')
  if (!userId || typeof userId !== 'string') {
    return null
  }
  return userId
}

export async function getUser(request: Request) {
  const userId = await getUserId(request)
  if (typeof userId !== 'string') {
    return null
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, profile: true },
    })
    return user
  } catch (err) {
    console.log(`🚀 ~ getUser ~ err:`, err)
    throw logout(request)
  }
}

export async function register(user: RegisterForm) {
  const exists = await prisma.user.count({ where: { email: user.email } })
  if (exists) {
    return json(
      { error: 'User already exists with that email' },
      { status: 400 }
    )
  }

  const newUser = await createUser(user)

  if (!newUser) {
    return json(
      { error: 'Something went wrong trying to create a new user' },
      { status: 400 }
    )
  }
  return createUserSession(newUser.id, '/')
}

export async function login({ email, password }: LoginForm) {
  const user = await prisma.user.findUnique({ where: { email } })

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return json({ error: 'Incorrect login' }, { status: 400 })
  }

  return createUserSession(user.id, '/')
}

export async function logout(request: Request) {
  const session = await getUserSession(request)
  return redirect('/login', {
    headers: {
      'Set-Cookie': await storage.destroySession(session),
    },
  })
}
