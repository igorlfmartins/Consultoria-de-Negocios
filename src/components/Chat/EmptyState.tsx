import { useTranslation } from 'react-i18next'

export function EmptyState() {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-8">
      <div className="md:col-span-12 bg-bio-deep/5 dark:bg-bio-deep p-8 md:p-12 flex flex-col justify-between min-h-[300px] relative overflow-hidden group">
        <div>
          <p className="text-xs font-bold text-bio-lime uppercase tracking-widest mb-4 font-mono">
            {t('chat.body.initialBriefing.title')}
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-bio-deep dark:text-bio-white font-mono leading-tight">
            {t('chat.body.initialBriefing.heading')}
          </h2>
        </div>
      </div>
    </div>
  )
}
