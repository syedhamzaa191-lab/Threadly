'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
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

          // If profile has no avatar but Google metadata does, sync it
          const googleAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || null
          if (data && !data.avatar_url && googleAvatar) {
            await supabase
              .from('profiles')
              .update({ avatar_url: googleAvatar })
              .eq('id', user.id)
            data.avatar_url = googleAvatar
          }

          // If profile has no full_name but Google metadata does, sync it
          const googleName = user.user_metadata?.full_name || user.user_metadata?.name || null
          if (data && !data.full_name && googleName) {
            await supabase
              .from('profiles')
              .update({ full_name: googleName })
              .eq('id', user.id)
            data.full_name = googleName
          }

          setProfile(data)
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
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return { user, profile, loading, signOut }
}
