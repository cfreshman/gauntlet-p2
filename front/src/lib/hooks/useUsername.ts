import { useUsernames } from './useUsernames'

export function useUsername(userId: string | undefined | null) {
  const { usernames } = useUsernames()
  return userId ? usernames[userId] || '' : ''
} 