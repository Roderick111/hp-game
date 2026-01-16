/**
 * BriefingDossier Component
 *
 * Displays structured case information (Dossier) as the first slide
 * of the standardized briefing wizard.
 *
 * @module components/BriefingDossier
 */

import { TERMINAL_THEME } from '../styles/terminal-theme';
import type { BriefingContent } from '../types/investigation';

interface BriefingDossierProps {
    dossier: BriefingContent['dossier'];
    onContinue: () => void;
}

export function BriefingDossier({ dossier, onContinue }: BriefingDossierProps) {
    return (
        <div className="flex flex-col h-full animate-fadeIn">
            {/* Header Removed (Managed by Parent Window) */}

            {/* Grid Layout for Data Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-8">

                {/* Victim */}
                <div className="space-y-1">
                    <div className={TERMINAL_THEME.typography.caption}>VICTIM</div>
                    <div className={`${TERMINAL_THEME.typography.body} border-l-2 border-gray-600 pl-3`}>
                        {dossier.victim}
                    </div>
                </div>

                {/* Location */}
                <div className="space-y-1">
                    <div className={TERMINAL_THEME.typography.caption}>LOCATION</div>
                    <div className={`${TERMINAL_THEME.typography.body} border-l-2 border-gray-600 pl-3`}>
                        {dossier.location}
                    </div>
                </div>

                {/* Time */}
                <div className="space-y-1">
                    <div className={TERMINAL_THEME.typography.caption}>TIME OF INCIDENT</div>
                    <div className={`${TERMINAL_THEME.typography.body} border-l-2 border-gray-600 pl-3`}>
                        {dossier.time}
                    </div>
                </div>

                {/* Status */}
                <div className="space-y-1">
                    <div className={TERMINAL_THEME.typography.caption}>CURRENT STATUS</div>
                    <div className={`${TERMINAL_THEME.typography.body} border-l-2 border-gray-600 pl-3`}>
                        {dossier.status}
                    </div>
                </div>
            </div>

            {/* Synopsis / Description */}
            <div className="flex-grow">
                <div className={`${TERMINAL_THEME.typography.caption} mb-2`}>
                    BRIEFING SYNOPSIS
                </div>
                <div className={`${TERMINAL_THEME.typography.body} bg-gray-800/30 p-4 border border-gray-700 rounded leading-relaxed whitespace-pre-wrap`}>
                    {dossier.synopsis}
                </div>
            </div>

            {/* Footer / Action */}
            <div className="mt-8 pt-4 border-t border-gray-700 flex justify-end">
                <button
                    onClick={onContinue}
                    className={`${TERMINAL_THEME.components.button.base} w-auto px-8 py-3 bg-amber-900/20 text-amber-500 border-amber-700/50 hover:bg-amber-900/40 hover:text-amber-400 font-bold tracking-widest uppercase transition-all duration-200 group`}
                >
                    <span className="mr-2 group-hover:mr-4 transition-all">ACKNOWLEDGE & CONTINUE</span>
                    {TERMINAL_THEME.symbols.current}
                </button>
            </div>
        </div>
    );
}
