export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center">
            <span className="text-white font-extrabold text-xl">T</span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Threadly</h1>
        </div>
        {children}
      </div>
    </div>
  )
}
