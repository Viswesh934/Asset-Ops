import { useState } from "react"
import { Package, Shield, BarChart3, Zap } from "lucide-react"
import { useAuth } from "../hooks/useAuth"
import { AuthAlert, LoginForm, SignUpForm, ForgotPasswordForm } from "../components/auth/AuthForms"

interface LoginProps {
  onLoginSuccess: (token: string, email: string) => void
}

const FEATURES = [
  { icon: Package, title: "Asset Tracking", desc: "Real-time visibility across all assets and inventory" },
  { icon: Shield, title: "Secure Access", desc: "Role-based permissions with full audit logging" },
  { icon: BarChart3, title: "Analytics", desc: "Intelligent insights to optimize asset utilization" },
]

export default function Login({ onLoginSuccess }: LoginProps) {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login")

  const { loading, error, successMsg, tempPassword, login, signup, forgotPassword, resetState } = useAuth()

  const handleLoginSubmit = async (email: string, pass: string) => {
    const res = await login(email, pass)
    if (res) {
      localStorage.setItem("token", res.accessToken)
      localStorage.setItem("userEmail", res.user)
      onLoginSuccess(res.accessToken, res.user)
    }
  }

  const handleSignUpSubmit = async (email: string, pass: string, user: string, name: string) => {
    const success = await signup(email, pass, user, name)
    if (success) setMode("login")
  }

  const switchTab = (target: "login" | "signup") => {
    setMode(target)
    resetState()
  }

  return (
    <div className="flex w-screen h-screen bg-[#07080f] overflow-hidden">

      {/* ── Left Panel: Brand ── */}
      <div className="hidden lg:flex flex-col justify-between w-[46%] min-w-[420px] bg-gradient-to-br from-[#0d0f1a] to-[#070810] border-r border-white/[0.06] p-12 relative overflow-hidden">
        
        {/* Glow blobs */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-orange-600/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-blue-600/10 blur-[100px] pointer-events-none" />
        
        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-orange-600 to-orange-400 shadow-lg shadow-orange-500/30">
            <Zap size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">AssetOps</span>
        </div>

        {/* Headline */}
        <div className="relative z-10 space-y-6">
          <div>
            <h1 className="text-[42px] font-extrabold text-white leading-[1.15] tracking-tight">
              Manage every<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-300">
                asset with clarity.
              </span>
            </h1>
            <p className="mt-4 text-base text-slate-400 leading-relaxed max-w-xs">
              Enterprise-grade asset and operations management built for modern teams.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3.5 group">
                <div className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.08] group-hover:border-orange-500/30 group-hover:bg-orange-500/5 transition-all duration-200">
                  <Icon size={16} className="text-slate-400 group-hover:text-orange-400 transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">{title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-xs text-slate-600">
          © 2025 AssetOps · Enterprise Asset Management
        </p>
      </div>

      {/* ── Right Panel: Form ── */}
      <div className="flex flex-1 flex-col items-center justify-center p-8">

        {/* Mobile logo */}
        <div className="flex lg:hidden items-center gap-2.5 mb-10">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-orange-600 to-orange-400">
            <Zap size={17} className="text-white" />
          </div>
          <span className="text-lg font-bold text-white">AssetOps</span>
        </div>

        <div className="w-full max-w-[420px]">
          {/* Header text */}
          <div className="mb-7">
            {mode === "forgot" ? (
              <>
                <h2 className="text-2xl font-bold text-white">Reset your password</h2>
                <p className="text-sm text-slate-500 mt-1">We'll help you get back in.</p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-white">
                  {mode === "login" ? "Welcome back" : "Create your account"}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  {mode === "login"
                    ? "Sign in to your AssetOps workspace."
                    : "Get started with AssetOps for free."}
                </p>
              </>
            )}
          </div>

          {/* Tab switcher */}
          {mode !== "forgot" && (
            <div className="flex p-1 bg-white/[0.04] border border-white/[0.08] rounded-xl mb-6">
              {(["login", "signup"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => switchTab(tab)}
                  disabled={loading}
                  className={[
                    "flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200",
                    mode === tab
                      ? "bg-white/10 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-300"
                  ].join(" ")}
                >
                  {tab === "login" ? "Sign In" : "Sign Up"}
                </button>
              ))}
            </div>
          )}

          {/* Alert */}
          {(error || successMsg) && (
            <div className="mb-5">
              <AuthAlert error={error} successMsg={successMsg} tempPassword={tempPassword} />
            </div>
          )}

          {/* Form */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-7 shadow-2xl shadow-black/40">
            {mode === "login" && (
              <LoginForm
                onSubmit={handleLoginSubmit}
                onForgotPassword={() => { setMode("forgot"); resetState() }}
                loading={loading}
              />
            )}
            {mode === "signup" && (
              <SignUpForm onSubmit={handleSignUpSubmit} loading={loading} />
            )}
            {mode === "forgot" && (
              <ForgotPasswordForm
                onSubmit={async (email) => { await forgotPassword(email) }}
                onBack={() => { setMode("login"); resetState() }}
                loading={loading}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
