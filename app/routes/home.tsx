import { LoaderFunction, json } from '@remix-run/node'
import { Outlet, useLoaderData } from '@remix-run/react'
import { Kudo as IKudo, Prisma, Profile } from '@prisma/client'
import { Kudo } from '~/components/kudo'
import { Layout } from '~/components/layout'
import { UserPanel } from '~/components/user-panel'
import { SearchBar } from '~/components/search-bar'
import { RecentBar } from '~/components/recent-bar'
import { getUser, requireUserId } from '~/utils/auth.server'
import { getFilteredKudos, getRecentKudos } from '~/utils/kudos.server'
import { getOtherUsers } from '~/utils/user.server'

interface KudoWithProfile extends IKudo {
  author: {
    profile: Profile
  }
}

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url)
  const sort = url.searchParams.get('sort')
  const filter = url.searchParams.get('filter')

  let sortOptions: Prisma.KudoOrderByWithRelationInput = {}

  switch (sort) {
    case 'date':
      sortOptions = { createdAt: 'desc' }
      break
    case 'sender':
      sortOptions = { author: { profile: { firstName: 'asc' } } }
      break
    case 'emoji':
      sortOptions = { style: { emoji: 'asc' } }
      break
    default:
      break
  }

  let textFilter: Prisma.KudoWhereInput = {}

  if (filter) {
    textFilter = {
      OR: [
        { message: { mode: 'insensitive', contains: filter } },
        {
          author: {
            OR: [
              {
                profile: {
                  is: { firstName: { mode: 'insensitive', contains: filter } },
                },
              },
              {
                profile: {
                  is: { lastName: { mode: 'insensitive', contains: filter } },
                },
              },
            ],
          },
        },
      ],
    }
  }

  const userId = await requireUserId(request)
  const users = await getOtherUsers(userId)
  const kudos = await getFilteredKudos(userId, sortOptions, textFilter)
  const recentKudos = await getRecentKudos()
  const user = await getUser(request)
  return json({ users, kudos, recentKudos, user })
}

export default function Home() {
  const { users, kudos, recentKudos, user } = useLoaderData()
  console.log(`🚀 ~ Home ~ user:`, user)
  return (
    <Layout>
      <Outlet />
      <div className='h-full flex'>
        <UserPanel users={users} />
        <div className='flex-1 flex flex-col'>
          <SearchBar profile={user.profile} />
          <div className='flex-1 flex'>
            <div className='w-full p-10 flex flex-col gap-y-4'>
              {kudos.map((kudo: KudoWithProfile) => (
                <Kudo key={kudo.id} kudo={kudo} profile={kudo.author.profile} />
              ))}
            </div>
            <RecentBar kudos={recentKudos} />
          </div>
        </div>
      </div>
    </Layout>
  )
}
