'use client'

import { useEffect, useState } from 'react'
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
  const supabase = createClient()

  useEffect(() => {
    if (!workspaceId) return

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()

      const { data: ws } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', workspaceId)
        .single()

      const { data: mems } = await supabase
        .from('workspace_members')
        .select('user_id, role, profiles:user_id(id, full_name, avatar_url)')
        .eq('workspace_id', workspaceId)

      setWorkspace(ws)
      setMembers((mems as any) || [])

      if (user && mems) {
        const me = mems.find((m: any) => m.user_id === user.id)
        if (me) setMyRole(me.role)
      }

      setLoading(false)
    }

    load()
  }, [workspaceId])

  const createInvite = async (userId: string) => {
    const { data, error } = await supabase
      .from('invites')
      .insert({ workspace_id: workspaceId, created_by: userId })
      .select()
      .single()

    return { data, error }
  }

  return { workspace, members, myRole, loading, createInvite }
}
