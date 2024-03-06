import { LoaderFunction, json } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { Layout } from '~/components/layout'
import { UserPanel } from '~/components/user-panel'
import { requireUserId } from '~/utils/auth.server'
import { getOtherUsers } from '~/utils/user.server'

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await requireUserId(request)
  const users = await getOtherUsers(userId)
  return json({ users })
}

export default function Home() {
  const { users } = useLoaderData()
  console.log(`🚀 ~ Home ~ users:`, users)
  return (
    <Layout>
      <div className='h-full flex'>
        <UserPanel users={users} />
        <div className='flex-1'></div>
      </div>
    </Layout>
  )
}
