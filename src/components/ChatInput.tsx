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
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-2">
      <div className="flex items-end gap-3">
        <div className="flex-1 rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 flex items-end gap-2">
          <textarea
            id="chat-input"
            name="message"
            aria-label={t('chat.footer.inputPlaceholder')}
            ref={inputRef}
            rows={1}
            className="w-full resize-none bg-transparent text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none py-1"
            placeholder={t('chat.footer.textareaPlaceholder')}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={!canSend}
            className="btn-primary h-10 w-10 md:w-auto md:px-4 md:gap-2 flex-shrink-0 flex items-center justify-center"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="hidden md:inline text-xs">{t('chat.footer.send')}</span>
          </button>

          <button
            type="button"
            onClick={onToggleLive}
            className="h-10 w-10 flex items-center justify-center rounded-lg border border-slate-800 bg-slate-950/50 text-sky-500 hover:bg-slate-900 hover:text-sky-400 transition-colors"
            title="Live Mode"
          >
            <Mic className="h-4 w-4" />
          </button>
          
          <button
            type="button"
            onClick={onGenerateReport}
            className="h-10 w-10 flex items-center justify-center rounded-lg border border-slate-800 bg-slate-950/50 text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition-colors"
            title={t('chat.footer.generateReportTooltip')}
          >
            <FileText className="h-4 w-4" />
          </button>
        </div>
      </div>
      <p className="text-[10px] text-slate-500">
        {t('chat.footer.disclaimer')}
      </p>
    </form>
  )
}
