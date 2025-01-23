# Project Files\n\n## Front-end\n

### front/src/App.tsx
```typescript
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './lib/hooks/useAuth';
import { ThemeProvider } from './lib/hooks/useTheme';
import { Header } from './components/Header';
import { Routes } from './Routes';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Header />
          <Routes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
```

### front/src/main.tsx
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

### front/src/env.d.ts
```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 
```

### front/src/components/SupabaseTest.tsx
```typescript
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function SupabaseTest() {
  const [status, setStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [envStatus, setEnvStatus] = useState<{url: boolean, key: boolean}>({
    url: false,
    key: false
  });

  useEffect(() => {
    // Check environment variables
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    setEnvStatus({
      url: !!supabaseUrl,
      key: !!supabaseKey
    });

    async function testConnection() {
      try {
        // Simple health check using auth
        const { error } = await supabase.auth.getSession();
        
        if (error) {
          throw new Error(`Supabase Error: ${error.message}`);
        }
        
        // If we get here, the connection is working (even with no session)
        setStatus('connected');
      } catch (err) {
        setStatus('error');
        const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
        setErrorMessage(errorMsg);
        console.error('Supabase connection error:', err);
      }
    }

    if (supabaseUrl && supabaseKey) {
      testConnection();
    } else {
      setStatus('error');
      setErrorMessage('Missing environment variables');
    }
  }, []);

  return (
    <div className="p-4 rounded-lg border">
      <h2 className="text-lg font-semibold mb-2">Supabase Connection Test</h2>
      
      <div className="mb-4">
        <h3 className="text-md font-medium mb-2">Environment Variables:</h3>
        <ul className="text-sm space-y-1">
          <li className={envStatus.url ? "text-green-600" : "text-red-600"}>
            VITE_SUPABASE_URL: {envStatus.url ? "✓ Present" : "✗ Missing"}
          </li>
          <li className={envStatus.key ? "text-green-600" : "text-red-600"}>
            VITE_SUPABASE_ANON_KEY: {envStatus.key ? "✓ Present" : "✗ Missing"}
          </li>
        </ul>
      </div>

      {status === 'loading' && (
        <p className="text-yellow-600">Testing connection...</p>
      )}
      {status === 'connected' && (
        <div>
          <p className="text-green-600">Successfully connected to Supabase!</p>
          <p className="text-sm text-gray-600 mt-1">Your connection is working properly.</p>
        </div>
      )}
      {status === 'error' && (
        <div>
          <p className="text-red-600">Failed to connect to Supabase</p>
          <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{errorMessage}</p>
        </div>
      )}
    </div>
  );
} 
```

### front/src/components/ui/tabs.tsx
```typescript
import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "../../lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-9 items-center justify-center rounded-lg bg-background p-1 text-primary",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-primary data-[state=active]:text-background data-[state=active]:shadow",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent } 
```

### front/src/components/ui/card.tsx
```typescript
import * as React from "react"
import { cn } from "../../lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border border-primary bg-background text-primary shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-primary/70", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } 
```

### front/src/components/ui/popover.tsx
```typescript
import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { cn } from "../../lib/utils"

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-72 rounded-md border bg-white p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent } 
```

### front/src/components/ui/label.tsx
```typescript
import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cn } from "../../lib/utils"

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      className
    )}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label } 
```

### front/src/components/ui/supabase-status.tsx
```typescript
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export function SupabaseStatus() {
  const [latency, setLatency] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function checkLatency() {
      try {
        const start = performance.now();
        const { error } = await supabase.auth.getSession();
        const end = performance.now();
        
        if (error) throw error;
        if (mounted) setLatency(Math.round(end - start));
      } catch (err) {
        if (mounted) setError('connection error');
      }
    }

    const interval = setInterval(checkLatency, 1000);
    checkLatency(); // Initial check

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="text-sm text-muted-foreground">
      {error ? (
        <span className="text-destructive">{error}</span>
      ) : (
        <span>latency: {latency}ms</span>
      )}
    </div>
  );
} 
```

### front/src/components/ui/switch.tsx
```typescript
import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { cn } from "../../lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-primary bg-background shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:border-primary",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-4 w-4 rounded-full bg-primary shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0 data-[state=checked]:bg-background"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch } 
```

### front/src/components/ui/command.tsx
```typescript
import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"
import { cn } from "../../lib/utils"

const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      "flex h-full w-full flex-col overflow-hidden rounded-md bg-background text-primary",
      className
    )}
    {...props}
  />
))
Command.displayName = CommandPrimitive.displayName

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div className="flex items-center border-b border-primary/20" cmdk-input-wrapper="">
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md bg-transparent px-3 py-3 text-sm outline-none text-primary placeholder:text-primary/50 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  </div>
))
CommandInput.displayName = CommandPrimitive.Input.displayName

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
    {...props}
  />
))
CommandList.displayName = CommandPrimitive.List.displayName

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className="py-6 text-center text-sm"
    {...props}
  />
))
CommandEmpty.displayName = CommandPrimitive.Empty.displayName

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      "overflow-hidden p-1 text-primary [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-primary/50",
      className
    )}
    {...props}
  />
))
CommandGroup.displayName = CommandPrimitive.Group.displayName

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none text-primary hover:bg-primary/10 hover:text-primary",
      className
    )}
    {...props}
  />
))
CommandItem.displayName = CommandPrimitive.Item.displayName

const CommandShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        "ml-auto text-xs tracking-widest text-primary/50",
        className
      )}
      {...props}
    />
  )
}
CommandShortcut.displayName = "CommandShortcut"

export {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} 
```

### front/src/components/ui/dialog.tsx
```typescript
import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "../../lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} 
```

### front/src/components/ui/button.tsx
```typescript
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-background shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-background shadow-sm hover:bg-destructive/90",
        outline:
          "border border-primary bg-background shadow-sm hover:bg-primary hover:text-background",
        secondary:
          "bg-background text-primary shadow-sm hover:bg-background/80",
        ghost: "hover:bg-primary hover:text-background",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants } 
```

### front/src/components/ui/dropdown-menu.tsx
```typescript
import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "../../lib/utils"

const DropdownMenu = DropdownMenuPrimitive.Root

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

const DropdownMenuGroup = DropdownMenuPrimitive.Group

const DropdownMenuPortal = DropdownMenuPrimitive.Portal

const DropdownMenuSub = DropdownMenuPrimitive.Sub

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </DropdownMenuPrimitive.SubTrigger>
))
DropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
DropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border border-primary bg-background text-primary shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
))
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm text-primary outline-none transition-colors hover:bg-primary/5 focus:bg-primary focus:text-background data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
))
DropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
))
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-primary/20", className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      {...props}
    />
  )
}
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} 
```

### front/src/components/ui/select.tsx
```typescript
import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown } from "lucide-react"

import { cn } from "../../lib/utils"

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-9 w-full items-center justify-between rounded-md border border-primary bg-background px-3 py-2 text-sm text-primary shadow-sm ring-offset-background placeholder:text-primary/50 focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50 hover:bg-primary/5",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 min-w-[8rem] overflow-hidden rounded-md border border-primary bg-background text-primary shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("px-2 py-1.5 text-sm font-semibold", className)}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-primary focus:text-background data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-primary/20", className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
} 
```

### front/src/components/ui/textarea.tsx
```typescript
import * as React from "react"
import { cn } from "../../lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex w-full rounded-md border border-primary bg-background px-3 py-2 text-sm shadow-sm transition-colors",
          "placeholder:text-primary/50",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea } 
```

### front/src/components/ui/input.tsx
```typescript
import * as React from "react"
import { cn } from "../../lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-primary bg-background px-3 py-1 text-sm shadow-sm transition-colors",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "placeholder:text-primary/50",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input } 
```

### front/src/components/settings/UnclaimedWorkers.tsx
```typescript
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/hooks/useAuth'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import type { Profile } from '../../lib/hooks/useAuth'

export function UnclaimedWorkers() {
  const { profile } = useAuth()
  const [workers, setWorkers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [teamId, setTeamId] = useState<string | null>(null)

  useEffect(() => {
    if (profile?.role === 'manager') {
      loadTeamAndWorkers()

      // Subscribe to team_members changes
      const channel = supabase
        .channel('unclaimed-workers')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'team_members'
          },
          () => {
            loadTeamAndWorkers()
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: 'role=eq.worker'
          },
          () => {
            loadTeamAndWorkers()
          }
        )
        .subscribe()

      return () => {
        channel.unsubscribe()
      }
    }
  }, [profile])

  async function loadTeamAndWorkers() {
    try {
      // Get manager's team first
      const { data: tm, error: teamError } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', profile?.id)
        .maybeSingle()

      if (teamError) throw teamError
      if (!tm) return // No team yet

      setTeamId(tm.team_id)
      console.log('Found team:', tm.team_id)

      // Get all workers
      const { data: allWorkers, error: workersError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'worker')

      if (workersError) throw workersError
      console.log('Found workers:', allWorkers)

      // Get all team members
      const { data: teamMembers, error: membersError } = await supabase
        .from('team_members')
        .select('user_id')

      if (membersError) throw membersError
      console.log('Found team members:', teamMembers)

      // Filter out workers who are already on teams
      const teamMemberIds = new Set(teamMembers.map(tm => tm.user_id))
      const unclaimedWorkers = allWorkers.filter(worker => !teamMemberIds.has(worker.id))
      console.log('Unclaimed workers:', unclaimedWorkers)

      setWorkers(unclaimedWorkers)
    } catch (error) {
      console.error('Error loading workers:', error)
      setError('failed to load workers')
    } finally {
      setLoading(false)
    }
  }

  async function assignWorker(workerId: string) {
    if (!teamId) return

    try {
      const { error } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: workerId
        })

      if (error) throw error
      loadTeamAndWorkers()
    } catch (error) {
      console.error('Error assigning worker:', error)
      setError('failed to assign worker')
    }
  }

  if (!profile || profile.role !== 'manager') return null
  if (loading) return (
    <div className="flex items-center justify-center h-32 text-primary/70">
      loading workers...
    </div>
  )
  if (!teamId) return null
  if (workers.length === 0) return null

  return (
    <Card>
      <CardContent className="space-y-4 pt-4">
        <h3 className="text-lg font-medium">unclaimed workers</h3>
        {error && (
          <div className="text-sm text-red-600">{error}</div>
        )}
        <div className="space-y-2">
          {workers.map(worker => (
            <div key={worker.id} className="flex items-center justify-between">
              <span className="text-sm">{worker.username}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => assignWorker(worker.id)}
              >
                add to team
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 
```

### front/src/components/settings/FieldManager.tsx
```typescript
import { useState } from 'react'
import { useFieldDefinitions } from '../../lib/hooks/useFieldDefinitions'
import { useAuth } from '../../lib/hooks/useAuth'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Switch } from '../../components/ui/switch'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu'

interface FieldManagerProps {
  teamId: string | null
}

export function FieldManager({ teamId }: FieldManagerProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState<'text' | 'number' | 'boolean' | 'date'>('text')
  const [required, setRequired] = useState(false)
  const [error, setError] = useState('')
  const { user } = useAuth()

  const {
    fields,
    teamFields,
    loading,
    error: fieldsError,
    createField,
    addFieldToTeam,
    removeFieldFromTeam,
    deleteField
  } = useFieldDefinitions(teamId || undefined)

  if (!teamId) return null
  if (loading) return (
    <div className="flex items-center justify-center h-32 text-primary/70">
      loading fields...
    </div>
  )
  if (fieldsError) return <div className="text-sm text-red-600">{fieldsError}</div>

  async function handleCreateField(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const field = await createField(name, type, required)
    if (field) {
      await addFieldToTeam(field.id)
      setName('')
      setType('text')
      setRequired(false)
    }
  }

  const availableFields = fields.filter(
    field => !teamFields.some(tf => tf.id === field.id)
  )

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">field definitions</h3>

      <form onSubmit={handleCreateField} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-primary/70">name</label>
          <Input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="enter field name"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-primary/70">type</label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                {type}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setType('text')}>text</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setType('number')}>number</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setType('boolean')}>boolean</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setType('date')}>date</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={required}
            onCheckedChange={setRequired}
          />
          <label className="text-sm text-primary/70">required</label>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={!name}>
          create field
        </Button>
      </form>

      {teamFields.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">team fields</h4>
          {teamFields.map(field => (
            <div key={field.id} className="flex items-center justify-between">
              <div>
                <div className="font-medium">{field.name}</div>
                <div className="text-sm text-primary/70">
                  {field.type} {field.required && '(required)'}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFieldFromTeam(field.id)}
                >
                  remove
                </Button>
                {field.owner_id === user?.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteField(field.id)}
                  >
                    delete
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {availableFields.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">available fields</h4>
          {availableFields.map(field => (
            <div key={field.id} className="flex items-center justify-between">
              <div>
                <div className="font-medium">{field.name}</div>
                <div className="text-sm text-primary/70">
                  {field.type} {field.required && '(required)'}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => addFieldToTeam(field.id)}
                >
                  add
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 
```

### front/src/components/settings/TeamMembers.tsx
```typescript
import { useState } from 'react'
import { useAuth } from '../../lib/hooks/useAuth'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent } from '../ui/card'
import { useUsernames } from '../../lib/hooks/useUsernames'
import { PendingInvites } from './PendingInvites'
import { useTeamManagement } from '../../lib/hooks/useTeamManagement'
import { supabase } from '../../lib/supabase'

export default function TeamMembers() {
  const { profile } = useAuth()
  const { usernames } = useUsernames()
  const { members, team, loading, error, unassignWorker } = useTeamManagement(profile?.id)
  const [editingName, setEditingName] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [roleLoading, setRoleLoading] = useState<string | null>(null)

  async function renameTeam() {
    if (!team?.id || !newTeamName) return

    try {
      const { error } = await supabase
        .from('teams')
        .update({ name: newTeamName })
        .eq('id', team.id)

      if (error) throw error

      setEditingName(false)
    } catch (error) {
      console.error('Error renaming team:', error)
    }
  }

  async function promoteToManager(userId: string) {
    if (!profile || profile.role !== 'manager') return
    setRoleLoading(userId)

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-profile`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify({ id: userId, role: 'manager' })
        }
      )

      const data = await response.json()
      
      if (data.error) {
        throw data.error
      }

      // Refresh the workers list
      window.location.reload()
    } catch (error) {
      console.error('Error promoting to manager:', error)
    } finally {
      setRoleLoading(null)
    }
  }

  if (!profile || (profile.role !== 'manager' && profile.role !== 'worker')) return null
  if (loading) return (
    <div className="flex items-center justify-center h-32 text-primary/70">
      loading workers...
    </div>
  )
  if (!team) return profile.role === 'manager' ? <div>create a team to manage workers</div> : null

  const workers = members.filter(m => m.role === 'worker')

  return (
    <Card>
      <CardContent className="space-y-6 pt-4">
        {error && (
          <div className="text-sm text-red-600">{error}</div>
        )}

        <div>
          <div className="flex items-center justify-between mb-4">
            {profile.role === 'manager' && editingName ? (
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder={team?.name}
                  className="w-48"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={renameTeam}
                  disabled={!newTeamName}
                >
                  save
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingName(false)
                    setNewTeamName('')
                  }}
                >
                  cancel
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-medium">
                  {team?.name || 'team members'}
                </h3>
                {profile.role === 'manager' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingName(true)
                      setNewTeamName(team?.name || '')
                    }}
                  >
                    rename
                  </Button>
                )}
              </div>
            )}
          </div>

          {workers.length === 0 ? (
            <p className="text-sm text-primary/70">no workers on your team</p>
          ) : (
            <div className="space-y-2">
              {workers.map(worker => (
                <div key={worker.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{usernames[worker.id] || worker.username}</span>
                    <span className="text-xs text-primary/70">({worker.role})</span>
                  </div>
                  {profile.role === 'manager' && worker.role === 'worker' && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => promoteToManager(worker.id)}
                        disabled={roleLoading === worker.id}
                      >
                        {roleLoading === worker.id ? 'promoting...' : 'promote to manager'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => unassignWorker(worker.id)}
                      >
                        remove from team
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {profile.role === 'manager' && <PendingInvites />}
      </CardContent>
    </Card>
  )
} 
```

### front/src/components/settings/PendingInvites.tsx
```typescript
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/hooks/useAuth'
import { Button } from '../ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'

interface TeamInvite {
  id: string
  role: 'worker' | 'manager'
  status: 'pending' | 'accepted' | 'expired'
  team_id: string
  invited_by: string
  created_at: string
  magic_link?: string
}

export function PendingInvites() {
  const { profile } = useAuth()
  const [invites, setInvites] = useState<TeamInvite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inviteRole, setInviteRole] = useState<'worker' | 'manager'>('worker')
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null)
  const [teamMember, setTeamMember] = useState<{ team_id: string } | null>(null)

  useEffect(() => {
    if (profile) {
      loadInvites()

      // Subscribe to team_invites changes
      const channel = supabase
        .channel('pending-invites')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'team_invites'
          },
          () => {
            loadInvites()
          }
        )
        .subscribe()

      return () => {
        channel.unsubscribe()
      }
    }
  }, [profile])

  async function loadInvites() {
    if (!profile) return

    try {
      // Get manager's team first
      const { data: tm, error: teamError } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', profile.id)
        .maybeSingle()

      if (teamError) {
        console.error('Error loading team:', teamError)
        setError('failed to load team')
        return
      }

      setTeamMember(tm)

      // Load invites for team if exists
      if (tm) {
        const { data, error } = await supabase
          .from('team_invites')
          .select('*')
          .eq('team_id', tm.team_id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })

        if (error) throw error

        const invitesWithLinks = data.map(invite => ({
          ...invite,
          magic_link: `${window.location.origin}/signup?invite=${invite.id}`
        }))

        setInvites(invitesWithLinks)
      } else {
        setInvites([])
      }
    } catch (error) {
      console.error('Error loading invites:', error)
      setError('failed to load invites')
    } finally {
      setLoading(false)
    }
  }

  async function createInvite() {
    if (!profile || !teamMember) return
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-team-member`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify({ 
            role: inviteRole,
            team_id: teamMember.team_id
          })
        }
      )

      const data = await response.json()
      
      if (data.error) throw data.error

      const signupUrl = `${window.location.origin}/signup?invite=${data.invite_id}`
      
      navigator.clipboard.writeText(signupUrl)
      setCopiedInviteId(data.invite_id)
      setTimeout(() => setCopiedInviteId(null), 2000)

      await loadInvites()
    } catch (error) {
      console.error('Error creating invite:', error)
      setError('failed to create invite')
    }
  }

  const copyInviteLink = (inviteId: string, link: string) => {
    navigator.clipboard.writeText(link)
    setCopiedInviteId(inviteId)
    setTimeout(() => setCopiedInviteId(null), 2000)
  }

  if (!profile || profile.role !== 'manager') return null
  if (loading) return (
    <div className="flex items-center justify-center h-32 text-primary/70">
      loading invites...
    </div>
  )
  if (!teamMember) return <div>create a team to manage invites</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Select value={inviteRole} onValueChange={(value: 'worker' | 'manager') => setInviteRole(value)}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="worker">worker</SelectItem>
            <SelectItem value="manager">manager</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={createInvite}>
          create invite
        </Button>
      </div>

      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}

      {invites.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-lg font-medium">pending invites</h3>
          {invites.map(invite => (
            <div key={invite.id} className="flex items-center justify-between">
              <div className="text-sm">
                {invite.role}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => invite.magic_link && copyInviteLink(invite.id, invite.magic_link)}
              >
                {copiedInviteId === invite.id ? 'copied!' : 'copy invite link'}
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-primary/70">no pending invites</div>
      )}
    </div>
  )
} 
```

### front/src/components/settings/SkillManager.tsx
```typescript
import { useState } from 'react'
import { useAuth } from '../../lib/hooks/useAuth'
import { useSkills } from '../../lib/hooks/useSkills'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from '../ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { supabase } from '../../lib/supabase'

interface SkillManagerProps {
  teamId?: string | null  // Made optional since it's not used
}

export function SkillManager(_props: SkillManagerProps) {  // Prefix with _ to indicate unused
  const [name, setName] = useState('')
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const { user, profile } = useAuth()
  const { skills, userSkills, loading, refresh } = useSkills(user?.id)  // Removed unused skillsError

  // Filter skills based on search
  const filteredSkills = skills.filter(skill => 
    skill.name.toLowerCase().includes(search.toLowerCase()) &&
    !userSkills.has(skill.id)
  )

  async function handleCreateSkill(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    try {
      const { error: skillError } = await supabase  // Removed unused skill variable
        .from('skills')
        .insert({ name })
        .select()
        .single()

      if (skillError) throw skillError

      setName('')
      refresh()
    } catch (err) {
      console.error('Error creating skill:', err)
      setError('failed to create skill')
    }
  }

  async function handleDeleteSkill(skillId: string) {
    try {
      const { error: deleteError } = await supabase
        .from('user_skills')
        .delete()
        .eq('user_id', user?.id)
        .eq('skill_id', skillId)

      if (deleteError) throw deleteError
      refresh()
    } catch (err) {
      console.error('Error removing skill:', err)
      setError('failed to remove skill')
    }
  }

  async function handleSelectSkill(skillId: string) {
    if (!user) return

    try {
      const { error } = await supabase
        .from('user_skills')
        .insert({
          user_id: user.id,
          skill_id: skillId
        })

      if (error) throw error
      setOpen(false)
      refresh()
    } catch (err) {
      console.error('Error adding skill:', err)
      setError('failed to add skill')
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-32 text-primary/70">
      loading skills...
    </div>
  )

  const enabledSkills = skills.filter(skill => userSkills.has(skill.id))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">skills</h3>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              add skill
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-[200px]" side="bottom" align="end">
            <Command className="w-full">
              <CommandInput 
                placeholder="search skills..." 
                value={search}
                onValueChange={setSearch}
                className="w-full"
              />
              <CommandEmpty>no skills found</CommandEmpty>
              <CommandGroup>
                {filteredSkills.map(skill => (
                  <CommandItem
                    key={skill.id}
                    value={skill.name}
                    onSelect={() => handleSelectSkill(skill.id)}
                  >
                    {skill.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      
      {profile?.role === 'manager' && (
        <form onSubmit={handleCreateSkill} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-primary/70">name</label>
            <Input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="enter skill name"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" disabled={!name}>
            create skill
          </Button>
        </form>
      )}

      {enabledSkills.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {enabledSkills.map(skill => (
            <div 
              key={skill.id} 
              className="group flex items-center gap-1 px-2 py-1 bg-background border border-primary/20 rounded-full text-sm"
            >
              <span>{skill.name}</span>
              <button
                onClick={() => handleDeleteSkill(skill.id)}
                className="opacity-50 hover:opacity-100"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-primary/50">no skills set</div>
      )}
    </div>
  )
} 
```

### front/src/components/tickets/CustomFields.tsx
```typescript
import { CustomField, CustomFieldType } from './CustomField'

interface CustomFieldsProps {
  fields: CustomFieldType[]
  values: Record<string, string>
  onChange: (id: string, value: string) => void
  readOnly?: boolean
  errors?: Record<string, string>
  className?: string
}

export function CustomFields({ 
  fields, 
  values, 
  onChange,
  readOnly = false,
  errors = {},
  className 
}: CustomFieldsProps) {
  return (
    <div className={className}>
      {fields.map(field => (
        <CustomField
          key={field.id}
          field={field}
          value={values[field.id] || ''}
          onChange={value => onChange(field.id, value)}
          readOnly={readOnly}
          error={errors[field.id]}
          className="mb-4 last:mb-0"
        />
      ))}
    </div>
  )
} 
```

### front/src/components/tickets/TicketCreate.tsx
```typescript
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../../lib/hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { CustomFields } from './CustomFields'
import { useCustomFields } from '../../lib/hooks/useCustomFields'
import { Textarea } from '../ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/select'
import { Label } from '../../components/ui/label'

type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'

interface TemplateData {
  title: string
  description: string
  priority: TicketPriority
  ticket_tag_links?: Array<{
    tag: {
      id: string
      name: string
    }
  }>
}

export function TicketCreate() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const templateId = searchParams.get('template')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [priority, setPriority] = useState<TicketPriority>('medium')
  const { user } = useAuth()
  const { fields, values, updateValue, validateFields, fieldErrors } = useCustomFields(templateId || undefined)
  const [template, setTemplate] = useState<TemplateData | null>(null)

  useEffect(() => {
    if (templateId) {
      loadTemplate()
    }
  }, [templateId])

  useEffect(() => {
    if (template?.priority) {
      setPriority(template.priority)
    }
  }, [template])

  async function loadTemplate() {
    try {
      const { data, error } = await supabase.functions.invoke('get-template', {
        body: { id: templateId }
      })

      if (error) throw error
      if (data) {
        // Remove template: prefix from title when using as template
        setTemplate({
          title: data.title.slice(9).trim(),
          description: data.description || '',
          priority: data.priority || 'medium',
          ticket_tag_links: data.ticket_tag_links
        })
      }
    } catch (e) {
      console.error('Error loading template:', e)
      setError('failed to load template')
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!user) return // Early return if no user
    
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const data = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      priority,
      created_by: user.id,
      field_values: values,
      tags: template?.ticket_tag_links?.map(link => link.tag.id) || []
    }

    // Validate required fields
    if (!validateFields()) {
      setError('please fill in all required fields')
      setLoading(false)
      return
    }

    try {
      const { data: response, error } = await supabase.functions.invoke('create-ticket', {
        body: data
      })

      if (error) {
        console.error('Error creating ticket:', error)
        throw error
      }

      if (!response?.ticket) {
        throw new Error('no ticket returned')
      }

      navigate('/tickets')
    } catch (e) {
      console.error('Error creating ticket:', e)
      setError('failed to create ticket')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-2">create ticket</h1>
      
      <form onSubmit={handleSubmit} className="space-y-2">
        <div>
          <label htmlFor="title" className="block text-sm mb-1">
            title
          </label>
          <Input
            type="text"
            id="title"
            name="title"
            required
            defaultValue={template?.title}
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm mb-1">
            description
          </label>
          <Textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={template?.description}
          />
        </div>

        <div>
          <label htmlFor="priority" className="block text-sm mb-1">
            priority
          </label>
          <Select
            name="priority"
            value={priority}
            onValueChange={(value) => setPriority(value as TicketPriority)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">low</SelectItem>
              <SelectItem value="medium">medium</SelectItem>
              <SelectItem value="high">high</SelectItem>
              <SelectItem value="urgent">urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {template?.ticket_tag_links && template.ticket_tag_links.length > 0 && (
          <div>
            <label className="block text-sm mb-1">
              tags
            </label>
            <div className="flex flex-wrap gap-2">
              {template.ticket_tag_links.map(link => (
                <div 
                  key={link.tag.id}
                  className="px-2 py-1 border border-primary/20 rounded-full text-sm text-primary/70"
                >
                  {link.tag.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {fields && fields.length > 0 && (
          <div>
            <Label className="text-sm text-primary/70">additional fields</Label>
            <div className="mt-2">
              <CustomFields
                fields={fields}
                values={values}
                onChange={updateValue}
                errors={fieldErrors}
                className="space-y-4"
              />
            </div>
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600">{error}</div>
        )}

        <Button 
          type="submit"
          disabled={loading}
          className="w-full"
        >
          {loading ? 'creating...' : 'create ticket'}
        </Button>
      </form>
    </div>
  )
}
```

### front/src/components/tickets/TicketList.tsx
```typescript
import { useEffect, useState, useMemo } from 'react'
import { Link, useSearchParams, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Ticket } from '../../lib/types'
import { useAuth } from '../../lib/hooks/useAuth'
import { Button } from '../ui/button'
import { useUsernames } from '../../lib/hooks/useUsernames'
import { useTeams } from '../../lib/hooks/useTeams'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { useTags } from '../../lib/hooks/useTags'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '../ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { ChevronsUpDown } from 'lucide-react'

interface TicketWithProfile extends Ticket {
  assigned_to: string | null
  created_by: string
  team_id: string | null
  feedback: {
    rating: number
  }[] | null
  ticket_tag_links: {
    ticket_tags: {
      id: string
      name: string
    }
  }[] | null
}

type SortField = 'created_at' | 'priority' | 'status'
type SortOrder = 'asc' | 'desc'
type AssignedFilter = 'any' | 'unassigned' | 'my-team' | 'me'

const FILTER_STORAGE_KEY = 'ticket-filters'

// Add status and priority order maps
const STATUS_ORDER = {
  new: 0,
  open: 1,
  pending: 2,
  resolved: 3,
  closed: 4
} as const

const PRIORITY_ORDER = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3
} as const

export function TicketList() {
  const { profile, user } = useAuth()
  const { usernames, fetchUsername } = useUsernames()
  const { teams } = useTeams()
  const { tags } = useTags()
  const [tickets, setTickets] = useState<TicketWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()
  const [ready, setReady] = useState(false)
  const location = useLocation()
  const [usedTags, setUsedTags] = useState<{id: string, name: string}[]>([])
  const [tagSearchOpen, setTagSearchOpen] = useState(false)
  const [tagSearch, setTagSearch] = useState('')

  // Restore filters from storage if URL is empty
  useEffect(() => {
    if (location.search === '') {
      // Set role-specific defaults if no stored filters
      const storedFilters = localStorage.getItem(FILTER_STORAGE_KEY)
      if (storedFilters && profile?.role !== 'customer') {
        setSearchParams(new URLSearchParams(storedFilters))
      } else if (profile?.role === 'worker') {
        // Workers default: active tickets assigned to me, sorted by priority
        setSearchParams(new URLSearchParams({
          assigned: 'me',
          status: 'active',
          sort: 'priority',
          order: 'asc',
          view: 'tickets'
        }))
      } else if (profile?.role === 'manager') {
        // Managers default: show unassigned and new tickets first, sorted by priority
        setSearchParams(new URLSearchParams({
          status: 'active',
          assigned: 'unassigned',
          sort: 'priority',
          order: 'asc',
          view: 'tickets'
        }))
      }
      // Customers have no URL params - they see all their tickets sorted by date
    }
    setReady(true)
  }, [profile?.role, user?.id]) // Run when role/user changes

  // Let customers use URL params like everyone else
  const viewMode = searchParams.get('view') || 'tickets'
  const statusFilter = searchParams.get('status') || 'all'
  const priorityFilter = searchParams.get('priority') || 'all'
  const sortField = (searchParams.get('sort') as SortField) || 'created_at'
  const sortOrder = (searchParams.get('order') as SortOrder) || 'desc'
  const assignedFilter = (searchParams.get('assigned') as AssignedFilter) || 'any'
  const assignedId = searchParams.get('assigned_id')
  const closedAfter = searchParams.get('closed_after') || null
  const teamId = searchParams.get('team_id')
  const tagFilter = searchParams.get('tag') || 'all'

  // Update URL params helper
  const updateParams = (updates: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) {
        newParams.delete(key)
      } else {
        newParams.set(key, value)
      }
    })
    setSearchParams(newParams)
    // Store the filter configuration
    localStorage.setItem(FILTER_STORAGE_KEY, newParams.toString())
  }

  // Load usernames when tickets change
  useEffect(() => {
    const userIds = new Set<string>()
    tickets.forEach(ticket => {
      userIds.add(ticket.created_by)
      if (ticket.assigned_to) userIds.add(ticket.assigned_to)
    })

    userIds.forEach(userId => {
      fetchUsername(userId)
    })
  }, [tickets])

  // Load tickets when filters change
  useEffect(() => {
    if (!ready) return
    loadTickets()

    // Subscribe to changes
    const channel = supabase
      .channel('tickets')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets'
        },
        () => {
          // Reload all tickets when any change occurs
          loadTickets()
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [searchParams, ready]) // Only load when ready and params change

  // Add effect to load used tags
  useEffect(() => {
    async function loadUsedTags() {
      const { data } = await supabase
        .from('ticket_tag_links')
        .select(`
          ticket_tags (
            id,
            name
          )
        `)
        .order('ticket_tags(name)')
      
      // Deduplicate tags
      const uniqueTags = new Map()
      data?.forEach(item => {
        const tag = item.ticket_tags
        uniqueTags.set(tag.id, tag)
      })
      setUsedTags(Array.from(uniqueTags.values()))
    }
    loadUsedTags()
  }, [])

  // Filter tags based on search
  const filteredTags = useMemo(() => {
    const searchLower = tagSearch.toLowerCase()
    return usedTags.filter(t => t.name.toLowerCase().includes(searchLower))
  }, [usedTags, tagSearch])

  async function loadTickets() {
    try {
      setLoading(true)
      setError('')

      let query = supabase
        .from('tickets')
        .select(`
          *,
          feedback:ticket_feedback (
            rating
          ),
          ticket_tag_links!${tagFilter !== 'all' ? 'inner' : 'left'} (
            ticket_tags (
              id,
              name
            )
          )
        `)

      // Show either templates or regular tickets
      if (profile?.role !== 'customer') {
        if (viewMode === 'templates') {
          query = query.like('title', 'template:%')
        } else {
          query = query.not('title', 'like', 'template:%')
        }
      } else {
        // Customers never see templates
        query = query.not('title', 'like', 'template:%')
      }

      // Apply filters
      if (statusFilter === 'active') {
        query = query.neq('status', 'closed')
      } else if (statusFilter === 'unresolved') {
        query = query.not('status', 'in', '(resolved,closed)')
      } else if (statusFilter === 'closed' && closedAfter === '7d') {
        // Get date 7 days ago
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        query = query
          .eq('status', 'closed')
          .gte('updated_at', sevenDaysAgo.toISOString())
      } else if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }
      if (priorityFilter !== 'all') {
        query = query.eq('priority', priorityFilter)
      }

      // Handle team_id filter
      if (teamId) {
        query = query.eq('team_id', teamId)
      }

      // Handle assignment filter
      if (assignedId) {
        query = query.eq('assigned_to', assignedId)
      } else if (assignedFilter === 'unassigned') {
        query = query.is('assigned_to', null)
      } else if (assignedFilter === 'me' && user) {
        query = query.eq('assigned_to', user.id)
      } else if (assignedFilter === 'my-team' && user) {
        // Get user's team first
        const { data: teamData } = await supabase
          .from('team_members')
          .select('team_id')
          .eq('user_id', user.id)
          .single()

        if (teamData?.team_id) {
          query = query.eq('team_id', teamData.team_id)
        }
      }
      // 'any' shows all tickets (no filter)

      // Apply tag filter
      if (tagFilter !== 'all') {
        query = query
          .eq('ticket_tag_links.tag_id', tagFilter)
      }

      // Apply sorting
      if (sortField === 'status') {
        // Get all tickets and sort in memory for status
        query = query.order('created_at', { ascending: false })
        const { data, error } = await query
        if (error) throw error
        
        const sortedData = [...data].sort((a, b) => {
          const aOrder = STATUS_ORDER[a.status as keyof typeof STATUS_ORDER]
          const bOrder = STATUS_ORDER[b.status as keyof typeof STATUS_ORDER]
          return sortOrder === 'asc' ? aOrder - bOrder : bOrder - aOrder
        })
        setTickets(sortedData)
      } else if (sortField === 'priority') {
        // Get all tickets and sort in memory for priority
        query = query.order('created_at', { ascending: false })
        const { data, error } = await query
        if (error) throw error
        
        const sortedData = [...data].sort((a, b) => {
          const aOrder = PRIORITY_ORDER[a.priority as keyof typeof PRIORITY_ORDER]
          const bOrder = PRIORITY_ORDER[b.priority as keyof typeof PRIORITY_ORDER]
          return sortOrder === 'asc' ? aOrder - bOrder : bOrder - aOrder
        })
        setTickets(sortedData)
      } else {
        // For created_at, use database sorting
        query = query.order(sortField, { ascending: sortOrder === 'asc' })
        const { data, error } = await query
        if (error) throw error
        setTickets(data)
      }
    } catch (e) {
      console.error('Error loading tickets:', e)
      setError('Failed to load tickets')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-center h-32 text-primary/70">
        loading tickets...
      </div>
    </div>
  )
  if (error) return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-center h-32 text-red-500">
        {error}
      </div>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-primary">
            {profile?.role === 'customer' && (statusFilter !== 'all' || (searchParams.toString() !== '' && searchParams.toString() !== 'view=tickets'))
              ? 'filtered tickets'
              : viewMode === 'templates' ? 'templates' : 'tickets'}
          </h1>
          {profile?.role !== 'customer' && (
            <>
              {assignedId ? (
                <span className="text-2xl text-primary/90">
                  assigned to {usernames[assignedId] || 'loading...'}
                </span>
              ) : teamId ? (
                <span className="text-2xl text-primary/90">
                  assigned to {teams?.find(t => t.id === teamId)?.name || 'loading...'} team
                </span>
              ) : (
                <>
                  {assignedFilter === 'me' && (
                    <span className="text-2xl text-primary/90">
                      my tickets
                    </span>
                  )}
                  {assignedFilter === 'my-team' && (
                    <span className="text-2xl text-primary/90">
                      team tickets
                    </span>
                  )}
                  {assignedFilter === 'unassigned' && (
                    <span className="text-2xl text-primary/90">unassigned</span>
                  )}
                </>
              )}
            </>
          )}
        </div>
        <div className="flex gap-2">
          {profile?.role !== 'customer' && (
            <Link to={`/tickets?${new URLSearchParams({
              ...Object.fromEntries(searchParams),
              view: viewMode === 'templates' ? 'tickets' : 'templates'
            })}`}>
              <Button variant="outline">
                view {viewMode === 'templates' ? 'tickets' : 'templates'}
              </Button>
            </Link>
          )}
          <Link to="/tickets/new">
            <Button>new ticket</Button>
          </Link>
        </div>
      </div>

      {profile?.role !== 'customer' && (
        <div className="flex gap-4 mb-4">
          <div>
            <label className="block text-sm text-primary/70 mb-1">status</label>
            <Select 
              value={statusFilter} 
              onValueChange={(value) => updateParams({ status: value === 'all' ? null : value })}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">all</SelectItem>
                <SelectItem value="active">active</SelectItem>
                <SelectItem value="unresolved">unresolved</SelectItem>
                <SelectItem value="new">new</SelectItem>
                <SelectItem value="open">open</SelectItem>
                <SelectItem value="pending">pending</SelectItem>
                <SelectItem value="resolved">resolved</SelectItem>
                <SelectItem value="closed">closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm text-primary/70 mb-1">priority</label>
            <Select 
              value={priorityFilter} 
              onValueChange={(value) => updateParams({ priority: value === 'all' ? null : value })}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">all</SelectItem>
                <SelectItem value="low">low</SelectItem>
                <SelectItem value="medium">medium</SelectItem>
                <SelectItem value="high">high</SelectItem>
                <SelectItem value="urgent">urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm text-primary/70 mb-1">tag</label>
            <Popover open={tagSearchOpen} onOpenChange={setTagSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={tagSearchOpen}
                  className="w-[120px] justify-between"
                >
                  {tagFilter === 'all' 
                    ? 'all'
                    : usedTags.find(t => t.id === tagFilter)?.name || 'select...'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0" align="start">
                <Command>
                  <CommandInput 
                    placeholder="search tags..." 
                    value={tagSearch}
                    onValueChange={setTagSearch}
                  />
                  <CommandEmpty>no tags found</CommandEmpty>
                  <CommandGroup className="max-h-[200px] overflow-y-auto">
                    <CommandItem
                      value="all"
                      onSelect={() => {
                        updateParams({ tag: null })
                        setTagSearchOpen(false)
                        setTagSearch('')
                      }}
                    >
                      all
                    </CommandItem>
                    {filteredTags.map(tag => (
                      <CommandItem
                        key={tag.id}
                        value={tag.name}
                        onSelect={() => {
                          updateParams({ tag: tag.id })
                          setTagSearchOpen(false)
                          setTagSearch('')
                        }}
                      >
                        {tag.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className="block text-sm text-primary/70 mb-1">sort by</label>
            <Select 
              value={sortField} 
              onValueChange={(value) => updateParams({ sort: value })}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">created</SelectItem>
                <SelectItem value="priority">priority</SelectItem>
                <SelectItem value="status">status</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm text-primary/70 mb-1">order</label>
            <Select 
              value={sortOrder} 
              onValueChange={(value) => updateParams({ order: value })}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">ascending</SelectItem>
                <SelectItem value="desc">descending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm text-primary/70 mb-1">assigned to</label>
            <Select
              value={assignedId || teamId || assignedFilter}
              onValueChange={(value) => {
                const params = new URLSearchParams(searchParams)
                
                // Clear both assigned_id and team_id when selecting standard options
                if (['any', 'unassigned', 'my-team', 'me'].includes(value)) {
                  params.delete('assigned_id')
                  params.delete('team_id') 
                  params.set('assigned', value)
                }
                // Clear the other param when setting one
                else if (value === assignedId) {
                  params.delete('assigned_id')
                  params.delete('assigned')
                }
                else if (value === teamId) {
                  params.delete('team_id')
                  params.delete('assigned') 
                }
                setSearchParams(params)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="assigned to..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">any</SelectItem>
                <SelectItem value="unassigned">unassigned</SelectItem>
                <SelectItem value="my-team">my team</SelectItem>
                <SelectItem value="me">just me</SelectItem>
                {assignedId && usernames[assignedId] && (
                  <SelectItem value={assignedId}>{usernames[assignedId]}</SelectItem>
                )}
                {teamId && teams?.find(t => t.id === teamId)?.name && (
                  <SelectItem value={teamId}>{teams.find(t => t.id === teamId)?.name} team</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div className="bg-background border border-primary shadow rounded-lg overflow-hidden">
        <div className="divide-y divide-primary/20">
          {tickets.length > 0 ? (
            tickets.map(ticket => (
              <div key={ticket.id} className="hover:bg-primary/5 p-4">
                <Link 
                  to={`/tickets/${ticket.id}`}
                  className="block"
                >
                  <div className="text-lg font-medium text-primary hover:text-primary/90 mb-1">
                    {ticket.title}
                  </div>
                  <div className="text-sm text-primary/70 flex gap-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      ticket.status === 'new' ? 'bg-blue-500/10 text-blue-500' :
                      ticket.status === 'open' ? 'bg-green-500/10 text-green-500' :
                      ticket.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                      ticket.status === 'resolved' ? 'bg-purple-500/10 text-purple-500' :
                      'bg-primary/10 text-primary'
                    }`}>{ticket.status}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      ticket.priority === 'urgent' ? 'bg-red-500/10 text-red-500' :
                      ticket.priority === 'high' ? 'bg-orange-500/10 text-orange-500' :
                      ticket.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-500' :
                      'bg-green-500/10 text-green-500'
                    }`}>{ticket.priority}</span>
                    <span>by {usernames[ticket.created_by] || 'unknown'}</span>
                    <span>
                      {ticket.assigned_to ? (
                        <>
                          assigned to{' '}
                          <Link 
                            to={`/tickets?assigned_id=${ticket.assigned_to}`}
                            className="hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {usernames[ticket.assigned_to] || 'unknown'}
                          </Link>
                          {ticket.team_id && teams?.find(t => t.id === ticket.team_id)?.name && (
                            <>, {' '}
                              <Link
                                to={`/tickets?team_id=${ticket.team_id}`}
                                className="hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {teams.find(t => t.id === ticket.team_id)?.name}
                              </Link>
                            </>
                          )}
                        </>
                      ) : 'unassigned'}
                    </span>
                    <span>{new Date(ticket.created_at).toLocaleString()}</span>
                    {ticket.feedback?.[0] && (
                      <span className="text-primary">
                        {ticket.feedback[0].rating} ★
                      </span>
                    )}
                    {ticket.ticket_tag_links?.slice(0, 3).map(link => (
                      <Link
                        key={link.ticket_tags.id}
                        to={`/tickets?tag=${link.ticket_tags.id}`}
                        className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {link.ticket_tags.name}
                      </Link>
                    ))}
                    {ticket.ticket_tag_links && ticket.ticket_tag_links.length > 3 && (
                      <span className="text-xs text-primary/70">
                        +{ticket.ticket_tag_links.length - 3} more
                      </span>
                    )}
                  </div>
                </Link>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-primary/70">
              no tickets found
              {(statusFilter !== 'all' || priorityFilter !== 'all' || assignedFilter || tagFilter !== 'all') && (
                <div className="mt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      updateParams({
                        status: null,
                        priority: null,
                        assigned: null,
                        tag: null
                      })
                    }}
                  >
                    clear filters
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 
```

### front/src/components/tickets/TicketDetail.tsx
```typescript
import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Ticket, TicketStatus, TicketPriority } from '../../lib/types'
import { useAuth } from '../../lib/hooks/useAuth'
import { Button } from '../ui/button'
import { useUsernames } from '../../lib/hooks/useUsernames'
import { useTeamAssignment } from '../../lib/hooks/useTeamAssignment'
import { useCustomFields } from '../../lib/hooks/useCustomFields'
import { useFieldDefinitions } from '../../lib/hooks/useFieldDefinitions'
import { CustomField } from './CustomField'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Textarea } from '../ui/textarea'
import { createDebouncer } from '../../lib/utils'
import { useTags } from '../../lib/hooks/useTags'
import { useTicketTags } from '../../lib/hooks/useTicketTags'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '../ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { ChevronsUpDown, TrashIcon, Star } from 'lucide-react'
import { Switch } from '../ui/switch'
import { Label } from '../ui/label'

interface Comment {
  id: string
  content: string
  created_at: string
  created_by: string
  internal: boolean
}

interface TicketFeedback {
  id: string
  rating: number
  comment: string | null
  created_at: string
  created_by: string
}

interface TicketWithProfile extends Ticket {
  assigned_to: string | null
  created_by: string
  team_id: string | null
  profiles: {
    username: string
  }
}

export function TicketDetail() {
  const { id } = useParams()
  const { user, profile } = useAuth()
  const { usernames, fetchUsername } = useUsernames()
  const [ticket, setTicket] = useState<TicketWithProfile | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [feedback, setFeedback] = useState<TicketFeedback | null>(null)
  const [newComment, setNewComment] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingTicket, setUpdatingTicket] = useState(false)
  const [updatingComment, setUpdatingComment] = useState(false)
  const { getAssignableMembers } = useTeamAssignment(profile?.id)
  const { fields, values, updateValue, loadFields } = useCustomFields(id)
  const { fields: allFields } = useFieldDefinitions()
  const [addingField, setAddingField] = useState(false)
  const [selectedFieldId, setSelectedFieldId] = useState('')
  const saveDebouncer = createDebouncer()
  const { tags, createTag } = useTags()
  const { ticketTags, addTag, removeTag } = useTicketTags(id)
  const [tagSearchOpen, setTagSearchOpen] = useState(false)
  const [tagSearch, setTagSearch] = useState('')
  const [newFeedback, setNewFeedback] = useState({
    rating: 5,
    comment: ''
  })

  const isTemplate = ticket?.title.startsWith('template: ')
  const isManager = profile?.role === 'manager'
  const isManagerOrWorker = profile?.role === 'manager' || profile?.role === 'worker'
  const canLeaveFeedback = profile?.role === 'customer' && 
    ticket?.created_by === user?.id && 
    (ticket?.status === 'resolved' || ticket?.status === 'closed')

  // Add state to track if we're editing
  const [isEditing, setIsEditing] = useState(false)

  const filteredTags = useMemo(() => {
    const searchLower = tagSearch.toLowerCase()
    const filtered = tags
      .filter(t => !ticketTags.find(tt => tt.id === t.id))
      .filter(t => t.name.toLowerCase().includes(searchLower))

    if (isManager && tagSearch && !tags.find(t => t.name.toLowerCase() === tagSearch.toLowerCase())) {
      filtered.push({ id: 'create', name: `create "${tagSearch}"` })
    }

    return filtered
  }, [tags, ticketTags, tagSearch, isManager])

  useEffect(() => {
    loadTicket()
    loadComments()
    loadFeedback()

    const channel = supabase
      .channel('ticket')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
          filter: `id=eq.${id}`
        },
        (payload) => {
          console.log('Ticket changed:', payload)
          loadTicket()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ticket_comments',
          filter: `ticket_id=eq.${id}`
        },
        () => {
          loadComments()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'ticket_comments',
        },
        () => {
          loadComments()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ticket_feedback',
          filter: `ticket_id=eq.${id}`
        },
        () => {
          loadFeedback()
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [id])

  // Load usernames when ticket/comments/feedback change
  useEffect(() => {
    if (ticket) {
      fetchUsername(ticket.created_by)
      if (ticket.assigned_to) {
        fetchUsername(ticket.assigned_to)
      }
    }

    comments.forEach(comment => {
      fetchUsername(comment.created_by)
    })

    if (feedback) {
      fetchUsername(feedback.created_by)
    }
  }, [ticket, comments, feedback])

  async function loadTicket() {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setTicket(data)
      setLoading(false)
    } catch (e) {
      console.error('Error loading ticket:', e)
      setError('failed to load ticket')
      setLoading(false)
    }
  }

  async function loadComments() {
    try {
      const { data, error } = await supabase
        .from('ticket_comments')
        .select('*')
        .eq('ticket_id', id)
        .order('created_at', { ascending: true })

      if (error) throw error
      setComments(data)
    } catch (e) {
      console.error('Error loading comments:', e)
      setError('failed to load comments')
    }
  }

  async function loadFeedback() {
    try {
      const { data, error } = await supabase
        .from('ticket_feedback')
        .select('*')
        .eq('ticket_id', id)
        .single()

      if (error && error.code !== 'PGRST116') throw error // PGRST116 is "no rows returned"
      setFeedback(data)
      
      // Pre-fetch username for feedback
      if (data) {
        await fetchUsername(data.created_by)
      }
    } catch (e) {
      console.error('Error loading feedback:', e)
      setError('failed to load feedback')
    }
  }

  async function handleStatusChange(status: TicketStatus) {
    if (!user || !ticket) return
    setUpdatingTicket(true)
    
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status })
        .eq('id', ticket.id)
        .select()
        .single()

      if (error) throw error
      setTicket(prev => prev ? { ...prev, status } : null)
    } catch (e) {
      console.error('Error updating status:', e)
      setError('failed to update status')
    } finally {
      setUpdatingTicket(false)
    }
  }

  async function handlePriorityChange(priority: TicketPriority) {
    if (!user || !ticket) return
    setUpdatingTicket(true)
    
    try {
      const { error } = await supabase.functions.invoke('update-ticket', {
        body: {
          id: ticket.id,
          priority
        }
      })

      if (error) throw error
      setTicket(prev => prev ? { ...prev, priority } : null)
    } catch (e) {
      console.error('Error updating priority:', e)
      setError('failed to update priority')
    } finally {
      setUpdatingTicket(false)
    }
  }

  async function handleAssignmentChange(userId: string | null) {
    if (!user || !ticket) return
    setUpdatingTicket(true)
    
    try {
      const { error } = await supabase.functions.invoke('update-ticket', {
        body: {
          id: ticket.id,
          assigned_to: userId
        }
      })

      if (error) throw error
      setTicket(prev => prev ? { ...prev, assigned_to: userId } : null)
    } catch (e) {
      console.error('Error updating assignment:', e)
      setError('failed to update assignment')
    } finally {
      setUpdatingTicket(false)
    }
  }

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !ticket || !newComment.trim()) return
    setUpdatingComment(true)

    try {
      const { error } = await supabase.functions.invoke('create-comment', {
        body: {
          ticket_id: ticket.id,
          content: newComment.trim(),
          internal: isInternal,
        },
      })

      if (error) throw error
      setNewComment('')
      setIsInternal(false)
    } catch (e) {
      console.error('Error creating comment:', e)
      setError('failed to create comment')
    } finally {
      setUpdatingComment(false)
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!user || !ticket) return
    setUpdatingTicket(true)

    try {
      const { error } = await supabase
        .from('ticket_comments')
        .delete()
        .eq('id', commentId)

      if (error) throw error
      setComments(prev => prev.filter(c => c.id !== commentId))
    } catch (e) {
      console.error('Error deleting comment:', e)
      setError('failed to delete comment')
    } finally {
      setUpdatingTicket(false)
    }
  }

  async function handleShareTemplate() {
    if (!ticket) return
    const url = `${window.location.origin}/tickets/new?template=${ticket.id}`
    await navigator.clipboard.writeText(url)
    alert('template URL copied to clipboard')
  }

  async function handleFieldValueChange(fieldId: string, value: string) {
    if (!user || !ticket) return
    
    // Update UI immediately
    updateValue(fieldId, value)
    
    // Debounce the save operation
    saveDebouncer.debounce(`field-${fieldId}`, async () => {
      setUpdatingTicket(true)
      
      try {
        const { error } = await supabase
          .from('ticket_field_values')
          .upsert({
            ticket_id: ticket.id,
            field_id: fieldId,
            value
          })
          .select()

        if (error) {
          console.error('Supabase error:', error)
          throw error
        }
      } catch (e) {
        console.error('Error updating field value:', e)
        setError('failed to update field value')
        // Reload fields to reset UI state
        loadTicket()
      } finally {
        setUpdatingTicket(false)
      }
    })
  }

  // Clean up debouncer on unmount
  useEffect(() => {
    return () => {
      saveDebouncer.clearAll()
    }
  }, [])

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-center h-[calc(100vh-12rem)] text-primary/70">
        loading ticket...
      </div>
    </div>
  )
  if (!ticket) return <div>ticket not found</div>

  const isAssignedToMe = ticket.assigned_to === user?.id
  const canUpdateStatus = profile?.role === 'manager' || isAssignedToMe
  const assignableMembers = profile ? getAssignableMembers(profile.role) : []

  async function handleTemplateToggle() {
    if (!ticket) return
    setUpdatingTicket(true)
    
    try {
      const newTitle = isTemplate
        ? ticket.title.slice(9) // Remove prefix
        : `template: ${ticket.title}` // Add prefix

      const { error } = await supabase.functions.invoke('update-ticket', {
        body: {
          id: ticket.id,
          title: newTitle
        }
      })

      if (error) throw error
      setTicket(prev => prev ? { ...prev, title: newTitle } : null)
    } catch (e) {
      console.error('Error updating template status:', e)
      setError('failed to update template status')
    } finally {
      setUpdatingTicket(false)
    }
  }

  async function handleAddField(fieldId: string) {
    if (!fieldId) return
    
    const { error } = await supabase
      .from('ticket_field_values')
      .insert({
        ticket_id: id,
        field_id: fieldId,
        value: ''
      })

    if (error) {
      console.error('Error adding field:', error)
      return
    }

    // Reload fields and ticket data
    await Promise.all([
      loadTicket(),
      loadFields()
    ])
  }

  async function handleRemoveField(fieldId: string) {
    const { error } = await supabase
      .from('ticket_field_values')
      .delete()
      .eq('ticket_id', id)
      .eq('field_id', fieldId)

    if (error) {
      console.error('Error removing field:', error)
      return
    }

    // Reload fields and ticket data
    await Promise.all([
      loadTicket(),
      loadFields()
    ])
  }

  // Add function to start editing feedback
  function handleEditFeedback() {
    if (!feedback) return
    setNewFeedback({
      rating: feedback.rating,
      comment: feedback.comment || ''
    })
    setIsEditing(true)
  }

  // Add function to cancel editing
  function handleCancelEdit() {
    setIsEditing(false)
    setNewFeedback({ rating: 5, comment: '' })
  }

  async function handleSubmitFeedback(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !ticket) return
    setUpdatingTicket(true)

    try {
      if (isEditing) {
        // Update existing feedback
        const { error } = await supabase
          .from('ticket_feedback')
          .update({
            rating: newFeedback.rating,
            comment: newFeedback.comment.trim() || null
          })
          .eq('id', feedback?.id)

        if (error) throw error
      } else {
        // Create new feedback
        const { data, error } = await supabase
          .from('ticket_feedback')
          .insert({
            ticket_id: ticket.id,
            rating: newFeedback.rating,
            comment: newFeedback.comment.trim() || null
          })
          .select()
          .single()

        if (error) throw error
        
        // Pre-fetch username for new feedback
        if (data) {
          await fetchUsername(data.created_by)
        }
      }

      await loadFeedback()
      setNewFeedback({ rating: 5, comment: '' })
      setIsEditing(false)
    } catch (e) {
      console.error('Error submitting feedback:', e)
      setError('failed to submit feedback')
    } finally {
      setUpdatingTicket(false)
    }
  }

  async function handleClaimForTeam() {
    if (!user || !ticket) return
    setUpdatingTicket(true)
    
    try {
      if (ticket.team_id) {
        // Unclaim - set team_id to null
        const { error: updateError } = await supabase
          .from('tickets')
          .update({ team_id: null })
          .eq('id', ticket.id)

        if (updateError) throw updateError
        setTicket(prev => prev ? { ...prev, team_id: null } : null)
      } else {
        // Claim - set team_id to manager's team
        const { data: teamData, error: teamError } = await supabase
          .from('team_members')
          .select('team_id')
          .eq('user_id', user.id)
          .single()

        if (teamError) throw teamError

        const { error: updateError } = await supabase
          .from('tickets')
          .update({ team_id: teamData.team_id })
          .eq('id', ticket.id)

        if (updateError) throw updateError
        setTicket(prev => prev ? { ...prev, team_id: teamData.team_id } : null)
      }
    } catch (e) {
      console.error('Error claiming/unclaiming ticket:', e)
      setError('failed to claim/unclaim ticket')
    } finally {
      setUpdatingTicket(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {isManager && !ticket.assigned_to && (
        <div className="mb-4 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClaimForTeam}
            disabled={updatingTicket}
          >
            {ticket.team_id ? 'unclaim from team' : 'claim for team'}
          </Button>
        </div>
      )}
      <div className="space-y-4">
        {/* Feedback Display */}
        {feedback && !isEditing && (
          <div className="bg-background border border-primary shadow rounded-lg p-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-primary">feedback</h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${i < feedback.rating ? 'fill-yellow-500 text-yellow-500' : 'fill-primary/10 text-primary/10'}`}
                    />
                  ))}
                </div>
                {(profile?.role === 'manager' || feedback.created_by === user?.id) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEditFeedback}
                  >
                    edit
                  </Button>
                )}
              </div>
            </div>
            {feedback.comment && feedback.comment.trim() && (
              <div className="text-primary whitespace-pre-wrap mt-4">
                {feedback.comment}
              </div>
            )}
          </div>
        )}

        {/* Feedback Form */}
        {((canLeaveFeedback && !feedback) || isEditing) && (
          <div className="bg-background border border-primary shadow rounded-lg p-4">
            <h2 className="text-lg font-semibold text-primary mb-4">
              {isEditing ? 'edit feedback' : 'leave feedback'}
            </h2>
            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              <div>
                <span className="text-sm text-primary/70">rating</span>
                <div className="flex items-center gap-1 mt-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setNewFeedback({ ...newFeedback, rating: i + 1 })}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-6 w-6 ${i < newFeedback.rating ? 'fill-yellow-500 text-yellow-500' : 'fill-primary/10 text-primary/10'} hover:fill-yellow-500 hover:text-yellow-500 transition-colors`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-sm text-primary/70">comment (optional)</span>
                <Textarea 
                  value={newFeedback.comment}
                  onChange={(e) => setNewFeedback({ ...newFeedback, comment: e.target.value })}
                  placeholder="write your comment..."
                  className="w-full mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={!newFeedback.rating || updatingTicket}>
                  {updatingTicket ? 'submitting...' : isEditing ? 'update feedback' : 'submit feedback'}
                </Button>
                {isEditing && (
                  <Button type="button" variant="ghost" onClick={handleCancelEdit}>
                    cancel
                  </Button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Main Ticket Details */}
        <div className="bg-background border border-primary shadow rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-primary mb-2">
                {isTemplate ? ticket.title.slice(9) : ticket.title}
              </h1>
              <div className="text-sm text-primary/70 flex gap-4">
                <span>by {usernames[ticket.created_by] || 'unknown'}</span>
                <span>{new Date(ticket.created_at).toLocaleString()}</span>
              </div>
            </div>
            <div className="flex gap-2">
              {profile?.role !== 'customer' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShareTemplate}
                  disabled={!isTemplate}
                >
                  share template
                </Button>
              )}
              {(profile?.role === 'manager' || (profile?.role === 'worker' && ticket.created_by === user?.id)) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTemplateToggle}
                  disabled={updatingTicket}
                >
                  {isTemplate ? 'remove template' : 'make template'}
                </Button>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-4 text-sm text-red-600">{error}</div>
          )}

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-primary/70">status</span>
              {canUpdateStatus ? (
                <Select
                  value={ticket.status}
                  onValueChange={(value) => handleStatusChange(value as TicketStatus)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">new</SelectItem>
                    <SelectItem value="open">open</SelectItem>
                    <SelectItem value="pending">pending</SelectItem>
                    <SelectItem value="resolved">resolved</SelectItem>
                    <SelectItem value="closed">closed</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="mt-1 font-medium text-primary">{ticket.status}</p>
              )}
            </div>

            <div>
              <span className="text-sm text-primary/70">priority</span>
              {(profile?.role === 'manager' || (profile?.role === 'customer' && ticket.created_by === user?.id)) ? (
                <Select
                  value={ticket.priority}
                  onValueChange={(value) => handlePriorityChange(value as TicketPriority)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">low</SelectItem>
                    <SelectItem value="medium">medium</SelectItem>
                    <SelectItem value="high">high</SelectItem>
                    <SelectItem value="urgent">urgent</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="mt-1 font-medium text-primary">{ticket.priority}</p>
              )}
            </div>

            <div>
              <span className="text-sm text-primary/70">tags</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {ticketTags.map(tag => (
                  <div 
                    key={tag.id}
                    className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-sm"
                  >
                    {tag.name}
                    {(profile?.role === 'manager' || (profile?.role === 'worker' && ticket.assigned_to === user?.id)) && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await removeTag(tag.id)
                          } catch (e) {
                            console.error('Error removing tag:', e)
                            setError('failed to remove tag')
                          }
                        }}
                        className="text-primary/70 hover:text-primary"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                {(profile?.role === 'manager' || (profile?.role === 'worker' && ticket.assigned_to === user?.id)) && (
                  <Popover open={tagSearchOpen} onOpenChange={setTagSearchOpen}>
                    <PopoverTrigger asChild>
                      <button className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-sm hover:bg-primary/20">
                        add tag
                        <ChevronsUpDown className="h-3 w-3 opacity-50" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0 bg-background border border-primary" align="start">
                      <Command className="w-full [&_[cmdk-input-wrapper]]:px-0">
                        <CommandInput 
                          placeholder="search tags..." 
                          className="h-9 w-full ring-0 focus:ring-0 focus-visible:ring-0 text-primary placeholder:text-primary/50" 
                          value={tagSearch} 
                          onValueChange={setTagSearch}
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter' && tagSearch) {
                              e.preventDefault()
                              if (filteredTags.length === 1) {
                                const tag = filteredTags[0]
                                try {
                                  if (tag.id === 'create') {
                                    const newTag = await createTag(tagSearch.trim())
                                    if (newTag) {
                                      await addTag(newTag.id)
                                    }
                                  } else {
                                    await addTag(tag.id)
                                  }
                                  setTagSearchOpen(false)
                                  setTagSearch('')
                                } catch (e) {
                                  console.error('Error with tag:', e)
                                  setError('failed to handle tag')
                                }
                              }
                            }
                          }}
                        />
                        <CommandEmpty className="py-2 px-3 text-sm text-primary/50">no tags found</CommandEmpty>
                        <CommandGroup className="max-h-[200px] overflow-y-auto">
                          {filteredTags.map(tag => (
                            <CommandItem
                              key={tag.id}
                              onSelect={async () => {
                                try {
                                  if (tag.id === 'create') {
                                    const newTag = await createTag(tagSearch.trim())
                                    if (newTag) {
                                      await addTag(newTag.id)
                                    }
                                  } else {
                                    await addTag(tag.id)
                                  }
                                  setTagSearchOpen(false)
                                  setTagSearch('')
                                } catch (e) {
                                  console.error('Error with tag:', e)
                                  setError('failed to handle tag')
                                }
                              }}
                              className={tag.id === 'create' 
                                ? "py-2 px-3 cursor-pointer hover:bg-primary/10 text-primary"
                                : "py-2 px-3 cursor-pointer hover:bg-primary/10 text-primary"}
                            >
                              {tag.id === 'create' ? `create "${tagSearch}"` : tag.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>

            <div>
              <span className="text-sm text-primary/70">assignee</span>
              {profile?.role === 'manager' || (profile?.role === 'worker' && (!ticket.assigned_to || ticket.assigned_to === user?.id)) ? (
                <Select
                  value={ticket.assigned_to || 'unassigned'}
                  onValueChange={(value) => handleAssignmentChange(value === 'unassigned' ? null : value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">unassigned</SelectItem>
                    {assignableMembers.map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        {usernames[member.id] || member.username} ({member.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="mt-1 font-medium text-primary">
                  {ticket.assigned_to ? usernames[ticket.assigned_to] || 'unknown' : 'unassigned'}
                </p>
              )}
            </div>
          </div>

          {ticket.description && (
            <div className="mt-6">
              <span className="text-sm text-primary/70">description</span>
              <p className="mt-1 text-primary whitespace-pre-wrap">{ticket.description}</p>
            </div>
          )}

          {isManager && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-primary">custom fields</h3>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm">
                      add field
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="end">
                    <Command className="w-full">
                      <CommandInput 
                        placeholder="search fields..." 
                        className="h-9"
                      />
                      <CommandEmpty>no fields found</CommandEmpty>
                      <CommandGroup className="max-h-[200px] overflow-y-auto">
                        {allFields
                          .filter(f => !fields.find(existing => existing.id === f.id))
                          .map(field => (
                            <CommandItem
                              key={field.id}
                              value={field.id}
                              onSelect={() => handleAddField(field.id)}
                            >
                              <span>{field.name}</span>
                              <span className="ml-2 text-xs text-primary/50">
                                ({field.type}{field.required ? ", required" : ""})
                              </span>
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          {fields.length > 0 && (
            <div className="mt-4 space-y-4">
              {fields.map(field => (
                <div key={field.id} className="flex items-start gap-2">
                  <CustomField
                    field={field}
                    value={values[field.id] || ''}
                    onChange={(value: string) => handleFieldValueChange(field.id, value)}
                    mode={
                      profile?.role === 'customer' || 
                      (profile?.role === 'worker' && ticket.assigned_to !== user?.id) ? 
                      'view' : 'edit'
                    }
                    className="flex-1"
                  />
                  {isManager && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveField(field.id)}
                    >
                      remove
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-background border border-primary shadow rounded-lg p-4">
          <h2 className="text-lg font-semibold text-primary mb-4">comments</h2>
          <div className="space-y-4">
            {comments.map(comment => (
              <div key={comment.id} className="border-b border-primary/20 last:border-0 pb-4">
                <div className="flex justify-between items-start">
                  <div className="text-sm text-primary/70">
                    <span className="font-medium text-primary">{usernames[comment.created_by] || 'unknown'}</span>
                    <span className="mx-2">·</span>
                    <span>{new Date(comment.created_at).toLocaleString()}</span>
                    {comment.internal && (
                      <>
                        <span className="mx-2">·</span>
                        <span className="text-yellow-500">internal</span>
                      </>
                    )}
                  </div>
                  {(profile?.role === 'manager' || (profile?.role === 'customer' && comment.created_by === user?.id)) && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteComment(comment.id)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="mt-2 text-primary whitespace-pre-wrap">{comment.content}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-primary/20">
            <h3 className="text-sm font-medium text-primary mb-4">add comment</h3>
            <form onSubmit={handleSubmitComment} className="space-y-4">
              <div>
                <Textarea 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="write your comment..."
                  className="w-full"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.shiftKey && newComment.trim()) {
                      e.preventDefault()
                      handleSubmitComment(e)
                    }
                  }}
                />
              </div>
              {isManagerOrWorker && (
                <div className="flex items-center gap-2">
                  <Switch
                    id="internal"
                    checked={isInternal}
                    onCheckedChange={setIsInternal}
                  />
                  <Label htmlFor="internal" className="text-primary">internal comment</Label>
                </div>
              )}
              <Button type="submit" disabled={!newComment.trim() || updatingComment}>
                add comment
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
} 
```

### front/src/components/tickets/CustomFieldManager.tsx
```typescript
import { useState } from 'react'
import { useFieldDefinitions } from '../../lib/hooks/useFieldDefinitions'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'
import { Card, CardContent } from '../ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { useAuth } from '../../lib/hooks/useAuth'
import { CustomFieldType } from './CustomField'

interface CustomFieldManagerProps {
  teamId?: string
}

export function CustomFieldManager({ teamId }: CustomFieldManagerProps) {
  const { profile } = useAuth()
  const {
    fields,
    teamFields,
    error,
    createField,
    addFieldToTeam,
    removeFieldFromTeam,
    deleteField
  } = useFieldDefinitions(teamId || undefined)

  const [newField, setNewField] = useState<Omit<CustomFieldType, 'id'>>({
    name: '',
    type: 'text',
    required: false,
    owner_id: null
  })

  if (!profile || profile.role !== 'manager') {
    return null
  }

  async function handleCreateField() {
    if (!newField.name) return

    const field = await createField(
      newField.name,
      newField.type,
      newField.required
    )

    if (field && teamId) {
      await addFieldToTeam(field.id)
    }

    setNewField({
      name: '',
      type: 'text',
      required: false,
      owner_id: null
    })
  }

  async function handleToggleTeamField(fieldId: string, isTeamField: boolean) {
    if (isTeamField) {
      await removeFieldFromTeam(fieldId)
    } else {
      await addFieldToTeam(fieldId)
    }
  }

  async function handleDeleteField(fieldId: string) {
    await deleteField(fieldId)
  }

  const teamFieldIds = new Set(teamFields.map(f => f.id))

  return (
    <Card>
      <CardContent className="space-y-6 pt-4">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-primary">custom fields</h3>
          
          {/* Create new field */}
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label>name</Label>
              <Input
                value={newField.name}
                onChange={e => setNewField(prev => ({ ...prev, name: e.target.value }))}
                placeholder="field name"
              />
            </div>
            <div>
              <Label>type</Label>
              <Select
                value={newField.type}
                onValueChange={(value: CustomFieldType['type']) => setNewField(prev => ({ 
                  ...prev, 
                  type: value
                }))}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">text</SelectItem>
                  <SelectItem value="number">number</SelectItem>
                  <SelectItem value="boolean">boolean</SelectItem>
                  <SelectItem value="date">date</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={newField.required}
                onCheckedChange={(checked: boolean) => setNewField(prev => ({ ...prev, required: checked }))}
              />
              <Label>required</Label>
            </div>
            <Button onClick={handleCreateField} size="sm">
              create field
            </Button>
          </div>

          {/* List existing fields */}
          <div className="space-y-2">
            {fields.map(field => (
              <div 
                key={field.id} 
                className="flex items-center justify-between p-3 rounded-lg border border-primary/20 bg-background hover:bg-primary/5"
              >
                <div>
                  <span className="font-medium text-primary">{field.name}</span>
                  <span className="ml-2 text-sm text-primary/70">({field.type})</span>
                  {field.required && (
                    <span className="ml-2 text-sm text-primary/70">required</span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {teamId && (
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={teamFieldIds.has(field.id)}
                        onCheckedChange={() => handleToggleTeamField(field.id, teamFieldIds.has(field.id))}
                      />
                      <span className="text-sm text-primary/70">team field</span>
                    </div>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteField(field.id)}
                  >
                    delete
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 
```

### front/src/components/tickets/CustomField.tsx
```typescript
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'
import { cn } from '../../lib/utils'

export interface CustomFieldType {
  id: string
  name: string
  type: 'text' | 'number' | 'boolean' | 'date'
  required: boolean
  owner_id?: string | null
}

interface Props {
  field: CustomFieldType
  value: string
  onChange: (value: string) => void
  className?: string
  error?: string
  showLabel?: boolean
  mode: 'edit' | 'view'
}

export function CustomField({ 
  field, 
  value, 
  onChange, 
  className,
  error,
  showLabel = true,
  mode = 'edit'
}: Props) {
  return (
    <div className={cn("w-full space-y-1.5", className)}>
      {showLabel && (
        <Label className="flex items-center gap-1 text-sm text-primary/70">
          {field.name}
          {field.required && mode === 'edit' && <span className="text-primary/70">*</span>}
        </Label>
      )}
      
      <div>
        {field.type === 'boolean' ? (
          mode === 'view' ? (
            <span className="text-primary">{value === 'true' ? 'yes' : 'no'}</span>
          ) : (
            <div className="flex items-center h-9 space-x-2">
              <Switch
                id={field.id}
                checked={value === 'true'}
                onCheckedChange={(checked: boolean) => {
                  onChange(checked ? 'true' : 'false')
                }}
              />
            </div>
          )
        ) : mode === 'view' ? (
          <span className="text-primary">
            {field.type === 'date' && value ? new Date(value).toLocaleDateString() : value || '-'}
          </span>
        ) : (
          <Input
            type={field.type}
            value={value}
            onChange={e => onChange(e.target.value)}
            required={field.required}
            className={cn(error && "border-red-500")}
          />
        )}
      </div>

      {error && mode === 'edit' && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  )
} 
```

### front/src/components/kb/ArticleList.tsx
```typescript
import { useEffect, useState } from "react";
import { useSupabase } from "../../lib/hooks/useSupabase";
import { Button } from "../ui/button";
import { Link } from "react-router-dom";
import { useUsernames } from "../../lib/hooks/useUsernames";

interface Article {
  id: string;
  title: string;
  content: string;
  summary?: string;
  published: boolean;
  created_at: string;
  created_by: string;
  version: number;
}

export function ArticleList() {
  const supabase = useSupabase();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const { usernames, fetchUsername } = useUsernames();

  useEffect(() => {
    loadArticles();
  }, []);

  // Load usernames when articles change
  useEffect(() => {
    articles.forEach(article => {
      if (article.created_by) {
        fetchUsername(article.created_by);
      }
    });
  }, [articles]);

  async function loadArticles() {
    try {
      // The RLS policy will automatically filter based on user role
      const { data, error } = await supabase
        .from("kb_articles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error("error loading articles:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase.from("kb_articles").delete().eq("id", id);
      if (error) throw error;
      await loadArticles();
    } catch (error) {
      console.error("error deleting article:", error);
    }
  }

  if (loading) {
    return <div className="flex h-32 items-center justify-center text-primary/70">loading articles...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-primary">articles</h2>
        <Button size="sm" variant="outline" asChild>
          <Link to="/kb/new">new article</Link>
        </Button>
      </div>

      <div className="bg-background border border-primary shadow rounded-lg overflow-hidden">
        <div className="divide-y divide-primary/20">
          {articles.map((article) => (
            <div
              key={article.id}
              className="hover:bg-primary/5 p-4 flex items-center justify-between"
            >
              <div>
                <h3 className="text-lg font-medium text-primary hover:text-primary/90 mb-1">{article.title}</h3>
                {article.summary && (
                  <p className="text-sm text-primary/70">{article.summary}</p>
                )}
                <div className="mt-2 flex items-center gap-2 text-xs text-primary/50">
                  <span>v{article.version}</span>
                  <span>•</span>
                  <span>by {usernames[article.created_by] || 'unknown'}</span>
                  <span>•</span>
                  <span>
                    {new Date(article.created_at).toLocaleDateString()}
                  </span>
                  {article.published && (
                    <>
                      <span>•</span>
                      <span className="text-green-500">published</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Button size="sm" variant="ghost" asChild>
                  <Link to={`/help/${article.id}`}>view</Link>
                </Button>
                <Button size="sm" variant="ghost" asChild>
                  <Link to={`/kb/${article.id}/edit`}>edit</Link>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-500"
                  onClick={() => handleDelete(article.id)}
                >
                  delete
                </Button>
              </div>
            </div>
          ))}

          {articles.length === 0 && (
            <div className="flex h-[100px] items-center justify-center text-sm text-primary/70">
              no articles yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
```

### front/src/components/kb/ArticleEditor.tsx
```typescript
import { useState, ChangeEvent, useEffect } from "react";
import { useSupabase } from "../../lib/hooks/useSupabase";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { useAuth } from "../../lib/hooks/useAuth";
import ReactMarkdown from "react-markdown";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import '../../styles/github-markdown.css';

interface ArticleEditorProps {
  id?: string;
  initialTitle?: string;
  initialContent?: string;
  initialSummary?: string;
  initialPublished?: boolean;
  onSave?: () => void;
  onCancel?: () => void;
}

const markdownHints = `# Heading 1
## Heading 2
### Heading 3

**bold text**
*italic text*

- bullet point
- another point

1. numbered list
2. second item

[link text](url)

\`inline code\`

\`\`\`
code block
\`\`\`

> blockquote`;

const markdownExamples = `# Heading 1
## Heading 2
### Heading 3

**bold text**
*italic text*

- bullet point
- another point

1. numbered list
2. second item

[link text](url)

\`inline code\`

\`\`\`
code block
\`\`\`

> blockquote`;

export function ArticleEditor({
  id,
  initialTitle = "",
  initialContent = "",
  initialSummary = "",
  initialPublished = false,
  onSave,
  onCancel,
}: ArticleEditorProps) {
  const supabase = useSupabase();
  const { profile } = useAuth();
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [summary, setSummary] = useState(initialSummary);
  const [published, setPublished] = useState(initialPublished);
  const [takeOwnership, setTakeOwnership] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!id);
  const [showHints, setShowHints] = useState(false);

  // Load content from storage when editing
  useEffect(() => {
    if (!id) return;

    async function loadContent() {
      try {
        const { data: article } = await supabase
          .from('kb_articles')
          .select('storage_path')
          .eq('id', id)
          .single();

        if (article?.storage_path) {
          const { data, error } = await supabase.storage
            .from('kb')
            .download(article.storage_path);
            
          if (error) throw error;
          
          const text = await data.text();
          setContent(text);
        }
      } catch (error) {
        console.error('Error loading article content:', error);
      } finally {
        setLoading(false);
      }
    }

    loadContent();
  }, [id, supabase]);

  async function handleSave() {
    if (!title || !content) return;

    setSaving(true);
    try {
      const { error } = await supabase.functions.invoke("upsert-article", {
        body: {
          id,
          title,
          content,
          summary,
          published: profile?.role === 'manager' ? published : false,
          takeOwnership,
        },
      });

      if (error) throw error;
      onSave?.();
    } catch (error) {
      console.error("error saving article:", error);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[200px] items-center justify-center text-primary/70">
        loading article...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-primary">
          {id ? "edit article" : "new article"}
        </h2>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={onCancel}
            disabled={saving}
          >
            cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!title || !content || saving}
          >
            {saving ? "saving..." : "save"}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
            placeholder="article title"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="summary">summary</Label>
          <Input
            id="summary"
            value={summary}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSummary(e.target.value)}
            placeholder="brief summary (optional)"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">content (markdown)</Label>
          <Tabs defaultValue="write" className="w-full">
            <TabsList>
              <TabsTrigger value="write">write</TabsTrigger>
              <TabsTrigger value="preview">preview</TabsTrigger>
            </TabsList>
            <TabsContent value="write" className="mt-0 space-y-4">
              <Textarea
                id="content"
                value={content}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
                placeholder="article content in markdown"
                className="min-h-[300px] font-mono w-full"
              />
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowHints(!showHints)}
                >
                  {showHints ? "hide syntax guide" : "show syntax guide"}
                </Button>
              </div>
              {showHints && (
                <div className="grid grid-cols-2 gap-4 border border-primary/20 rounded-md">
                  <div className="p-4">
                    <h3 className="text-sm font-medium mb-2">Markdown Syntax</h3>
                    <pre className="text-primary/70 whitespace-pre-wrap">{markdownHints}</pre>
                  </div>
                  <div className="border-l border-primary/20 p-4">
                    <h3 className="text-sm font-medium mb-2">Rendered Result</h3>
                    <div className="markdown-body bg-background text-sm">
                      <ReactMarkdown>{markdownExamples}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
            <TabsContent value="preview" className="mt-0">
              <div className="min-h-[300px] markdown-body bg-background border border-primary/20 rounded-md p-4">
                <ReactMarkdown>{content || "*No content yet*"}</ReactMarkdown>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {profile?.role === 'manager' && (
          <div className="flex items-center space-x-2">
            <Switch
              id="published"
              checked={published}
              onCheckedChange={setPublished}
            />
            <Label htmlFor="published">publish article</Label>
          </div>
        )}

        {id && (
          <div className="flex items-center space-x-2">
            <Switch
              id="takeOwnership"
              checked={takeOwnership}
              onCheckedChange={setTakeOwnership}
            />
            <Label htmlFor="takeOwnership">take ownership</Label>
          </div>
        )}
      </div>
    </div>
  );
} 
```

### front/src/components/kb/ArticleViewer.tsx
```typescript
import { useEffect, useState, useCallback } from "react";
import { useSupabase } from "../../lib/hooks/useSupabase";
import ReactMarkdown from "react-markdown";
import '../../styles/github-markdown.css';

interface ArticleViewerProps {
  id: string;
}

export function ArticleViewer({ id }: ArticleViewerProps) {
  const supabase = useSupabase();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadContent = useCallback(async () => {
    try {
      const { data: article, error: articleError } = await supabase
        .from("kb_articles")
        .select("storage_path")
        .eq("id", id)
        .single();

      if (articleError) throw articleError;
      if (!article?.storage_path) {
        setError("article not found");
        return;
      }

      const { data, error: storageError } = await supabase.storage
        .from("kb")
        .download(article.storage_path);

      if (storageError) throw storageError;

      const text = await data.text();
      setContent(text);
    } catch (error) {
      console.error("error loading article content:", error);
      setError("failed to load article content");
    } finally {
      setLoading(false);
    }
  }, [id, supabase]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  if (loading) {
    return (
      <div className="flex items-center justify-center text-primary/70 min-h-[300px]">
        loading article...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center text-red-500 min-h-[300px]">
        {error}
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex items-center justify-center text-primary/70 min-h-[300px]">
        no content available
      </div>
    );
  }

  return (
    <article className="markdown-body">
      <ReactMarkdown>{content}</ReactMarkdown>
    </article>
  );
} 
```

### front/src/components/NotificationBell.tsx
```typescript
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
                    !notification.read && 'bg-background/10'
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
```

### front/src/components/feedback/FeedbackBarGraph.tsx
```typescript
import { FeedbackStats } from '../../lib/hooks/useFeedback'

interface FeedbackBarGraphProps {
  stats: FeedbackStats
  title?: string
}

export function FeedbackBarGraph({ stats, title }: FeedbackBarGraphProps) {
  // Find the max count to scale bars
  const maxCount = Math.max(...Object.values(stats.distribution))
  
  return (
    <div className="space-y-2">
      {title && <h3 className="text-sm font-medium text-primary">{title}</h3>}
      
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map(rating => {
          const count = stats.distribution[rating as 1|2|3|4|5]
          const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0
          
          return (
            <div key={rating} className="flex items-center gap-2">
              <div className="w-4 text-sm text-primary">{rating}</div>
              <div className="flex-1 h-6 bg-primary/10 rounded-sm overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500 ease-out"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="w-8 text-sm text-primary text-right">{count}</div>
            </div>
          )
        })}
      </div>

      <div className="flex justify-between text-sm text-primary/70 pt-2">
        <div>average: {stats.average.toFixed(1)}</div>
        <div>total: {stats.total}</div>
      </div>
    </div>
  )
} 
```

### front/src/components/feedback/TeamFeedbackRanking.tsx
```typescript
import { FeedbackStatsWithUser } from '../../lib/hooks/useFeedback'
import { Link } from 'react-router-dom'

interface TeamFeedbackRankingProps {
  members: FeedbackStatsWithUser[]
}

export function TeamFeedbackRanking({ members }: TeamFeedbackRankingProps) {
  return (
    <div className="space-y-1">
      {members.map(member => (
        <Link 
          key={member.user_id} 
          to={`/tickets?assigned_id=${member.user_id}&status=closed`}
          className="flex flex-col px-2 py-1.5 rounded-sm hover:bg-primary/5"
        >
          <div className="text-sm text-primary">{member.user_name}</div>
          <div className="flex justify-between text-sm">
            <span className="text-primary/70">{member.total} ratings</span>
            <span className="text-primary">{member.average > 0 ? member.average.toFixed(1) : '-'}</span>
          </div>
        </Link>
      ))}
    </div>
  )
} 
```

### front/src/components/Header.tsx
```typescript
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';
import { NotificationBell } from './NotificationBell'

export function Header() {
  const { profile, signOut } = useAuth();

  return (
    <header className="h-12 bg-header border-b border-primary/20">
      <div className="max-w-5xl mx-auto px-4 h-full flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-sm font-medium">
            auto-crm
          </Link>
          
          {profile && (
            <>
              <Link 
                to="/tickets" 
                className="text-sm text-primary/70 hover:text-primary"
              >
                tickets
              </Link>
              {(profile.role === 'worker' || profile.role === 'manager') && (
                <>
                  <Link 
                    to="/kb" 
                    className="text-sm text-primary/70 hover:text-primary"
                  >
                    knowledge base
                  </Link>
                  <Link 
                    to="/help" 
                    className="text-sm text-primary/70 hover:text-primary"
                  >
                    help center
                  </Link>
                </>
              )}
              {profile.role === 'customer' && (
                <Link 
                  to="/help" 
                  className="text-sm text-primary/70 hover:text-primary"
                >
                  help center
                </Link>
              )}
            </>
          )}
        </div>

        {profile ? (
          <div className="flex items-center gap-2">
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-7 hover:text-background">
                  <div className="flex items-center">
                    <span>{profile.username}</span>
                    {(profile.role === 'worker' || profile.role === 'manager') && (
                      <span className="ml-1 opacity-70">({profile.role})</span>
                    )}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/settings">settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut()}>
                  sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="space-x-4">
            <Link to="/login" className="text-sm text-primary/70 hover:text-primary">
              sign in
            </Link>
            <Link to="/signup" className="text-sm text-primary/70 hover:text-primary">
              sign up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
} 
```

### front/src/Routes.tsx
```typescript
import { Navigate, Routes as RouterRoutes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './lib/hooks/useAuth';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Settings } from './pages/Settings';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { ResetPassword } from './pages/ResetPassword';
import { UpdatePassword } from './pages/UpdatePassword';
import { TicketList } from './components/tickets/TicketList';
import { TicketCreate } from './components/tickets/TicketCreate';
import { TicketDetail } from './components/tickets/TicketDetail';
import { Logout } from './pages/Logout';
import { useEffect } from 'react';
import KnowledgeBase from './pages/kb';
import Help from './pages/help';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center h-[calc(100vh-12rem)] text-primary/70">
          loading...
        </div>
      </div>
    );
  }

  if (!user) {
    // Pass the current location to redirect back after login
    return <Navigate to="/signup" state={{ from: location }} />;
  }

  return <>{children}</>;
}

function RequireGuest({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  // Redirect to home if authenticated
  useEffect(() => {
    if (!loading && user) {
      navigate('/');
    }
  }, [user, loading, navigate]);
  
  if (loading) {
    return null;
  }
  
  if (user) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

function Home() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center h-[calc(100vh-12rem)] text-primary/70">
          loading...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Landing />;
  }

  // Show role-specific dashboard for authenticated users
  return <Dashboard />;
}

export function Routes() {
  return (
    <RouterRoutes>
      <Route path="/" element={<Home />} />
      <Route path="/help/:id" element={<Help />} />
      <Route path="/help" element={<Help />} />
      
      {/* Guest routes */}
      <Route path="/login" element={<RequireGuest><Login /></RequireGuest>} />
      <Route path="/signup" element={<RequireGuest><Signup /></RequireGuest>} />
      <Route path="/reset-password" element={<RequireGuest><ResetPassword /></RequireGuest>} />
      <Route path="/update-password" element={<RequireGuest><UpdatePassword /></RequireGuest>} />
      
      {/* Protected routes */}
      <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
      <Route path="/settings/*" element={<RequireAuth><Settings /></RequireAuth>} />
      <Route path="/tickets" element={<RequireAuth><TicketList /></RequireAuth>} />
      <Route path="/tickets/new" element={<RequireAuth><TicketCreate /></RequireAuth>} />
      <Route path="/tickets/:id" element={<RequireAuth><TicketDetail /></RequireAuth>} />
      <Route path="/kb/*" element={<RequireAuth><KnowledgeBase /></RequireAuth>} />
      <Route path="/kb/:id/edit" element={<RequireAuth><KnowledgeBase /></RequireAuth>} />
      <Route path="/kb/new" element={<RequireAuth><KnowledgeBase /></RequireAuth>} />
      <Route path="/logout" element={<Logout />} />
    </RouterRoutes>
  );
} 
```

### front/src/lib/utils.ts
```typescript
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
```

### front/src/lib/types.ts
```typescript
export type TicketStatus = 'new' | 'open' | 'pending' | 'resolved' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Ticket {
  id: string
  title: string
  description: string | null
  status: TicketStatus
  priority: TicketPriority
  restricted: boolean
  created_at: string
  updated_at: string
  created_by: string | null
  assigned_to: string | null
  team_id: string | null
}

export interface NewTicket {
  title: string
  description?: string
  priority?: TicketPriority
  team_id?: string
}

export type Role = 'customer' | 'worker' | 'manager'

export interface Profile {
  id: string
  username: string
  email: string
  role: Role
  created_at: string
  updated_at: string
} 
```

### front/src/lib/hooks/useSkills.ts
```typescript
import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

interface Skill {
  id: string
  name: string
  created_at: string
}

export function useSkills(userId?: string) {
  const [skills, setSkills] = useState<Skill[]>([])
  const [userSkills, setUserSkills] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadSkills()

    // Subscribe to skills changes
    const skillsSubscription = supabase
      .channel('skills_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'skills' },
        () => loadSkills()
      )
      .subscribe()

    return () => {
      skillsSubscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (userId) {
      loadUserSkills()

      // Subscribe to user_skills changes
      const userSkillsSubscription = supabase
        .channel('user_skills_changes')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'user_skills', filter: `user_id=eq.${userId}` },
          () => loadUserSkills()
        )
        .subscribe()

      return () => {
        userSkillsSubscription.unsubscribe()
      }
    }
  }, [userId])

  async function loadSkills() {
    try {
      const { data, error: skillsError } = await supabase
        .from('skills')
        .select('*')
        .order('name')

      if (skillsError) throw skillsError

      setSkills(data || [])
    } catch (err) {
      console.error('Error loading skills:', err)
      setError('failed to load skills')
    } finally {
      setLoading(false)
    }
  }

  async function loadUserSkills() {
    if (!userId) return

    try {
      const { data, error: userSkillsError } = await supabase
        .from('user_skills')
        .select('skill_id')
        .eq('user_id', userId)

      if (userSkillsError) throw userSkillsError

      setUserSkills(new Set(data?.map(us => us.skill_id)))
    } catch (err) {
      console.error('Error loading user skills:', err)
      setError('failed to load user skills')
    }
  }

  return {
    skills,
    userSkills,
    loading,
    error,
    refresh: loadSkills
  }
} 
```

### front/src/lib/hooks/useFeedback.ts
```typescript
import { useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { useUsernames } from './useUsernames'
import { supabase } from '../supabase'

interface TicketFeedback {
  rating: number
  tickets: {
    assigned_to: string
    team_id?: string
  }
}

interface TeamMember {
  user_id: string
}

export interface FeedbackStats {
  // Distribution of ratings (1-5)
  distribution: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
  // Average rating
  average: number
  // Total number of ratings
  total: number
}

export interface FeedbackStatsWithUser extends FeedbackStats {
  user_id: string
  user_name: string
}

export function useFeedback() {
  const { profile } = useAuth()
  const { fetchUsername } = useUsernames()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [personalStats, setPersonalStats] = useState<FeedbackStats>({
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    average: 0,
    total: 0
  })
  const [teamStats, setTeamStats] = useState<FeedbackStats>({
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    average: 0,
    total: 0
  })
  const [teamMemberStats, setTeamMemberStats] = useState<FeedbackStatsWithUser[]>([])

  useEffect(() => {
    loadFeedbackStats()
  }, [profile?.id])

  async function loadFeedbackStats() {
    try {
      setLoading(true)
      
      // Get user's team first
      const { data: teamData } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', profile?.id)
        .single()

      // Get all feedback for tickets assigned to the user
      const { data: personalFeedback } = await supabase
        .from('ticket_feedback')
        .select(`
          rating,
          tickets!inner (
            assigned_to
          )
        `)
        .eq('tickets.assigned_to', profile?.id) as { data: TicketFeedback[] | null }

      // Calculate personal stats
      if (personalFeedback) {
        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        let sum = 0
        personalFeedback.forEach(f => {
          distribution[f.rating as 1|2|3|4|5]++
          sum += f.rating
        })
        setPersonalStats({
          distribution,
          average: personalFeedback.length ? sum / personalFeedback.length : 0,
          total: personalFeedback.length
        })
      }

      // For managers, get team-wide stats
      if (profile?.role === 'manager' && teamData?.team_id) {
        // Get all feedback for tickets assigned to team members
        const { data: teamFeedback } = await supabase
          .from('ticket_feedback')
          .select(`
            rating,
            tickets!inner (
              assigned_to,
              team_id
            )
          `)
          .eq('tickets.team_id', teamData.team_id) as { data: TicketFeedback[] | null }

        if (teamFeedback) {
          // Calculate team stats
          const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
          let sum = 0
          teamFeedback.forEach(f => {
            distribution[f.rating as 1|2|3|4|5]++
            sum += f.rating
          })
          setTeamStats({
            distribution,
            average: teamFeedback.length ? sum / teamFeedback.length : 0,
            total: teamFeedback.length
          })

          // Get team members
          const { data: teamMembers } = await supabase
            .from('team_members')
            .select('user_id')
            .eq('team_id', teamData.team_id) as { data: TeamMember[] | null }

          if (teamMembers) {
            const memberStats = await Promise.all(
              teamMembers.map(async member => {
                const memberFeedback = teamFeedback.filter(
                  f => f.tickets.assigned_to === member.user_id
                )
                const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
                let sum = 0
                memberFeedback.forEach(f => {
                  distribution[f.rating as 1|2|3|4|5]++
                  sum += f.rating
                })
                const username = await fetchUsername(member.user_id)
                return {
                  user_id: member.user_id,
                  user_name: username || 'unknown',
                  distribution,
                  average: memberFeedback.length ? sum / memberFeedback.length : 0,
                  total: memberFeedback.length
                }
              })
            )
            setTeamMemberStats(memberStats.sort((a, b) => b.average - a.average))
          }
        }
      }
    } catch (e) {
      console.error('Error loading feedback stats:', e)
      setError('Failed to load feedback stats')
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    personalStats,
    teamStats,
    teamMemberStats,
    refresh: loadFeedbackStats
  }
} 
```

### front/src/lib/hooks/useFieldDefinitions.ts
```typescript
import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { CustomField } from './useCustomFields'

export function useFieldDefinitions(teamId?: string) {
  const [fields, setFields] = useState<CustomField[]>([])
  const [teamFields, setTeamFields] = useState<CustomField[]>([])
  const [loading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadAllFields()
    if (teamId) {
      loadTeamFields()
    }
  }, [teamId])

  async function loadAllFields() {
    try {
      const { data, error } = await supabase
        .from('ticket_field_definitions')
        .select('*')
        .order('name')

      if (error) throw error
      setFields(data)
    } catch (err) {
      console.error('Error loading fields:', err)
      setError('failed to load fields')
    }
  }

  async function loadTeamFields() {
    if (!teamId) return

    try {
      const { data, error } = await supabase
        .from('ticket_field_definitions')
        .select(`
          *,
          team_field_definitions!inner(team_id)
        `)
        .eq('team_field_definitions.team_id', teamId)
        .order('name')

      if (error) throw error
      setTeamFields(data)
    } catch (err) {
      console.error('Error loading team fields:', err)
      setError('failed to load team fields')
    }
  }

  async function createField(name: string, type: CustomField['type'], required: boolean) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('not authenticated')

      const { data, error } = await supabase
        .from('ticket_field_definitions')
        .insert({
          name,
          type,
          required,
          owner_id: user.id
        })
        .select()
        .single()

      if (error) throw error
      setFields(prev => [...prev, data])
      return data
    } catch (err) {
      console.error('Error creating field:', err)
      setError('failed to create field')
      return null
    }
  }

  async function updateField(fieldId: string, updates: Partial<CustomField>) {
    try {
      const { data, error } = await supabase
        .from('ticket_field_definitions')
        .update(updates)
        .eq('id', fieldId)
        .select()
        .single()

      if (error) throw error
      setFields(prev => prev.map(f => f.id === fieldId ? data : f))
      return data
    } catch (err) {
      console.error('Error updating field:', err)
      setError('failed to update field')
      return null
    }
  }

  async function addFieldToTeam(fieldId: string) {
    if (!teamId) return false

    try {
      const { error } = await supabase
        .from('team_field_definitions')
        .insert({
          team_id: teamId,
          field_id: fieldId
        })

      if (error) throw error
      await loadTeamFields()
      return true
    } catch (err) {
      console.error('Error adding field to team:', err)
      setError('failed to add field to team')
      return false
    }
  }

  async function removeFieldFromTeam(fieldId: string) {
    if (!teamId) return false

    try {
      const { error } = await supabase
        .from('team_field_definitions')
        .delete()
        .eq('team_id', teamId)
        .eq('field_id', fieldId)

      if (error) throw error
      await loadTeamFields()
      return true
    } catch (err) {
      console.error('Error removing field from team:', err)
      setError('failed to remove field from team')
      return false
    }
  }

  async function transferOwnership(fieldId: string, newOwnerId: string) {
    try {
      const { data, error } = await supabase
        .from('ticket_field_definitions')
        .update({ owner_id: newOwnerId })
        .eq('id', fieldId)
        .select()
        .single()

      if (error) throw error
      setFields(prev => prev.map(f => f.id === fieldId ? data : f))
      return true
    } catch (err) {
      console.error('Error transferring ownership:', err)
      setError('failed to transfer ownership')
      return false
    }
  }

  async function deleteField(fieldId: string) {
    try {
      const { error } = await supabase
        .from('ticket_field_definitions')
        .delete()
        .eq('id', fieldId)

      if (error) throw error
      setFields(prev => prev.filter(f => f.id !== fieldId))
      setTeamFields(prev => prev.filter(f => f.id !== fieldId))
      return true
    } catch (err) {
      console.error('Error deleting field:', err)
      setError('failed to delete field')
      return false
    }
  }

  return {
    fields,
    teamFields,
    loading,
    error,
    createField,
    updateField,
    addFieldToTeam,
    removeFieldFromTeam,
    transferOwnership,
    deleteField
  }
} 
```

### front/src/lib/hooks/useUsernames.tsx
```typescript
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
```

### front/src/lib/hooks/useAuth.tsx
```typescript
import * as React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../supabase';

export type Profile = {
  id: string
  username: string
  email: string
  role: 'customer' | 'worker' | 'manager'
  team_id?: string
  created_at: string
  updated_at: string
}

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, username: string, password: string, inviteId?: string | null) => Promise<void>;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUsername: (username: string) => Promise<{ error: null | Error }>;
  updatePassword: (password: string) => Promise<void>;
  updateEmail: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        getProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        getProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Subscribe to profile changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`public:profiles:id=eq.${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Profile changed:', payload);
          if (payload.new) {
            setProfile(payload.new as Profile);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  async function getProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  }

  async function validateUsername(username: string, userId?: string) {
    if (username.length < 3) {
      throw 'username must be at least 3 characters';
    }
    
    if (!/^[a-zA-Z0-9]+$/.test(username)) {
      throw 'username must be alphanumeric';
    }

    // Check if username is taken
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username);

    console.log(username, profiles)

    if (userId) {
      // For updates - check if taken by another user
      const existingUser = profiles?.find(p => p.id !== userId);
      if (existingUser) {
        throw 'username already taken';
      }
    } else {
      // For signup - check if taken by any user
      if (profiles?.length) {
        throw 'username already taken';
      }
    }
  }

  async function signUp(email: string, username: string, password: string, inviteId?: string | null) {
    try {
      await validateUsername(username);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sign-up`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ email, username, password, inviteId })
        }
      );

      const data = await response.json();
      
      if (data.error) {
        throw data.error;
      }

      // Set the session from the response
      const { session } = data;
      if (!session) throw 'signup failed';

      // Set the session in Supabase client
      await supabase.auth.setSession(session);

      // Update auth state
      setUser(session.user);
      if (session.user) {
        await getProfile(session.user.id);
      }

    } catch (error) {
      if (typeof error === 'string') {
        throw error;
      }
      throw 'signup failed';
    }
  }

  async function signIn(username: string, password: string) {
    try {
      // Call our Edge Function instead of direct DB function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sign-in-with-username`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ username, password })
        }
      )

      const data = await response.json()
      
      if (data.error) {
        throw data.error.message
      }

      // Set the session from the response
      const { session } = data
      if (!session) throw 'invalid credentials'

      // Set the session in Supabase client
      await supabase.auth.setSession(session)

      // Update auth state
      setUser(session.user)
      if (session.user) {
        await getProfile(session.user.id)
      }

    } catch (error) {
      if (typeof error === 'string') {
        throw error
      }
      throw 'invalid credentials'
    }
  }

  async function signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  async function updateUsername(username: string) {
    try {
      if (!user) throw 'no user';

      await validateUsername(username, user.id);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ username })
        .eq('id', user.id);

      if (updateError) throw 'update failed';

      setProfile(profile => profile ? { ...profile, username } : null);
      return { error: null };
    } catch (error) {
      if (typeof error === 'string') {
        throw error;
      }
      throw 'update failed';
    }
  }

  async function updatePassword(password: string) {
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw 'update failed';
    } catch (error) {
      if (typeof error === 'string') {
        throw error;
      }
      throw 'update failed';
    }
  }

  async function updateEmail(email: string) {
    try {
      if (!user) throw 'no user';

      const { error } = await supabase.rpc('update_email_admin', {
        user_id: user.id,
        new_email: email
      });

      if (error) throw 'update failed';

      // Profile will be updated automatically through realtime subscription
    } catch (error) {
      if (typeof error === 'string') {
        throw error;
      }
      throw 'update failed';
    }
  }

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateUsername,
    updatePassword,
    updateEmail,
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center h-[calc(100vh-12rem)] text-primary/70">
          loading...
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 
```

### front/src/lib/hooks/useSupabase.ts
```typescript
import { supabase } from '../supabase';

export function useSupabase() {
  return supabase;
} 
```

### front/src/lib/hooks/useTeamAssignment.ts
```typescript
import { useTeam, TeamMember } from './useTeam'

export function useTeamAssignment(userId?: string) {
  const { members, team, loading, error } = useTeam(userId)

  function getAssignableMembers(userRole: string): TeamMember[] {
    if (!userId || !members.length) return []

    if (userRole === 'manager') {
      // Managers can assign to themselves or any worker
      return [
        ...members.filter(member => member.id === userId), // Self
        ...members.filter(member => member.role === 'worker')
      ]
    } else if (userRole === 'worker') {
      // Workers can assign to themselves or their manager
      const manager = members.find(member => member.role === 'manager')
      return [
        ...members.filter(member => member.id === userId), // Self
        ...(manager ? [manager] : []) // Manager if exists
      ]
    }
    return []
  }

  return {
    members,
    team,
    loading,
    error,
    getAssignableMembers
  }
} 
```

### front/src/lib/hooks/useTeamManagement.ts
```typescript
import { useTeam } from './useTeam'
import { supabase } from '../supabase'

export function useTeamManagement(userId?: string) {
  const { members, team, loading, error, loadTeamData } = useTeam(userId)

  async function assignWorker(workerId: string) {
    if (!team?.id) return

    try {
      const { error } = await supabase
        .from('team_members')
        .insert({
          team_id: team.id,
          user_id: workerId
        })

      if (error) throw error
      await loadTeamData()
    } catch (error) {
      console.error('Error assigning worker:', error)
      throw new Error('failed to assign worker')
    }
  }

  async function unassignWorker(workerId: string) {
    if (!team?.id) return

    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('user_id', workerId)
        .eq('team_id', team.id)

      if (error) throw error
      await loadTeamData()
    } catch (error) {
      console.error('Error unassigning worker:', error)
      throw new Error('failed to unassign worker')
    }
  }

  return {
    members,
    team,
    loading,
    error,
    assignWorker,
    unassignWorker
  }
} 
```

### front/src/lib/hooks/useTags.ts
```typescript
import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

interface Tag {
  id: string
  name: string
}

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadTags()

    // Subscribe to changes
    const channel = supabase
      .channel('tags')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ticket_tags' },
        () => loadTags()
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  async function loadTags() {
    try {
      const { data, error } = await supabase
        .from('ticket_tags')
        .select('*')
        .order('name')

      if (error) throw error
      setTags(data)
    } catch (e) {
      console.error('Error loading tags:', e)
      setError('failed to load tags')
    } finally {
      setLoading(false)
    }
  }

  async function createTag(name: string) {
    try {
      const { data, error } = await supabase
        .from('ticket_tags')
        .insert({ name })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (e) {
      console.error('Error creating tag:', e)
      setError('failed to create tag')
      return null
    }
  }

  return {
    tags,
    loading,
    error,
    createTag
  }
} 
```

### front/src/lib/hooks/useNotifications.ts
```typescript
import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from './useAuth'

interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  link: string | null
  read: boolean
  created_at: string
}

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    // Load initial notifications
    loadNotifications()

    // Subscribe to new notifications
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications'
        },
        () => {
          console.log('Debug - Notification received')
          loadNotifications()
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [user])

  async function loadNotifications() {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      setNotifications(data)
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  async function markAsRead(id: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)

      if (error) throw error

      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  async function markAllAsRead() {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user?.id)

      if (error) throw error

      setNotifications(notifications.map(n => ({ ...n, read: true })))
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  return {
    notifications,
    loading,
    markAsRead,
    markAllAsRead,
  }
} 
```

### front/src/lib/hooks/useTheme.tsx
```typescript
import { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const DEFAULT_PRIMARY_COLOR = '49 100% 50%'; // Yellow

// Convert hex to HSL
function hexToHsl(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '49 100% 50%';
  
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// Convert HSL to hex
function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [primaryColor, setPrimaryColor] = useState(() => {
    const savedColor = localStorage.getItem('theme-primary-color');
    return savedColor || DEFAULT_PRIMARY_COLOR;
  });

  useEffect(() => {
    // Update CSS variables
    document.documentElement.style.setProperty('--primary', primaryColor);
    document.documentElement.style.setProperty('--foreground', primaryColor);
    document.documentElement.style.setProperty('--card-foreground', primaryColor);
    document.documentElement.style.setProperty('--popover-foreground', primaryColor);
    document.documentElement.style.setProperty('--secondary-foreground', primaryColor);
    document.documentElement.style.setProperty('--muted-foreground', primaryColor);
    document.documentElement.style.setProperty('--accent', primaryColor);
    document.documentElement.style.setProperty('--border', primaryColor);
    document.documentElement.style.setProperty('--ring', primaryColor);
    
    // Save to localStorage
    localStorage.setItem('theme-primary-color', primaryColor);
  }, [primaryColor]);

  return (
    <ThemeContext.Provider value={{ primaryColor, setPrimaryColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 
```

### front/src/lib/hooks/useProfile.ts
```typescript
import { useEffect, useState } from "react";
import { useSupabase } from "./useSupabase";
import { useAuth } from "./useAuth";

interface Profile {
  id: string;
  role: 'customer' | 'worker' | 'manager';
  username: string;
  email: string;
}

export function useProfile() {
  const supabase = useSupabase();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  async function loadProfile() {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, role, username, email")
        .eq("id", user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("error loading profile:", error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }

  return { profile, loading };
} 
```

### front/src/lib/hooks/useCustomFields.ts
```typescript
import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export interface CustomField {
  id: string
  name: string
  type: 'text' | 'number' | 'boolean' | 'date'
  required: boolean
  owner_id?: string | null
}

interface SupabaseFieldValue {
  field_id: string
  value: string
  created_at: string
  ticket_field_definitions: {
    id: string
    name: string
    type: 'text' | 'number' | 'boolean' | 'date'
    required: boolean
  }
}

export function useCustomFields(ticketId?: string) {
  const [fields, setFields] = useState<CustomField[]>([])
  const [values, setValues] = useState<Record<string, string>>({})
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (ticketId) {
      loadFields()
    }
  }, [ticketId])

  async function loadFields() {
    setLoading(true)
    setError('')
    setFieldErrors({})

    try {
      // Check if this is a template
      const { error: ticketError } = await supabase
        .from('tickets')
        .select('title')
        .eq('id', ticketId)
        .single()

      if (ticketError) throw ticketError

      // Get fields that have values for this ticket
      const { data: fieldValues, error: valuesError } = await supabase
        .from('ticket_field_values')
        .select(`
          field_id,
          value,
          created_at,
          ticket_field_definitions (
            id,
            name,
            type,
            required
          )
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })

      if (valuesError) throw valuesError

      // Transform the data
      const valueMap: Record<string, string> = {}
      const fieldsMap = new Map<string, CustomField>()
   
      ;(fieldValues as unknown as SupabaseFieldValue[])?.forEach(fv => {
        if (fv.ticket_field_definitions) {
          // Always copy field definitions
          fieldsMap.set(fv.field_id, {
            id: fv.field_id,
            name: fv.ticket_field_definitions.name,
            type: fv.ticket_field_definitions.type,
            required: fv.ticket_field_definitions.required
          })
          
          // Always copy values
          valueMap[fv.field_id] = fv.value
        }
      })

      setValues(valueMap)
      // Convert map to array in the same order as the query results
      setFields(Array.from(fieldsMap.values()))

    } catch (e) {
      console.error('Error loading fields:', e)
      setError('failed to load fields')
    } finally {
      setLoading(false)
    }
  }

  function updateValue(fieldId: string, value: string) {
    setValues(prev => ({
      ...prev,
      [fieldId]: value
    }))

    // Clear error when value changes
    setFieldErrors(prev => {
      const next = { ...prev }
      delete next[fieldId]
      return next
    })
  }

  function validateFields() {
    const errors: Record<string, string> = {}
    let isValid = true

    fields.forEach(field => {
      if (field.required) {
        const value = values[field.id]
        if (!value || value.trim() === '') {
          errors[field.id] = 'This field is required'
          isValid = false
        }
      }

      if (field.type === 'number' && values[field.id]) {
        const num = Number(values[field.id])
        if (isNaN(num)) {
          errors[field.id] = 'Must be a valid number'
          isValid = false
        }
      }
    })

    setFieldErrors(errors)
    return isValid
  }

  return {
    fields,
    values,
    fieldErrors,
    loading,
    error,
    updateValue,
    validateFields,
    loadFields
  }
} 
```

### front/src/lib/hooks/useTicketTags.ts
```typescript
import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

interface Tag {
  id: string
  name: string
}

interface TagLink {
  ticket_tags: Tag
}

export function useTicketTags(ticketId?: string) {
  const [ticketTags, setTicketTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (ticketId) {
      loadTicketTags()

      // Subscribe to changes
      const channel = supabase
        .channel('ticket-tags')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'ticket_tag_links', filter: `ticket_id=eq.${ticketId}` },
          () => loadTicketTags()
        )
        .subscribe()

      return () => {
        channel.unsubscribe()
      }
    }
  }, [ticketId])

  async function loadTicketTags() {
    if (!ticketId) return

    try {
      const { data, error } = await supabase
        .from('ticket_tag_links')
        .select('ticket_tags(id, name)')
        .eq('ticket_id', ticketId)

      if (error) throw error
      const links = data as unknown as TagLink[]
      setTicketTags(links.map(link => link.ticket_tags))
    } catch (e) {
      console.error('Error loading ticket tags:', e)
      setError('failed to load ticket tags')
    } finally {
      setLoading(false)
    }
  }

  async function addTag(tagId: string) {
    if (!ticketId) return

    try {
      const { error } = await supabase
        .from('ticket_tag_links')
        .insert({ ticket_id: ticketId, tag_id: tagId })

      if (error) throw error
      await loadTicketTags() // Reload tags to update UI immediately
    } catch (e) {
      console.error('Error adding tag:', e)
      setError('failed to add tag')
    }
  }

  async function removeTag(tagId: string) {
    if (!ticketId) {
      console.error('Cannot remove tag: no ticketId provided')
      return
    }

    try {
      console.log('Removing tag:', { ticketId, tagId })
      const { error } = await supabase
        .from('ticket_tag_links')
        .delete()
        .eq('ticket_id', ticketId)
        .eq('tag_id', tagId)

      if (error) {
        console.error('Supabase error removing tag:', error)
        throw error
      }
      
      console.log('Successfully removed tag')
      await loadTicketTags() // Reload tags to update UI
    } catch (e) {
      console.error('Error removing tag:', e)
      setError('failed to remove tag')
      throw e
    }
  }

  return {
    ticketTags,
    loading,
    error,
    addTag,
    removeTag
  }
} 
```

### front/src/lib/hooks/useUsername.ts
```typescript
import { useUsernames } from './useUsernames'

export function useUsername(userId: string | undefined | null) {
  const { usernames } = useUsernames()
  return userId ? usernames[userId] || '' : ''
} 
```

### front/src/lib/hooks/useTeams.ts
```typescript
import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

interface Team {
  id: string
  name: string
  created_at: string
  created_by: string
}

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadTeams()

    // Subscribe to changes
    const channel = supabase
      .channel('teams')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'teams'
        },
        () => {
          loadTeams()
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  async function loadTeams() {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('name')

      if (error) throw error
      setTeams(data || [])
    } catch (e) {
      console.error('Error loading teams:', e)
      setError('failed to load teams')
    } finally {
      setLoading(false)
    }
  }

  return { teams, loading, error }
} 
```

### front/src/lib/hooks/useTeam.ts
```typescript
import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useUsernames } from './useUsernames'

export interface TeamMember {
  id: string
  username: string
  role: 'worker' | 'manager'
}

export interface Team {
  id: string
  name: string
}

export function useTeam(userId?: string) {
  const { fetchUsername } = useUsernames()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [team, setTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (userId) {
      loadTeamData()

      const channel = supabase
        .channel('team-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'team_members'
          },
          () => {
            loadTeamData()
          }
        )
        .subscribe()

      return () => {
        channel.unsubscribe()
      }
    }
  }, [userId])

  // Load usernames when members change
  useEffect(() => {
    members.forEach(member => {
      fetchUsername(member.id)
    })
  }, [members])

  async function loadTeamData() {
    if (!userId) return

    try {
      // Get user's team first
      const { data: tm, error: teamError } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', userId)
        .maybeSingle()

      if (teamError) {
        console.error('Error loading team:', teamError)
        setError('failed to load team')
        return
      }

      if (!tm) {
        setMembers([])
        setTeam(null)
        setLoading(false)
        return
      }

      // Get team details
      const { data: teamData, error: teamDetailsError } = await supabase
        .from('teams')
        .select('id, name')
        .eq('id', tm.team_id)
        .single()

      if (teamDetailsError) {
        console.error('Error loading team details:', teamDetailsError)
        setError('failed to load team details')
        return
      }

      setTeam(teamData)

      // Get team members
      const { data: teamMemberships, error: membershipError } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('team_id', tm.team_id)

      if (membershipError) {
        console.error('Error loading team memberships:', membershipError)
        setError('failed to load team memberships')
        return
      }

      if (!teamMemberships.length) {
        setMembers([])
        setLoading(false)
        return
      }

      const memberIds = teamMemberships.map(m => m.user_id)

      // Get profiles for team members
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, role')
        .in('id', memberIds)

      if (profilesError) {
        console.error('Error loading profiles:', profilesError)
        setError('failed to load profiles')
        return
      }

      setMembers(profiles)
      setLoading(false)
      setError(null)
    } catch (error) {
      console.error('Error:', error)
      setError('failed to load team data')
      setLoading(false)
    }
  }

  return {
    members,
    team,
    loading,
    error,
    loadTeamData
  }
} 
```

### front/src/lib/database.types.ts
```typescript
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          email: string
          role: 'customer' | 'worker' | 'manager'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          email: string
          role: 'customer' | 'worker' | 'manager'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          email?: string
          role?: 'customer' | 'worker' | 'manager'
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
  }
} 
```

### front/src/lib/supabase.ts
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 
```

### front/src/pages/Settings.tsx
```typescript
import { useState, useEffect } from 'react';
import { useAuth } from '../lib/hooks/useAuth';
import { useTheme } from '../lib/hooks/useTheme';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { supabase } from '../lib/supabase';
import TeamMembers from '../components/settings/TeamMembers';
import { UnclaimedWorkers } from '../components/settings/UnclaimedWorkers';
import { FieldManager } from '../components/settings/FieldManager';
import { SkillManager } from '../components/settings/SkillManager'

type Status = {
  type: 'error' | 'success' | null;
  message: string;
};

export function Settings() {
  const { profile, updateUsername, updatePassword, updateEmail } = useAuth();
  const { primaryColor, setPrimaryColor } = useTheme();
  const [username, setUsername] = useState(profile?.username ?? '');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState(profile?.email ?? '');
  const [usernameStatus, setUsernameStatus] = useState<Status>({ type: null, message: '' });
  const [passwordStatus, setPasswordStatus] = useState<Status>({ type: null, message: '' });
  const [emailStatus, setEmailStatus] = useState<Status>({ type: null, message: '' });
  const [loading, setLoading] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamStatus, setTeamStatus] = useState<Status>({ type: null, message: '' });
  const [hasTeam, setHasTeam] = useState(false);
  const [teamId, setTeamId] = useState<string | null>(null);

  // Convert HSL to hex for color input
  const [currentColor, setCurrentColor] = useState(primaryColor);
  const [hue, saturation, lightness] = currentColor.split(' ').map(val => val.replace('%', ''));

  // Update local state when primaryColor changes
  useEffect(() => {
    setCurrentColor(primaryColor);
  }, [primaryColor]);

  const hslToHex = (h: number, s: number, l: number) => {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  // Convert hex to HSL for theme
  const hexToHsl = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return null;
    
    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  // Fetch users and invites if current user is a manager
  useEffect(() => {
    if (profile?.role === 'manager') {
      checkForTeam();
    }
  }, [profile]);

  useEffect(() => {
    if (profile?.username) {
      setUsername(profile.username);
    }
  }, [profile?.username]);

  async function checkForTeam() {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', profile?.id)
        .maybeSingle();

      if (error) throw error;
      setHasTeam(!!data);
      setTeamId(data?.team_id);
    } catch (error) {
      console.error('Error checking for team:', error);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameStatus({ type: null, message: '' });
    setLoading(true);

    try {
      const { error } = await updateUsername(username);
      if (error) throw error;
      setUsernameStatus({ type: 'success', message: 'username updated' });
    } catch (err) {
      if (typeof err === 'string') {
        setUsernameStatus({ type: 'error', message: err });
      } else {
        setUsernameStatus({ type: 'error', message: 'update failed' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus({ type: null, message: '' });

    if (password.length < 6) {
      setPasswordStatus({ type: 'error', message: 'password must be at least 6 characters' });
      return;
    }

    setLoading(true);

    try {
      await updatePassword(password);
      setPasswordStatus({ type: 'success', message: 'password updated' });
      setPassword('');
    } catch (err) {
      setPasswordStatus({
        type: 'error',
        message: err === 'weak password' ? 'password is too weak' : 'update failed'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    setUsernameStatus({ type: null, message: '' });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setPasswordStatus({ type: null, message: '' });
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailStatus({ type: null, message: '' });
    setLoading(true);

    try {
      await updateEmail(email);
      setEmailStatus({ type: 'success', message: 'email updated' });
    } catch (err) {
      if (typeof err === 'string') {
        setEmailStatus({ type: 'error', message: err });
      } else {
        setEmailStatus({ type: 'error', message: 'update failed' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setEmailStatus({ type: null, message: '' });
  };

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || profile.role !== 'manager') return;
    
    setTeamStatus({ type: null, message: '' });
    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-team`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify({ name: teamName })
        }
      );

      const data = await response.json();
      
      if (data.error) {
        throw data.error;
      }

      setTeamStatus({ type: 'success', message: 'team created' });
      setTeamName('');
      window.location.reload(); // Reload to update UI with new team
    } catch (error) {
      console.error('Error creating team:', error);
      setTeamStatus({ type: 'error', message: 'failed to create team' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">settings</h1>
      
      <div className="space-y-6">
        {/* Team management section */}
        {profile?.role === 'manager' && (
          <>
            {!hasTeam && (
              <Card>
                <CardContent className="space-y-4 pt-4">
                  <form onSubmit={handleCreateTeam}>
                    <div className="space-y-2">
                      <label className="text-sm text-primary/70">team name</label>
                      <Input
                        type="text"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        disabled={loading}
                        placeholder="enter team name"
                      />
                      {teamStatus.message && (
                        <p className={`text-sm ${teamStatus.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                          {teamStatus.message}
                        </p>
                      )}
                    </div>
                    <Button type="submit" disabled={loading || !teamName} className="mt-2">
                      create team
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Team members section */}
        {(profile?.role === 'manager' || profile?.role === 'worker') && (
          <TeamMembers />
        )}

        {/* Skills section */}
        {(profile?.role === 'manager' || profile?.role === 'worker') && (
          <Card>
            <CardContent className="pt-4">
              <SkillManager teamId={teamId} />
            </CardContent>
          </Card>
        )}

        {/* Field manager section */}
        {profile?.role === 'manager' && hasTeam && (
          <Card>
            <CardContent className="pt-4">
              <FieldManager teamId={teamId} />
            </CardContent>
          </Card>
        )}

        {/* User settings section */}
        <Card>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm text-primary/70">theme color</label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={hslToHex(Number(hue), Number(saturation), Number(lightness))}
                  onChange={(e) => {
                    const hsl = hexToHsl(e.target.value);
                    if (hsl) setPrimaryColor(hsl);
                  }}
                  className="w-12 h-9 p-1"
                />
                <Button
                  variant="outline"
                  onClick={() => setPrimaryColor('49 100% 50%')}
                  size="sm"
                >
                  reset
                </Button>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm text-primary/70">username</label>
                <Input
                  type="text"
                  value={username}
                  onChange={handleUsernameChange}
                  disabled={loading}
                />
                {usernameStatus.message && (
                  <p className={`text-sm ${usernameStatus.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                    {usernameStatus.message}
                  </p>
                )}
              </div>
              <Button type="submit" disabled={loading} className="mt-2">
                update username
              </Button>
            </form>

            <form onSubmit={handlePasswordSubmit}>
              <div className="space-y-2">
                <label className="text-sm text-primary/70">new password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={handlePasswordChange}
                  disabled={loading}
                />
                {passwordStatus.message && (
                  <p className={`text-sm ${passwordStatus.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                    {passwordStatus.message}
                  </p>
                )}
              </div>
              <Button type="submit" disabled={loading} className="mt-2">
                update password
              </Button>
            </form>

            <form onSubmit={handleEmailSubmit}>
              <div className="space-y-2">
                <label className="text-sm text-primary/70">email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  disabled={loading}
                />
                {emailStatus.message && (
                  <p className={`text-sm ${emailStatus.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                    {emailStatus.message}
                  </p>
                )}
              </div>
              <Button type="submit" disabled={loading} className="mt-2">
                update email
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Unclaimed workers section */}
        {profile?.role === 'manager' && hasTeam && (
          <UnclaimedWorkers />
        )}
      </div>
    </div>
  );
} 
```

### front/src/pages/kb/index.tsx
```typescript
import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ArticleList } from "../../components/kb/ArticleList";
import { ArticleEditor } from "../../components/kb/ArticleEditor";
import { useSupabase } from "../../lib/hooks/useSupabase";

interface Article {
  id: string;
  title: string;
  content: string;
  summary?: string;
  published: boolean;
}

export default function KnowledgeBase() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { pathname } = useLocation();
  const supabase = useSupabase();
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(false);

  const isNew = pathname === '/kb/new';

  useEffect(() => {
    if (id && !isNew) {
      loadArticle(id);
    } else {
      setSelectedArticle(null);
    }
  }, [id, isNew]);

  async function loadArticle(articleId: string) {
    try {
      setLoading(true);

      // Get article metadata
      const { data: article, error: articleError } = await supabase
        .from("kb_articles")
        .select("id, title, summary, published")
        .eq("id", articleId)
        .single();

      if (articleError) throw articleError;

      // Get article content
      const { data, error: storageError } = await supabase.storage
        .from("kb")
        .download(`${articleId}.md`);

      if (storageError) throw storageError;

      const content = await data.text();

      setSelectedArticle({
        id: article.id,
        title: article.title,
        content,
        summary: article.summary,
        published: article.published
      });
    } catch (error) {
      console.error("error loading article:", error);
      navigate("/kb");
    } finally {
      setLoading(false);
    }
  }

  function handleSave() {
    navigate("/kb");
  }

  function handleCancel() {
    navigate("/kb");
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex h-32 items-center justify-center text-primary/70">
          loading article...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-primary mb-6">knowledge base</h1>

      {id || isNew ? (
        <ArticleEditor
          id={selectedArticle?.id}
          initialTitle={selectedArticle?.title}
          initialContent={selectedArticle?.content}
          initialSummary={selectedArticle?.summary}
          initialPublished={selectedArticle?.published}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      ) : (
        <ArticleList />
      )}
    </div>
  );
} 
```

### front/src/pages/Login.tsx
```typescript
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/hooks/useAuth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardFooter } from '../components/ui/card';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Properly construct the from path
  const from = location.state?.from 
    ? `${location.state.from.pathname}${location.state.from.search || ''}`
    : '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(username, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err as string);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-3rem)] items-center justify-center">
      <Card className="w-[320px]">
        <form onSubmit={handleSubmit}>
          <CardContent className="pt-4">
            <div className="text-center mb-4">
              <h1 className="text-lg font-semibold">auto-crm</h1>
              <p className="text-sm text-primary/70">sign in to your account</p>
            </div>
            {error && (
              <p className="mb-2 text-sm text-destructive">{error}</p>
            )}
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoCapitalize="none"
                disabled={loading}
              />
              <Input
                type="password"
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex-col space-y-2">
            <Button className="w-full" disabled={loading}>
              {loading ? 'signing in...' : 'sign in'}
            </Button>
            <Button variant="ghost" asChild className="w-full">
              <Link to="/signup" state={location.state}>need an account?</Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 
```

### front/src/pages/Dashboard.tsx
```typescript
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/hooks/useAuth'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/button'
import { FeedbackBarGraph } from '../components/feedback/FeedbackBarGraph'
import { TeamFeedbackRanking } from '../components/feedback/TeamFeedbackRanking'
import { useFeedback } from '../lib/hooks/useFeedback'

interface TicketCounts {
  total: number
  new: number
  new_assigned: number
  open: number
  pending: number
  resolved: number
  recently_closed: number
  urgent: number
  high: number
  assigned: number
  unassigned: number
}

export function Dashboard() {
  const { profile, loading: profileLoading } = useAuth()
  const { loading: feedbackLoading, personalStats, teamStats, teamMemberStats } = useFeedback()
  const [counts, setCounts] = useState<TicketCounts>({
    total: 0,
    new: 0,
    new_assigned: 0,
    open: 0,
    pending: 0,
    resolved: 0,
    recently_closed: 0,
    urgent: 0,
    high: 0,
    assigned: 0,
    unassigned: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!profileLoading && profile) {
      loadCounts()

      // Subscribe to ticket changes
      const channel = supabase
        .channel('dashboard_tickets')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tickets',
          },
          () => {
            loadCounts()
          }
        )
        .subscribe()

      return () => {
        channel.unsubscribe()
      }
    }
  }, [profile, profileLoading])

  if (loading && profileLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center h-[calc(100vh-12rem)] text-primary/70">
          loading dashboard...
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center h-[calc(100vh-12rem)] text-primary/70">
          loading profile...
        </div>
      </div>
    )
  }

  const loadCounts = async () => {
    try {
      // Get date 7 days ago
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      // Only check team membership for workers
      let teamData = null
      if (profile.role === 'worker') {
        const { data, error: teamError } = await supabase
          .from('team_members')
          .select('team_id')
          .eq('user_id', profile.id)
          .single()

        if (teamError && teamError.code !== 'PGRST116') throw teamError // PGRST116 is "no rows returned"
        teamData = data

        // Workers need a team
        if (!teamData) {
          setError('no team assigned')
          return
        }
      }

      // Base query will respect RLS policies
      const { data, error } = await supabase
        .from('tickets')
        .select('status, priority, assigned_to, updated_at, title, team_id, created_by')
        .not('title', 'like', 'template:%')

      if (error) throw error

      if (data) {
        // Filter tickets based on role
        let relevantTickets = []
        let activeTickets = []

        if (profile.role === 'customer') {
          // For customers, show their own tickets
          relevantTickets = data.filter(t => t.created_by === profile.id)
          activeTickets = relevantTickets.filter(t => t.status !== 'closed')
          const unresolvedTickets = relevantTickets.filter(t => t.status !== 'resolved' && t.status !== 'closed')

          setCounts({
            total: unresolvedTickets.length,
            new: activeTickets.filter(t => t.status === 'new').length,
            new_assigned: 0,
            open: activeTickets.filter(t => t.status === 'open').length,
            pending: activeTickets.filter(t => t.status === 'pending').length,
            resolved: relevantTickets.filter(t => t.status === 'resolved').length,
            recently_closed: relevantTickets.filter(t => 
              t.status === 'closed' && 
              new Date(t.updated_at) >= sevenDaysAgo
            ).length,
            urgent: activeTickets.filter(t => t.priority === 'urgent').length,
            high: activeTickets.filter(t => t.priority === 'high').length,
            assigned: activeTickets.filter(t => t.assigned_to !== null).length,
            unassigned: relevantTickets.filter(t => t.assigned_to === null).length
          })
        } else {
          // For workers/managers, show team tickets
          relevantTickets = data.filter(t => t.team_id === teamData?.team_id)
          activeTickets = relevantTickets.filter(t => t.status !== 'closed')

          const unclaimedTeamTickets = activeTickets.filter(t => t.assigned_to === null)
          const noTeamTickets = data.filter(t => t.team_id === null)
          const activeNoTeamTickets = noTeamTickets.filter(t => t.status !== 'closed')

          setCounts({
            total: activeTickets.length,
            new: activeTickets.filter(t => t.status === 'new').length,
            new_assigned: activeTickets.filter(t => t.status === 'new' && t.assigned_to === profile.id).length,
            open: activeTickets.filter(t => t.status === 'open').length,
            pending: activeTickets.filter(t => t.status === 'pending').length,
            resolved: relevantTickets.filter(t => t.status === 'resolved').length,
            recently_closed: relevantTickets.filter(t => 
              t.status === 'closed' && 
              new Date(t.updated_at) >= sevenDaysAgo
            ).length,
            urgent: activeTickets.filter(t => t.priority === 'urgent').length,
            high: activeTickets.filter(t => t.priority === 'high').length,
            assigned: activeTickets.filter(t => t.assigned_to !== null).length,
            unassigned: profile.role === 'manager' ? activeNoTeamTickets.length : unclaimedTeamTickets.length
          })
        }
      }
    } catch (e) {
      console.error('Error loading counts:', e)
      setError('failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
          <div className="text-center">
            <div className="text-red-600 mb-4">{error}</div>
            {error === 'no team assigned' && profile.role === 'worker' && (
              <div className="text-primary/70">
                please wait to be assigned to a team by a manager
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (profile.role === 'manager') {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-primary">dashboard</h1>
          <div className="flex gap-2">
            <Link to="/tickets/new">
              <Button>new ticket</Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-background border border-primary shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-primary mb-4">team statuses</h2>
            <div className="space-y-2">
              <Link to="/tickets?status=new&assigned=my-team&view=tickets" className="flex justify-between px-2 py-1 rounded-md hover:bg-primary/5">
                <span className="text-primary">new</span>
                <span className="text-primary">{counts.new}</span>
              </Link>
              <Link to="/tickets?status=open&assigned=my-team&view=tickets" className="flex justify-between px-2 py-1 rounded-md hover:bg-primary/5">
                <span className="text-primary">open</span>
                <span className="text-primary">{counts.open}</span>
              </Link>
              <Link to="/tickets?status=pending&assigned=my-team&view=tickets" className="flex justify-between px-2 py-1 rounded-md hover:bg-primary/5">
                <span className="text-primary">pending</span>
                <span className="text-primary">{counts.pending}</span>
              </Link>
              <Link to="/tickets?status=resolved&assigned=my-team&view=tickets" className="flex justify-between px-2 py-1 rounded-md hover:bg-primary/5">
                <span className="text-primary">resolved</span>
                <span className="text-primary">{counts.resolved}</span>
              </Link>
              <Link to="/tickets?status=closed&assigned=my-team&view=tickets&closed_after=7d" className="flex justify-between px-2 py-1 rounded-md hover:bg-primary/5">
                <span className="text-primary">recently closed</span>
                <span className="text-primary">{counts.recently_closed}</span>
              </Link>
            </div>
          </div>

          <div className="bg-background border border-primary shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-primary mb-4">priorities</h2>
            <div className="space-y-2">
              <Link to="/tickets?priority=urgent&assigned=my-team&view=tickets" className="flex justify-between px-2 py-1 rounded-md hover:bg-red-500/5">
                <span className="text-red-500">urgent</span>
                <span className="text-red-500">{counts.urgent}</span>
              </Link>
              <Link to="/tickets?priority=high&assigned=my-team&view=tickets" className="flex justify-between px-2 py-1 rounded-md hover:bg-orange-500/5">
                <span className="text-orange-500">high</span>
                <span className="text-orange-500">{counts.high}</span>
              </Link>
              <Link to="/tickets?assigned=unassigned&status=active&view=tickets" className="flex justify-between px-2 py-1 rounded-md hover:bg-primary/5">
                <span className="text-primary">unassigned</span>
                <span className="text-primary">{counts.unassigned}</span>
              </Link>
            </div>
          </div>

          <div className="bg-background border border-primary shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-primary mb-4">team feedback</h2>
            {feedbackLoading ? (
              <div className="text-sm text-primary/70">loading feedback...</div>
            ) : (
              <FeedbackBarGraph stats={teamStats} />
            )}
          </div>

          <div className="bg-background border border-primary shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-primary mb-4">member ratings</h2>
            {feedbackLoading ? (
              <div className="text-sm text-primary/70">loading ratings...</div>
            ) : (
              <TeamFeedbackRanking members={teamMemberStats} />
            )}
          </div>
        </div>
      </div>
    )
  }

  if (profile.role === 'worker') {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-primary">dashboard</h1>
          <div className="flex gap-2">
            <Link to="/tickets/new">
              <Button>new ticket</Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-background border border-primary shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-primary mb-4">ticket overview</h2>
            <div className="space-y-2">
              <Link to="/tickets?status=new&assigned=my-team&view=tickets" className="flex justify-between px-2 py-1 rounded-md hover:bg-primary/5">
                <span className="text-primary">new team tickets</span>
                <span className="text-primary">{counts.new}</span>
              </Link>
              <Link to={`/tickets?assigned=me&status=active&view=tickets`} className="flex justify-between px-2 py-1 rounded-md hover:bg-primary/5">
                <span className="text-primary">assigned to me</span>
                <span className="text-primary">{counts.assigned}</span>
              </Link>
              <Link to={`/tickets?priority=urgent&assigned=me&status=active&view=tickets`} className="flex justify-between px-2 py-1 rounded-md hover:bg-red-500/5">
                <span className="text-red-500">urgent</span>
                <span className="text-red-500">{counts.urgent}</span>
              </Link>
              <Link to={`/tickets?priority=high&assigned=me&status=active&view=tickets`} className="flex justify-between px-2 py-1 rounded-md hover:bg-orange-500/5">
                <span className="text-orange-500">high</span>
                <span className="text-orange-500">{counts.high}</span>
              </Link>
            </div>
          </div>

          <div className="bg-background border border-primary shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-primary mb-4">ticket status</h2>
            <div className="space-y-2">
              <Link to="/tickets?status=new&assigned=me&view=tickets" className="flex justify-between px-2 py-1 rounded-md hover:bg-primary/5">
                <span className="text-primary">new</span>
                <span className="text-primary">{counts.new_assigned}</span>
              </Link>
              <Link to="/tickets?status=open&assigned=me&view=tickets" className="flex justify-between px-2 py-1 rounded-md hover:bg-primary/5">
                <span className="text-primary">open</span>
                <span className="text-primary">{counts.open}</span>
              </Link>
              <Link to="/tickets?status=pending&assigned=me&view=tickets" className="flex justify-between px-2 py-1 rounded-md hover:bg-primary/5">
                <span className="text-primary">pending</span>
                <span className="text-primary">{counts.pending}</span>
              </Link>
              <Link to="/tickets?status=resolved&assigned=me&view=tickets" className="flex justify-between px-2 py-1 rounded-md hover:bg-primary/5">
                <span className="text-primary">resolved</span>
                <span className="text-primary">{counts.resolved}</span>
              </Link>
              <Link to="/tickets?status=closed&assigned=me&closed_after=7d&view=tickets" className="flex justify-between px-2 py-1 rounded-md hover:bg-primary/5">
                <span className="text-primary">recently closed</span>
                <span className="text-primary">{counts.recently_closed}</span>
              </Link>
            </div>
          </div>

          <div className="bg-background border border-primary shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-primary mb-4">my feedback</h2>
            {feedbackLoading ? (
              <div className="text-sm text-primary/70">loading feedback...</div>
            ) : (
              <FeedbackBarGraph stats={personalStats} />
            )}
          </div>
        </div>
      </div>
    )
  }

  // Customer view
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-primary">my tickets</h1>
        <div className="flex gap-2">
          <Link to="/tickets/new">
            <Button>new ticket</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-background border border-primary shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-primary mb-4">ticket status</h2>
          <div className="space-y-2">
            <Link to="/tickets?status=unresolved&view=tickets" className="flex justify-between px-2 py-1 rounded-md hover:bg-primary/5">
              <span className="text-primary">unresolved tickets</span>
              <span className="text-primary">{counts.total}</span>
            </Link>
            <Link to="/tickets?status=resolved&view=tickets" className="flex justify-between px-2 py-1 rounded-md hover:bg-primary/5">
              <span className="text-primary">resolved</span>
              <span className="text-primary">{counts.resolved}</span>
            </Link>
            <Link to="/tickets?status=closed&closed_after=7d&view=tickets" className="flex justify-between px-2 py-1 rounded-md hover:bg-primary/5">
              <span className="text-primary">recently closed</span>
              <span className="text-primary">{counts.recently_closed}</span>
            </Link>
          </div>
        </div>

        <div className="bg-background border border-primary shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-primary mb-4">quick actions</h2>
          <div className="space-y-4">
            <Link to="/tickets/new" className="block">
              <Button className="w-full">create ticket</Button>
            </Link>
            <Link to="/tickets" className="block">
              <Button variant="outline" className="w-full">view tickets</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 
```

### front/src/pages/Logout.tsx
```typescript
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
```

### front/src/pages/ResetPassword.tsx
```typescript
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

export function ResetPassword() {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(undefined);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ identifier })
        }
      );

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'reset failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-3rem)] items-center justify-center">
      <Card className="w-[320px]">
        {success ? (
          <CardContent className="pt-4 text-center space-y-4">
            <div className="mb-4">
              <h1 className="text-lg font-semibold">auto-crm</h1>
              <p className="text-sm text-gray-600">check your email for a reset link</p>
            </div>
            <Button variant="ghost" asChild className="w-full">
              <Link to="/login">back to login</Link>
            </Button>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="pt-4">
              <div className="text-center mb-4">
                <h1 className="text-lg font-semibold">auto-crm</h1>
                <p className="text-sm text-gray-600">reset your password</p>
              </div>
              {error && (
                <p className="mb-2 text-sm text-destructive">{error}</p>
              )}
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="username or email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoCapitalize="none"
                  disabled={loading}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex-col space-y-2">
              <Button className="w-full" disabled={loading}>
                {loading ? 'sending...' : 'reset password'}
              </Button>
              <Button variant="ghost" asChild className="w-full">
                <Link to="/login">back to login</Link>
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
} 
```

### front/src/pages/Signup.tsx
```typescript
import { useState, useEffect } from 'react';
import { Link, useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/hooks/useAuth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardFooter } from '../components/ui/card';
import { supabase } from '../lib/supabase';

export function Signup() {
  const [searchParams] = useSearchParams();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [inviteRole, setInviteRole] = useState<string | null>(null);
  const { signUp } = useAuth();
  const inviteId = searchParams.get('invite');
  const location = useLocation();
  const navigate = useNavigate();
  
  // Use location state for all redirects
  const from = location.state?.from
    ? `${location.state.from.pathname}${location.state.from.search || ''}`
    : '/';

  useEffect(() => {
    async function fetchInvite() {
      if (!inviteId) return;
      
      try {
        const { data, error } = await supabase
          .from('team_invites')
          .select('role')
          .eq('id', inviteId)
          .eq('status', 'pending')
          .single();

        if (error) throw error;
        if (data) setInviteRole(data.role);
      } catch (err) {
        console.error('Error fetching invite:', err);
        setError('invalid or expired invite');
      }
    }

    fetchInvite();
  }, [inviteId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signUp(email, username, password, inviteId);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err as string);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-3rem)] items-center justify-center">
      <Card className="w-[320px]">
        <form onSubmit={handleSubmit}>
          <CardContent className="pt-4">
            <div className="text-center mb-4">
              {inviteRole ? (
                <p className="text-sm text-primary/70 mb-2">create {inviteRole} account</p>
              ) : (
                <p className="text-sm text-primary/70 mb-2">create your account</p>
              )}
            </div>
            {error && (
              <p className="mb-2 text-sm text-destructive">{error}</p>
            )}
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoCapitalize="none"
                disabled={loading}
              />
              <Input
                type="email"
                placeholder="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoCapitalize="none"
                disabled={loading}
              />
              <Input
                type="password"
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex-col space-y-2">
            <Button className="w-full" disabled={loading}>
              {loading ? 'signing up...' : 'sign up'}
            </Button>
            <Button variant="ghost" asChild className="w-full">
              <Link to="/login" state={location.state}>have an account?</Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 
```

### front/src/pages/Landing.tsx
```typescript
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { SupabaseStatus } from '../components/ui/supabase-status';

export function Landing() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-4 py-12">
      <h1 className="text-2xl font-medium">welcome to auto-crm</h1>
      <p className="text-sm text-muted-foreground">
        modern customer support system
      </p>
      <div className="flex gap-2">
        <Button asChild>
          <Link to="/signup">sign up</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/login">sign in</Link>
        </Button>
      </div>
      <SupabaseStatus />
    </div>
  );
} 
```

### front/src/pages/UpdatePassword.tsx
```typescript
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/hooks/useAuth';

export function UpdatePassword() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Check for recovery token on load
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Allow if user is logged in or has recovery token
      if (!session?.user && !user) {
        navigate('/login');
      }
    };

    checkAuth();
  }, [navigate, user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(undefined);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        // Handle Supabase's "Password should be different from the old password" error
        if (error.message.includes('different from the old password')) {
          throw new Error('new password must be different');
        }
        throw error;
      }

      // Password updated successfully
      navigate('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'update failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-3rem)] items-center justify-center">
      <Card className="w-[320px]">
        <form onSubmit={handleSubmit}>
          <CardContent className="pt-4">
            {error && (
              <p className="mb-2 text-sm text-destructive">{error}</p>
            )}
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex-col space-y-2">
            <Button className="w-full" disabled={loading}>
              {loading ? 'updating...' : 'update password'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 
```

### front/src/pages/help/index.tsx
```typescript
import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useSupabase } from "../../lib/hooks/useSupabase";
import { ArticleViewer } from "../../components/kb/ArticleViewer";
import { Button } from "../../components/ui/button";
import { useUsernames } from "../../lib/hooks/useUsernames";
import { useProfile } from "../../lib/hooks/useProfile";

interface Article {
  id: string;
  title: string;
  summary?: string;
  created_at: string;
  created_by: string;
}

export default function Help() {
  const navigate = useNavigate();
  const { id } = useParams();
  const supabase = useSupabase();
  const [articles, setArticles] = useState<Article[]>([]);
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { usernames, fetchUsername } = useUsernames();
  const { profile, loading: profileLoading } = useProfile();

  // Only load articles after profile is loaded
  useEffect(() => {
    if (!profileLoading) {
      loadArticles();
    }
  }, [profileLoading]);

  // Only load article after profile is loaded
  useEffect(() => {
    if (!profileLoading && id) {
      loadArticle(id);
    } else if (!id) {
      setCurrentArticle(null);
    }
  }, [id, profileLoading]);

  // Load usernames when articles or current article changes
  useEffect(() => {
    articles.forEach(article => {
      if (article.created_by) {
        fetchUsername(article.created_by);
      }
    });
    if (currentArticle?.created_by) {
      fetchUsername(currentArticle.created_by);
    }
  }, [articles, currentArticle, fetchUsername]);

  async function loadArticle(articleId: string) {
    try {
      // Only filter by published for customers
      let query = supabase
        .from("kb_articles")
        .select("id, title, summary, created_at, created_by")
        .eq("id", articleId);

      // Only filter by published for non-staff
      if (!profile?.role || profile.role === 'customer') {
        query = query.eq("published", true);
      }

      const { data, error } = await query.single();

      if (error) throw error;
      if (data) {
        setCurrentArticle(data);
      }
    } catch (error) {
      console.error("error loading article:", error);
      setError('failed to load article');
      navigate("/help");
    }
  }

  async function loadArticles() {
    try {
      // Only filter by published for customers
      let query = supabase
        .from("kb_articles")
        .select("id, title, summary, created_at, created_by")
        .order("created_at", { ascending: false });

      // Only filter by published for non-staff  
      if (!profile?.role || profile.role === 'customer') {
        query = query.eq("published", true);
      }

      const { data, error } = await query;

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error("error loading articles:", error);
      setError('failed to load articles');
    } finally {
      setLoading(false);
    }
  }

  if (profileLoading || loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex h-32 items-center justify-center text-primary/70">
          loading articles...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex h-32 items-center justify-center text-red-500">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary">help center</h1>
      </div>
      
      {id && currentArticle ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-medium text-primary mb-1">
                {currentArticle.title}
              </h2>
              {currentArticle.summary && (
                <p className="text-sm text-primary/70 mb-2">{currentArticle.summary}</p>
              )}
              <div className="flex items-center gap-2 text-xs text-primary/50">
                <span>by {usernames[currentArticle.created_by] || 'unknown'}</span>
                <span>•</span>
                <span>{new Date(currentArticle.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/help")}
            >
              back to articles
            </Button>
          </div>
          <div className="bg-background border border-primary shadow rounded-lg overflow-hidden p-6">
            <ArticleViewer id={currentArticle.id} />
          </div>
        </div>
      ) : (
        <div className="bg-background border border-primary shadow rounded-lg overflow-hidden">
          <div className="divide-y divide-primary/20">
            {articles.length > 0 ? articles.map((article) => (
              <Link
                key={article.id}
                to={`/help/${article.id}`}
                className="block hover:bg-primary/5 p-4"
              >
                <h3 className="text-lg font-medium text-primary hover:text-primary/90 mb-1">{article.title}</h3>
                {article.summary && (
                  <p className="text-sm text-primary/70 mb-2">{article.summary}</p>
                )}
                <div className="flex items-center gap-2 text-xs text-primary/50">
                  <span>by {usernames[article.created_by] || 'unknown'}</span>
                  <span>•</span>
                  <span>{new Date(article.created_at).toLocaleDateString()}</span>
                </div>
              </Link>
            )) : (
              <div className="flex h-[100px] items-center justify-center text-sm text-primary/70">
                no published articles yet
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 
```
\n## Back-end\n

### back/supabase/migrations/20240101000002_init.sql
```sql
-- Drop everything
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists handle_new_user();
drop publication if exists supabase_realtime;
drop table if exists profiles;

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create profiles table
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  email text unique not null,
  role text not null check (role in ('customer', 'worker', 'manager')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table profiles enable row level security;

-- Create updated_at function
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create updated_at trigger for profiles
create trigger set_updated_at
  before update on profiles
  for each row
  execute procedure handle_updated_at();

-- Create policies to allow users to read and update their own profiles
create policy "Users can read their own full profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Anyone can read username and role"
  on profiles for select
  using (true);

-- Create a separate policy for email access
alter table profiles alter column email set default '';
create policy "Only self can read email"
  on profiles for select
  using (auth.uid() = id AND current_setting('app.current_field') = 'email');

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- Create policy for role updates
create policy "Only managers can update roles"
  on profiles for update using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'manager'
    )
  )
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'manager'
    )
  );

-- Create policy to allow users to create their own profiles
create policy "Users can create their own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- Create realtime publication
create publication supabase_realtime;
alter publication supabase_realtime add table profiles;

-- Create a secure function to update email without confirmation
create or replace function update_email_admin(user_id uuid, new_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Update auth.users email directly
  update auth.users 
  set email = new_email,
      email_confirmed_at = now(),
      updated_at = now()
  where id = user_id;

  -- Update profiles email
  update public.profiles
  set email = new_email
  where id = user_id;
end;
$$;

grant execute on function update_email_admin(uuid, text) to authenticated; 
```

### back/supabase/migrations/20240117000001_notification_triggers.sql
```sql
-- Create notification functions
create or replace function handle_ticket_comment()
returns trigger as $$
declare
  ticket_record record;
begin
  -- Get ticket details
  select created_by, assigned_to, title into ticket_record
  from tickets where id = NEW.ticket_id;
  
  -- Don't notify for internal comments
  if NEW.internal then
    return NEW;
  end if;

  -- Notify ticket creator if comment is by someone else
  if ticket_record.created_by != NEW.created_by then
    insert into notifications (user_id, type, title, link)
    values (
      ticket_record.created_by,
      'comment_added',
      'new comment on your ticket "' || ticket_record.title || '"',
      '/tickets/' || NEW.ticket_id
    );
  end if;

  -- Notify assigned worker if comment is by someone else
  if ticket_record.assigned_to is not null and ticket_record.assigned_to != NEW.created_by then
    insert into notifications (user_id, type, title, link)
    values (
      ticket_record.assigned_to,
      'comment_added',
      'new comment on ticket "' || ticket_record.title || '"',
      '/tickets/' || NEW.ticket_id
    );
  end if;

  return NEW;
end;
$$ language plpgsql security definer;

create or replace function handle_ticket_status()
returns trigger as $$
begin
  -- Only notify if status has changed
  if (TG_OP = 'UPDATE' and NEW.status is distinct from OLD.status) then
    -- Notify ticket creator
    insert into notifications (user_id, type, title, link)
    values (
      NEW.created_by,
      'status_changed',
      'ticket "' || NEW.title || '" status changed to ' || NEW.status,
      '/tickets/' || NEW.id
    );
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

-- Create triggers
create trigger on_ticket_comment
  after insert on ticket_comments
  for each row
  execute function handle_ticket_comment();

create trigger on_ticket_status
  after update on tickets
  for each row
  execute function handle_ticket_status();
```

### back/supabase/migrations/20240117000000_notifications.sql
```sql
-- Create notifications table
create table notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null,
  type text not null,
  title text not null,
  link text,
  read boolean default false,
  created_at timestamptz default now()
);

-- Enable RLS
alter table notifications enable row level security;

-- Enable realtime
alter publication supabase_realtime add table notifications;

-- RLS policies
create policy "Users can view own notifications"
  on notifications for select
  using (auth.uid() = user_id);

create policy "System can create notifications"
  on notifications for insert
  with check (true);

create policy "Users can mark as read"
  on notifications for update
  using (auth.uid() = user_id);

-- Function to clean up old notifications
create or replace function cleanup_old_notifications()
returns trigger as $$
begin
  delete from notifications
  where created_at < now() - interval '30 days';
  return null;
end;
$$ language plpgsql security definer;

-- Trigger to run cleanup daily
create trigger cleanup_notifications_trigger
  after insert on notifications
  execute function cleanup_old_notifications(); 
```

### back/supabase/migrations/20240101000000_reset.sql
```sql
-- Drop our publication first (ignore Supabase's internal ones)
DROP PUBLICATION IF EXISTS supabase_realtime;

-- Drop all tables in public schema
DO $$ 
DECLARE 
  r RECORD;
BEGIN
  -- Disable RLS temporarily
  SET session_replication_role = 'replica';

  -- Drop tables
  FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
  LOOP
    EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
  END LOOP;

  -- Drop functions
  FOR r IN (
    SELECT ns.nspname as schema, p.proname as name, pg_get_function_identity_arguments(p.oid) as args
    FROM pg_proc p 
    JOIN pg_namespace ns ON p.pronamespace = ns.oid
    WHERE ns.nspname = 'public'
  )
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS public.' || quote_ident(r.name) || '(' || r.args || ') CASCADE';
  END LOOP;

  -- Drop types
  FOR r IN (
    SELECT t.typname
    FROM pg_type t
    JOIN pg_namespace ns ON t.typnamespace = ns.oid
    WHERE ns.nspname = 'public'
    AND t.typtype = 'c'
  )
  LOOP
    EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(r.typname) || ' CASCADE';
  END LOOP;

  -- Drop sequences
  FOR r IN (
    SELECT sequence_name 
    FROM information_schema.sequences 
    WHERE sequence_schema = 'public'
  )
  LOOP
    EXECUTE 'DROP SEQUENCE IF EXISTS public.' || quote_ident(r.sequence_name) || ' CASCADE';
  END LOOP;

  -- Truncate auth tables (except migrations)
  FOR r IN (
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'auth' 
    AND tablename != 'schema_migrations'
  )
  LOOP
    EXECUTE 'TRUNCATE auth.' || quote_ident(r.tablename) || ' CASCADE';
  END LOOP;

  -- Drop policies
  FOR r IN (
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  )
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || 
      quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
  END LOOP;

  -- Clean storage
  DELETE FROM storage.objects;
  DELETE FROM storage.buckets;

  -- Reset RLS
  SET session_replication_role = 'origin';
END $$;
```

### back/supabase/migrations/20240101000001_auth_triggers.sql
```sql
-- Create auth user handler function
create or replace function handle_auth_user()
returns trigger as $$
begin
  new.created_by = auth.uid();
  return new;
end;
$$ language plpgsql security definer; 
```

### back/supabase/migrations/20240101000003_tickets.sql
```sql
-- Create teams table first
create table teams (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

-- Enable RLS for teams
alter table teams enable row level security;

-- Create team members table
create table team_members (
  team_id uuid references teams(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  primary key (team_id, user_id)
);

-- Enable RLS for team members
alter table team_members enable row level security;

-- Then create tickets that reference teams
create table tickets (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  status text not null default 'new',
  priority text not null default 'medium',
  restricted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  assigned_to uuid references auth.users(id) on delete set null,
  team_id uuid references teams(id) on delete set null,
  constraint valid_status check (status in ('new', 'open', 'pending', 'resolved', 'closed')),
  constraint valid_priority check (priority in ('low', 'medium', 'high', 'urgent'))
);

-- Finally create tables that reference tickets
create table ticket_comments (
  id uuid default gen_random_uuid() primary key,
  ticket_id uuid references tickets(id) on delete cascade not null,
  content text not null,
  internal boolean not null default false,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create table ticket_feedback (
  id uuid default gen_random_uuid() primary key,
  ticket_id uuid references tickets(id) on delete cascade not null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

-- Enable RLS
alter table tickets enable row level security;

-- Create policies
create policy "Customers can view their own tickets"
  on tickets for select
  using (created_by = auth.uid());

create policy "Everyone can view templates"
  on tickets for select
  using (title like 'template: %');

create policy "Workers can view unrestricted tickets"
  on tickets for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'worker'
    )
    and not restricted
  );

create policy "Managers can view all tickets"
  on tickets for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'manager'
    )
  );

create policy "Assigned workers can update their tickets"
  on tickets for update
  using (assigned_to = auth.uid())
  with check (assigned_to = auth.uid());

create policy "Managers can update any ticket"
  on tickets for update
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'manager'
    )
  );

create policy "Workers can assign/unassign themselves"
  on tickets for update
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'worker'
    )
    and (
      -- Allow unassigning if currently assigned to me
      assigned_to = auth.uid()
      or
      -- Allow assigning if currently unassigned
      assigned_to is null
    )
  )
  with check (
    -- Can only set assigned_to to myself or null
    assigned_to is null 
    or 
    assigned_to = auth.uid()
  );

-- Trigger for updated_at
create trigger set_updated_at
  before update on tickets
  for each row
  execute procedure handle_updated_at();

-- After existing tickets table...

-- Enable RLS
alter table ticket_comments enable row level security;

-- Comment policies
create policy "Customers can view non-internal comments on their tickets"
  on ticket_comments for select
  using (
    not internal and
    exists (
      select 1 from tickets
      where id = ticket_id
      and created_by = auth.uid()
    )
  );

create policy "Workers can view all comments on their assigned tickets"
  on ticket_comments for select
  using (
    exists (
      select 1 from tickets
      where id = ticket_id
      and assigned_to = auth.uid()
    )
  );

create policy "Workers can view comments on viewable tickets"
  on ticket_comments for select
  using (
    exists (
      select 1 from tickets t
      join profiles p on p.id = auth.uid()
      where t.id = ticket_id
      and p.role = 'worker'
      and not t.restricted
    )
  );

create policy "Managers can view all comments"
  on ticket_comments for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'manager'
    )
  );

create policy "Customers can comment on their tickets"
  on ticket_comments for insert
  with check (
    exists (
      select 1 from tickets
      where id = ticket_id
      and created_by = auth.uid()
    )
  );

create policy "Workers can comment on their assigned tickets"
  on ticket_comments for insert
  with check (
    exists (
      select 1 from tickets
      where id = ticket_id
      and assigned_to = auth.uid()
    )
  );

create policy "Managers can comment on any ticket"
  on ticket_comments for insert
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'manager'
    )
  );

create table ticket_tags (
  id uuid default gen_random_uuid() primary key,
  name text unique not null
);

create table ticket_tag_links (
  ticket_id uuid references tickets(id) on delete cascade,
  tag_id uuid references ticket_tags(id) on delete cascade,
  primary key (ticket_id, tag_id)
);

-- Enable RLS
alter table ticket_tags enable row level security;
alter table ticket_tag_links enable row level security;

-- Tag policies
create policy "Everyone can view tags"
  on ticket_tags for select
  using (true);

create policy "Managers can manage tags"
  on ticket_tags for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role = 'manager'
    )
  );

-- Tag link policies follow ticket visibility
create policy "Can view tags on viewable tickets"
  on ticket_tag_links for select
  using (
    exists (
      select 1 from tickets
      where id = ticket_id
      and (
        created_by = auth.uid()
        or (
          exists (
            select 1 from profiles p
            where p.id = auth.uid()
            and p.role in ('worker', 'manager')
            and (not restricted or p.role = 'manager')
          )
        )
      )
    )
  );

-- Custom fields schema
create table ticket_field_definitions (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  type text not null check (type in ('text', 'number', 'boolean', 'date')),
  required boolean not null default false,
  created_at timestamptz not null default now(),
  owner_id uuid references auth.users(id) on delete set null
);

-- Create team field definitions link table
create table team_field_definitions (
  team_id uuid references teams(id) on delete cascade,
  field_id uuid references ticket_field_definitions(id) on delete cascade,
  primary key (team_id, field_id)
);

create table ticket_field_values (
  ticket_id uuid references tickets(id) on delete cascade,
  field_id uuid references ticket_field_definitions(id) on delete cascade,
  value text,
  created_at timestamptz not null default now(),
  primary key (ticket_id, field_id)
);

-- Enable RLS
alter table ticket_field_definitions enable row level security;
alter table team_field_definitions enable row level security;
alter table ticket_field_values enable row level security;

-- Field definition policies
create policy "Everyone can view field definitions"
  on ticket_field_definitions for select
  using (true);

create policy "Managers can create field definitions"
  on ticket_field_definitions for insert
  with check (
    owner_id = auth.uid()
    and exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'manager'
    )
  );

create policy "Managers can update their field definitions"
  on ticket_field_definitions for update
  using (owner_id = auth.uid())
  with check (
    owner_id = auth.uid()
    and exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'manager'
    )
  );

create policy "Managers can transfer field definition ownership"
  on ticket_field_definitions for update
  using (owner_id = auth.uid())
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'manager'
    )
    and exists (
      select 1 from profiles
      where id = owner_id
      and role = 'manager'
    )
  );

-- Team field definition policies
create policy "Team members can view their team's field definitions"
  on team_field_definitions for select
  using (
    exists (
      select 1 from team_members
      where team_id = team_field_definitions.team_id
      and user_id = auth.uid()
    )
  );

create policy "Managers can manage their team's field definitions"
  on team_field_definitions for all
  using (
    exists (
      select 1 from team_members
      where team_id = team_field_definitions.team_id
      and user_id = auth.uid()
      and exists (
        select 1 from profiles
        where id = auth.uid()
        and role = 'manager'
      )
    )
  );

-- Field value policies
create policy "Can view field values on viewable tickets"
  on ticket_field_values for select
  using (
    exists (
      select 1 from tickets t
      where t.id = ticket_id
      and (
        t.created_by = auth.uid()
        or exists (
          select 1 from profiles p
          where p.id = auth.uid()
          and p.role in ('worker', 'manager')
          and (not t.restricted or p.role = 'manager')
        )
      )
    )
  );

create policy "Can view field values on templates"
  on ticket_field_values for select
  using (
    exists (
      select 1 from tickets t
      where t.id = ticket_id
      and t.title like 'template: %'
    )
  );

create policy "Managers can manage any field values"
  on ticket_field_values for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'manager'
    )
  )
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'manager'
    )
  );

create policy "Workers can manage field values on team tickets"
  on ticket_field_values for all
  using (
    exists (
      select 1 from tickets t
      join team_field_definitions tfd on tfd.team_id = t.team_id
      where t.id = ticket_id
      and tfd.field_id = field_id
      and exists (
        select 1 from team_members
        where team_id = t.team_id
        and user_id = auth.uid()
        and exists (
          select 1 from profiles
          where id = auth.uid()
          and role = 'worker'
        )
      )
    )
  );

-- Skills schema
create table skills (
  id uuid default gen_random_uuid() primary key,
  name text unique not null
);

create table user_skills (
  user_id uuid references auth.users(id) on delete cascade,
  skill_id uuid references skills(id) on delete cascade,
  primary key (user_id, skill_id)
);

create table ticket_required_skills (
  ticket_id uuid references tickets(id) on delete cascade,
  skill_id uuid references skills(id) on delete cascade,
  primary key (ticket_id, skill_id)
);

-- Enable RLS
alter table skills enable row level security;
alter table user_skills enable row level security;
alter table ticket_required_skills enable row level security;

-- Skill policies
create policy "Everyone can view skills"
  on skills for select using (true);

-- Knowledge base schema
create table kb_articles (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  summary text,
  storage_path text not null,
  published boolean not null default false,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create table kb_article_tags (
  article_id uuid references kb_articles(id) on delete cascade,
  tag_id uuid references ticket_tags(id) on delete cascade,
  primary key (article_id, tag_id)
);

-- Enable RLS
alter table kb_articles enable row level security;
alter table kb_article_tags enable row level security;

-- Article policies
create policy "Everyone can view published articles"
  on kb_articles for select
  using (published);

create policy "Workers can view all articles"
  on kb_articles for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role in ('worker', 'manager')
    )
  );

create policy "Managers can manage articles"
  on kb_articles for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role = 'manager'
    )
  );

-- Article tag policies
create policy "Everyone can view article tags"
  on kb_article_tags for select
  using (true);

create policy "Managers can manage article tags"
  on kb_article_tags for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role = 'manager'
    )
  );

-- Add policy for team-based viewing
create policy "Team members can view their team's tickets"
  on tickets for select
  using (
    exists (
      select 1 from team_members
      where team_id = tickets.team_id
      and user_id = auth.uid()
    )
  );

-- Add policy for team-based updates
create policy "Team members can update their team's tickets"
  on tickets for update
  using (
    exists (
      select 1 from team_members
      where team_id = tickets.team_id
      and user_id = auth.uid()
    )
  );

-- Simple ticket creation policy
create policy "Anyone can create tickets"
  on tickets for insert
  with check (created_by = auth.uid());

-- Add update policies for tag links
create policy "Can update tags on updatable tickets"
  on ticket_tag_links for update
  using (
    exists (
      select 1 from tickets t
      where t.id = ticket_id
      and (
        assigned_to = auth.uid()
        or exists (
          select 1 from team_members
          where team_id = t.team_id
          and user_id = auth.uid()
        )
        or exists (
          select 1 from profiles
          where id = auth.uid()
          and role = 'manager'
        )
      )
    )
  );

-- Add insert policies for tag links
create policy "Can insert tags on updatable tickets"
  on ticket_tag_links for insert
  with check (
    exists (
      select 1 from tickets t
      where t.id = ticket_id
      and (
        assigned_to = auth.uid()
        or exists (
          select 1 from team_members
          where team_id = t.team_id
          and user_id = auth.uid()
        )
        or exists (
          select 1 from profiles
          where id = auth.uid()
          and role = 'manager'
        )
      )
    )
  );

-- Add insert/update policies for user skills
create policy "Workers can manage their own skills"
  on user_skills for all
  using (
    user_id = auth.uid()
    and exists (
      select 1 from profiles
      where id = auth.uid()
      and role in ('worker', 'manager')
    )
  )
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from profiles
      where id = auth.uid()
      and role in ('worker', 'manager')
    )
  );

-- Add policies for ticket required skills
create policy "Can view required skills on viewable tickets"
  on ticket_required_skills for select
  using (
    exists (
      select 1 from tickets t
      where t.id = ticket_id
      and (
        t.created_by = auth.uid()
        or (
          exists (
            select 1 from profiles p
            where p.id = auth.uid()
            and p.role in ('worker', 'manager')
            and (not t.restricted or p.role = 'manager')
          )
        )
      )
    )
  );

create policy "Can manage required skills on updatable tickets"
  on ticket_required_skills for all
  using (
    exists (
      select 1 from tickets t
      where t.id = ticket_id
      and (
        assigned_to = auth.uid()
        or exists (
          select 1 from team_members
          where team_id = t.team_id
          and user_id = auth.uid()
        )
        or exists (
          select 1 from profiles
          where id = auth.uid()
          and role = 'manager'
        )
      )
    )
  );

-- Add policies for team member management
create policy "Managers can manage team members"
  on team_members for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'manager'
    )
  );

-- Add delete policies for tickets
create policy "Managers can delete tickets"
  on tickets for delete
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'manager'
    )
  );

-- Add delete policies for comments
create policy "Managers can delete comments"
  on ticket_comments for delete
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'manager'
    )
  );

create policy "Customers can delete their own comments"
  on ticket_comments for delete
  using (
    created_by = auth.uid()
    and exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'customer'
    )
  );

-- Add tables to realtime publication
alter publication supabase_realtime 
  add table tickets, 
  ticket_comments, 
  ticket_tags,
  ticket_tag_links,
  ticket_field_values,
  teams,
  team_members,
  skills,
  user_skills,
  ticket_required_skills,
  kb_articles,
  kb_article_tags,
  ticket_feedback,
  ticket_field_definitions,
  team_field_definitions;

-- Add missing RLS enablement
alter table ticket_feedback enable row level security;

-- Add missing feedback policies
create policy "Customers can view feedback on their tickets"
  on ticket_feedback for select
  using (
    exists (
      select 1 from tickets t
      where t.id = ticket_id
      and t.created_by = auth.uid()
    )
  );

create policy "Workers can view feedback on assigned tickets"
  on ticket_feedback for select
  using (
    exists (
      select 1 from tickets t
      where t.id = ticket_id
      and t.assigned_to = auth.uid()
    )
  );

create policy "Managers can view all feedback"
  on ticket_feedback for select
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role = 'manager'
    )
  );

create policy "Customers can add feedback to their tickets"
  on ticket_feedback for insert
  with check (
    exists (
      select 1 from tickets t
      where t.id = ticket_id
      and t.created_by = auth.uid()
    )
  );

-- Keep this correct version at the bottom
create policy "Managers can manage skills"
  on skills for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role = 'manager'
    )
  );

-- Add missing view policy for user skills
create policy "Anyone can view user skills"
  on user_skills for select
  using (true);

-- Add missing team policies
create policy "Team members can view their teams"
  on teams for select
  using (
    exists (
      select 1 from team_members tm
      where tm.team_id = id
      and tm.user_id = auth.uid()
    )
  );

create policy "Workers can view teams they're assigned to"
  on teams for select
  using (
    exists (
      select 1 from tickets t
      where t.team_id = id
      and t.assigned_to = auth.uid()
    )
  );

-- Add missing team member policies
create policy "Everyone can view team members"
  on team_members for select
  using (true);

create policy "Managers can manage their team members"
  on team_members for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role = 'manager'
    )
  );

-- Team policies
create policy "Everyone can view teams"
  on teams for select
  using (true);

create policy "Managers can manage their teams"
  on teams for all
  using (
    exists (
      select 1 from team_members
      where user_id = auth.uid()
      and team_id = teams.id
      and exists (
        select 1 from profiles
        where id = auth.uid()
        and role = 'manager'
      )
    )
  );

create policy "Managers can delete their field definitions"
  on ticket_field_definitions for delete
  using (
    owner_id = auth.uid()
    and exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'manager'
    )
  );

create policy "Can insert field values on new tickets"
  on ticket_field_values for insert
  with check (
    exists (
      select 1 from tickets t
      where t.id = ticket_id
      and t.created_by = auth.uid()
    )
  );

-- Add delete policies for tag links
create policy "Can delete tags on updatable tickets"
  on ticket_tag_links for delete
  using (
    exists (
      select 1 from tickets t
      where t.id = ticket_id
      and (
        assigned_to = auth.uid()
        or exists (
          select 1 from team_members
          where team_id = t.team_id
          and user_id = auth.uid()
        )
        or exists (
          select 1 from profiles
          where id = auth.uid()
          and role = 'manager'
        )
      )
    )
  );

-- Create KB bucket
INSERT INTO storage.buckets (id, name)
VALUES ('kb', 'kb')
ON CONFLICT DO NOTHING;

-- KB Storage Policies
CREATE POLICY "Anyone can read published articles"
ON storage.objects FOR SELECT
USING (bucket_id = 'kb' AND EXISTS (
  SELECT 1 FROM kb_articles
  WHERE storage_path = name
  AND published = true
));

CREATE POLICY "Staff can read all articles"
ON storage.objects FOR SELECT
USING (bucket_id = 'kb' AND EXISTS (
  SELECT 1 FROM profiles
  WHERE id = auth.uid()
  AND role IN ('worker', 'manager')
));

CREATE POLICY "Staff can manage articles"
ON storage.objects FOR ALL
USING (bucket_id = 'kb' AND EXISTS (
  SELECT 1 FROM profiles
  WHERE id = auth.uid()
  AND role IN ('worker', 'manager')
));

-- Add update/delete policies for feedback
create policy "Customers can update their own feedback"
  on ticket_feedback for update
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

create policy "Managers can update any feedback"
  on ticket_feedback for update
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role = 'manager'
    )
  );

create policy "Customers can delete their own feedback"
  on ticket_feedback for delete
  using (created_by = auth.uid());

create policy "Managers can delete any feedback"
  on ticket_feedback for delete
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role = 'manager'
    )
  );

-- Add auth triggers for created_by fields
create trigger set_ticket_feedback_created_by
  before insert on ticket_feedback
  for each row
  execute function handle_auth_user();
```

### back/supabase/migrations/20240101000004_invites.sql
```sql
-- Create invites table
create table team_invites (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid references teams(id) on delete cascade not null,
  role text not null check (role in ('worker', 'manager')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'expired')),
  invited_by uuid references auth.users not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '24 hours',
  accepted_at timestamptz
);

-- Enable RLS
alter table team_invites enable row level security;

-- Create policies
create policy "Managers can create invites for their team"
  on team_invites for insert
  with check (
    exists (
      select 1 from team_members
      where user_id = auth.uid()
      and team_id = team_invites.team_id
      and exists (
        select 1 from profiles
        where id = auth.uid()
        and role = 'manager'
      )
    )
  );

create policy "Managers can view their team's invites"
  on team_invites for select
  using (
    exists (
      select 1 from team_members
      where user_id = auth.uid()
      and team_id = team_invites.team_id
      and exists (
        select 1 from profiles
        where id = auth.uid()
        and role = 'manager'
      )
    )
  );

create policy "Anyone can view pending invites by ID"
  on team_invites for select
  using (status = 'pending');

-- Add to realtime publication
alter publication supabase_realtime add table team_invites; 
```

### back/supabase/functions/sign-up/index.ts
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

interface SignUpPayload {
  email: string
  password: string
  username: string
  inviteId?: string | null
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, password, username, inviteId } = await req.json() as SignUpPayload

    if (!email || !password || !username) {
      throw new Error('email, password and username required')
    }

    const supabase = createClient(
      Deno.env.get('PLATFORM_URL') ?? '',
      Deno.env.get('PLATFORM_KEY') ?? ''
    )

    // Default role is customer
    let role = 'customer'
    let invite = null

    // If invite ID provided, verify it and get role
    if (inviteId) {
      console.log('Checking invite:', inviteId)
      const { data: inviteData, error: inviteError } = await supabase
        .from('team_invites')
        .select('role, status, team_id')
        .eq('id', inviteId)
        .single()

      if (inviteError) {
        console.error('Invite error:', inviteError)
        throw new Error('invalid invite')
      }

      if (!inviteData) {
        console.error('No invite found')
        throw new Error('invalid invite')
      }

      if (inviteData.status !== 'pending') {
        console.error('Invite not pending:', inviteData.status)
        throw new Error('invite has expired')
      }

      invite = inviteData
      role = invite.role
    }

    console.log('Creating user with role:', role)

    // Create user
    console.log('Attempting to create user with email:', email)
    const createUserResponse = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username }
    })
    
    console.log('Create user response:', JSON.stringify(createUserResponse))

    const { data: { user }, error: signUpError } = createUserResponse

    if (signUpError) {
      console.error('Signup error:', signUpError)
      throw signUpError
    }

    if (!user) {
      console.error('No user created')
      throw new Error('failed to create user')
    }

    console.log('Created auth user:', user.id)

    // Check if this is the first user (most performant way)
    const { data: hasProfiles } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .single()

    // First user is manager, unless they have an invite
    if (!inviteId && !hasProfiles) {
      console.log('First user - setting as manager')
      role = 'manager'
    }

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        username,
        email,
        role
      })

    if (profileError) {
      console.error('Profile error:', profileError)
      // Cleanup: delete user if profile creation fails
      await supabase.auth.admin.deleteUser(user.id)
      throw new Error('failed to create profile')
    }

    // If invite was used, add to team_members and mark as accepted
    if (inviteId && invite.team_id) {
      // Add to team_members
      const { error: teamError } = await supabase
        .from('team_members')
        .insert({
          team_id: invite.team_id,
          user_id: user.id
        })

      if (teamError) {
        console.error('Team error:', teamError)
        // Cleanup: delete user if team member creation fails
        await supabase.auth.admin.deleteUser(user.id)
        throw new Error('failed to add team member')
      }

      const { error: updateError } = await supabase
        .from('team_invites')
        .update({ 
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', inviteId)

      if (updateError) {
        console.error('Failed to update invite:', updateError)
        // Don't throw here, user is already created
      }
    }

    // Sign in the user
    const { data: { session }, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (signInError) {
      console.error('Sign in error:', signInError)
      throw signInError
    }

    if (!session) {
      console.error('No session created')
      throw new Error('failed to create session')
    }

    return new Response(
      JSON.stringify({ session }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Sign up error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
}) 
```

### back/supabase/functions/update-profile/index.ts
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface UpdateProfilePayload {
  id: string
  role?: 'customer' | 'worker' | 'manager'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('PLATFORM_URL') ?? '',
      Deno.env.get('PLATFORM_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')?.split(' ')[1]
    if (!authHeader) throw new Error('no auth header')
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader)
    if (userError || !user) throw new Error('invalid auth')

    // Verify user is a manager
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) throw profileError
    if (profile.role !== 'manager') throw new Error('unauthorized')

    const { id, role } = await req.json() as UpdateProfilePayload
    if (!id) throw new Error('profile id required')

    // Update profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', id)

    if (updateError) throw updateError

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
}) 
```

### back/supabase/functions/create-comment/index.ts
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface CreateCommentPayload {
  ticket_id: string
  content: string
  internal?: boolean
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('PLATFORM_URL') ?? '',
      Deno.env.get('PLATFORM_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')?.split(' ')[1]
    if (!authHeader) throw new Error('no auth header')
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader)
    if (userError || !user) throw new Error('invalid auth')

    const { ticket_id, content, internal } = await req.json() as CreateCommentPayload

    if (!ticket_id) throw new Error('ticket id required')
    if (!content) throw new Error('content required')

    // Create comment
    const { data: comment, error: commentError } = await supabase
      .from('ticket_comments')
      .insert({
        ticket_id,
        content,
        internal: internal || false,
        created_by: user.id
      })
      .select()
      .single()

    if (commentError) throw commentError

    return new Response(
      JSON.stringify({ comment }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
}) 
```

### back/supabase/functions/sign-in-with-username/index.ts
```typescript
// @ts-ignore: Deno uses URL imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    const { username, password } = await req.json()
    
    const supabaseClient = createClient(
      Deno.env.get('PLATFORM_URL')!,
      Deno.env.get('PLATFORM_KEY')!
    )

    // Get email for username
    const { data: profiles, error: profileError } = await supabaseClient
      .from('profiles')
      .select('email')
      .eq('username', username.toLowerCase())
      .single()

    if (profileError || !profiles?.email) {
      return new Response(
        JSON.stringify({ 
          error: { message: 'invalid credentials', status: 401 }
        }),
        { 
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          status: 401,
        }
      )
    }

    // Sign in with email
    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
      email: profiles.email,
      password
    })

    if (authError) {
      return new Response(
        JSON.stringify({ 
          error: { message: 'invalid credentials', status: 401 }
        }),
        { 
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          status: 401,
        }
      )
    }

    return new Response(
      JSON.stringify(authData),
      { 
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        status: 200,
      }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ 
        error: { message: 'server error', status: 500 }
      }),
      { 
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        status: 500,
      }
    )
  }
}) 
```

### back/supabase/functions/types.d.ts
```typescript
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
```

### back/supabase/functions/invite-team-member/index.ts
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

interface InviteTeamMemberPayload {
  role: 'worker' | 'manager',
  team_id?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('PLATFORM_URL') ?? '',
      Deno.env.get('PLATFORM_KEY') ?? ''
    )

    // Get auth user
    const authHeader = req.headers.get('Authorization')?.split(' ')[1]
    if (!authHeader) throw new Error('no auth header')
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader)
    if (userError || !user) throw new Error('invalid auth')

    // Verify user is a manager
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) throw profileError
    if (profile.role !== 'manager') throw new Error('only managers can invite team members')

    // Get invite data
    const { role, team_id } = await req.json() as InviteTeamMemberPayload
    if (!role) throw new Error('role required')
    if (!['worker', 'manager'].includes(role)) throw new Error('invalid role')

    // If team_id provided, verify manager is part of that team
    if (team_id) {
      const { data: teamMember, error: teamError } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id)
        .eq('team_id', team_id)
        .single()

      if (teamError || !teamMember) throw new Error('manager must be part of the specified team')
    }

    // Create invite record
    const { data: invite, error: inviteError } = await supabase
      .from('team_invites')
      .insert({
        role,
        team_id,
        invited_by: user.id
      })
      .select()
      .single()

    if (inviteError) throw inviteError

    return new Response(
      JSON.stringify({ 
        success: true,
        invite_id: invite.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
}) 
```

### back/supabase/functions/create-team/index.ts
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

interface CreateTeamPayload {
  name: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('PLATFORM_URL') ?? '',
      Deno.env.get('PLATFORM_KEY') ?? ''
    )

    // Get auth user
    const authHeader = req.headers.get('Authorization')?.split(' ')[1]
    if (!authHeader) throw new Error('no auth header')
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader)
    if (userError || !user) throw new Error('invalid auth')

    // Verify user is a manager
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) throw profileError
    if (profile.role !== 'manager') throw new Error('only managers can create teams')

    // Get team name
    const { name } = await req.json() as CreateTeamPayload
    if (!name) throw new Error('team name required')

    // Create team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({
        name,
        created_by: user.id
      })
      .select()
      .single()

    if (teamError) throw teamError

    // Add creator as team member
    const { error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: team.id,
        user_id: user.id
      })

    if (memberError) throw memberError

    return new Response(
      JSON.stringify({ 
        success: true,
        team_id: team.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
}) 
```

### back/supabase/functions/create-ticket/index.ts
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

interface CreateTicketPayload {
  title: string
  description?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  team_id?: string
  required_skills?: string[]
  field_values?: { [key: string]: string }
  tags?: string[]
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('PLATFORM_URL') ?? '',
      Deno.env.get('PLATFORM_KEY') ?? ''
    )

    // Get auth user
    const authHeader = req.headers.get('Authorization')?.split(' ')[1]
    if (!authHeader) throw new Error('no auth header')
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader)
    if (userError || !user) throw new Error('invalid auth')

    // Get request data
    const { title, description, priority, team_id, required_skills, field_values, tags } = await req.json() as CreateTicketPayload
    console.log('Received request data:', { title, description, priority, team_id, field_values, tags })

    // Validate required fields
    if (!title) throw new Error('title required')

    // Create ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .insert({
        title,
        description,
        priority: priority ?? 'medium',
        team_id,
        created_by: user.id
      })
      .select()
      .single()

    if (ticketError) {
      console.error('Error creating ticket:', ticketError)
      throw ticketError
    }
    console.log('Created ticket:', ticket)

    // Add required skills if provided
    if (required_skills?.length) {
      const { error: skillsError } = await supabase
        .from('ticket_required_skills')
        .insert(
          required_skills.map(skill_id => ({
            ticket_id: ticket.id,
            skill_id
          }))
        )
      if (skillsError) {
        console.error('Error adding skills:', skillsError)
        throw skillsError
      }
    }

    // Add field values if provided
    if (field_values && Object.keys(field_values).length > 0) {
      console.log('Attempting to add field values:', field_values)
      const fieldValueRows = Object.entries(field_values).map(([field_id, value]) => ({
        ticket_id: ticket.id,
        field_id,
        value
      }))
      console.log('Prepared field value rows:', fieldValueRows)

      const { data: insertedValues, error: fieldsError } = await supabase
        .from('ticket_field_values')
        .insert(fieldValueRows)
        .select()

      if (fieldsError) {
        console.error('Error adding field values:', fieldsError)
        throw fieldsError
      }
      console.log('Successfully inserted field values:', insertedValues)
    } else {
      console.log('No field values to add')
    }

    // Add tags if provided
    if (tags?.length) {
      const { error: tagsError } = await supabase
        .from('ticket_tag_links')
        .insert(
          tags.map(tag_id => ({
            ticket_id: ticket.id,
            tag_id
          }))
        )
      if (tagsError) {
        console.error('Error adding tags:', tagsError)
        throw tagsError
      }
    }

    return new Response(
      JSON.stringify({ ticket }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Create ticket error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
}) 
```

### back/supabase/functions/update-ticket/index.ts
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface UpdateTicketPayload {
  id: string
  title?: string
  description?: string
  status?: 'new' | 'open' | 'pending' | 'resolved' | 'closed'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  team_id?: string | null
  assigned_to?: string | null
  restricted?: boolean
  required_skills?: string[]
  field_values?: { [key: string]: string }
  tags?: string[]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('PLATFORM_URL') ?? '',
      Deno.env.get('PLATFORM_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')?.split(' ')[1]
    if (!authHeader) throw new Error('no auth header')
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader)
    if (userError || !user) throw new Error('invalid auth')

    const { id, title, description, status, priority, team_id, assigned_to, restricted, required_skills, field_values, tags } = await req.json() as UpdateTicketPayload

    if (!id) throw new Error('ticket id required')

    // Get user role and check if they're the creator
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profileError) throw profileError

    // Get current ticket to check permissions
    const { data: currentTicket, error: ticketError } = await supabase
      .from('tickets')
      .select('created_by, assigned_to, team_id, title')
      .eq('id', id)
      .single()

    if (ticketError) throw ticketError

    // If worker is trying to assign to someone else, verify it's a manager
    let assigningToManager = false
    if (profile.role === 'worker' && assigned_to && assigned_to !== user.id) {
      const { data: targetUser, error: targetError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', assigned_to)
        .single()

      if (targetError) throw targetError
      assigningToManager = targetUser.role === 'manager'
    }

    // If assigning to someone, get their team_id
    let newTeamId = team_id
    if (assigned_to) {
      const { data: teamData, error: teamError } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', assigned_to)
        .single()

      if (teamError && teamError.code !== 'PGRST116') throw teamError // PGRST116 is "no rows returned"
      if (teamData) newTeamId = teamData.team_id
    }

    // Build update object based on permissions
    const updateData: any = {}
    
    if (profile.role === 'manager') {
      // Managers can update everything
      updateData.title = title
      updateData.description = description
      updateData.status = status
      updateData.priority = priority
      updateData.team_id = newTeamId
      updateData.assigned_to = assigned_to
      updateData.restricted = restricted
    } else if (profile.role === 'worker') {
      if (currentTicket.assigned_to === user.id) {
        // Workers can update assigned tickets
        updateData.status = status
      }
      // Workers can assign/unassign themselves to unassigned tickets
      // OR assign to a manager
      if (currentTicket.assigned_to === null || currentTicket.assigned_to === user.id || assigningToManager) {
        updateData.assigned_to = assigned_to
        updateData.team_id = newTeamId
      }
    } else if (profile.role === 'customer' && currentTicket.created_by === user.id) {
      // Customers can update priority of their tickets
      updateData.priority = priority
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error('no valid updates permitted')
    }

    // Update ticket
    const { data: ticket, error: updateError } = await supabase
      .from('tickets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError

    // Create notification if someone else assigned the ticket
    if (assigned_to && assigned_to !== user.id) {
      await supabase
        .from('notifications')
        .insert({
          user_id: assigned_to,
          type: 'ticket_assigned',
          title: `ticket "${currentTicket.title}" assigned to you`,
          link: `/tickets/${id}`
        })
    }

    // Only managers can update these related items
    if (profile.role === 'manager') {
      // Update required skills if provided
      if (required_skills) {
        // Delete existing skills
        await supabase
          .from('ticket_required_skills')
          .delete()
          .eq('ticket_id', id)

        // Add new skills
        if (required_skills.length) {
          const { error: skillsError } = await supabase
            .from('ticket_required_skills')
            .insert(
              required_skills.map(skill_id => ({
                ticket_id: id,
                skill_id
              }))
            )
          if (skillsError) throw skillsError
        }
      }

      // Update field values if provided
      if (field_values) {
        // Upsert field values
        const { error: fieldsError } = await supabase
          .from('ticket_field_values')
          .upsert(
            Object.entries(field_values).map(([field_id, value]) => ({
              ticket_id: id,
              field_id,
              value
            }))
          )
        if (fieldsError) throw fieldsError
      }

      // Update tags if provided
      if (tags) {
        // Delete existing tags
        await supabase
          .from('ticket_tag_links')
          .delete()
          .eq('ticket_id', id)

        // Add new tags
        if (tags.length) {
          const { error: tagsError } = await supabase
            .from('ticket_tag_links')
            .insert(
              tags.map(tag_id => ({
                ticket_id: id,
                tag_id
              }))
            )
          if (tagsError) throw tagsError
        }
      }
    }

    return new Response(
      JSON.stringify({ ticket }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
}) 
```

### back/supabase/functions/delete-comment/index.ts
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('PLATFORM_URL') ?? '',
      Deno.env.get('PLATFORM_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')?.split(' ')[1]
    if (!authHeader) throw new Error('no auth header')
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader)
    if (userError || !user) throw new Error('invalid auth')

    const { id } = await req.json()
    if (!id) throw new Error('comment id required')

    // Delete comment
    const { error: deleteError } = await supabase
      .from('ticket_comments')
      .delete()
      .eq('id', id)

    if (deleteError) throw deleteError

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
}) 
```

### back/supabase/functions/reset-password/index.ts
```typescript
// @ts-ignore: Deno uses URL imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    const { identifier } = await req.json()
    
    const supabaseClient = createClient(
      Deno.env.get('PLATFORM_URL')!,
      Deno.env.get('PLATFORM_KEY')!
    )

    // Try username first
    let { data: profiles } = await supabaseClient
      .from('profiles')
      .select('email')
      .eq('username', identifier.toLowerCase())
      .single()

    // If no result, try email
    if (!profiles?.email) {
      const { data: emailProfiles } = await supabaseClient
        .from('profiles')
        .select('email')
        .eq('email', identifier.toLowerCase())
        .single()
      
      profiles = emailProfiles
    }

    if (!profiles?.email) {
      return new Response(
        JSON.stringify({ 
          error: { message: 'invalid username or email', status: 401 }
        }),
        { 
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          status: 401,
        }
      )
    }

    // Send reset email
    const { error: resetError } = await supabaseClient.auth.resetPasswordForEmail(
      profiles.email,
      { redirectTo: `${req.headers.get('origin')}/update-password` }
    )

    if (resetError) {
      return new Response(
        JSON.stringify({ 
          error: { message: 'reset failed', status: 500 }
        }),
        { 
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          status: 500,
        }
      )
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        status: 200,
      }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ 
        error: { message: 'server error', status: 500 }
      }),
      { 
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        status: 500,
      }
    )
  }
}) 
```

### back/supabase/functions/_shared/cors.ts
```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
} 
```

### back/supabase/functions/delete-ticket/index.ts
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('PLATFORM_URL') ?? '',
      Deno.env.get('PLATFORM_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')?.split(' ')[1]
    if (!authHeader) throw new Error('no auth header')
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader)
    if (userError || !user) throw new Error('invalid auth')

    const { id } = await req.json()
    if (!id) throw new Error('ticket id required')

    // Verify user is a manager
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) throw profileError
    if (profile.role !== 'manager') throw new Error('unauthorized')

    // Delete ticket (cascades to comments, tags, fields, etc)
    const { error: deleteError } = await supabase
      .from('tickets')
      .delete()
      .eq('id', id)

    if (deleteError) throw deleteError

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
}) 
```

### back/supabase/functions/update-team/index.ts
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

interface UpdateTeamPayload {
  id: string
  name?: string
  members?: string[] // user ids
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('PLATFORM_URL') ?? '',
      Deno.env.get('PLATFORM_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')?.split(' ')[1]
    if (!authHeader) throw new Error('no auth header')
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader)
    if (userError || !user) throw new Error('invalid auth')

    // Verify user is a manager
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) throw profileError
    if (profile.role !== 'manager') throw new Error('unauthorized')

    const { id, name, members } = await req.json() as UpdateTeamPayload
    if (!id) throw new Error('team id required')

    // Update team name if provided
    if (name) {
      const { error: updateError } = await supabase
        .from('teams')
        .update({ name })
        .eq('id', id)

      if (updateError) throw updateError
    }

    // Update members if provided
    if (members !== undefined) {
      // Delete existing members
      await supabase
        .from('team_members')
        .delete()
        .eq('team_id', id)

      // Add new members
      if (members.length) {
        const { error: membersError } = await supabase
          .from('team_members')
          .insert(
            members.map(user_id => ({
              team_id: id,
              user_id
            }))
          )
        if (membersError) throw membersError
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
}) 
```

### back/supabase/functions/get-template/index.ts
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('PLATFORM_URL') ?? '',
      Deno.env.get('PLATFORM_KEY') ?? ''
    )

    const { id } = await req.json()
    if (!id) throw new Error('template id required')

    // Get template ticket
    const { data: template, error: templateError } = await supabase
      .from('tickets')
      .select(`
        *,
        ticket_tag_links(
          tag: ticket_tags(*)
        )
      `)
      .eq('id', id)
      .ilike('title', 'template: %')
      .single()

    if (templateError) throw templateError
    if (!template) throw new Error('template not found')

    return new Response(
      JSON.stringify(template),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
}) 
```

### back/supabase/functions/upsert-article/index.ts
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface UpsertArticleBody {
  id?: string;
  title: string;
  content: string;
  summary?: string;
  published?: boolean;
  takeOwnership?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('PLATFORM_URL') ?? '',
      Deno.env.get('PLATFORM_KEY') ?? ''
    );

    // Get auth user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(req.headers.get("Authorization")?.split(" ")[1] ?? "");

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["worker", "manager"].includes(profile.role)) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get request body
    const body = (await req.json()) as UpsertArticleBody;

    // Validate input
    if (!body.title || !body.content) {
      return new Response(
        JSON.stringify({ error: "title and content are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Only managers can publish
    if (body.published && profile.role !== "manager") {
      return new Response(
        JSON.stringify({ error: "only managers can publish articles" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // If updating, verify ownership or manager role
    let version = 1;
    if (body.id) {
      const { data: existing } = await supabase
        .from("kb_articles")
        .select("created_by, version")
        .eq("id", body.id)
        .single();

      if (existing) {
        // Allow edit if:
        // 1. User is a manager
        // 2. User is taking ownership
        // 3. User owns the article
        if (profile.role !== "manager" && !body.takeOwnership && existing.created_by !== user.id) {
          return new Response(
            JSON.stringify({ error: "can only edit your own articles" }),
            {
              status: 403,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        version = existing.version + 1;
      }
    }

    // Generate storage path
    const articleId = body.id || crypto.randomUUID();
    const storagePath = `${articleId}.md`;

    // Upload content to storage
    const { error: uploadError } = await supabase.storage
      .from("kb")
      .upload(storagePath, body.content, {
        contentType: "text/markdown",
        upsert: true,
      });

    if (uploadError) {
      return new Response(
        JSON.stringify({ error: "failed to upload content" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update or insert article record
    const { data: article, error: articleError } = await supabase
      .from("kb_articles")
      .upsert(
        {
          id: articleId,
          title: body.title,
          summary: body.summary,
          storage_path: storagePath,
          published: body.published ?? false,
          version: version ?? 1,
          created_by: body.id ? (body.takeOwnership ? user.id : undefined) : user.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      )
      .select()
      .single();

    if (articleError) {
      return new Response(
        JSON.stringify({ error: "failed to update article record" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ article }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}); 
```
\n## Configuration\n
\n### package.json\n```json\n{
  "name": "gauntlet-p2",
  "private": true,
  "workspaces": [
    "front",
    "back/functions/*"
  ],
  "scripts": {
    "dev": "yarn workspace front dev",
    "build": "yarn workspace front build",
    "build:dev": "yarn workspace front build:dev",
    "preview": "yarn workspace front preview",
    "lint": "yarn workspace front lint"
  }
}\n```
\n### .cursorrules\n```markdown\n# .cursorrules

## project instructions

**goal**  
build a modern customer support system (crm) with generative ai enhancements. the system handles ticket creation, assignment, and collaboration, then integrates ai to automate and scale support workflows.

**phases**  
1. **week 1 mvp (by jan 21, 2025)**  
   - ✅ functional baseline crm  
   - ✅ roles: customer, worker, manager  
   - ✅ ticket creation & management with row-level security  
   - ✅ minimal ui for listing and updating tickets  
   - ✅ keep existing patterns; do not remove or break anything  

2. **week 1 final (by jan 24, 2025)**  
   - ✅ polish the existing crm  
   - ✅ ensure stable team management, comment system, assignments  
   - ✅ internal comments for workers/managers
   - ✅ fix major bugs (unknown username, visibility issues)  
   - ✅ template system for quick responses
   - ✅ theme customization
   - ✅ ticket feedback/rating system
   - remaining features:
     - 🟡 ticket history view (partial - has timestamps and notifications)
     - ❌ bulk operations for tickets
     - ❌ deliver a 5-min walkthrough video  

3. **week 2 mvp (by jan 27, 2025)**  
   - introduce basic ai features:
     - auto-route tickets based on content
     - auto-reply for common questions
     - suggested responses for agents
   - maintain user roles & rls  
   - any ai logic must be optional/toggleable  
   - integrate with knowledge base
   - implement RAG system for context

4. **week 2 final (by jan 31, 2025)**  
   - refine ai features:
     - knowledge-based suggestions
     - smart escalation rules
     - ticket summarization
     - performance analytics
   - ensure human-in-the-loop oversight  
   - implement learning system from human interventions
   - deliver final demo showing ai-driven workflow  

**current status**
- Week 1 MVP: ✅ Completed
- Week 1 Final: 🟡 In Progress
  - Completed:
    - Team management
    - Comment system
    - Internal comments
    - Bug fixes
    - Template system
    - Theme customization
    - Ticket feedback/rating
  - Partially Complete:
    - Ticket history (has timestamps and notifications)
  - Not Started:
    - Bulk operations
    - Walkthrough video
- Week 2 MVP: ⏳ Not Started
- Week 2 Final: ⏳ Not Started

**important notes**  
- some features may or may not be implemented yet. only implement or modify code if specifically asked.  
- maintain supabase-based backend, rls, and edge functions.  
- do not remove or rewrite working code unless necessary for new features.

---

## ui text
- lowercase except proper nouns
- concise and direct
- remove unnecessary words
- consistent terminology
- short, clear error messages (e.g., "invalid credentials")

### examples
- ✅ "sign in"  
- ✅ "username"  
- ✅ "invalid credentials"  
- ✅ "need an account?"  

---

## component naming
- react components: PascalCase (e.g., `TicketForm`)
- file names: kebab-case (e.g., `ticket-form.tsx`)
- css classes: kebab-case

---

## spacing
- minimal vertical spacing (`space-y-2`)
- forms max-width: 320px
- consistent padding (`pt-4`)
- compact header (`h-12`)
- small text (`text-sm`) for secondary info

---

## buttons
- default `size="sm"`
- keep text short
- `variant="ghost"` for secondary actions
- header buttons: `h-7`

---

## core rules
- **never remove working code**  
- **never modify code beyond requested changes**  
- **never "clean up" working code** unless explicitly asked  
- preserve all security measures  
- follow existing patterns (rls, migrations, edge functions)
- do not break role-based workflows

---

## code changes
- only do what is explicitly requested
- show enough context
- use correct file paths
- keep existing error handling
- maintain configs
- deploy after changes

---

## file structure
- preserve existing organization
- do not break imports or references
- follow naming conventions

---

## database
- keep working tables/schemas
- preserve triggers/functions
- keep rls policies
- verify dependencies before changes

---

## edge functions
- follow existing patterns
- parameterized queries
- keep cors configs
- deploy with project ref
- check dependencies

---

## do not
- ❌ remove working code
- ❌ change working patterns
- ❌ "clean up" existing code
- ❌ break dependencies
- ❌ modify security

---

## correct steps
- ✅ check dependencies first
- ✅ verify usage
- ✅ keep working functionality
- ✅ follow existing patterns
- ✅ test after changes\n```
\n### README.md\n```markdown\n# auto-crm

Modern customer support system with AI enhancements for efficient ticket management and customer service.

## Overview

auto-crm provides:
- Comprehensive ticket management with role-based access control
- Modern customer support portal with real-time updates
- Team management and intelligent ticket assignment
- Advanced comment system with internal notes
- Template system for quick responses
- Real-time notifications
- Tag-based organization

## Project Structure

```
/
├── back/                    # Backend (Supabase)
│   ├── supabase/           
│   │   ├── functions/      # Edge Functions
│   │   │   ├── _shared/    # Shared utilities
│   │   │   ├── create-ticket/
│   │   │   ├── update-ticket/
│   │   │   └── ...
│   │   └── migrations/     # Database schemas
│   ├── deploy-functions.sh # Deploy edge functions
│   └── reset-and-migrate.sh # Reset and migrate database
│
├── front/                  # Frontend (React)
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── tickets/   # Ticket-related components
│   │   │   ├── teams/     # Team management
│   │   │   └── ui/        # Shared UI components
│   │   ├── lib/          # Hooks and utilities
│   │   │   ├── hooks/    # React hooks
│   │   │   ├── types.ts  # TypeScript types
│   │   │   └── supabase.ts # Supabase client
│   │   └── styles/       # Global styles
│   └── public/           # Static assets
│
└── md/                   # Documentation
    ├── kb.md            # Knowledge base
    ├── map.md          # Project map
    └── notifications.md # Notification system
```

## Getting Started

### 1. Backend Setup

1. Create two Supabase projects (development and production)

2. Set up environment:
```bash
cd back
cp .env.example .env.development
cp .env.example .env.production
```

3. Update environment files with your Supabase project URLs:
```env
# .env.development or .env.production
PLATFORM_URL=https://[project-ref].supabase.co
PLATFORM_KEY=[service-role-key]
```

4. Deploy database schema:
> ⚠️ Warning: This will completely reset the database. Make sure you have backups if needed.
```bash
cd back
chmod +x reset-and-migrate.sh

# For development environment
./reset-and-migrate.sh dev

# For production environment
./reset-and-migrate.sh prod
```

5. Deploy Edge Functions:
```bash
chmod +x deploy-functions.sh
./deploy-functions.sh dev    # Deploy to development
# or
./deploy-functions.sh prod   # Deploy to production
```

### 2. Frontend Setup

1. Set up environment:
```bash
cd front
cp .env.example .env.development
cp .env.example .env.production
```

2. Update environment files:
```env
VITE_SUPABASE_URL=https://[project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=[anon-key]
```

3. Install and run:
```bash
yarn install
yarn dev
```

## Features

### Role-Based Access

- **Customers**
  - Submit and track support requests
  - Communicate with support team
  - Provide feedback on resolved issues

- **Workers**
  - Handle assigned support tickets
  - Collaborate with team members
  - Manage customer communications

- **Managers**
  - Oversee support operations
  - Manage teams and workload
  - Monitor performance and quality

### Core Features

- **Ticket Management**
  - Priority levels (low, medium, high, urgent)
  - Status tracking (new, open, pending, resolved, closed)
  - Tag system
  - Knowledge base integration

- **Communication**
  - Public and internal comments
  - Response templates
  - Real-time notifications

- **Security**
  - Row-level security (RLS)
  - Role-based access control
  - Change tracking:
    - Timestamps for all records (created, updated)
    - User attribution for all actions
    - Real-time change notifications
    - 30-day notification history

## Development vs Production

The project supports two environments:

**Development**
- Local frontend (localhost:5173)
- Development Supabase project
- Development database
- Real-time development

**Production**
- Hosted frontend
- Production Supabase project
- Production database
- Optimized performance

## Troubleshooting

### Edge Functions
- Ensure Docker Desktop is running
- Verify environment variables
- Check function logs in Supabase Dashboard
- Confirm CORS settings

### Database
- Verify RLS policies are applied
- Check table relationships and triggers
- Ensure migrations ran in correct order
- Monitor real-time subscriptions

### Frontend
- Confirm environment variables match Supabase project
- Check browser console for errors
- Verify API endpoints are accessible
- Clear browser cache if needed

## Security Notes

- Never expose service role keys
- Always use RLS policies
- Keep environment variables secure
- Regular security audits
- Monitor access logs\n```
\n### amplify.yml\n```yaml\nversion: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd front
        - yarn install
    build:
      commands:
        - yarn build
  artifacts:
    baseDirectory: front/dist
    files:
      - '**/*'
  cache:
    paths:
      - front/node_modules/**/*
      - front/.yarn/cache/**/*\n```
