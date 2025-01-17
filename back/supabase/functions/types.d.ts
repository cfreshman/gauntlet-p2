// Declare Deno types for URL imports
declare module 'https://esm.sh/*' {
  const content: any
  export = content
}

// Declare Deno namespace
declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined
  }
  export function serve(handler: (req: Request) => Promise<Response>): void
} 