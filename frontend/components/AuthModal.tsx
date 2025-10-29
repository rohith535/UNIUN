import React, { useState, useEffect } from 'react'
import Button from './ui/Button'
import Card from './ui/Card'
import { register, login, checkUsernameAvailability } from '../utils/api'
import { useRouter } from 'next/router'

export default function AuthModal({ onClose }: { onClose?: () => void }) {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [usernameAvailable, setUsernameAvailable] = useState(true)
  const [usernameTouched, setUsernameTouched] = useState(false)

  useEffect(() => {
    if (usernameTouched) {
      const checkAvailability = async () => {
        if (username.length > 2) {
          const res: any = await checkUsernameAvailability(username);
          setUsernameAvailable(res.available);
        }
      };
      checkAvailability();
    }
  }, [username, usernameTouched]);

  async function submit() {
    try {
      if (isLogin) {
        const res: any = await login(username, password)
        localStorage.setItem('token', res.token)
        // Notify listeners that auth state changed
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth:changed'))
        }
        // After basic auth login, go to profile
        router.push('/profile')
      } else {
        const res: any = await register(username, password)
        localStorage.setItem('token', res.token)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth:changed'))
        }
        // After registration, go to profile
        router.push('/profile')
      }
      onClose && onClose()
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-md">
      <Card className="glass shadow-premium transition-premium p-8 w-96 border border-white/10">
        <h3 className="heading-premium text-2xl mb-6 text-center">{isLogin ? 'Login' : 'Register'}</h3>
        <input className="w-full mb-3 p-3 rounded-lg bg-white/10 text-premium border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#3b82f6] transition-premium" placeholder="username" value={username} onChange={(e) => { setUsername(e.target.value); setUsernameTouched(true); }} />
        {!isLogin && usernameTouched && username.length > 2 && (
          <div className={`text-sm mb-2 ${usernameAvailable ? 'text-green-500' : 'text-red-500'}`}>
            {usernameAvailable ? 'Username is available' : 'Username is taken'}
          </div>
        )}
        <input className="w-full mb-5 p-3 rounded-lg bg-white/10 text-premium border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#3b82f6] transition-premium" placeholder="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <div className="flex gap-2 justify-end">
          <Button onClick={() => setIsLogin(!isLogin)}>{isLogin ? 'Switch to Register' : 'Switch to Login'}</Button>
          <Button onClick={submit} disabled={!isLogin && !usernameAvailable}>{isLogin ? 'Login' : 'Register'}</Button>
        </div>
      </Card>
    </div>
  )
}
