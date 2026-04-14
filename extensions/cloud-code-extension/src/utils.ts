import { Uri } from 'vscode';

export function isValidUri(uri: string): boolean {
    try {
        const parsedUri = Uri.parse(uri);
        return parsedUri.scheme !== '';
    } catch {
        return false;
    }
}

export function formatMessage(message: string): string {
    return `[Cloud Code Extension]: ${message}`;
}

export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
