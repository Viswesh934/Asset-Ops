import { useState } from "react"
import { Mail, Lock, User, Eye, EyeOff, ShieldAlert, CheckCircle2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

// ─── Alert Banner ─────────────────────────────────────────────────────────────

interface AuthAlertProps {
  error: string | null
  successMsg: string | null
  tempPassword: string | null
}

export function AuthAlert({ error, successMsg, tempPassword }: AuthAlertProps) {
  if (error) {
    return (
      <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-lg text-sm bg-red-500/10 border border-red-500/25 text-red-300">
        <ShieldAlert size={16} className="flex-shrink-0 mt-0.5 text-red-400" />
        <span className="leading-snug">{error}</span>
      </div>
    )
  }
  if (successMsg) {
    return (
      <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-lg text-sm bg-emerald-500/10 border border-emerald-500/25 text-emerald-300">
        <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5 text-emerald-400" />
        <div className="flex-1 leading-snug">
          <p>{successMsg}</p>
          {tempPassword && (
            <div className="mt-2 p-2 bg-black/40 rounded border border-white/10 font-mono text-xs">
              Temp password: <code className="text-orange-400 font-bold select-all">{tempPassword}</code>
            </div>
          )}
        </div>
      </div>
    )
  }
  return null
}

// ─── Icon Input Wrapper ───────────────────────────────────────────────────────

interface IconInputProps {
  id: string
  label: string
  icon: React.ReactNode
  rightSlot?: React.ReactNode
  type?: string
  placeholder?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  required?: boolean
  disabled?: boolean
}

function IconInput({ id, label, icon, rightSlot, ...inputProps }: IconInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-xs font-semibold uppercase tracking-widest text-slate-400">
        {label}
      </Label>
      <div className="relative group">
        <span className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-orange-400 transition-colors z-10">
          {icon}
        </span>
        <Input
          id={id}
          {...inputProps}
          className="h-11 bg-white/[0.04] border-white/10 text-white placeholder:text-slate-600 focus-visible:border-orange-500/60 focus-visible:ring-orange-500/20 focus-visible:bg-white/[0.07]"
          style={{ paddingLeft: '2.5rem', paddingRight: rightSlot ? '2.75rem' : '0.875rem' }}
        />
        {rightSlot && (
          <span className="absolute inset-y-0 right-3 flex items-center z-10">
            {rightSlot}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Login Form ───────────────────────────────────────────────────────────────

interface LoginFormProps {
  onSubmit: (email: string, password: string) => void
  onForgotPassword: () => void
  loading: boolean
}

export function LoginForm({ onSubmit, onForgotPassword, loading }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw] = useState(false)

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(email, password) }} className="flex flex-col gap-5">
      <IconInput
        id="login-email"
        label="Email"
        icon={<Mail size={15} />}
        type="email"
        placeholder="you@company.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={loading}
      />

      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center">
          <Label htmlFor="login-password" className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Password
          </Label>
          <button
            type="button"
            onClick={onForgotPassword}
            disabled={loading}
            className="text-xs text-orange-400/80 hover:text-orange-400 font-medium transition-colors"
          >
            Forgot password?
          </button>
        </div>
        <div className="relative group">
          <span className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-orange-400 transition-colors z-10">
            <Lock size={15} />
          </span>
          <Input
            id="login-password"
            type={showPw ? "text" : "password"}
            placeholder="••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            className="h-11 bg-white/[0.04] border-white/10 text-white placeholder:text-slate-600 focus-visible:border-orange-500/60 focus-visible:ring-orange-500/20 focus-visible:bg-white/[0.07]"
            style={{ paddingLeft: '2.5rem', paddingRight: '2.75rem' }}
          />
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            tabIndex={-1}
            className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors z-10"
          >
            {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={loading}
        className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white border-0 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 rounded-lg"
      >
        {loading
          ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          : "Sign In"}
      </Button>
    </form>
  )
}

// ─── Sign Up Form ─────────────────────────────────────────────────────────────

interface SignUpFormProps {
  onSubmit: (email: string, password: string, username: string, name: string) => void
  loading: boolean
}

export function SignUpForm({ onSubmit, loading }: SignUpFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [name, setName] = useState("")
  const [showPw, setShowPw] = useState(false)

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(email, password, username, name) }} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <IconInput id="signup-name" label="Full Name" icon={<User size={15} />} type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required disabled={loading} />
        <IconInput id="signup-username" label="Username" icon={<User size={15} />} type="text" placeholder="johndoe" value={username} onChange={(e) => setUsername(e.target.value)} required disabled={loading} />
      </div>

      <IconInput id="signup-email" label="Email" icon={<Mail size={15} />} type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="signup-password" className="text-xs font-semibold uppercase tracking-widest text-slate-400">Password</Label>
        <div className="relative group">
          <span className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-orange-400 transition-colors z-10">
            <Lock size={15} />
          </span>
          <Input
            id="signup-password"
            type={showPw ? "text" : "password"}
            placeholder="••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            className="h-11 bg-white/[0.04] border-white/10 text-white placeholder:text-slate-600 focus-visible:border-orange-500/60 focus-visible:ring-orange-500/20 focus-visible:bg-white/[0.07]"
            style={{ paddingLeft: '2.5rem', paddingRight: '2.75rem' }}
          />
          <button type="button" onClick={() => setShowPw(!showPw)} tabIndex={-1} className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors z-10">
            {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={loading}
        className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white border-0 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 rounded-lg"
      >
        {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Create Account"}
      </Button>
    </form>
  )
}

// ─── Forgot Password Form ─────────────────────────────────────────────────────

interface ForgotPasswordFormProps {
  onSubmit: (email: string) => void
  onBack: () => void
  loading: boolean
}

export function ForgotPasswordForm({ onSubmit, onBack, loading }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("")

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(email) }} className="flex flex-col gap-5">
      <p className="text-sm text-slate-400 leading-relaxed">
        Enter your registered email and we'll send you a temporary password to get back in.
      </p>

      <IconInput id="forgot-email" label="Email" icon={<Mail size={15} />} type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />

      <Button
        type="submit"
        size="lg"
        disabled={loading}
        className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white border-0 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 rounded-lg"
      >
        {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Send Reset Link"}
      </Button>

      <button type="button" onClick={onBack} disabled={loading} className="text-sm text-slate-500 hover:text-slate-300 text-center transition-colors">
        ← Back to Sign In
      </button>
    </form>
  )
}
