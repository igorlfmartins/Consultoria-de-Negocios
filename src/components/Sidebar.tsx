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
    <aside className="hidden md:flex md:w-72 lg:w-80 flex-col border-r border-slate-800 bg-navy-950">
      <div className="px-6 pt-8 pb-6 border-b border-slate-800">
        <div className="mb-8 relative">
          <div className="absolute -left-6 top-0 w-1 h-8 bg-neon-blue" />
          <p className="text-[10px] font-bold uppercase tracking-geometric text-neon-blue mb-1">{t('chat.sidebar.header')}</p>
          <h2 className="text-xl font-bold text-white tracking-geometric">{t('chat.sidebar.subHeader')}</h2>
        </div>

        <button
          type="button"
          onClick={onNewSession}
          className="btn-primary w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('chat.sidebar.newSessionButton')}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 text-xs">
        <div className="flex items-center justify-between px-2 mb-4">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-geometric">
            {t('chat.sidebar.history')}
          </span>
          {isLoading && <Loader2 className="h-3 w-3 animate-spin text-neon-blue" />}
        </div>

        <div className="space-y-2">
          {sessions.length === 0 && !isLoading && (
            <p className="text-[11px] text-slate-600 px-2 italic">
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
                className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-all group relative border ${
                  isActive 
                    ? 'bg-navy-900 border-neon-blue/30 text-white' 
                    : 'border-transparent hover:bg-navy-900/50 hover:border-slate-800'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 w-0.5 h-full bg-neon-blue" />
                )}
                <span className={`mt-0.5 ${isActive ? 'text-neon-blue' : 'text-slate-600'}`}>
                  <Hash className="h-3 w-3" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className={`block text-[11px] font-medium truncate ${isActive ? 'text-white' : 'text-slate-400'}`}>
                    {session.title || t('chat.session.defaultTitle')}
                  </span>
                  {session.createdAt && (
                    <span className="block text-[9px] text-slate-600 mt-1 font-bold uppercase tracking-widest">
                      {new Date(session.createdAt).toLocaleString(i18n.language, {
                        dateStyle: 'short',
                      })}
                    </span>
                  )}
                </span>
                <span
                  role="button"
                  onClick={(e) => onDeleteSession(session.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-neon-magenta text-slate-600 transition-opacity"
                  title={t('chat.sidebar.deleteConversation')}
                >
                  <Trash2 className="h-3 w-3" />
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="px-6 py-4 border-t border-slate-800 bg-navy-900/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-white tracking-geometric truncate max-w-[120px]">{userId}</span>
            <span className="text-[9px] text-slate-600 uppercase tracking-geometric">{t('chat.sidebar.userAccessLevel')}</span>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="p-2 text-slate-500 hover:text-neon-magenta hover:bg-neon-magenta/5 border border-transparent hover:border-neon-magenta/20 transition-all"
            title={t('chat.sidebar.logout')}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
