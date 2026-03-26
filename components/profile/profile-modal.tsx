'use client'

import { useState, useRef, useEffect } from 'react'
import { IconButton } from '@/components/ui/icon-button'
import { Avatar } from '@/components/ui/avatar'

interface ProfileData {
  name: string
  email: string
  role: string
  avatar: string | null
  bio: string
  phone: string
  location: string
  department: string
}

interface ProfileModalProps {
  profile: ProfileData
  onClose: () => void
  onSave: (data: ProfileData) => void
}

export function ProfileModal({ profile, onClose, onSave }: ProfileModalProps) {
  const [editing, setEditing] = useState(false)
  const [data, setData] = useState<ProfileData>(profile)
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(profile.avatar)
  const [visible, setVisible] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Slide-in animation
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 300)
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      setPreviewAvatar(result)
      setData((prev) => ({ ...prev, avatar: result }))
    }
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    onSave(data)
    setEditing(false)
  }

  // Joined date
  const joinedDate = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/30 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />

      {/* Slide-in Panel from right */}
      <div
        className={`absolute right-0 top-0 h-full w-full max-w-[420px] bg-[#1e1a2b] shadow-xl flex flex-col transition-transform duration-300 ease-out ${
          visible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Cover */}
        <div className="relative h-36 bg-gradient-to-br from-[#0f0a1a] via-[#2a1050] to-[#4c1d95] shrink-0">
          {/* Pattern overlay */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }} />

          <div className="absolute top-4 left-5 right-5 flex items-center justify-between">
            <button
              onClick={handleClose}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-bold text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-1.5 rounded-lg text-[12px] font-bold bg-white text-white/80 hover:bg-white/[0.06] transition-colors"
              >
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setData(profile)
                    setPreviewAvatar(profile.avatar)
                    setEditing(false)
                  }}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-bold bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-1.5 rounded-lg text-[12px] font-bold bg-white text-white/80 hover:bg-white/[0.06] transition-colors"
                >
                  Save
                </button>
              </div>
            )}
          </div>

          {/* Avatar */}
          <div className="absolute -bottom-14 left-6">
            <div className="relative">
              <div className="w-28 h-28 rounded-3xl border-4 border-[#1e1a2b] overflow-hidden bg-[#252133] shadow-soft">
                {previewAvatar ? (
                  <img src={previewAvatar} alt={data.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-white/[0.06] flex items-center justify-center">
                    <span className="text-3xl font-extrabold text-white/40">
                      {data.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </span>
                  </div>
                )}
              </div>
              {editing && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-9 h-9 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white flex items-center justify-center hover:opacity-90 transition-all shadow-glow"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="pt-[72px] px-6 pb-8">
            {/* Name & Role & Status */}
            {editing ? (
              <div className="mb-6">
                <label className="block text-[11px] font-bold text-white/80 uppercase tracking-widest mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={data.name}
                  onChange={(e) => setData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/[0.04] rounded-xl text-[15px] text-white/80 font-bold border border-white/[0.08] focus:outline-none focus:border-purple-500/40 transition-colors"
                />
              </div>
            ) : (
              <div className="mb-6">
                <h2 className="text-[22px] font-extrabold text-white tracking-tight">{data.name}</h2>
                <div className="flex items-center gap-2.5 mt-1.5">
                  <span className="px-2.5 py-0.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg text-[11px] font-bold uppercase tracking-wide shadow-sm">
                    {data.role}
                  </span>
                  <span className="flex items-center gap-1.5 text-[12px] text-emerald-600 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Online
                  </span>
                </div>
              </div>
            )}

            {/* Bio Section */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2.5">
                <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
                <span className="text-[11px] font-bold text-white/80 uppercase tracking-widest">About</span>
              </div>
              {editing ? (
                <textarea
                  value={data.bio}
                  onChange={(e) => setData((prev) => ({ ...prev, bio: e.target.value }))}
                  placeholder="Write something about yourself — your role, expertise, what you're working on..."
                  rows={4}
                  className="w-full px-4 py-3 bg-white/[0.04] rounded-xl text-[13px] text-white/80 border border-white/[0.08] focus:outline-none focus:border-purple-500/40 transition-colors resize-none leading-relaxed"
                />
              ) : (
                <div className="bg-white/[0.04] rounded-2xl p-4">
                  <p className="text-[13px] text-white/80 leading-relaxed whitespace-pre-wrap">
                    {data.bio || 'No bio added yet. Click "Edit Profile" to tell people about yourself.'}
                  </p>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="h-px bg-white/[0.08] mb-6" />

            {/* Contact Info */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-[11px] font-bold text-white/80 uppercase tracking-widest">Contact Info</span>
              </div>
              <div className="space-y-2">
                <InfoField icon={<MailIcon />} label="Email" value={data.email} editing={false} />
                <InfoField
                  icon={<PhoneIcon />}
                  label="Phone"
                  value={data.phone}
                  editing={editing}
                  placeholder="+92 300 1234567"
                  onChange={(v) => setData((prev) => ({ ...prev, phone: v }))}
                />
              </div>
            </div>

            {/* Work Info */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-[11px] font-bold text-white/80 uppercase tracking-widest">Work</span>
              </div>
              <div className="space-y-2">
                <InfoField
                  icon={<DepartmentIcon />}
                  label="Department"
                  value={data.department}
                  editing={editing}
                  placeholder="e.g. Engineering"
                  onChange={(v) => setData((prev) => ({ ...prev, department: v }))}
                />
                <InfoField
                  icon={<LocationIcon />}
                  label="Location"
                  value={data.location}
                  editing={editing}
                  placeholder="e.g. Karachi, Pakistan"
                  onChange={(v) => setData((prev) => ({ ...prev, location: v }))}
                />
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/[0.08] mb-6" />

            {/* Activity / Stats */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="text-[11px] font-bold text-white/80 uppercase tracking-widest">Activity</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <StatCard label="Joined" value={joinedDate} />
                <StatCard label="Role" value={data.role} />
                <StatCard label="Status" value="Active" highlight />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-white/[0.03] rounded-xl p-3 text-center border border-white/[0.06]">
      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-[12px] font-bold truncate ${highlight ? 'text-emerald-600' : 'text-white/80'}`}>
        {value}
      </p>
    </div>
  )
}

function InfoField({
  icon,
  label,
  value,
  editing,
  placeholder,
  onChange,
}: {
  icon: React.ReactNode
  label: string
  value: string
  editing: boolean
  placeholder?: string
  onChange?: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-3 p-3.5 bg-white/[0.04] rounded-xl">
      <div className="w-9 h-9 rounded-xl bg-white border border-white/[0.08] flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest">{label}</p>
        {editing && onChange ? (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-transparent text-[13px] text-white/80 font-medium focus:outline-none mt-0.5"
          />
        ) : (
          <p className="text-[13px] text-white/80 font-medium truncate mt-0.5">
            {value || 'Not set'}
          </p>
        )}
      </div>
    </div>
  )
}

function MailIcon() {
  return (
    <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  )
}

function LocationIcon() {
  return (
    <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function DepartmentIcon() {
  return (
    <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  )
}
