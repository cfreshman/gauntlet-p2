import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

interface UserCache {
  [key: string]: string
}

export function useUsernames() {
  const [usernames, setUsernames] = useState<UserCache>({})
  const [loading, setLoading] = useState(false)

  async function fetchUsername(userId: string) {
    if (!userId) return
    if (usernames[userId]) return usernames[userId]

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .single()

      if (error) throw error

      setUsernames(prev => ({
        ...prev,
        [userId]: data.username
      }))

      return data.username
    } catch (error) {
      console.error('Error loading username:', error)
      return 'unknown'
    } finally {
      setLoading(false)
    }
  }

  // Subscribe to profile changes for cached users
  useEffect(() => {
    const userIds = Object.keys(usernames)
    if (userIds.length === 0) return

    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id.in.(${userIds.join(',')})`
        },
        (payload: any) => {
          if (payload.new?.id && payload.new?.username) {
            setUsernames(prev => ({
              ...prev,
              [payload.new.id]: payload.new.username
            }))
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [Object.keys(usernames).join(',')])

  return {
    usernames,
    fetchUsername,
    loading
  }
} 