import type { FormEvent } from 'react'
import { useState } from 'react'
import { Mail, CheckCircle, AlertCircle, Loader2, Lock, ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth'

export function Login() {
  const { t } = useTranslation()
  const { signInWithEmail, signInWithPassword, signUp } = useAuth()
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

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    await submitLogin()
  }

  return (
    <div className="min-h-screen bg-navy-950 text-slate-50 flex items-center justify-center px-4 font-sans bg-grid-pattern">
      <div className="w-full max-w-md bg-navy-900 border border-slate-800 p-10 space-y-10 relative overflow-hidden">
        {/* Geometric Decorative Elements */}
        <div className="absolute top-0 right-0 w-24 h-24 border-t-2 border-r-2 border-neon-blue opacity-10 -mr-12 -mt-12 rotate-45" />
        <div className="absolute bottom-0 left-0 w-16 h-1 bg-neon-magenta opacity-20" />
        
        <div className="space-y-4 text-center relative z-10">
          <p className="text-[10px] font-bold uppercase tracking-geometric text-neon-blue">{t('login.appTitle')}</p>
          <h1 className="text-3xl font-bold text-white tracking-geometric">
            {mode === 'signup' ? 'CRIAR CONTA' : (mode === 'password' ? 'ENTRAR' : t('login.title').toUpperCase())}
          </h1>
          <div className="h-1 w-12 bg-neon-magenta mx-auto" />
          <p className="text-xs text-slate-500 uppercase tracking-widest leading-relaxed">
            {mode === 'signup' ? 'Preencha seus dados para começar' : (mode === 'password' ? 'Digite suas credenciais para acessar' : t('login.subtitle'))}
          </p>
        </div>

        {message && (
          <div className={`p-5 rounded-none flex items-center gap-4 text-xs font-bold uppercase tracking-widest ${
            message.type === 'success' ? 'bg-neon-green/5 text-neon-green border border-neon-green/20' : 'bg-neon-magenta/5 text-neon-magenta border border-neon-magenta/20'
          }`}>
            {message.type === 'success' ? <CheckCircle className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-[10px] font-bold text-slate-500 uppercase tracking-geometric">
                {t('login.emailLabel')}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-600">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className="input-base pl-12"
                  placeholder={t('login.emailPlaceholder').toUpperCase()}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={loading || (mode === 'magic_link' && message?.type === 'success')}
                />
              </div>
            </div>

            {(mode === 'password' || mode === 'signup') && (
              <div className="space-y-2">
                <label htmlFor="password" className="text-[10px] font-bold text-slate-500 uppercase tracking-geometric">
                  SENHA
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-600">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    className="input-base pl-12"
                    placeholder="SUA SENHA SEGURA"
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
            className="btn-primary w-full py-4"
            disabled={loading || (mode === 'magic_link' && message?.type === 'success')}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {mode === 'signup' ? 'CADASTRAR' : (mode === 'magic_link' && message?.type === 'success' ? 'LINK ENVIADO' : (mode === 'password' ? 'ENTRAR' : 'RECEBER LINK'))}
          </button>

          <div className="pt-8 border-t border-slate-800 space-y-4">
             {mode === 'password' && (
               <div className="flex flex-col gap-3">
                 <button
                    type="button"
                    onClick={() => {
                      setMode('magic_link')
                      setMessage(null)
                    }}
                    className="w-full text-[10px] font-bold text-slate-500 hover:text-neon-blue uppercase tracking-geometric transition-colors"
                  >
                    Entrar sem senha
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup')
                      setMessage(null)
                    }}
                    className="w-full text-[10px] font-bold text-slate-500 hover:text-neon-magenta uppercase tracking-geometric transition-colors"
                  >
                    Criar nova conta
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
                  className="w-full text-[10px] font-bold text-slate-500 hover:text-neon-blue uppercase tracking-geometric transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="h-3 w-3" />
                  <span>Voltar para senha</span>
                </button>
             )}

             {mode === 'signup' && (
               <button
                  type="button"
                  onClick={() => {
                    setMode('password')
                    setMessage(null)
                  }}
                  className="w-full text-[10px] font-bold text-slate-500 hover:text-neon-blue uppercase tracking-geometric transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="h-3 w-3" />
                  <span>Já tem conta? Entrar</span>
                </button>
             )}
          </div>
        </form>

        <p className="text-[9px] text-slate-600 text-center leading-loose uppercase tracking-widest font-bold opacity-50">
          {t('login.footer')}
        </p>
      </div>
    </div>
  )
}
