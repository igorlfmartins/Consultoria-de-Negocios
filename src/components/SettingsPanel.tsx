import { useTranslation } from 'react-i18next'
import { Settings, X, Globe, Zap, Moon, Sun, CreditCard, LogOut } from 'lucide-react'

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

  if (!isOpen) return null

  const TONES = [
    { level: 1, label: t('settings.tone.level1.label'), desc: t('settings.tone.level1.desc') },
    { level: 2, label: t('settings.tone.level2.label'), desc: t('settings.tone.level2.desc') },
    { level: 3, label: t('settings.tone.level3.label'), desc: t('settings.tone.level3.desc') },
  ]

  const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'pt', label: 'Português' },
    { code: 'es', label: 'Español' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="h-5 w-5 text-sky-500" />
            {t('settings.title')}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="p-6 space-y-6">
          {/* Language */}
          <div className="space-y-3">
            <label className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {t('settings.language.label')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                    language === lang.code
                      ? 'bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/50 text-sky-700 dark:text-sky-400'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Theme */}
          <div className="space-y-3">
            <label className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Moon className="h-4 w-4" />
              {t('settings.theme.label')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setTheme('light')}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                  theme === 'light'
                    ? 'bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/50 text-sky-700 dark:text-sky-400'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <Sun className="h-4 w-4" />
                {t('settings.theme.light')}
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                  theme === 'dark'
                    ? 'bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/50 text-sky-700 dark:text-sky-400'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <Moon className="h-4 w-4" />
                {t('settings.theme.dark')}
              </button>
            </div>
          </div>

          {/* Tone Level */}
          <div className="space-y-3">
            <label className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              {t('settings.tone.label')}
            </label>
            <div className="grid grid-cols-1 gap-2">
              {TONES.map((tone) => (
                <button
                  key={tone.level}
                  onClick={() => setToneLevel(tone.level)}
                  className={`flex flex-col items-start text-left px-3 py-2 rounded-lg text-sm border transition-all ${
                    toneLevel === tone.level
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/50'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <span
                    className={`font-semibold ${
                      toneLevel === tone.level ? 'text-emerald-800 dark:text-emerald-300' : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {tone.label}
                  </span>
                  <span
                    className={`text-xs ${
                      toneLevel === tone.level ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {tone.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <footer className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-3">
          <button className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline">
            <CreditCard className="h-4 w-4" />
            {t('settings.subscription.manage')}
          </button>
          <button
            onClick={onSignOut}
            className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:underline"
          >
            <LogOut className="h-4 w-4" />
            {t('settings.logout.label')}
          </button>
        </footer>
      </div>
    </div>
  )
}
