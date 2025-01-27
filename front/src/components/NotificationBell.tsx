import { Bell } from 'lucide-react'
import { useNotifications } from '../lib/hooks/useNotifications'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover'
import { Button } from './ui/button'
import { Link } from 'react-router-dom'
import { cn } from '../lib/utils'
import { useState } from 'react'

export function NotificationBell() {
  const { notifications, loading, markAsRead, markAllAsRead } = useNotifications()
  const unreadCount = notifications.filter(n => !n.read).length
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 hover:text-background relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 text-[10px] rounded-full bg-primary text-background flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 bg-header border-primary">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">notifications</h4>
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7"
                onClick={() => markAllAsRead()}
              >
                mark all read
              </Button>
            )}
          </div>
          
          {loading ? (
            <div className="text-sm text-primary/70">loading...</div>
          ) : notifications.length === 0 ? (
            <div className="text-sm text-primary/70">no notifications</div>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {notifications.map(notification => (
                <Link
                  key={notification.id}
                  to={notification.link || '#'}
                  className={cn(
                    'block p-2 rounded hover:bg-primary/10',
                    !notification.read && 'bg-primary/5 font-medium'
                  )}
                  onClick={() => {
                    markAsRead(notification.id)
                    setOpen(false)
                  }}
                >
                  <div className="text-sm">{notification.title}</div>
                  <div className="text-xs text-primary/70 mt-1">
                    {new Date(notification.created_at).toLocaleString()}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
} 