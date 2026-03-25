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

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Check user status in profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('status, is_deleted')
        .eq('id', user.id)
        .single()

      if (profile) {
        // Check 1: status must be active
        // Check 2: must not be deleted
        if (profile.status !== 'active' || profile.is_deleted) {
          // Reject login — sign out and redirect with error
          await supabase.auth.signOut()
          return NextResponse.redirect(
            `${origin}/login?error=account_deactivated`
          )
        }
      }
      // If no profile yet (new user), the DB trigger will create one

      // Update email in profile if not set
      if (user.email) {
        await supabase
          .from('profiles')
          .update({ email: user.email })
          .eq('id', user.id)
      }
    }

    // Redirect to invite page if coming from invite flow
    if (redirect) {
      return NextResponse.redirect(`${origin}${redirect}`)
    }

    return NextResponse.redirect(`${origin}/workspace`)
  }

  return NextResponse.redirect(`${origin}/login?error=no_code`)
}
