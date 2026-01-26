import { useTranslation } from 'react-i18next'
import { X, LogOut, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../auth'

type SettingsPanelProps = {
  isOpen: boolean
  onClose: () => void
  language: string
  setLanguage: (lang: string) => void
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
  toneLevel: number
  setToneLevel: (level: number) => void
  onSignOut: () => void
}

export function SettingsPanel({
  isOpen,
  onClose,
  language,
  setLanguage,
  theme,
  setTheme,
  toneLevel,
  setToneLevel,
  onSignOut,
}: SettingsPanelProps) {
  const { t } = useTranslation()
  const { updatePassword } = useAuth()
  const [newPassword, setNewPassword] = useState('')
  const [passwordStatus, setPasswordStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')

  async function handleUpdatePassword() {
    if (!newPassword || newPassword.length < 6) return
    setPasswordStatus('saving')
    try {
      const { error } = await updatePassword(newPassword)
      if (error) throw error
      setPasswordStatus('success')
      setNewPassword('')
      setTimeout(() => setPasswordStatus('idle'), 3000)
    } catch (e: any) {
      console.error('Password update error:', e)
      setPasswordStatus('error')
      setTimeout(() => {
        setPasswordStatus('idle')
      }, 5000)
    }
  }

  if (!isOpen) return null


  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-navy-950 border-l border-slate-800 shadow-2xl z-50 flex flex-col font-sans bg-grid-pattern">
      <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-navy-900">
        <div className="flex flex-col">
          <p className="text-[10px] font-bold uppercase tracking-geometric text-neon-blue mb-1">Configurações</p>
          <h2 className="text-xl font-bold text-white tracking-geometric">{t('settings.title')}</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-slate-500 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-10">
        {/* Language & Theme Section */}
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-geometric">
              {t('settings.language.label')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['pt', 'en', 'es'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`py-3 text-[10px] font-bold uppercase tracking-widest border transition-all ${
                    language === lang 
                      ? 'bg-neon-blue/10 border-neon-blue text-neon-blue' 
                      : 'border-slate-800 text-slate-600 hover:border-slate-700'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-geometric">
              {t('settings.theme.label')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['dark', 'light'] as const).map((tMode) => (
                <button
                  key={tMode}
                  onClick={() => setTheme(tMode)}
                  className={`py-3 text-[10px] font-bold uppercase tracking-widest border transition-all ${
                    theme === tMode 
                      ? 'bg-neon-magenta/10 border-neon-magenta text-neon-magenta' 
                      : 'border-slate-800 text-slate-600 hover:border-slate-700'
                  }`}
                >
                  {tMode === 'dark' ? t('settings.theme.dark') : t('settings.theme.light')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tone Level Section */}
        <div className="space-y-4">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-geometric">
            {t('settings.tone.label')}
          </label>
          <div className="space-y-3">
            {[1, 2, 3].map((level) => (
              <button
                key={level}
                onClick={() => setToneLevel(level as 1 | 2 | 3)}
                className={`w-full p-4 text-left border transition-all relative group ${
                  toneLevel === level 
                    ? 'bg-navy-900 border-neon-blue text-white' 
                    : 'border-slate-800 text-slate-500 hover:bg-navy-900/50'
                }`}
              >
                {toneLevel === level && (
                  <div className="absolute top-0 right-0 w-2 h-2 bg-neon-blue" />
                )}
                <p className={`text-[11px] font-bold uppercase tracking-geometric mb-1 ${toneLevel === level ? 'text-neon-blue' : ''}`}>
                  {t(`settings.tone.level${level}.label`)}
                </p>
                <p className="text-[10px] leading-relaxed opacity-60">
                  {t(`settings.tone.level${level}.desc`)}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Password Update Section */}
        <div className="pt-8 border-t border-slate-800 space-y-4">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-geometric">
            Alterar Senha
          </label>
          <div className="space-y-3">
            <input
              type="password"
              placeholder="NOVA SENHA"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input-base"
            />
            <button
              onClick={handleUpdatePassword}
              disabled={passwordStatus === 'saving' || !newPassword}
              className="btn-primary w-full py-3"
            >
              {passwordStatus === 'saving' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'ATUALIZAR'}
            </button>
            {passwordStatus === 'success' && (
              <p className="text-[10px] text-neon-green font-bold uppercase tracking-widest text-center">Senha atualizada!</p>
            )}
          </div>
        </div>
      </div>

      <div className="p-8 bg-navy-900 border-t border-slate-800">
        <button
          onClick={onSignOut}
          className="btn-outline w-full"
        >
          <LogOut className="h-4 w-4 mr-2" />
          {t('settings.logout.label')}
        </button>
      </div>
    </div>
  )
}
