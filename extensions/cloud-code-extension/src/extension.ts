import * as vscode from 'vscode';
import { activateCommands } from './commands';
import { AIChatViewProvider, loadKeyPool } from './ai-providers';

export async function activate(context: vscode.ExtensionContext) {
    // Register AI Chat as WebviewView (sidebar panel)
    const aiChatProvider = new AIChatViewProvider(context);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('cloudCode.aiChat', aiChatProvider, {
            webviewOptions: { retainContextWhenHidden: true }
        })
    );

    activateCommands(context);

    // Check if keys are imported — prompt if not
    const geminiFree = await loadKeyPool(context.secrets, 'geminiFree');
    const openRouterKeys = await loadKeyPool(context.secrets, 'openrouter');
    const hasAnyKeys = geminiFree.length > 0 || openRouterKeys.length > 0;

    if (!hasAnyKeys) {
        // Show welcome message with key import option
        const action = await vscode.window.showInformationMessage(
            '🤖 SAI ROLOTECH: Free AI API keys not configured yet!',
            'Import FREE Keys',
            'Learn More'
        );

        if (action === 'Import FREE Keys') {
            vscode.commands.executeCommand('cloudCode.importAllKeys');
        } else if (action === 'Learn More') {
            vscode.env.openExternal(vscode.Uri.parse(
                'https://github.com/adminsairolotech-bit/cloud-code-extension#free-ai-setup'
            ));
        }
    }
}

export function deactivate() {}
