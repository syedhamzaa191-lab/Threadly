'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { clearProfileCache } from './use-messages'
import type { User } from '@supabase/supabase-js'

interface Profile {
  id: string
  full_name: string
  avatar_url: string | null
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  useEffect(() => {
    async function getUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)

        if (user) {
          const { data } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', user.id)
            .single()

          // Sync missing profile data from Google in one update
          if (data) {
            const googleAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || null
            const googleName = user.user_metadata?.full_name || user.user_metadata?.name || null
            const updates: Record<string, string> = {}
            if (!data.avatar_url && googleAvatar) updates.avatar_url = googleAvatar
            if (!data.full_name && googleName) updates.full_name = googleName

            if (Object.keys(updates).length > 0) {
              await supabase.from('profiles').update(updates).eq('id', user.id)
            }

            setProfile({
              ...data,
              avatar_url: data.avatar_url || googleAvatar,
              full_name: data.full_name || googleName || '',
            })
          } else {
            setProfile(null)
          }
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') console.error('Auth error:', err)
      }

      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const signOut = async () => {
    clearProfileCache()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return { user, profile, loading, signOut }
}
