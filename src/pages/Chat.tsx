import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, MessageSquareMore, Target, ArrowRight, Settings } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { useTranslation } from 'react-i18next'
import { ChatInput } from '../components/ChatInput'
import { SettingsPanel } from '../components/SettingsPanel'
import { Sidebar } from '../components/Sidebar'
import { LiveMode } from '../components/LiveMode'
import { useAuth } from '../auth'
import type { ChatMessage, SessionSummary } from '../api'
import { sendConsultoriaMessage } from '../api'

const FOCUS_AREAS = (t: (key: string) => string) => [
  { id: 'vendas', label: t('chat.focusAreas.sales'), color: 'text-emerald-400', border: 'border-emerald-500/50', bg: 'bg-emerald-500/10' },
  { id: 'marketing', label: t('chat.focusAreas.marketing'), color: 'text-purple-400', border: 'border-purple-500/50', bg: 'bg-purple-500/10' },
  { id: 'financas', label: t('chat.focusAreas.finance'), color: 'text-amber-400', border: 'border-amber-500/50', bg: 'bg-amber-500/10' },
  { id: 'gestao', label: t('chat.focusAreas.management'), color: 'text-blue-400', border: 'border-blue-500/50', bg: 'bg-blue-500/10' },
  { id: 'tecnologia', label: t('chat.focusAreas.tech'), color: 'text-indigo-400', border: 'border-indigo-500/50', bg: 'bg-indigo-500/10' },
]

const SESSIONS_KEY_PREFIX = 'consultoria_sessions_'
const SESSION_MESSAGES_KEY_PREFIX = 'consultoria_session_messages_'

function getSessionsKey(userId: string) {
  return `${SESSIONS_KEY_PREFIX}${userId}`
}

function getMessagesKey(userId: string, sessionId: string) {
  return `${SESSION_MESSAGES_KEY_PREFIX}${userId}_${sessionId}`
}

function loadSessionsFromStorage(userId: string): SessionSummary[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(getSessionsKey(userId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

function saveSessionsToStorage(userId: string, sessions: SessionSummary[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(getSessionsKey(userId), JSON.stringify(sessions))
  } catch {
  }
}

function loadMessagesFromStorage(userId: string, sessionId: string): ChatMessage[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(getMessagesKey(userId, sessionId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

function saveMessagesToStorage(userId: string, sessionId: string, messages: ChatMessage[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(getMessagesKey(userId, sessionId), JSON.stringify(messages))
  } catch {
  }
}

type SessionState = {
  id: string | null
  title: string
  messages: ChatMessage[]
}

export function Chat() {
  const { t, i18n } = useTranslation()
  const { user, signOut } = useAuth()
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [currentSession, setCurrentSession] = useState<SessionState>({
    id: null,
    title: t('chat.session.new'),
    messages: [],
  })
  const [selectedFocus, setSelectedFocus] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingSessions, setIsLoadingSessions] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [language, setLanguage] = useState(i18n.language)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [toneLevel, setToneLevel] = useState(3)
  const [isLiveMode, setIsLiveMode] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const focusAreas = useMemo(() => FOCUS_AREAS(t), [t])

  // Load settings
  useEffect(() => {
    const savedLang = localStorage.getItem('consultoria_language') || 'en'
    const savedTheme = (localStorage.getItem('consultoria_theme') as 'light' | 'dark') || 'dark'
    const savedTone = parseInt(localStorage.getItem('consultoria_tone') || '1', 10)
    setLanguage(savedLang)
    setTheme(savedTheme)
    setToneLevel(savedTone)
  }, [])

  // Apply theme
  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
    localStorage.setItem('consultoria_theme', theme)
  }, [theme])

  // Save language
  useEffect(() => {
    localStorage.setItem('consultoria_language', language)
    i18n.changeLanguage(language)
  }, [language, i18n])

  // Save tone
  useEffect(() => {
    localStorage.setItem('consultoria_tone', toneLevel.toString())
  }, [toneLevel])

  useEffect(() => {
    if (!user) return
    setIsLoadingSessions(true)

    const stored = loadSessionsFromStorage(user.id)
    setSessions(stored)
    setIsLoadingSessions(false)
  }, [user])

  useEffect(() => {
    if (!messagesEndRef.current) return
    messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [currentSession.messages.length])

  function handleNewSession() {
    setCurrentSession({
      id: null,
      title: t('chat.session.new'),
      messages: [],
    })
    setError(null)
  }

  function handleSelectSession(session: SessionSummary) {
    if (!user) return
    const messages = loadMessagesFromStorage(user.id, session.id)
    setCurrentSession({
      id: session.id,
      title: session.title,
      messages,
    })
    setError(null)
  }

  function handleDeleteSession(sessionId: string, event: React.MouseEvent) {
    event.stopPropagation()
    if (!user) return

    if (!window.confirm(t('chat.sidebar.confirmDelete'))) return

    const nextSessions = sessions.filter((s) => s.id !== sessionId)
    setSessions(nextSessions)
    saveSessionsToStorage(user.id, nextSessions)
    
    // Clean up messages from storage
    try {
      window.localStorage.removeItem(getMessagesKey(user.id, sessionId))
    } catch {}

    if (currentSession.id === sessionId) {
      handleNewSession()
    }
  }

  async function sendMessage(text: string, focusOverride?: string) {
    if (!user || !text.trim()) return

    const focusToSend = focusOverride !== undefined ? focusOverride : selectedFocus
    const now = new Date().toISOString()

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      sender: 'user',
      text,
      createdAt: now,
    }

    setCurrentSession((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
    }))
    
    setIsLoading(true)
    setError(null)

    try {
      const result = await sendConsultoriaMessage({
        userId: user.id,
        conversationId: currentSession.id,
        message: text,
        history: currentSession.messages,
        focus: focusToSend,
        language: language,
        toneLevel: toneLevel,
      })

      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: result.reply,
        createdAt: new Date().toISOString(),
      }

      const conversationId = result.conversationId
      const baseMessages = [...currentSession.messages, userMessage]
      const fullMessages = [...baseMessages, aiMessage]

      setCurrentSession((prev) => ({
        ...prev,
        id: conversationId,
        messages: fullMessages,
      }))

      if (user) {
        let createdAt = now
        let title = currentSession.title
        const existing = sessions.find((s) => s.id === conversationId)
        if (existing) {
          createdAt = existing.createdAt ?? createdAt
          title = existing.title || title
        } else {
          if (!title || title === t('chat.session.new')) {
            title = text.length > 60 ? `${text.slice(0, 57)}...` : text
          }
        }

        const summary: SessionSummary = {
          id: conversationId,
          title: title || t('chat.session.defaultTitle'),
          createdAt,
        }

        setSessions((prev) => {
          const index = prev.findIndex((s) => s.id === conversationId)
          if (index === -1) {
            const next = [summary, ...prev]
            saveSessionsToStorage(user.id, next)
            return next
          }
          const next = [...prev]
          next[index] = summary
          saveSessionsToStorage(user.id, next)
          return next
        })

        saveMessagesToStorage(user.id, conversationId, fullMessages)
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || t('chat.body.error'))
    } finally {
      setIsLoading(false)
    }
  }

  function handleDeepDive(area: { id: string; label: string }) {
    sendMessage(t('chat.body.aiMessage.deepDive') + ` ${area.label}`, area.label)
  }

  function handleGenerateReport() {
    sendMessage(t('chat.footer.generateReport'))
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex">
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSession.id}
        isLoading={isLoadingSessions}
        onNewSession={handleNewSession}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        userId={user?.id || ''}
        onSignOut={signOut}
      />

      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <header className="border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur flex items-center justify-between px-6 py-4 transition-colors duration-300">
          <div className="flex items-center gap-3">
            <MessageSquareMore className="h-5 w-5 text-sky-500" />
            <div>
              <h1 className="text-sm font-semibold text-slate-900 dark:text-slate-50">{t('chat.header.title')}</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-[10px] uppercase tracking-wider font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded-full">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {t('chat.header.aiStatus')}
            </div>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              title={t('chat.header.settings')}
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </header>

        <section className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6">
            {currentSession.messages.length === 0 && !isLoading && (
              <div className="max-w-2xl mx-auto rounded-xl border border-dashed border-slate-800 bg-slate-950/60 px-6 py-6 md:px-8 md:py-8">
                <p className="text-xs uppercase tracking-[0.25em] text-sky-500 mb-3">{t('chat.body.initialBriefing.title')}</p>
                <h2 className="text-lg font-semibold text-slate-50 mb-3">
                  {t('chat.body.initialBriefing.heading')}
                </h2>
                <p className="text-sm text-slate-400 mb-4">
                  {t('chat.body.initialBriefing.paragraph')}
                </p>
                <ul className="text-xs text-slate-400 space-y-1">
                  <li>• {t('chat.body.initialBriefing.example1')}</li>
                  <li>• {t('chat.body.initialBriefing.example2')}</li>
                  <li>• {t('chat.body.initialBriefing.example3')}</li>
                </ul>
              </div>
            )}

            {currentSession.messages.map((message) => {
              const isUser = message.sender === 'user'
              return (
                <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-2xl rounded-lg px-4 py-3 text-sm leading-relaxed ${
                      isUser
                        ? 'bg-sky-600/90 text-slate-50 shadow-md'
                        : 'bg-slate-900/90 text-slate-50 border border-slate-800'
                    }`}
                  >
                    {!isUser && (
                      <div className="text-[11px] font-medium text-sky-400 mb-1.5">{t('chat.body.aiMessage.senderName')}</div>
                    )}
                    {isUser ? (
                      <p>{message.text}</p>
                    ) : (
                      <div className="prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown>{message.text}</ReactMarkdown>
                        
                        <div className="mt-6 pt-4 border-t border-slate-800/50">
                          <p className="text-[10px] text-slate-500 mb-3 uppercase tracking-wider font-medium flex items-center gap-2">
                            <Target className="h-3 w-3" />
                            {t('chat.body.aiMessage.deepDive')}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {focusAreas.map((area) => (
                              <button
                                key={area.id}
                                onClick={() => handleDeepDive(area)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all border ${area.border} ${area.bg} ${area.color} hover:bg-opacity-20 hover:scale-[1.02] active:scale-[0.98]`}
                              >
                                {area.label}
                                <ArrowRight className="h-3 w-3 opacity-50" />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>{t('chat.body.loading')}</span>
              </div>
            )}

            {error && <p className="text-xs text-red-400">{error}</p>}

            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/95 backdrop-blur px-6 py-6 transition-colors duration-300">
            <div className="max-w-3xl mx-auto mb-4 overflow-x-auto no-scrollbar">
              <div className="flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => setSelectedFocus(null)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-semibold transition-all whitespace-nowrap ${
                    selectedFocus === null
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-slate-200 text-slate-500 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                  }`}
                >
                  {t('chat.footer.integratedView')}
                </button>
                {focusAreas.map((area) => (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => setSelectedFocus(selectedFocus === area.label ? null : area.label)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-semibold transition-all whitespace-nowrap ${
                      selectedFocus === area.label
                        ? 'bg-sky-500 text-white'
                        : 'bg-slate-200 text-slate-500 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                    }`}
                  >
                    {area.label}
                  </button>
                ))}
              </div>
            </div>

            <ChatInput
              onSendMessage={sendMessage}
              onGenerateReport={handleGenerateReport}
              onToggleLive={() => setIsLiveMode(true)}
              isLoading={isLoading}
            />
          </div>
        </section>

        {isLiveMode && (
          <LiveMode 
            onClose={() => setIsLiveMode(false)}
            systemInstruction={t('chat.header.aiStatus')} // Fallback or logic to get actual prompt
          />
        )}

        <SettingsPanel
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          language={language}
          setLanguage={setLanguage}
          theme={theme}
          setTheme={setTheme}
          toneLevel={toneLevel}
          setToneLevel={setToneLevel}
          onSignOut={signOut}
        />
      </main>
    </div>
  )
}
