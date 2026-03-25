'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AcceptInvite({
  workspaceId,
  workspaceName,
}: {
  workspaceId: string
  workspaceName: string
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleAccept() {
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('You must be logged in')
      setLoading(false)
      return
    }

    const { error: joinError } = await supabase
      .from('workspace_members')
      .insert({ workspace_id: workspaceId, user_id: user.id, role: 'member' })

    if (joinError) {
      setError(joinError.message)
      setLoading(false)
      return
    }

    router.push(`/workspace/${workspaceId}`)
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-brand-700 mb-4">Threadly</h1>
        <h2 className="text-xl font-semibold mb-2">You&apos;ve been invited!</h2>
        <p className="text-gray-500 mb-6">
          Join <strong>{workspaceName}</strong> on Threadly
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <button
          onClick={handleAccept}
          disabled={loading}
          className="w-full py-2 px-4 bg-brand-600 text-white rounded-md hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Joining...' : 'Accept Invite'}
        </button>
      </div>
    </div>
  )
}
