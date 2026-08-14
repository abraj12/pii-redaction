import api from '../services/api';

/**
 * Securely downloads a redacted document using the binary blob API.
 * @param documentId The ID of the document to download.
 * @param filename The original filename of the document (used to derive the redacted filename).
 */
export const downloadRedactedDocument = async (documentId: string, filename: string): Promise<void> => {
    try {
        const res = await api.get(`/documents/${documentId}/download`, { 
            responseType: 'blob' 
        });

        // Some APIs return JSON on failure even when responseType is 'blob'
        // Let's verify it's not a JSON error response before triggering download
        if (res.data.type === 'application/json') {
            const text = await res.data.text();
            const json = JSON.parse(text);
            throw new Error(json.error || 'Failed to download document');
        }

        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        
        // Ensure proper filename is used
        const extMatch = filename.match(/\.([^.]+)$/);
        const ext = extMatch ? extMatch[1] : 'docx'; // Fallback
        const baseName = filename.replace(/\.[^/.]+$/, "").replace(/[^\w.-]+/g, '_');
        
        link.setAttribute('download', `Redacted_${baseName}.${ext}`);
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (err: any) {
        console.error('Download failed', err);
        throw err;
    }
};
