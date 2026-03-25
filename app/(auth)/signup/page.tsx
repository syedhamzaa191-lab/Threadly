'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

// No separate signup - Google auth handles both login & signup
export default function SignupPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/login')
  }, [router])

  return null
}
