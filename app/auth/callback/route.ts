import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const redirect = searchParams.get('redirect')

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      return NextResponse.redirect(`${origin}/login?error=auth_failed`)
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('status, is_deleted')
        .eq('id', user.id)
        .single()

      if (profile) {
        if (profile.status !== 'active' || profile.is_deleted) {
          await supabase.auth.signOut()
          return NextResponse.redirect(
            `${origin}/login?error=account_deactivated`
          )
        }
      }

      if (user.email) {
        await supabase
          .from('profiles')
          .update({ email: user.email })
          .eq('id', user.id)
      }
    }

    if (redirect) {
      return NextResponse.redirect(`${origin}${redirect}`)
    }

    return NextResponse.redirect(`${origin}/workspace`)
  }

  return NextResponse.redirect(`${origin}/login?error=no_code`)
}
