import axios from 'axios';
import { env } from '../config/env';

export interface PiiEntity {
    type: string;
    text: string;
    fakeValue: string;
    score: number;
    start: number;
    end: number;
    redact?: boolean;
}

export interface PiiAnalysisResult {
    total_pii: number;
    breakdown: Record<string, number>;
    entities: PiiEntity[];
}

interface TextChunk {
    text: string;
    offset: number;
}

const splitIntoChunks = (text: string): TextChunk[] => {
    if (text.length <= env.chunkSize) return [{ text, offset: 0 }];

    const chunks: TextChunk[] = [];
    let start = 0;
    while (start < text.length) {
        const targetEnd = Math.min(start + env.chunkSize, text.length);
        let end = targetEnd;
        if (end < text.length) {
            const boundary = text.lastIndexOf('\n', end);
            if (boundary > start + env.chunkSize * 0.6) end = boundary;
        }

        chunks.push({ text: text.slice(start, end), offset: start });
        if (end >= text.length) break;
        start = Math.max(0, end - env.chunkOverlap);
    }
    return chunks;
};

const dedupeEntities = (entities: PiiEntity[]): PiiEntity[] => {
    const sorted = entities.sort((a, b) => a.start - b.start || b.score - a.score);
    const selected: PiiEntity[] = [];
    const seen = new Set<string>();

    for (const entity of sorted) {
        const key = `${entity.type}:${entity.start}:${entity.end}:${entity.text}`;
        if (seen.has(key)) continue;
        const overlaps = selected.some((existing) => (
            entity.start < existing.end
            && entity.end > existing.start
            && entity.type === existing.type
            && entity.text === existing.text
        ));
        if (!overlaps) {
            seen.add(key);
            selected.push(entity);
        }
    }

    return selected;
};

export const analyzeText = async (text: string, filename: string): Promise<PiiAnalysisResult> => {
    const chunks = splitIntoChunks(text);
    const entities: PiiEntity[] = [];

    for (const chunk of chunks) {
        const response = await axios.post(`${env.piiEngineUrl}/api/v1/analyze`, {
            text: chunk.text,
            filename
        }, { timeout: env.piiTimeoutMs });

        for (const entity of response.data.entities || []) {
            entities.push({
                ...entity,
                start: entity.start + chunk.offset,
                end: entity.end + chunk.offset
            });
        }
    }

    const deduped = dedupeEntities(entities);
    const breakdown: Record<string, number> = {};
    for (const entity of deduped) {
        breakdown[entity.type] = (breakdown[entity.type] || 0) + 1;
    }

    return {
        total_pii: deduped.length,
        breakdown,
        entities: deduped
    };
};
