import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function createDebouncer() {
  const pendingOperations = new Map<string, NodeJS.Timeout>()

  return {
    debounce: (key: string, operation: () => void, delay: number = 500) => {
      // Clear any pending operation for this key
      const pending = pendingOperations.get(key)
      if (pending) {
        clearTimeout(pending)
      }
      
      // Schedule new operation
      pendingOperations.set(key, setTimeout(() => {
        operation()
        pendingOperations.delete(key)
      }, delay))
    },
    
    clear: (key: string) => {
      const pending = pendingOperations.get(key)
      if (pending) {
        clearTimeout(pending)
        pendingOperations.delete(key)
      }
    },

    clearAll: () => {
      pendingOperations.forEach(timeout => clearTimeout(timeout))
      pendingOperations.clear()
    }
  }
} 