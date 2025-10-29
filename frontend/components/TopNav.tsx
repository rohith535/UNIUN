import Button from './ui/Button'
import Card from './ui/Card'
import Icons from './ui/icons'
import { useRouter } from 'next/router'
import { useContext, useEffect, useState, useRef } from 'react'
import api from '../utils/api'
//
import Avatar from './ui/Avatar'
import { useToast } from './ui/Toast'
import { ThemeContext } from './Layout'
import { Settings } from 'lucide-react'
import NotificationBell from './NotificationBell'

export default function TopNav({ onOpenAuth }: { onOpenAuth?: () => void }) {
  const router = useRouter()
  const [unread, setUnread] = useState<number>(0)
  const [authed, setAuthed] = useState<boolean>(false)
  const [me, setMe] = useState<any>(null)
  const { show } = useToast()
  const { theme, setTheme, motion, toggleMotion } = useContext(ThemeContext)
  const [showSettings, setShowSettings] = useState(false)
  const settingsRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let timer: any

    const refreshAuth = async () => {
      const hasToken = typeof window !== 'undefined' ? !!localStorage.getItem('token') : false
      setAuthed(hasToken)
      if (hasToken) {
        try { setMe(await api.me()) }
        catch {
          // Token likely invalid/stale (e.g., DB reset between deploys). Clear it to recover.
          try { localStorage.removeItem('token'); window.dispatchEvent(new Event('auth:changed')) } catch {}
          setAuthed(false)
          setMe(null)
        }
      } else {
        setMe(null)
      }
    }

    const loadUnread = async () => {
      try {
        if (typeof window !== 'undefined' && localStorage.getItem('token')) {
          const r:any = await api.unreadCount();
          setUnread(Number(r.total || 0))
        } else {
          setUnread(0)
        }
      } catch { setUnread(0) }
      timer = setTimeout(loadUnread, 15000)
    }

    // Initial hydrate
    refreshAuth()
    loadUnread()

    // React to storage token changes across tabs and custom auth event
    const onStorage = (e: StorageEvent) => { if (e.key === 'token') refreshAuth() }
    const onAuthChanged = () => refreshAuth()
    window.addEventListener('storage', onStorage)
    window.addEventListener('auth:changed', onAuthChanged as any)

    // Refresh on route changes to keep header data current
    const onRoute = () => { refreshAuth(); loadUnread() }
    router.events.on('routeChangeComplete', onRoute)

    return () => {
      if (timer) clearTimeout(timer)
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('auth:changed', onAuthChanged as any)
      router.events.off('routeChangeComplete', onRoute)
    }
  }, [router.events])
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as any)) setShowSettings(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])
  return (
    <Card className="w-full glass shadow-premium transition-premium border-b border-white/10 backdrop-blur-md fixed top-0 left-0 right-0 z-40">
      <div className="container-premium p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="heading-premium text-2xl cursor-pointer select-none" onClick={() => onOpenAuth && onOpenAuth()}>
            UNIUN
          </div>
        </div>
        <div className="flex items-center gap-4">
        <Button onClick={() => { show('Opening search', 'info'); router.push('/search') }} className={router.pathname === '/search' ? 'ring-2 ring-[#3b82f6]' : ''}><Icons.Search size={16} /> Search</Button>
        {authed && (
          <>
            <NotificationBell />
            <div className="relative" ref={settingsRef}>
              <Button onClick={() => setShowSettings(s => !s)} aria-label="Open settings" title="Settings"><Settings size={16} /></Button>
              {showSettings && (
                <div className="absolute right-0 mt-2 min-w-[220px] glass shadow-premium rounded-xl border border-white/10 p-3 z-50">
                  <div className="text-xs text-gray-400 mb-2">Preferences</div>
                  <div className="mb-2">
                    <div className="text-premium mb-1">Theme</div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button onClick={() => setTheme('dark')} className={theme==='dark'?'ring-2 ring-[#3b82f6]':''}>Dark</Button>
                      <Button onClick={() => setTheme('default')} className={theme==='default'?'ring-2 ring-[#3b82f6]':''}>Default</Button>
                      <Button onClick={() => setTheme('light-olive')} className={theme==='light-olive'?'ring-2 ring-[#3b82f6]':''}>Light (Olive)</Button>
                      <Button onClick={() => setTheme('futuristic')} className={theme==='futuristic'?'ring-2 ring-[#3b82f6]':''}>Futuristic</Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-premium">Motion</span>
                    <Button onClick={toggleMotion}>{motion === 'reduce' ? 'Reduce' : 'Auto'}</Button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
        {authed && (
          <Button onClick={() => { show('Opening messages', 'info'); router.push('/messages-direct') }} className="relative">
            <Icons.MessageSquare size={16} /> Messages
            {unread>0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full shadow-premium">{unread}</span>
            )}
          </Button>
        )}
        {authed ? (
          <Button onClick={() => { show('Opening upload', 'info'); router.push('/upload') }}><Icons.Upload size={16} /> Upload</Button>
        ) : (
          <Button onClick={() => onOpenAuth && onOpenAuth()}><Icons.Upload size={16} /> Upload</Button>
        )}
        <Button onClick={() => {
          const t = typeof window !== 'undefined' ? localStorage.getItem('token') : null
          if (t) router.push('/profile'); else onOpenAuth && onOpenAuth()
        }}>
          {me?.avatarUrl ? (
            <span className="inline-flex items-center gap-2" title={`Logged in as ${me?.username || me?.id || me?._id}`}>
              <Avatar src={me.avatarUrl} size={18} className="border border-white/20 shadow-premium" />
              <span className="inline-flex items-center gap-1 text-premium">
                <span>{me?.username || 'Account'}</span>
                {me && <span className="text-[10px] text-gray-400">({me.id || me._id})</span>}
              </span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 text-premium" title={me ? `Logged in as ${me?.username || me?.id || me?._id}` : ''}>
              <Icons.User size={16} />
              <span className="inline-flex items-center gap-1">
                <span>{me?.username || 'Account'}</span>
                {me && <span className="text-[10px] text-gray-400">({me.id || me._id})</span>}
              </span>
            </span>
          )}
        </Button>
        </div>
      </div>
    </Card>
  )
}
