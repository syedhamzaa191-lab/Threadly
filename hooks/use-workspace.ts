'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Workspace {
  id: string
  name: string
  slug: string
  owner_id: string
}

interface Member {
  user_id: string
  role: string
  profiles: {
    id: string
    full_name: string
    avatar_url: string | null
  } | null
}

export function useWorkspace(workspaceId: string) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [myRole, setMyRole] = useState<string>('member')
  const [loading, setLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const reload = () => setReloadKey((k) => k + 1)

  useEffect(() => {
    if (!workspaceId) return

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()

      // Parallel fetch workspace + members
      const [wsResult, memsResult] = await Promise.all([
        supabase.from('workspaces').select('*').eq('id', workspaceId).single(),
        supabase.from('workspace_members').select('user_id, role').eq('workspace_id', workspaceId),
      ])

      const ws = wsResult.data
      const mems = memsResult.data

      // Fetch profiles in parallel if members exist
      let combined: Member[] = []
      if (mems && mems.length > 0) {
        const userIds = mems.map((m: any) => m.user_id)
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds)

        combined = mems.map((m: any) => ({
          ...m,
          profiles: profiles?.find((p: any) => p.id === m.user_id) || null,
        }))
      }

      setWorkspace(ws)
      setMembers(combined)

      if (user && mems) {
        const me = mems.find((m: any) => m.user_id === user.id)
        if (me) setMyRole(me.role)
      }

      setLoading(false)
    }

    load()
  }, [workspaceId, reloadKey, supabase])

  return { workspace, members, myRole, loading, reload }
}
