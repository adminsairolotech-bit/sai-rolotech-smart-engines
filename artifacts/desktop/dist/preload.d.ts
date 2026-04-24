declare global {
    interface Window {
        electronAPI?: {
            saveFile: (content: string, defaultName: string, filters?: {
                name: string;
                extensions: string[];
            }[]) => Promise<{
                success: boolean;
                filePath?: string;
            }>;
            openFile: (filters?: {
                name: string;
                extensions: string[];
            }[]) => Promise<{
                success: boolean;
                content: string | null;
                filePath?: string;
            }>;
            getAppInfo: () => Promise<{
                name: string;
                version: string;
                apiPort: number;
                isDev: boolean;
                platform: string;
                arch: string;
            }>;
            getGpuInfo: () => Promise<unknown>;
            getSystemInfo: () => Promise<{
                cpu: {
                    model: string;
                    cores: number;
                    speed: number;
                    usage: number;
                };
                memory: {
                    total: number;
                    free: number;
                    used: number;
                    percent: number;
                };
                app: {
                    memoryUsage: NodeJS.MemoryUsage;
                    uptime: number;
                    pid: number;
                };
                os: {
                    platform: string;
                    release: string;
                    hostname: string;
                    arch: string;
                    uptime: number;
                };
            }>;
            checkForUpdates: () => Promise<void>;
            downloadUpdate: () => Promise<void>;
            getUpdateSettings: () => Promise<{
                checkFrequency: string;
                autoDownload: boolean;
            }>;
            setUpdateSettings: (settings: {
                checkFrequency?: string;
                autoDownload?: boolean;
            }) => Promise<{
                checkFrequency: string;
                autoDownload: boolean;
            }>;
            getUpdateHistory: () => Promise<{
                version: string;
                action: string;
                timestamp: string;
                success: boolean;
            }[]>;
            onUpdateAvailable: (callback: (data: {
                version: string;
                releaseDate: string;
                releaseNotes: string;
            }) => void) => void;
            onUpdateDownloadProgress: (callback: (data: {
                percent: number;
                bytesPerSecond: number;
                transferred: number;
                total: number;
            }) => void) => void;
            onUpdateDownloaded: (callback: (data: {
                version: string;
            }) => void) => void;
            onUpdateError: (callback: (data: {
                message: string;
            }) => void) => void;
            onUpdateNotAvailable: (callback: () => void) => void;
            onUpdateCountdown: (callback: (data: {
                seconds: number;
                version: string;
            }) => void) => void;
            quitAndInstall: () => Promise<void>;
            getLiveHardware: () => Promise<{
                coreUtils: number[];
                avgCpu: number;
                cpuModel: string;
                cpuCores: number;
                cpuSpeedMHz: number;
                totalRam: number;
                freeRam: number;
                usedRam: number;
                ramPct: number;
                nvidia: {
                    available: boolean;
                    name: string;
                    utilGpu: number;
                    memUsed: number;
                    memTotal: number;
                    tempC: number;
                    powerW: number;
                    clockMHz: number;
                };
            }>;
            showNotification: (title: string, message: string) => void;
            isElectron: true;
            apiBaseUrl: string;
        };
    }
}
export {};
//# sourceMappingURL=preload.d.ts.map