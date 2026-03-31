'use client'

import { useEffect, useState } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'

interface UserProfile {
  id: string
  full_name: string
  avatar_url: string | null
  email: string
  bio: string
  phone: string
  location: string
  department: string
  status: string
}

interface UserProfilePanelProps {
  userId: string
  onClose: () => void
}

export function UserProfilePanel({ userId, onClose }: UserProfilePanelProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [visible, setVisible] = useState(false)
  const [showFullAvatar, setShowFullAvatar] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, email, bio, phone, location, department, status')
        .eq('id', userId)
        .single()
      setProfile(data)
      setLoading(false)
    }
    load()
  }, [userId])

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 300)
  }

  return (
    <>
      {/* Full avatar overlay */}
      {showFullAvatar && profile?.avatar_url && (
        <div
          className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center cursor-pointer animate-fade-in"
          onClick={() => setShowFullAvatar(false)}
        >
          <img
            src={profile.avatar_url}
            alt={profile.full_name}
            className="max-w-[90vw] max-h-[90vh] rounded-2xl shadow-2xl object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {/* Panel */}
      <div className={`w-full sm:w-[380px] fixed sm:relative inset-0 sm:inset-auto z-[50] sm:z-auto h-full flex flex-col border-l border-white/[0.06] bg-[#1e1a2b] transition-transform duration-300 ease-out ${visible ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Cover */}
        <div className="relative h-32 bg-gradient-to-br from-violet-600/40 via-purple-600/30 to-indigo-600/20 shrink-0">
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '20px 20px',
          }} />

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-black/20 hover:bg-black/40 flex items-center justify-center text-white/60 hover:text-white transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Avatar */}
          <div className="absolute -bottom-12 left-6">
            <button
              onClick={() => profile?.avatar_url && setShowFullAvatar(true)}
              className="relative group"
            >
              <div className="w-24 h-24 rounded-2xl border-4 border-[#1e1a2b] overflow-hidden bg-[#252133] shadow-lg">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Avatar name={profile?.full_name || '?'} size="xl" />
                  </div>
                )}
              </div>
              {profile?.avatar_url && (
                <div className="absolute inset-0 rounded-2xl border-4 border-[#1e1a2b] bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                  <svg className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-dark">
          {loading ? (
            <div className="pt-16 px-6 flex items-center justify-center">
              <div className="flex gap-1.5 py-8">
                <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-[bounce_1s_infinite_0ms]" />
                <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-[bounce_1s_infinite_200ms]" />
                <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-[bounce_1s_infinite_400ms]" />
              </div>
            </div>
          ) : profile ? (
            <div className="pt-16 px-6 pb-8">
              {/* Name & Status */}
              <h2 className="text-xl font-extrabold text-white tracking-tight">{profile.full_name}</h2>
              <div className="flex items-center gap-2 mt-1.5 mb-6">
                <span className="flex items-center gap-1.5 text-[12px] text-emerald-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Online
                </span>
              </div>

              {/* Bio */}
              {profile.bio && (
                <div className="mb-6">
                  <SectionLabel icon={<AboutIcon />} label="About" />
                  <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.05]">
                    <p className="text-[13px] text-white/60 leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
                  </div>
                </div>
              )}

              {/* Divider */}
              <div className="h-px bg-white/[0.06] mb-6" />

              {/* Contact */}
              <div className="mb-6">
                <SectionLabel icon={<ContactIcon />} label="Contact" />
                <div className="space-y-2">
                  <InfoRow label="Email" value={profile.email} />
                  {profile.phone && <InfoRow label="Phone" value={profile.phone} />}
                </div>
              </div>

              {/* Work */}
              {(profile.department || profile.location) && (
                <div className="mb-6">
                  <SectionLabel icon={<WorkIcon />} label="Work" />
                  <div className="space-y-2">
                    {profile.department && <InfoRow label="Department" value={profile.department} />}
                    {profile.location && <InfoRow label="Location" value={profile.location} />}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="pt-16 px-6 text-center">
              <p className="text-white/30 text-sm">User not found</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {icon}
      <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">{label}</span>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-xl border border-white/[0.05]">
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{label}</p>
        <p className="text-[13px] text-white/60 font-medium truncate mt-0.5">{value || 'Not set'}</p>
      </div>
    </div>
  )
}

function AboutIcon() {
  return <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h7" /></svg>
}
function ContactIcon() {
  return <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
}
function WorkIcon() {
  return <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
}
