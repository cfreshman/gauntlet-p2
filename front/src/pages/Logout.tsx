import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/hooks/useAuth'

export function Logout() {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    async function logout() {
      await signOut()
      navigate('/login')
    }
    logout()
  }, [])

  return null
} 