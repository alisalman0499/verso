import type { ReactNode } from 'react'

type AuthLayoutProps = {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}

// The frame every sign-in screen shares: one narrow column, centred.
export default function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <div className="grid min-h-dvh place-items-center bg-ink px-5 py-12 text-bone">
      <main className="w-full max-w-sm">
        <div className="mb-12 font-serif text-2xl text-pure">Verso</div>
        <h1 className="font-serif text-[40px] leading-none tracking-tight text-pure">
          {title}
        </h1>
        {subtitle !== undefined && (
          <p className="mt-3 text-sm text-mute">{subtitle}</p>
        )}
        <div className="mt-8">{children}</div>
        {footer !== undefined && (
          <div className="mt-10 border-t border-hairline pt-5 text-sm text-mute">
            {footer}
          </div>
        )}
      </main>
    </div>
  )
}
