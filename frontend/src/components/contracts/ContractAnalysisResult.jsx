import React, { useMemo } from 'react';
import { IconCheck } from '@tabler/icons-react';
import { parseMarkdownToHtml } from '../../utils/markdown';

export const ContractAnalysisResult = ({ analysis }) => {
    if (!analysis) return null;

    const html = useMemo(() => parseMarkdownToHtml(analysis), [analysis]);

    return (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[24px] p-8 mt-6 shadow-sm">
            <h3 className="text-[18px] font-bold flex items-center gap-2.5 mb-6 pb-4 border-b border-[var(--card-border)] tracking-tight text-[var(--foreground)]">
                <span className="h-6 w-6 rounded bg-[#d4af37]/10 text-[#b48512] flex items-center justify-center border border-[#d4af37]/20">
                    <IconCheck size={16} stroke={2.5} />
                </span>
                AI Legal Review
            </h3>

            <div
                className="markdown-body text-[var(--foreground)]"
                dangerouslySetInnerHTML={{ __html: html }}
            />
        </div>
    );
};