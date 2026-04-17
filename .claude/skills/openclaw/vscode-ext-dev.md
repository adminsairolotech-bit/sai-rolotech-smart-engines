---
name: vscode-ext-dev
description: VS Code extension development patterns for SAI Rolotech
---

# VS Code Extension Development Skill

## Project Structure

```
cloud-code-extension/
├── src/
│   ├── extension.ts      # Entry point
│   ├── commands/         # Command handlers
│   ├── providers/        # LSP providers
│   └── utils/           # Utilities
├── package.json         # Extension manifest
├── tsconfig.json        # TypeScript config
└── vsc-extension-quickstart.md
```

## Key APIs

### Register Command

```typescript
vscode.commands.registerCommand('extension.myCommand', async (args) => {
  // Your logic here
  const editor = vscode.window.activeTextEditor;
  const selection = editor?.selection;
});
```

### Webview Panel

```typescript
const panel = vscode.window.createWebviewPanel(
  'myView',
  'My View',
  vscode.ViewColumn.One,
  { enableScripts: true }
);

panel.webview.html = `
  <html>
    <body><h1>Hello</h1></body>
  </html>
`;
```

### Configuration

```typescript
// package.json
"configuration": {
  "title": "My Extension",
  "properties": {
    "myext.setting": {
      "type": "string",
      "default": "default"
    }
  }
}

// Read in code
const config = vscode.workspace.getConfiguration('myext');
const value = config.get('setting');
```

## Testing

```bash
# Run tests
npm test

# Watch mode
npm run test -- --watch

# Install Extension (for testing)
F5 or Ctrl+Shift+B
```

## Publishing

```bash
# Get PAT from Azure DevOps
npx vsce login <publisher>

# Package
npx vsce package

# Publish
npx vsce publish
```

## Useful VSCode APIs

```typescript
// Get active file
vscode.window.activeTextEditor?.document.uri.fsPath

// Show message
vscode.window.showInformationMessage('Hello!');
vscode.window.showErrorMessage('Error!');

// Quick pick
const item = await vscode.window.showQuickPick(['Option1', 'Option2']);

// Input box
const input = await vscode.window.showInputBox({
  prompt: 'Enter name'
});

// File dialog
const uri = await vscode.window.showOpenDialog({
  canSelectFiles: true,
  canSelectFolders: true
});
```

## Status Bar

```typescript
const item = vscode.window.setStatusBarMessage('Working...', 5000);
// or
const item = vscode.window.createStatusBarItem(
  vscode.StatusBarAlignment.Right,
  100
);
item.text = '$(check) Ready';
item.show();
```
