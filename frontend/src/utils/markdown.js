import { marked } from 'marked';

marked.setOptions({
    gfm: true,
    breaks: true
});

export const parseMarkdownToHtml = (content = '') => {
    const normalizedContent = content
        .replace(/\r\n/g, '\n')
        .replace(/\u200B/g, '');

    const parsed = marked.parse(normalizedContent);
    return typeof parsed === 'string' ? parsed : '';
};
