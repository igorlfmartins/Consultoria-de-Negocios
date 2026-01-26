import type { FormEvent } from 'react'
import { useState } from 'react'
import { Mail, CheckCircle, AlertCircle, Loader2, RefreshCw, Lock, ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth'

export function Login() {
  const { t } = useTranslation()
  const { signInWithEmail, signInWithPassword, signUp, resendSignUp } = useAuth()
  const [mode, setMode] = useState<'password' | 'magic_link' | 'signup'>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  async function submitLogin() {
    if (!email.trim()) return
    if ((mode === 'password' || mode === 'signup') && !password) return

    setLoading(true)
    setMessage(null)

    try {
      if (mode === 'password') {
        const { error } = await signInWithPassword(email, password)
        if (error) {
          if (error.message.includes('Email not confirmed')) {
            setMessage({ type: 'error', text: 'E-mail não confirmado.' })
          } else {
            setMessage({ type: 'error', text: 'Email ou senha incorretos.' })
          }
        }
      } else if (mode === 'signup') {
        const { error, data } = await signUp(email, password)
        if (error) {
          console.error('Signup error:', error)
          setMessage({ type: 'error', text: error.message || 'Erro ao criar conta.' })
        } else {
           if (data?.user && !data.session) {
              setMessage({ type: 'success', text: 'Conta criada! Verifique seu e-mail para confirmar.' })
           } else {
              // Auto logged in
           }
        }
      } else {
        const { error } = await signInWithEmail(email)
        if (error) {
          console.error('Auth error:', error)
          setMessage({ type: 'error', text: error.message || 'Erro ao enviar link. Verifique o e-mail.' })
        } else {
          setMessage({ type: 'success', text: 'Link de acesso enviado! Verifique sua caixa de entrada.' })
        }
      }
    } catch (err: any) {
      console.error('Unexpected error:', err)
      setMessage({ type: 'error', text: err?.message || 'Erro inesperado. Tente novamente.' })
    } finally {
      setLoading(false)
    }
  }

  async function handleResendSignUp() {
    if (!email.trim()) return
    setLoading(true)
    try {
        const { error } = await resendSignUp(email)
        if (error) {
             setMessage({ type: 'error', text: error.message || 'Erro ao reenviar e-mail.' })
        } else {
             setMessage({ type: 'success', text: 'E-mail de confirmação reenviado!' })
        }
    } catch (e: any) {
        setMessage({ type: 'error', text: e?.message || 'Erro ao reenviar.' })
    } finally {
        setLoading(false)
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    await submitLogin()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-navy-900 to-slate-900 text-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-950/80 backdrop-blur-lg shadow-xl px-8 py-10 space-y-8">
        <div className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-sky-500">{t('login.appTitle')}</p>
          <h1 className="text-2xl font-semibold text-slate-50">
            {mode === 'signup' ? 'Criar Conta' : (mode === 'password' ? 'Entrar com Senha' : t('login.title'))}
          </h1>
          <p className="text-sm text-slate-400">
            {mode === 'signup' ? 'Preencha seus dados para começar' : (mode === 'password' ? 'Digite suas credenciais para acessar' : t('login.subtitle'))}
          </p>
        </div>

        {message && (
          <div className={`p-4 rounded-lg flex items-center gap-3 text-sm ${
            message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
            {message.type === 'success' ? <CheckCircle className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="email" className="text-sm font-medium text-slate-200">
                {t('login.emailLabel')}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className="input-base pl-9"
                  placeholder={t('login.emailPlaceholder')}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={loading || (mode === 'magic_link' && message?.type === 'success')}
                />
              </div>
            </div>

            {(mode === 'password' || mode === 'signup') && (
              <div className="space-y-1">
                <label htmlFor="password" className="text-sm font-medium text-slate-200">
                  Senha
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    className="input-base pl-9"
                    placeholder="Sua senha segura"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
            )}
          </div>

          <button 
            type="submit" 
            className="btn-primary w-full flex items-center justify-center gap-2"
            disabled={loading || (mode === 'magic_link' && message?.type === 'success')}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === 'signup' ? 'Cadastrar' : (mode === 'magic_link' && message?.type === 'success' ? 'Link Enviado' : (mode === 'password' ? 'Entrar' : 'Receber Link de Acesso'))}
          </button>

          {mode === 'magic_link' && message?.type === 'success' && (
            <div className="space-y-3 pt-2 animate-in fade-in slide-in-from-top-2">
              <button
                type="button"
                onClick={submitLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors text-sm font-medium border border-slate-700"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Enviar novo link
              </button>
            </div>
          )}

          {((mode === 'signup' && message?.type === 'success') || (message?.text === 'E-mail não confirmado.')) && (
            <div className="space-y-3 pt-2 animate-in fade-in slide-in-from-top-2">
              <button
                type="button"
                onClick={handleResendSignUp}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors text-sm font-medium border border-slate-700"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Reenviar e-mail de confirmação
              </button>
            </div>
          )}
          
          <div className="pt-2 border-t border-slate-800 space-y-3">
             {mode === 'password' && (
               <div className="flex flex-col gap-2">
                 <button
                    type="button"
                    onClick={() => {
                      setMode('magic_link')
                      setMessage(null)
                    }}
                    className="w-full text-sm text-slate-400 hover:text-sky-400 transition-colors"
                  >
                    Esqueci minha senha / Entrar sem senha
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup')
                      setMessage(null)
                    }}
                    className="w-full text-sm text-slate-400 hover:text-sky-400 transition-colors font-medium"
                  >
                    Não tem conta? Cadastre-se
                  </button>
               </div>
             )}

             {mode === 'magic_link' && (
               <button
                  type="button"
                  onClick={() => {
                    setMode('password')
                    setMessage(null)
                  }}
                  className="w-full text-sm text-slate-400 hover:text-sky-400 transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="h-3 w-3" />
                  <span>Voltar para login com senha</span>
                </button>
             )}

             {mode === 'signup' && (
               <button
                  type="button"
                  onClick={() => {
                    setMode('password')
                    setMessage(null)
                  }}
                  className="w-full text-sm text-slate-400 hover:text-sky-400 transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="h-3 w-3" />
                  <span>Já tem conta? Entrar</span>
                </button>
             )}
          </div>
        </form>

        <p className="text-[11px] text-slate-500 text-center leading-relaxed">
          {t('login.footer')}
        </p>
      </div>
    </div>
  )
}
