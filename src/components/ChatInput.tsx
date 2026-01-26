import { useRef, useState, useEffect, type FormEvent, type KeyboardEvent } from 'react'
import { FileText, Loader2, Send, Mic } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface ChatInputProps {
  onSendMessage: (message: string) => void
  onGenerateReport: () => void
  onToggleLive: () => void
  isLoading: boolean
}

export function ChatInput({ onSendMessage, onGenerateReport, onToggleLive, isLoading }: ChatInputProps) {
  const { t } = useTranslation()
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const canSend = input.trim().length > 0 && !isLoading

  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    const lineHeight = 20
    const maxHeight = lineHeight * 5
    const next = Math.min(el.scrollHeight, maxHeight)
    el.style.height = `${next}px`
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }, [input])

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!canSend) return
    onSendMessage(input)
    setInput('')
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSubmit(event as unknown as FormEvent)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-4 pb-8 px-4">
      <div className="flex flex-col md:flex-row items-stretch md:items-end gap-4">
        <div className="flex-1 bg-navy-900 border border-slate-800 p-4 relative group focus-within:border-neon-blue transition-colors">
          <div className="absolute top-0 left-0 w-1 h-4 bg-neon-blue opacity-30" />
          <textarea
            id="chat-input"
            name="message"
            aria-label={t('chat.footer.inputPlaceholder')}
            ref={inputRef}
            rows={1}
            className="w-full resize-none bg-transparent text-sm text-white placeholder:text-slate-600 focus:outline-none py-1 leading-relaxed"
            placeholder={t('chat.footer.textareaPlaceholder')}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!canSend}
            className="btn-primary flex-1 md:flex-none h-full"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="ml-2">{t('chat.footer.send')}</span>
          </button>

          <button
            type="button"
            onClick={onToggleLive}
            className="p-4 bg-navy-900 border border-slate-800 text-neon-blue hover:border-neon-blue hover:bg-neon-blue/5 transition-all relative group"
            title="Live Mode"
          >
            <div className="absolute top-0 right-0 w-2 h-2 bg-neon-blue animate-pulse" />
            <Mic className="h-4 w-4" />
          </button>
          
          <button
            type="button"
            onClick={onGenerateReport}
            className="p-4 bg-navy-900 border border-slate-800 text-slate-500 hover:text-neon-magenta hover:border-neon-magenta hover:bg-neon-magenta/5 transition-all"
            title={t('chat.footer.generateReportTooltip')}
          >
            <FileText className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="h-[1px] flex-1 bg-slate-800" />
        <p className="text-[9px] uppercase tracking-geometric text-slate-600 font-bold whitespace-nowrap">
          {t('chat.footer.disclaimer')}
        </p>
        <div className="h-[1px] flex-1 bg-slate-800" />
      </div>
    </form>
  )
}
