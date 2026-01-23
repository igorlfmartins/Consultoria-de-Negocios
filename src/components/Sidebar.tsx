import { Plus, Hash, Trash2, Loader2, LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { SessionSummary } from '../api'

interface SidebarProps {
  sessions: SessionSummary[]
  currentSessionId: string | null
  isLoading: boolean
  onNewSession: () => void
  onSelectSession: (session: SessionSummary) => void
  onDeleteSession: (sessionId: string, e: React.MouseEvent) => void
  userId: string | null
  onSignOut: () => void
}

export function Sidebar({
  sessions,
  currentSessionId,
  isLoading,
  onNewSession,
  onSelectSession,
  onDeleteSession,
  userId,
  onSignOut,
}: SidebarProps) {
  const { t, i18n } = useTranslation()

  return (
    <aside className="hidden md:flex md:w-72 lg:w-80 flex-col border-r border-slate-800 bg-gradient-to-b from-slate-950 to-navy-900/80">
      <div className="px-5 pt-5 pb-4 border-b border-slate-800">
        <div className="mb-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-500 mb-1">{t('chat.sidebar.header')}</p>
          <h2 className="text-lg font-semibold text-slate-200">{t('chat.sidebar.subHeader')}</h2>
        </div>

        <button
          type="button"
          onClick={onNewSession}
          className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg py-2.5 transition-all active:scale-[0.98] shadow-lg shadow-sky-900/20"
        >
          <Plus className="h-4 w-4" />
          <span className="text-xs font-medium">{t('chat.sidebar.newSessionButton')}</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 text-xs">
        <div className="flex items-center justify-between px-2 mb-2">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-[0.2em]">
            {t('chat.sidebar.history')}
          </span>
          {isLoading && <Loader2 className="h-3 w-3 animate-spin text-slate-500" />}
        </div>

        {sessions.length === 0 && !isLoading && (
          <p className="text-[11px] text-slate-500 px-2">
            {t('chat.sidebar.emptyHistory')}
          </p>
        )}

        {sessions.map((session) => {
          const isActive = session.id === currentSessionId
          return (
            <button
              key={session.id}
              type="button"
              onClick={() => onSelectSession(session)}
              className={`w-full flex items-start gap-2 rounded-md px-3 py-2 text-left transition group ${
                isActive ? 'bg-slate-900 border border-sky-700/70' : 'border border-transparent hover:bg-slate-900/60'
              }`}
            >
              <span className="mt-0.5 text-slate-500">
                <Hash className="h-3 w-3" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[11px] font-medium text-slate-200 truncate">
                  {session.title || t('chat.session.defaultTitle')}
                </span>
                {session.createdAt && (
                  <span className="block text-[10px] text-slate-500 mt-0.5">
                    {new Date(session.createdAt).toLocaleString(i18n.language, {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </span>
                )}
              </span>
              <span
                role="button"
                onClick={(e) => onDeleteSession(session.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 text-slate-600 transition-opacity"
                title={t('chat.sidebar.deleteConversation')}
              >
                <Trash2 className="h-3 w-3" />
              </span>
            </button>
          )
        })}
      </div>

      <div className="px-4 py-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="font-medium text-slate-300">{userId}</span>
          <span className="text-[10px] text-slate-500">{t('chat.sidebar.userAccessLevel')}</span>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-900"
        >
          <LogOut className="h-3 w-3" />
          {t('chat.sidebar.logout')}
        </button>
      </div>
    </aside>
  )
}
