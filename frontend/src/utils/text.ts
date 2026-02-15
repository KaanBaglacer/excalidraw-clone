import type { FontFamily } from '@/types/element.ts';

const FONT_FAMILY_MAP: Record<FontFamily, string> = {
    'hand-drawn': '"Virgil", "Segoe UI", sans-serif',
    normal: '"Helvetica", "Arial", sans-serif',
    code: '"Cascadia Code", "Fira Code", monospace',
};

export function getFontString(fontSize: number, fontFamily: FontFamily) {
    return `${fontSize}px ${FONT_FAMILY_MAP[fontFamily]}`;
}

export function measureText(text: string, fontSize: number, fontFamily: FontFamily) {
    const lines = text.split('\n');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
        return { width: 0, height: 0, baseline: 0 };
    }

    const padding = 10;
    context.font = getFontString(fontSize, fontFamily);
    let maxWidth = 0;

    // Measure each line
    lines.forEach(line => {
        const metrics = context.measureText(line);
        maxWidth = Math.max(maxWidth, metrics.width);
    });

    // Calculate height (approximate line height 1.25)
    const lineHeight = fontSize * 1.25;
    const height = lines.length * lineHeight;

    return {
        width: maxWidth + padding * 2,
        height: height + padding * 2,
        baseline: lineHeight
    };
}

export function wrapText(text: string, maxWidth: number, fontSize: number, fontFamily: FontFamily): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return text;

    ctx.font = getFontString(fontSize, fontFamily);

    const splitLongWord = (word: string): string[] => {
        if (!word) return [''];
        const parts: string[] = [];
        let current = '';

        for (const ch of word) {
            const candidate = current + ch;
            if (current && ctx.measureText(candidate).width > maxWidth) {
                parts.push(current);
                current = ch;
            } else {
                current = candidate;
            }
        }

        if (current) parts.push(current);
        return parts.length > 0 ? parts : [''];
    };

    const paragraphs = text.split('\n');
    return paragraphs.map((paragraph) => {
        if (paragraph === '') return '';

        const words = paragraph.trim().split(/\s+/);
        const lines: string[] = [];
        let currentLine = '';

        for (const word of words) {
            const lineWithWord = currentLine ? `${currentLine} ${word}` : word;
            if (ctx.measureText(lineWithWord).width <= maxWidth) {
                currentLine = lineWithWord;
                continue;
            }

            if (currentLine) {
                lines.push(currentLine);
                currentLine = '';
            }

            if (ctx.measureText(word).width <= maxWidth) {
                currentLine = word;
                continue;
            }

            const chunks = splitLongWord(word);
            lines.push(...chunks.slice(0, -1));
            currentLine = chunks[chunks.length - 1] ?? '';
        }

        if (currentLine) lines.push(currentLine);
        return lines.join('\n');
    }).join('\n');
}
