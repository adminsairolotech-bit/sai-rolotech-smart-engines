import * as vscode from 'vscode';

export function activateCommands(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('extension.helloWorld', () => {
        vscode.window.showInformationMessage('Hello World from Cloud Code Extension!');
    });

    context.subscriptions.push(disposable);
}

export function anotherCommand() {
    // Define another command functionality here
}