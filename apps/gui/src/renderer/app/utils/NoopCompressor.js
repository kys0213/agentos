export class NoopCompressor {
    async compress(messages) {
        return {
            summary: {
                role: 'system',
                content: { contentType: 'text', value: 'summary not implemented' },
            },
            compressedCount: messages.length,
        };
    }
}
