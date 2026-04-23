/**
 * BriefingDossier Component
 *
 * Displays structured case information (Dossier) as the first slide
 * of the standardized briefing wizard.
 *
 * @module components/BriefingDossier
 */

import { useTheme } from '../context/useTheme';
import { useTranslation } from '../i18n/LanguageContext';
import { renderInlineMarkdown } from '../utils/renderInlineMarkdown';
import type { BriefingContent } from '../types/investigation';

interface BriefingDossierProps {
    dossier: BriefingContent['dossier'];
    onContinue: () => void;
}

export function BriefingDossier({ dossier, onContinue }: BriefingDossierProps) {
    const { theme } = useTheme();
    const { t } = useTranslation();

    return (
        <div className="flex flex-col h-full animate-fadeIn">
            {/* Header Removed (Managed by Parent Window) */}

            {/* Grid Layout for Data Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-8">

                {/* Victim */}
                <div className="space-y-1">
                    <div className={theme.typography.caption}>{t('briefing.victim')}</div>
                    <div className={`${theme.typography.body} border-l-2 ${theme.colors.border.default} pl-3`}>
                        {dossier.victim}
                    </div>
                </div>

                {/* Location */}
                <div className="space-y-1">
                    <div className={theme.typography.caption}>{t('briefing.location')}</div>
                    <div className={`${theme.typography.body} border-l-2 ${theme.colors.border.default} pl-3`}>
                        {dossier.location}
                    </div>
                </div>

                {/* Time */}
                <div className="space-y-1">
                    <div className={theme.typography.caption}>{t('briefing.timeOfIncident')}</div>
                    <div className={`${theme.typography.body} border-l-2 ${theme.colors.border.default} pl-3`}>
                        {dossier.time}
                    </div>
                </div>

                {/* Status */}
                <div className="space-y-1">
                    <div className={theme.typography.caption}>{t('briefing.status')}</div>
                    <div className={`${theme.typography.body} border-l-2 ${theme.colors.border.default} pl-3`}>
                        {dossier.status}
                    </div>
                </div>
            </div>

            {/* Synopsis / Description */}
            <div className="flex-grow">
                <div className={`${theme.typography.caption} mb-2`}>
                    {t('briefing.synopsis')}
                </div>
                <div className={`${theme.typography.body} ${theme.colors.bg.semiTransparent} p-4 border ${theme.colors.border.default} rounded leading-relaxed whitespace-pre-wrap text-justify`}>
                    {renderInlineMarkdown(dossier.synopsis)}
                </div>
            </div>

            {/* Footer / Action */}
            <div className={`mt-8 pt-4 border-t ${theme.colors.border.default} flex justify-end`}>
                <button
                    onClick={onContinue}
                    className={`${theme.components.button.base} w-auto px-8 py-3 ${theme.colors.bg.semiTransparent} ${theme.colors.interactive.text} border ${theme.colors.interactive.border} hover:brightness-90 font-bold tracking-widest uppercase transition-all duration-200 group`}
                >
                    <span className="mr-2 group-hover:mr-4 transition-all">{t('briefing.acknowledge')}</span>
                    {theme.symbols.current}
                </button>
            </div>
        </div>
    );
}
