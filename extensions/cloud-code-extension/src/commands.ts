import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as apiClient from './api-client';
import { smartAI, AIConfig, storeAPIKey, getAPIKey, getAllAPIKeys, storeMultipleKeys, loadKeyPool, getKeyPoolStatus, addKeyToPool } from './ai-providers';

const execAsync = promisify(exec);

const PROJECT_ROOT = path.join(__dirname, '..', '..', '..');

// Track all disposables for cleanup
let dashboardDisposable: vscode.WebviewPanel | undefined;
const webviewPanels = new Map<string, vscode.WebviewPanel>();
let statusBarItem: vscode.StatusBarItem;

interface ServiceStatus {
    name: string;
    port: number;
    status: 'running' | 'stopped' | 'checking';
}

interface ValidationResult {
    file: string;
    lines: number;
    safetyScore: number;
    issues: string[];
    warnings: string[];
}

export function activateCommands(context: vscode.ExtensionContext) {

    // ============ STATUS BAR ============
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
    statusBarItem.text = `$(gear~spin) Cloud Code`;
    statusBarItem.tooltip = 'Sai Rolotech Smart Engines';
    statusBarItem.command = 'cloudCode.openDashboard';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // ============ HELLO WORLD ============
    let helloDisposable = vscode.commands.registerCommand('cloudCode.helloWorld', () => {
        vscode.window.showInformationMessage('Hello World from Cloud Code Extension! Sai Rolotech Smart Engines v2.3.0');
    });
    context.subscriptions.push(helloDisposable);

    // ============ DASHBOARD (WEBVIEW) ============
    let dashboardCommand = vscode.commands.registerCommand('cloudCode.openDashboard', async () => {
        if (dashboardDisposable) {
            dashboardDisposable.reveal(vscode.ViewColumn.One, true);
            return;
        }

        dashboardDisposable = vscode.window.createWebviewPanel(
            'cloudCodeDashboard',
            'Sai Rolotech Smart Engines',
            { viewColumn: vscode.ViewColumn.One, preserveFocus: true },
            { enableScripts: true, retainContextWhenHidden: true }
        );

        const services = await checkServices();
        const htmlContent = getDashboardHTML(services);

        dashboardDisposable.webview.html = htmlContent;

        dashboardDisposable.webview.onDidReceiveMessage(async (message) => {
            switch (message.type) {
                case 'refreshServices':
                    const updatedServices = await checkServices();
                    dashboardDisposable?.webview.postMessage({ type: 'services', services: updatedServices });
                    break;
                case 'validateGcode':
                    const result = await validateActiveGcode();
                    dashboardDisposable?.webview.postMessage({ type: 'validationResult', result });
                    break;
                case 'openService':
                    vscode.env.openExternal(vscode.Uri.parse(message.url));
                    break;
                case 'openProject':
                    const projectPath = path.join(PROJECT_ROOT, message.path);
                    const uri = vscode.Uri.file(projectPath);
                    await vscode.commands.executeCommand('revealFileInOS', uri);
                    break;
                case 'newProfile':
                    vscode.commands.executeCommand('cloudCode.newProfile');
                    break;
            }
        });

        dashboardDisposable.onDidDispose(() => {
            dashboardDisposable = undefined;
        });

        // Refresh services every 30 seconds
        const refreshInterval = setInterval(async () => {
            if (dashboardDisposable) {
                const updatedServices = await checkServices();
                dashboardDisposable.webview.postMessage({ type: 'services', services: updatedServices });
            } else {
                clearInterval(refreshInterval);
            }
        }, 30000);

        context.subscriptions.push({ dispose: () => clearInterval(refreshInterval) });
    });
    context.subscriptions.push(dashboardCommand);

    // ============ VALIDATE G-CODE ============
    let validateGcodeDisposable = vscode.commands.registerCommand('cloudCode.validateGcode', async () => {
        const result = await validateActiveGcode();

        const outputChannel = vscode.window.createOutputChannel('G-Code Validation');
        outputChannel.show();
        outputChannel.appendLine(`File: ${result.file}`);
        outputChannel.appendLine(`Lines: ${result.lines}`);
        outputChannel.appendLine(`Safety Score: ${result.safetyScore}/100`);

        if (result.issues.length > 0) {
            outputChannel.appendLine('\n❌ Issues:');
            result.issues.forEach(issue => outputChannel.appendLine(`  - ${issue}`));
        }
        if (result.warnings.length > 0) {
            outputChannel.appendLine('\n⚠️ Warnings:');
            result.warnings.forEach(warn => outputChannel.appendLine(`  - ${warn}`));
        }
        if (result.issues.length === 0 && result.warnings.length === 0) {
            outputChannel.appendLine('\n✅ No issues found!');
        }
    });
    context.subscriptions.push(validateGcodeDisposable);

    // ============ API STATUS ============
    let apiStatusDisposable = vscode.commands.registerCommand('cloudCode.apiStatus', async () => {
        const services = await checkServices();
        showServiceStatusMessage(services);
    });
    context.subscriptions.push(apiStatusDisposable);

    // ============ OPEN PROJECT ============
    let openProjectDisposable = vscode.commands.registerCommand('cloudCode.openProject', async () => {
        const projects = [
            { label: 'design-tool', description: 'Web-based roll forming design tool', path: 'artifacts/design-tool' },
            { label: 'api-server', description: 'Backend API server', path: 'artifacts/api-server' },
            { label: 'python-api', description: 'Python CAD/CAM engine', path: 'artifacts/python-api' },
            { label: 'desktop', description: 'Desktop Electron app', path: 'artifacts/desktop' }
        ];

        const selected = await vscode.window.showQuickPick(projects, {
            placeHolder: 'Select a project to open'
        });

        if (selected) {
            const projectPath = path.join(PROJECT_ROOT, selected.path);
            const uri = vscode.Uri.file(projectPath);
            await vscode.commands.executeCommand('revealFileInOS', uri);
            vscode.window.showInformationMessage(`Opening: ${selected.label}`);
        }
    });
    context.subscriptions.push(openProjectDisposable);

    // ============ NEW PROFILE ============
    let newProfileDisposable = vscode.commands.registerCommand('cloudCode.newProfile', async () => {
        const profileName = await vscode.window.showInputBox({
            prompt: 'Enter profile name',
            placeHolder: 'e.g., C-Channel-100x50'
        });

        if (profileName) {
            const templatesDir = path.join(PROJECT_ROOT, 'artifacts', 'design-tool', 'src', 'templates');
            const profilePath = path.join(templatesDir, `${profileName}.json`);

            const template = {
                name: profileName,
                version: '1.0.0',
                created: new Date().toISOString(),
                profile: { width: 100, height: 50, thickness: 2, material: 'Steel' },
                stations: [],
                flowerPattern: []
            };

            try {
                fs.mkdirSync(path.dirname(profilePath), { recursive: true });
                fs.writeFileSync(profilePath, JSON.stringify(template, null, 2));
                vscode.window.showInformationMessage(`Profile created: ${profileName}.json`);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to create profile: ${error}`);
            }
        }
    });
    context.subscriptions.push(newProfileDisposable);

    // ============ WEBVIEW CREATION HELPER ============
    function createWebviewPanel(
        context: vscode.ExtensionContext,
        id: string,
        title: string,
        fileName: string
    ): vscode.WebviewPanel {
        if (webviewPanels.has(id)) {
            webviewPanels.get(id)!.reveal(vscode.ViewColumn.One, true);
            return webviewPanels.get(id)!;
        }

        const panel = vscode.window.createWebviewPanel(
            'cloudCode.' + id,
            'Cloud Code: ' + title,
            { viewColumn: vscode.ViewColumn.One, preserveFocus: true },
            { enableScripts: true, retainContextWhenHidden: true }
        );

        const htmlPath = path.join(__dirname, '..', 'webviews', fileName);
        if (fs.existsSync(htmlPath)) {
            let html = fs.readFileSync(htmlPath, 'utf8');
            panel.webview.html = html;
        } else {
            panel.webview.html = `<html><body><h1>Error: ${fileName} not found</h1></body></html>`;
        }

        webviewPanels.set(id, panel);
        panel.onDidDispose(() => webviewPanels.delete(id));

        panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.type) {
                // ─── Profile Designer ────────────────────────────
                case 'runPipeline':
                    try {
                        const result = await apiClient.runAutoPipeline(message.data);
                        panel.webview.postMessage({ type: 'pipelineResult', result });
                    } catch (err) {
                        panel.webview.postMessage({ type: 'pipelineError', error: String(err) });
                    }
                    break;

                // ─── Flower Pattern ─────────────────────────────
                case 'generateFlower':
                    try {
                        const result = await apiClient.generateFlower(message.data);
                        panel.webview.postMessage({ type: 'flowerResult', result });
                    } catch (err) {
                        panel.webview.postMessage({ type: 'flowerError', error: String(err) });
                    }
                    break;

                // ─── Roll Tooling ────────────────────────────────
                case 'generateRollTooling':
                    try {
                        const result = await apiClient.generateRollTooling(message.data);
                        panel.webview.postMessage({ type: 'toolingResult', result });
                    } catch (err) {
                        panel.webview.postMessage({ type: 'toolingError', error: String(err) });
                    }
                    break;

                // ─── Materials ──────────────────────────────────
                case 'getMaterials':
                    try {
                        const materials = await apiClient.getMaterials();
                        panel.webview.postMessage({ type: 'materialsResult', materials });
                    } catch (err) {
                        panel.webview.postMessage({ type: 'materialsError', error: String(err) });
                    }
                    break;

                // ─── Springback ──────────────────────────────────
                case 'calculateSpringback':
                    try {
                        const result = await apiClient.calculateSpringback(message.data);
                        panel.webview.postMessage({ type: 'springbackResult', result });
                    } catch (err) {
                        panel.webview.postMessage({ type: 'springbackError', error: String(err) });
                    }
                    break;

                // ─── Strip Width ─────────────────────────────────
                case 'calculateStripWidth':
                    try {
                        const result = await apiClient.calculateStripWidth(message.data);
                        panel.webview.postMessage({ type: 'stripWidthResult', result });
                    } catch (err) {
                        panel.webview.postMessage({ type: 'stripWidthError', error: String(err) });
                    }
                    break;

                // ─── BOM ────────────────────────────────────────
                case 'generateBOM':
                    try {
                        const result = await apiClient.generateBOM(message.data);
                        panel.webview.postMessage({ type: 'bomResult', result });
                    } catch (err) {
                        panel.webview.postMessage({ type: 'bomError', error: String(err) });
                    }
                    break;

                // ─── Simulation ─────────────────────────────────
                case 'runSimulation':
                    try {
                        const result = await apiClient.runSimulation(message.data);
                        panel.webview.postMessage({ type: 'simulationResult', result });
                    } catch (err) {
                        panel.webview.postMessage({ type: 'simulationError', error: String(err) });
                    }
                    break;

                // ─── Export ─────────────────────────────────────
                case 'exportCAD':
                    try {
                        const result = await apiClient.exportCAD(message.data);
                        panel.webview.postMessage({ type: 'exportResult', result });
                    } catch (err) {
                        panel.webview.postMessage({ type: 'exportError', error: String(err) });
                    }
                    break;

                // ─── G-Code ─────────────────────────────────────
                case 'generateGCode':
                    try {
                        const result = await apiClient.generateGCode(message.data);
                        panel.webview.postMessage({ type: 'gcodeResult', result });
                    } catch (err) {
                        panel.webview.postMessage({ type: 'gcodeError', error: String(err) });
                    }
                    break;

                // ─── DXF Upload ─────────────────────────────────
                case 'uploadDXF':
                    vscode.window.showWarningMessage('DXF upload: select file from Explorer panel');
                    break;

                // ─── Notifications ───────────────────────────────
                case 'bomGenerated':
                case 'exportComplete':
                case 'machineSelected':
                case 'processCardGenerated':
                case '3DGenerated':
                case 'feaAnalysisDone':
                case 'tubeCalculated':
                case 'punchesUpdated':
                    vscode.window.showInformationMessage(`[${message.type}] Updated`);
                    break;
                case 'exportBOMPDF':
                case 'exportBOMExcel':
                case 'exportProcessCardPDF':
                case 'exportProcessCardCSV':
                case 'exportDXF':
                case 'exportSTEP':
                case 'exportPDF':
                    try {
                        const result = await apiClient.exportCAD({
                            rollTooling: (message.data as { rollTooling?: unknown[] })?.rollTooling || [],
                            format: 'pdf',
                        });
                        vscode.window.showInformationMessage(`Export ready: ${result.fileName}`);
                    } catch {
                        vscode.window.showInformationMessage('Export: connecting to python-api...');
                    }
                    break;
                case 'downloadFile':
                    vscode.window.showInformationMessage(`Download: ${message.data?.name || 'file'}`);
                    break;
                case 'validateOnMachine':
                    vscode.window.showInformationMessage('Validating profile...');
                    break;
                case 'previewPunches':
                    break;
                case 'showNotification':
                    if (message.level === 'error') {
                        vscode.window.showErrorMessage(message.text);
                    } else if (message.level === 'warning') {
                        vscode.window.showWarningMessage(message.text);
                    } else {
                        vscode.window.showInformationMessage(message.text);
                    }
                    break;
            }
        });

        context.subscriptions.push(panel);
        return panel;
    }

    // ============ PROFILE DESIGNER ============
    context.subscriptions.push(
        vscode.commands.registerCommand('cloudCode.openProfileDesigner', () => {
            createWebviewPanel(context, 'ProfileDesigner', 'Profile Designer', 'profile-designer.html');
        })
    );

    // ============ FLOWER PATTERN ============
    context.subscriptions.push(
        vscode.commands.registerCommand('cloudCode.openFlowerPattern', () => {
            createWebviewPanel(context, 'FlowerPattern', 'Flower Pattern', 'flower-pattern.html');
        })
    );

    // ============ ROLL TOOLING ============
    context.subscriptions.push(
        vscode.commands.registerCommand('cloudCode.openRollTooling', () => {
            createWebviewPanel(context, 'RollTooling', 'Roll Tooling CAD', 'roll-tooling.html');
        })
    );

    // ============ MATERIAL DATABASE ============
    context.subscriptions.push(
        vscode.commands.registerCommand('cloudCode.openMaterialDatabase', () => {
            createWebviewPanel(context, 'MaterialDatabase', 'Material Database', 'material-database.html');
        })
    );

    // ============ MACHINE CONFIGURATION ============
    context.subscriptions.push(
        vscode.commands.registerCommand('cloudCode.openMachineConfig', () => {
            createWebviewPanel(context, 'MachineConfig', 'Machine Configuration', 'machine-config.html');
        })
    );

    // ============ SPRINGBACK CALCULATOR ============
    context.subscriptions.push(
        vscode.commands.registerCommand('cloudCode.openSpringbackCalculator', () => {
            createWebviewPanel(context, 'SpringbackCalc', 'Springback Calculator', 'springback-calculator.html');
        })
    );

    // ============ STRIP WIDTH CALCULATOR ============
    context.subscriptions.push(
        vscode.commands.registerCommand('cloudCode.openStripWidthCalculator', () => {
            createWebviewPanel(context, 'StripWidthCalc', 'Strip Width Calculator', 'strip-width-calculator.html');
        })
    );

    // ============ EXPORT UI ============
    context.subscriptions.push(
        vscode.commands.registerCommand('cloudCode.openExportUI', () => {
            createWebviewPanel(context, 'ExportUI', 'CAD Export Center', 'export-ui.html');
        })
    );

    // ============ BOM GENERATOR ============
    context.subscriptions.push(
        vscode.commands.registerCommand('cloudCode.openBOMGenerator', () => {
            createWebviewPanel(context, 'BOMGenerator', 'Bill of Materials', 'bom-generator.html');
        })
    );

    // ============ 3D PREVIEW ============
    context.subscriptions.push(
        vscode.commands.registerCommand('cloudCode.open3DPreview', () => {
            createWebviewPanel(context, '3DPreview', '3D Flower Preview', '3d-preview.html');
        })
    );

    // ============ FEA SIMULATION ============
    context.subscriptions.push(
        vscode.commands.registerCommand('cloudCode.openFEASimulation', () => {
            createWebviewPanel(context, 'FEASimulation', 'FEA Simulation', 'fea-simulation.html');
        })
    );

    // ============ PROCESS CARD ============
    context.subscriptions.push(
        vscode.commands.registerCommand('cloudCode.openProcessCard', () => {
            createWebviewPanel(context, 'ProcessCard', 'Process Card', 'process-card.html');
        })
    );

    // ============ PUNCH EDITOR ============
    context.subscriptions.push(
        vscode.commands.registerCommand('cloudCode.openPunchEditor', () => {
            createWebviewPanel(context, 'PunchEditor', 'Punch Editor', 'punch-editor.html');
        })
    );

    // ============ TUBE FORMING ============
    context.subscriptions.push(
        vscode.commands.registerCommand('cloudCode.openTubeForming', () => {
            createWebviewPanel(context, 'TubeForming', 'Tube Forming', 'tube-forming.html');
        })
    );

    // ============ AI CHAT (Gemini + OpenRouter) ============
    context.subscriptions.push(
        vscode.commands.registerCommand('cloudCode.openAIChat', async () => {
            // Get AI config from settings
            const config = vscode.workspace.getConfiguration('cloudCode');
            const aiConfig: AIConfig = {
                geminiKey: config.get('geminiKey', ''),
                openRouterKey: config.get('openRouterKey', ''),
                customApiUrl: config.get('customApiUrl', ''),
                customApiKey: config.get('customApiKey', ''),
                provider: config.get('aiProvider', 'gemini') as AIConfig['provider'],
            };

            // Quick AI chat in a quick pick input
            const query = await vscode.window.showInputBox({
                prompt: 'Ask AI Assistant about roll forming...',
                placeHolder: 'e.g., Explain springback compensation for SS304'
            });

            if (query) {
                const result = await smartAI(query, aiConfig);
                const panel = vscode.window.createOutputChannel('AI Assistant');
                panel.show();
                panel.appendLine(`[${result.provider} / ${result.model}] ${result.latencyMs ? `(${result.latencyMs}ms)` : ''}`);
                panel.appendLine('─'.repeat(60));
                panel.appendLine(result.text);
            }
        })
    );

    // ============ RUN PIPELINE COMMAND ============
    context.subscriptions.push(
        vscode.commands.registerCommand('cloudCode.runPipeline', async () => {
            const panel = vscode.window.createOutputChannel('Pipeline');
            panel.show();
            panel.appendLine('🚀 Running Auto-Pipeline...');

            try {
                const result = await apiClient.runAutoPipeline({
                    geometry: {
                        segments: [{ type: 'line', length: 100 }, { type: 'line', length: 50 }],
                        boundingBox: { width: 100, height: 50 },
                        bends: [{ angle: 90, radius: 2, segmentIndex: 0, side: 'left', direction: 'up' }]
                    },
                    thickness: 2.0,
                    material: 'GI',
                    sectionModel: 'open',
                    motorKw: 11,
                    rpm: 1440
                });

                panel.appendLine('\n✅ Pipeline Complete!');
                panel.appendLine('─'.repeat(60));
                panel.appendLine(`Status: ${result.pipeline_status}`);
                panel.appendLine(`Stations: ${result.summary.estimated_stations}`);
                panel.appendLine(`Strip Width: ${result.summary.strip_width_mm}mm`);
                panel.appendLine(`Shaft: ${result.summary.shaft_diameter_mm}mm (${result.summary.bearing_type})`);
                panel.appendLine(`Motor: ${result.summary.motor_kw}kW`);
                panel.appendLine(`Accuracy: ${result.summary.accuracy_score}%`);
                panel.appendLine(`Profile: ${result.summary.section_width_mm}×${result.summary.section_height_mm}mm ${result.summary.profile_complexity}`);
                panel.appendLine(`Flower Stations: ${result.flower_stations?.length || 0}`);

                if (result.warnings.length > 0) {
                    panel.appendLine('\n⚠️ Warnings:');
                    result.warnings.forEach(w => panel.appendLine(`  • ${w}`));
                }

                if (result.errors.length > 0) {
                    panel.appendLine('\n❌ Errors:');
                    result.errors.forEach(e => panel.appendLine(`  • ${e}`));
                }

                vscode.window.showInformationMessage(`Pipeline complete! ${result.summary.estimated_stations} stations, ${result.summary.accuracy_score}% accuracy`);
            } catch (err) {
                panel.appendLine(`\n❌ Error: ${err}`);
                vscode.window.showErrorMessage(`Pipeline failed: ${err}`);
            }
        })
    );

    // ============ CHECK ALL ENGINES ============
    context.subscriptions.push(
        vscode.commands.registerCommand('cloudCode.checkEngines', async () => {
            const panel = vscode.window.createOutputChannel('Engine Status');
            panel.show();
            panel.appendLine('🔍 Checking Sai Rolotech Engines...\n');

            const services = await apiClient.checkServices();
            for (const s of services) {
                const icon = s.status === 'running' ? '✅' : '❌';
                panel.appendLine(`${icon} ${s.name} (port ${s.port}): ${s.status.toUpperCase()}`);
                if (s.version) panel.appendLine(`   ${s.version}`);
            }

            // Try materials API
            try {
                const materials = await apiClient.getMaterials();
                const count = materials.supported_codes?.length || Object.keys(materials.materials || {}).length || 0;
                panel.appendLine(`\n✅ Materials API: ${count} materials available`);
            } catch {
                panel.appendLine('\n⚠️ Materials API: Not responding');
            }

            vscode.window.showInformationMessage('Engine check complete! See output channel.');
        })
    );

    // ============ SET API KEYS (SECURE STORAGE) ============
    context.subscriptions.push(
        vscode.commands.registerCommand('cloudCode.setAPIKey', async () => {
            const options = [
                { label: 'Gemini API Key', key: 'geminiKey', desc: 'Free tier at aistudio.google.com' },
                { label: 'OpenRouter API Key', key: 'openRouterKey', desc: '$5 free credits — Claude Sonnet 4.6' },
                { label: 'Custom API Key', key: 'customApiKey', desc: 'Your self-made API key' },
                { label: 'Custom API URL', key: 'customApiUrl', desc: 'Your API endpoint (https://...)' },
            ];

            const selected = await vscode.window.showQuickPick(options, {
                placeHolder: 'Select which API key to set'
            });

            if (!selected) return;

            if (selected.key === 'customApiUrl') {
                const url = await vscode.window.showInputBox({
                    prompt: 'Enter your Custom API URL',
                    placeHolder: 'https://your-api.com/v1/chat/completions'
                });
                if (url) {
                    await storeAPIKey(context.secrets, selected.key, url);
                    vscode.window.showInformationMessage(`Custom API URL saved securely!`);
                }
            } else {
                const key = await vscode.window.showInputBox({
                    prompt: `Enter ${selected.label}`,
                    placeHolder: 'sk-... or your API key',
                    password: true
                });
                if (key) {
                    await storeAPIKey(context.secrets, selected.key, key);
                    vscode.window.showInformationMessage(`${selected.label} saved securely!`);
                }
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('cloudCode.checkAPIKeys', async () => {
            const panel = vscode.window.createOutputChannel('API Key Status');
            panel.show();
            panel.appendLine('=== API Key Status ===\n');

            const keys = await getAllAPIKeys(context.secrets);
            const keyNames: Record<string, string> = {
                geminiKey: 'Gemini',
                openRouterKey: 'OpenRouter',
                customApiKey: 'Custom API Key',
                customApiUrl: 'Custom API URL',
            };

            for (const [keyName, label] of Object.entries(keyNames)) {
                const hasKey = !!keys[keyName];
                panel.appendLine(`${hasKey ? '✅' : '❌'} ${label}: ${hasKey ? '[saved]' : '[not set]'}`);
            }

            panel.appendLine('\n--- Settings ---');
            const config = vscode.workspace.getConfiguration('cloudCode');
            panel.appendLine(`AI Provider: ${config.get('aiProvider', 'gemini')}`);
            panel.appendLine(`API Server: http://localhost:${config.get('apiServerPort', 8080)}`);
            panel.appendLine(`Python API: http://localhost:${config.get('pythonApiPort', 9000)}`);

            panel.appendLine('\nTo set keys: Ctrl+Shift+P → "Set API Key"');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('cloudCode.clearAPIKey', async () => {
            const options = [
                { label: 'Gemini API Key', key: 'geminiKey' },
                { label: 'OpenRouter API Key', key: 'openRouterKey' },
                { label: 'Custom API Key', key: 'customApiKey' },
                { label: 'Custom API URL', key: 'customApiUrl' },
            ];

            const selected = await vscode.window.showQuickPick(options, {
                placeHolder: 'Select which API key to clear'
            });

            if (!selected) return;

            const confirmed = await vscode.window.showWarningMessage(
                `Delete ${selected.label}?`,
                { modal: true },
                'Delete'
            );

            if (confirmed === 'Delete') {
                await context.secrets.delete(`cloudcode.${selected.key}`);
                vscode.window.showInformationMessage(`${selected.label} cleared.`);
            }
        })
    );

    // ============ ADD KEY TO POOL (Multi-Key Support) ============
    context.subscriptions.push(
        vscode.commands.registerCommand('cloudCode.addKeyToPool', async () => {
            const options = [
                { label: 'Add Gemini Key(s)', provider: 'gemini', desc: 'Add one or more Gemini API keys' },
                { label: 'Add OpenRouter Key(s)', provider: 'openrouter', desc: 'Add one or more OpenRouter keys' },
            ];

            const selected = await vscode.window.showQuickPick(options, {
                placeHolder: 'Select provider to add keys'
            });

            if (!selected) return;

            // Ask for single key or multiple
            const choice = await vscode.window.showQuickPick([
                { label: 'Single Key', desc: 'Add one API key' },
                { label: 'Multiple Keys', desc: 'Add multiple keys (one per line)' },
            ], { placeHolder: 'How many keys to add?' });

            if (!choice) return;

            if (choice.label === 'Single Key') {
                const key = await vscode.window.showInputBox({
                    prompt: `Enter ${selected.label}`,
                    placeHolder: 'AIza... or sk-or-v1-...',
                    password: true
                });
                if (key) {
                    await addKeyToPool(context.secrets, selected.provider, key);
                    vscode.window.showInformationMessage(`Key added to ${selected.label} pool!`);
                }
            } else {
                const keys = await vscode.window.showInputBox({
                    prompt: 'Enter multiple keys (one per line)',
                    placeHolder: 'Key 1\nKey 2\nKey 3...',
                    password: true
                });
                if (keys) {
                    const keyList = keys.split('\n').map(k => k.trim()).filter(k => k.length > 10);
                    if (keyList.length > 0) {
                        await storeMultipleKeys(context.secrets, selected.provider, keyList);
                        vscode.window.showInformationMessage(`${keyList.length} keys added to ${selected.label} pool!`);
                    }
                }
            }
        })
    );

    // ============ CHECK KEY POOL STATUS ============
    context.subscriptions.push(
        vscode.commands.registerCommand('cloudCode.keyPoolStatus', async () => {
            const panel = vscode.window.createOutputChannel('Key Pool Status');
            panel.show();

            // Load and display pool status
            const geminiFreePool = await loadKeyPool(context.secrets, 'geminiFree');
            const geminiPaidPool = await loadKeyPool(context.secrets, 'geminiPaid');
            const openRouterPool = await loadKeyPool(context.secrets, 'openrouter');

            panel.appendLine('═══════════════════════════════════════');
            panel.appendLine('      SAI ROLOTECH - KEY POOL STATUS');
            panel.appendLine('═══════════════════════════════════════\n');

            panel.appendLine(`📊 FREE GEMINI KEYS (6x): ${geminiFreePool.length} keys`);
            panel.appendLine('─'.repeat(45));
            if (geminiFreePool.length === 0) {
                panel.appendLine('  ❌ No FREE keys imported');
            } else {
                geminiFreePool.forEach((key, i) => {
                    panel.appendLine(`  ${i + 1}. ${key.slice(0, 15)}...${key.slice(-4)}`);
                });
            }

            panel.appendLine(`\n📊 PAID GEMINI KEYS (8x): ${geminiPaidPool.length} keys`);
            panel.appendLine('─'.repeat(45));
            if (geminiPaidPool.length === 0) {
                panel.appendLine('  ❌ No PAID keys imported');
            } else {
                geminiPaidPool.forEach((key, i) => {
                    panel.appendLine(`  ${i + 1}. ${key.slice(0, 15)}...${key.slice(-4)}`);
                });
            }

            panel.appendLine(`\n📊 OPENROUTER KEYS: ${openRouterPool.length} keys`);
            panel.appendLine('─'.repeat(45));
            if (openRouterPool.length === 0) {
                panel.appendLine('  ❌ No OpenRouter keys');
            } else {
                openRouterPool.forEach((key, i) => {
                    panel.appendLine(`  ${i + 1}. ${key.slice(0, 12)}...${key.slice(-4)}`);
                });
            }

            panel.appendLine('\n═══════════════════════════════════════');
            panel.appendLine('SMART ROUTING: Auto-selects model by query');
            panel.appendLine('───────────────────────────────────────');
            panel.appendLine('• Simple/Medium → FREE Gemini keys');
            panel.appendLine('• Complex → PAID Gemini 3.1 Pro keys');
            panel.appendLine('• Fallback → OpenRouter ($5 credits)');
            panel.appendLine('RATE LIMIT: 15/min FREE, 60/min PAID');
            panel.appendLine('═══════════════════════════════════════');

            panel.appendLine('\n💡 To add keys: Ctrl+Shift+P → "Import All Keys"');

            vscode.window.showInformationMessage(`Key Pool: ${geminiFreePool.length} FREE + ${geminiPaidPool.length} PAID Gemini`);
        })
    );

    // ============ IMPORT ALL USER'S KEYS ============
    context.subscriptions.push(
        vscode.commands.registerCommand('cloudCode.importAllKeys', async () => {
            // Step 1: Ask for FREE keys
            const freeInput = await vscode.window.showInputBox({
                prompt: 'Step 1: Paste FREE Gemini keys (6 keys, one per line)',
                placeHolder: 'AIzaSy...\nAIzaSy...\nAIzaSy...',
                password: true
            });

            if (!freeInput) {
                vscode.window.showInformationMessage('Import cancelled');
                return;
            }

            // Step 2: Ask for PAID keys
            const paidInput = await vscode.window.showInputBox({
                prompt: 'Step 2: Paste PAID Gemini keys (8 keys, one per line)',
                placeHolder: 'AIzaSy...\nAIzaSy...\nAIzaSy...',
                password: true
            });

            // Step 3: Ask for OpenRouter key (optional)
            const openRouterInput = await vscode.window.showInputBox({
                prompt: 'Step 3: Paste OpenRouter key (optional, press Enter to skip)',
                placeHolder: 'sk-or-v1-...',
                password: true
            });

            // Parse and deduplicate
            const parseKeys = (input: string | undefined): string[] => {
                if (!input) return [];
                const keys = input.split('\n')
                    .map(k => k.trim())
                    .filter(k => k.length > 10)
                    .filter((k, i, arr) => arr.indexOf(k) === i); // remove duplicates
                return keys;
            };

            const geminiFreeKeys = parseKeys(freeInput);
            const geminiPaidKeys = parseKeys(paidInput);
            const openRouterKeys = parseKeys(openRouterInput).filter(k => k.startsWith('sk-'));

            // Show confirmation
            const panel = vscode.window.createOutputChannel('🔐 API Key Import');
            panel.clear();
            panel.appendLine('═══════════════════════════════════════════════');
            panel.appendLine('     SAI ROLOTECH - SECURE KEY IMPORT');
            panel.appendLine('═══════════════════════════════════════════════\n');

            panel.appendLine(`📊 FREE Gemini Keys: ${geminiFreeKeys.length}`);
            geminiFreeKeys.forEach((k, i) => panel.appendLine(`   ${i + 1}. ${k.slice(0, 15)}...${k.slice(-4)}`));

            panel.appendLine(`\n📊 PAID Gemini Keys: ${geminiPaidKeys.length}`);
            geminiPaidKeys.forEach((k, i) => panel.appendLine(`   ${i + 1}. ${k.slice(0, 15)}...${k.slice(-4)}`));

            panel.appendLine(`\n📊 OpenRouter Keys: ${openRouterKeys.length}`);
            openRouterKeys.forEach((k, i) => panel.appendLine(`   ${i + 1}. ${k.slice(0, 12)}...${k.slice(-4)}`));

            // Store securely in VS Code SecretStorage
            if (geminiFreeKeys.length > 0) {
                await storeMultipleKeys(context.secrets, 'geminiFree', geminiFreeKeys);
                panel.appendLine('\n✅ FREE keys stored securely (VS Code SecretStorage)');
            }
            if (geminiPaidKeys.length > 0) {
                await storeMultipleKeys(context.secrets, 'geminiPaid', geminiPaidKeys);
                panel.appendLine('✅ PAID keys stored securely (VS Code SecretStorage)');
            }
            if (openRouterKeys.length > 0) {
                await storeMultipleKeys(context.secrets, 'openrouter', openRouterKeys);
                panel.appendLine('✅ OpenRouter keys stored securely');
            }

            panel.appendLine('\n═══════════════════════════════════════════════');
            panel.appendLine('🔒 Keys are encrypted in VS Code vault');
            panel.appendLine('🔄 Smart routing will auto-select best model');
            panel.appendLine('═══════════════════════════════════════════════');
            panel.show();

            const total = geminiFreeKeys.length + geminiPaidKeys.length + openRouterKeys.length;
            vscode.window.showInformationMessage(`🔐 ${total} keys imported securely!`);
        })
    );
}

// ============ HELPER FUNCTIONS ============

async function checkServices(): Promise<ServiceStatus[]> {
    try {
        // Use api-client for real health checks
        const services = await apiClient.checkServices();
        return services.map(s => ({
            name: s.name,
            port: s.port,
            status: s.status,
        }));
    } catch {
        // Fallback to basic checks
        const services: ServiceStatus[] = [
            { name: 'API Server', port: 8080, status: 'checking' },
            { name: 'Design Tool', port: 5000, status: 'checking' },
            { name: 'Python API', port: 9000, status: 'checking' }
        ];

        for (const service of services) {
            try {
                await fetch(`http://localhost:${service.port}`, {
                    method: 'HEAD',
                    signal: AbortSignal.timeout(1000)
                });
                service.status = 'running';
            } catch {
                service.status = 'stopped';
            }
        }

        return services;
    }
}

async function validateActiveGcode(): Promise<ValidationResult> {
    const editor = vscode.window.activeTextEditor;
    const result: ValidationResult = {
        file: 'No file',
        lines: 0,
        safetyScore: 100,
        issues: [],
        warnings: []
    };

    if (!editor) {
        result.warnings.push('No file open in editor');
        return result;
    }

    const filePath = editor.document.uri.fsPath;
    result.file = path.basename(filePath);
    const content = editor.document.getText();
    const lines = content.split('\n');
    result.lines = lines.length;

    const validCommands = ['G0', 'G1', 'G2', 'G3', 'G28', 'G90', 'G91', 'M0', 'M3', 'M5', 'M30'];

    lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (trimmed.startsWith(';') || trimmed === '') return;

        // Check for negative Z (potentially dangerous)
        if (trimmed.includes('Z-')) {
            const zMatch = trimmed.match(/Z(-?\d+\.?\d*)/);
            if (zMatch && parseFloat(zMatch[1]) < -50) {
                result.issues.push(`Line ${index + 1}: Deep cut detected (Z=${zMatch[1]})`);
                result.safetyScore -= 15;
            }
        }

        // Check for rapid moves
        if (trimmed.startsWith('G0')) {
            const hasXY = trimmed.includes('X') || trimmed.includes('Y');
            const hasZ = trimmed.includes('Z');
            if (hasXY && hasZ) {
                result.warnings.push(`Line ${index + 1}: G0 with X/Y and Z - check for collisions`);
            }
        }

        // Check for coolant commands
        if (trimmed.includes('M7') || trimmed.includes('M8') || trimmed.includes('M9')) {
            result.warnings.push(`Line ${index + 1}: Coolant command detected - ensure safety measures`);
        }
    });

    return result;
}

function showServiceStatusMessage(services: ServiceStatus[]) {
    const running = services.filter(s => s.status === 'running').length;
    const total = services.length;
    const statusList = services.map(s =>
        s.status === 'running' ? `✓ ${s.name}` : `✗ ${s.name}`
    ).join(', ');

    vscode.window.showInformationMessage(
        `Services: ${running}/${total} running | ${statusList}`,
        'Open Dashboard'
    ).then(selection => {
        if (selection === 'Open Dashboard') {
            vscode.commands.executeCommand('cloudCode.openDashboard');
        }
    });
}

// ============ DASHBOARD HTML ============

function getDashboardHTML(services: ServiceStatus[]): string {
    const servicesHTML = services.map(s => {
        const statusColor = s.status === 'running' ? '#22c55e' : s.status === 'stopped' ? '#ef4444' : '#f59e0b';
        const statusText = s.status === 'running' ? 'Running' : s.status === 'stopped' ? 'Stopped' : 'Checking...';
        const icon = s.status === 'running' ? 'check-circle' : 'x-circle';
        return `
            <div class="service-card">
                <div class="service-icon" style="color: ${statusColor}">
                    <span class="codicon codicon-${icon}"></span>
                </div>
                <div class="service-info">
                    <div class="service-name">${s.name}</div>
                    <div class="service-port">Port ${s.port}</div>
                </div>
                <div class="service-status" style="background: ${statusColor}20; color: ${statusColor}">
                    ${statusText}
                </div>
            </div>
        `;
    }).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sai Rolotech Smart Engines</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: #fff;
            padding: 20px;
            min-height: 100vh;
        }

        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        .logo {
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .logo-icon {
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
        }

        .logo-text h1 {
            font-size: 20px;
            font-weight: 700;
        }

        .logo-text span {
            font-size: 12px;
            color: #888;
        }

        .refresh-btn {
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.2);
            color: #fff;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.3s;
        }

        .refresh-btn:hover {
            background: rgba(255,255,255,0.2);
        }

        .section-title {
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #888;
            margin-bottom: 15px;
        }

        .services-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
        }

        .service-card {
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 12px;
            padding: 20px;
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .service-icon {
            font-size: 28px;
        }

        .service-info {
            flex: 1;
        }

        .service-name {
            font-weight: 600;
            font-size: 16px;
        }

        .service-port {
            font-size: 12px;
            color: #888;
            margin-top: 2px;
        }

        .service-status {
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }

        .actions-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-bottom: 30px;
        }

        .action-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            color: #fff;
            padding: 20px;
            border-radius: 12px;
            cursor: pointer;
            text-align: left;
            transition: transform 0.2s, box-shadow 0.2s;
        }

        .action-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
        }

        .action-btn h3 {
            font-size: 16px;
            margin-bottom: 5px;
        }

        .action-btn p {
            font-size: 12px;
            opacity: 0.8;
        }

        .action-btn.secondary {
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.2);
        }

        .action-btn.secondary:hover {
            background: rgba(255,255,255,0.1);
            box-shadow: none;
        }

        .quick-stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-bottom: 30px;
        }

        .stat-card {
            background: rgba(255,255,255,0.05);
            border-radius: 12px;
            padding: 20px;
            text-align: center;
        }

        .stat-value {
            font-size: 28px;
            font-weight: 700;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .stat-label {
            font-size: 12px;
            color: #888;
            margin-top: 5px;
        }

        .validation-panel {
            background: rgba(255,255,255,0.05);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
        }

        .validation-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }

        .validation-header h3 {
            font-size: 16px;
        }

        .validate-btn {
            background: #22c55e;
            border: none;
            color: #fff;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
        }

        .validate-btn:hover {
            background: #16a34a;
        }

        .validation-result {
            margin-top: 15px;
            padding: 15px;
            border-radius: 8px;
            display: none;
        }

        .validation-result.show {
            display: block;
        }

        .validation-result.success {
            background: rgba(34, 197, 94, 0.1);
            border: 1px solid rgba(34, 197, 94, 0.3);
        }

        .validation-result.warning {
            background: rgba(245, 158, 11, 0.1);
            border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .validation-result.error {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .score {
            font-size: 48px;
            font-weight: 700;
            text-align: center;
        }

        .score-label {
            text-align: center;
            font-size: 14px;
            color: #888;
            margin-bottom: 15px;
        }

        .issue-list {
            margin-top: 15px;
        }

        .issue-item {
            padding: 8px 0;
            border-bottom: 1px solid rgba(255,255,255,0.1);
            font-size: 13px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .issue-item:last-child {
            border-bottom: none;
        }

        .projects-section {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
        }

        .project-card {
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 8px;
            padding: 15px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .project-card:hover {
            background: rgba(255,255,255,0.1);
            border-color: rgba(255,255,255,0.3);
        }

        .project-card h4 {
            font-size: 14px;
            margin-bottom: 5px;
        }

        .project-card p {
            font-size: 11px;
            color: #888;
        }

        .footer {
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid rgba(255,255,255,0.1);
            color: #666;
            font-size: 12px;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        .checking {
            animation: pulse 1s infinite;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">
            <div class="logo-icon">⚙️</div>
            <div class="logo-text">
                <h1>Sai Rolotech Smart Engines</h1>
                <span>v2.3.0 - Precision Roll Forming Suite</span>
            </div>
        </div>
        <button class="refresh-btn" onclick="refreshServices()">🔄 Refresh</button>
    </div>

    <div class="quick-stats">
        <div class="stat-card">
            <div class="stat-value">${services.filter(s => s.status === 'running').length}</div>
            <div class="stat-label">Services Running</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">3</div>
            <div class="stat-label">Total Projects</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">v2.3.0</div>
            <div class="stat-label">Version</div>
        </div>
    </div>

    <div class="section-title">Services Status</div>
    <div class="services-grid" id="servicesGrid">
        ${servicesHTML}
    </div>

    <div class="actions-grid">
        <button class="action-btn" onclick="openService('http://localhost:8080')">
            <h3>🚀 API Server</h3>
            <p>Open in browser (port 8080)</p>
        </button>
        <button class="action-btn" onclick="openService('http://localhost:5000')">
            <h3>🎨 Design Tool</h3>
            <p>Open in browser (port 5000)</p>
        </button>
        <button class="action-btn secondary" onclick="newProfile()">
            <h3>📐 New Profile</h3>
            <p>Create roll forming profile</p>
        </button>
        <button class="action-btn secondary" onclick="openProject('artifacts/design-tool')">
            <h3>📁 Open Project</h3>
            <p>Browse project files</p>
        </button>
    </div>

    <div class="validation-panel">
        <div class="validation-header">
            <h3>📋 G-Code Validator</h3>
            <button class="validate-btn" onclick="validateGcode()">Validate File</button>
        </div>
        <p style="color: #888; font-size: 13px;">Validate the active G-code file for safety issues</p>
        <div class="validation-result" id="validationResult">
            <div class="score-label">Safety Score</div>
            <div class="score" id="safetyScore">--</div>
            <div class="issue-list" id="issueList"></div>
        </div>
    </div>

    <div class="section-title">Quick Access</div>
    <div class="projects-section">
        <div class="project-card" onclick="openProject('artifacts/design-tool')">
            <h4>🎨 Design Tool</h4>
            <p>Web-based roll forming design</p>
        </div>
        <div class="project-card" onclick="openProject('artifacts/api-server')">
            <h4>⚙️ API Server</h4>
            <p>Backend Node.js API</p>
        </div>
        <div class="project-card" onclick="openProject('artifacts/python-api')">
            <h4>🐍 Python API</h4>
            <p>CAD/CAM Python engine</p>
        </div>
        <div class="project-card" onclick="openProject('artifacts/desktop')">
            <h4>🖥️ Desktop App</h4>
            <p>Electron desktop application</p>
        </div>
    </div>

    <div class="footer">
        <p>Sai Rolotech Smart Engines v2.3.0 | Precision Roll Forming Engineering Suite</p>
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        function refreshServices() {
            vscode.postMessage({ type: 'refreshServices' });
        }

        function validateGcode() {
            vscode.postMessage({ type: 'validateGcode' });
        }

        function openService(url) {
            vscode.postMessage({ type: 'openService', url });
        }

        function openProject(projectPath) {
            vscode.postMessage({ type: 'openProject', projectPath });
        }

        function newProfile() {
            vscode.postMessage({ type: 'newProfile' });
        }

        window.addEventListener('message', event => {
            const message = event.data;

            if (message.type === 'services') {
                updateServices(message.services);
            }

            if (message.type === 'validationResult') {
                showValidationResult(message.result);
            }
        });

        function updateServices(services) {
            const grid = document.getElementById('servicesGrid');
            grid.innerHTML = services.map(s => {
                const statusColor = s.status === 'running' ? '#22c55e' : s.status === 'stopped' ? '#ef4444' : '#f59e0b';
                const statusText = s.status === 'running' ? 'Running' : s.status === 'stopped' ? 'Stopped' : 'Checking...';
                const iconClass = s.status === 'running' ? 'check-circle' : 'x-circle';
                return \`
                    <div class="service-card">
                        <div class="service-icon" style="color: \${statusColor}">
                            <span class="codicon codicon-\${iconClass}"></span>
                        </div>
                        <div class="service-info">
                            <div class="service-name">\${s.name}</div>
                            <div class="service-port">Port \${s.port}</div>
                        </div>
                        <div class="service-status \${s.status === 'checking' ? 'checking' : ''}" style="background: \${statusColor}20; color: \${statusColor}">
                            \${statusText}
                        </div>
                    </div>
                \`;
            }).join('');

            // Update stats
            document.querySelector('.stat-card:nth-child(1) .stat-value').textContent =
                services.filter(s => s.status === 'running').length;
        }

        function showValidationResult(result) {
            const panel = document.getElementById('validationResult');
            const score = document.getElementById('safetyScore');
            const issueList = document.getElementById('issueList');

            panel.classList.add('show');

            // Set score color
            let scoreColor = '#22c55e';
            panel.className = 'validation-result show success';

            if (result.safetyScore < 50) {
                scoreColor = '#ef4444';
                panel.className = 'validation-result show error';
            } else if (result.safetyScore < 80) {
                scoreColor = '#f59e0b';
                panel.className = 'validation-result show warning';
            }

            score.style.color = scoreColor;
            score.textContent = result.safetyScore + '/100';

            // Build issue list
            let html = '';
            result.issues.forEach(issue => {
                html += '<div class="issue-item">❌ ' + issue + '</div>';
            });
            result.warnings.forEach(warn => {
                html += '<div class="issue-item">⚠️ ' + warn + '</div>';
            });

            if (result.issues.length === 0 && result.warnings.length === 0) {
                html = '<div class="issue-item" style="color: #22c55e">✅ No issues found - file looks safe!</div>';
            }

            issueList.innerHTML = html;
        }
    </script>
</body>
</html>`;
}
