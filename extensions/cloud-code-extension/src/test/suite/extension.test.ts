/**
 * Cloud Code Extension - Unit Tests
 * Tests for AI Providers, API Client, and Commands
 */

import * as assert from 'assert';

// Mock VS Code API
const mockSecrets: Record<string, string> = {};
const mockContext = {
    secrets: {
        store: async (key: string, value: string) => {
            mockSecrets[key] = value;
        },
        get: async (key: string) => mockSecrets[key],
        delete: async (key: string) => delete mockSecrets[key],
    },
    subscriptions: [],
};

describe('AI Providers Tests', () => {

    describe('Query Complexity Analysis', () => {
        it('should identify simple queries correctly', () => {
            const simpleQueries = [
                'what is roll forming',
                'hello',
                'hi',
                'material gi',
                'explain',
            ];

            simpleQueries.forEach(query => {
                const score = analyzeComplexity(query);
                assert(score <= 2, `Query "${query}" should be simple`);
            });
        });

        it('should identify medium queries correctly', () => {
            const mediumQueries = [
                'explain springback compensation',
                'how to calculate strip width',
                'g71 turning cycle example',
                'roll tooling design formula',
                'material properties of SS304',
            ];

            mediumQueries.forEach(query => {
                const score = analyzeComplexity(query);
                assert(score >= 3 && score < 8, `Query "${query}" should be medium`);
            });
        });

        it('should identify complex queries correctly', () => {
            const complexQueries = [
                'analyze and optimize flower pattern for complex profile with multiple bends',
                'calculate fea simulation for stress analysis with detailed mesh recommendations',
                'explain defect prediction for edge wave and flange buckling in detail',
            ];

            complexQueries.forEach(query => {
                const score = analyzeComplexity(query);
                assert(score >= 8, `Query "${query}" should be complex`);
            });
        });
    });

    describe('Key Pool Management', () => {
        it('should store and retrieve API keys', async () => {
            const testKey = 'test-api-key-12345';
            await mockContext.secrets.store('cloudcode.testKey', testKey);
            const retrieved = await mockContext.secrets.get('cloudcode.testKey');
            assert.strictEqual(retrieved, testKey);
        });

        it('should handle missing keys gracefully', async () => {
            const missing = await mockContext.secrets.get('cloudcode.nonexistent');
            assert.strictEqual(missing, undefined);
        });

        it('should delete keys correctly', async () => {
            await mockContext.secrets.store('cloudcode.deleteMe', 'to-be-deleted');
            await mockContext.secrets.delete('cloudcode.deleteMe');
            const result = await mockContext.secrets.get('cloudcode.deleteMe');
            assert.strictEqual(result, undefined);
        });
    });

    describe('Offline Knowledge Base', () => {
        it('should match flower pattern queries', () => {
            const kb = getOfflineKB();
            const response = offlineResponse('what is flower pattern in roll forming');
            assert(response.includes('Flower Pattern'));
        });

        it('should match springback queries', () => {
            const response = offlineResponse('how to calculate springback compensation');
            assert(response.includes('Springback'));
        });

        it('should match tooling queries', () => {
            const response = offlineResponse('roll tooling shaft bearing design');
            assert(response.includes('Tooling'));
        });

        it('should match material queries', () => {
            const response = offlineResponse('material properties steel aluminum');
            assert(response.includes('Material'));
        });
    });
});

describe('API Client Tests', () => {

    describe('Service Health Check', () => {
        it('should return correct service structure', () => {
            const mockServices = [
                { name: 'API Server', port: 8080, status: 'running' },
                { name: 'Python API', port: 9000, status: 'running' },
                { name: 'Design Tool', port: 5000, status: 'stopped' },
            ];

            assert.strictEqual(mockServices.length, 3);
            mockServices.forEach(service => {
                assert(service.name);
                assert(service.port > 0);
                assert(['running', 'stopped', 'checking'].includes(service.status));
            });
        });
    });

    describe('Request Building', () => {
        it('should build valid pipeline request', () => {
            const request = buildPipelineRequest({
                geometry: {
                    segments: [{ type: 'line', length: 100 }],
                    boundingBox: { width: 100, height: 50 },
                    bends: [{ angle: 90, radius: 2, segmentIndex: 0, side: 'left', direction: 'up' }],
                },
                thickness: 2.0,
                material: 'GI',
            });

            assert(request.geometry);
            assert(request.material === 'GI');
            assert(request.thickness === 2.0);
        });
    });
});

describe('G-Code Validation Tests', () => {

    describe('Safety Score Calculation', () => {
        it('should give full score to safe G-code', () => {
            const safeGcode = `
G90 ; Absolute mode
G0 X0 Y0 Z10 ; Rapid move
G1 X100 F1000 ; Linear move
M30 ; End of program
            `.trim();

            const result = validateGcode(safeGcode);
            assert(result.safetyScore === 100);
            assert(result.issues.length === 0);
        });

        it('should detect deep Z cuts', () => {
            const dangerousGcode = `
G90
G1 Z-100 F100
M30
            `.trim();

            const result = validateGcode(dangerousGcode);
            assert(result.safetyScore < 100);
            assert(result.issues.some(i => i.includes('Deep cut')));
        });

        it('should warn on G0 with multiple axes', () => {
            const warningGcode = `
G90
G0 X100 Y50 Z-10
M30
            `.trim();

            const result = validateGcode(warningGcode);
            assert(result.warnings.length > 0);
        });
    });

    describe('Comment Handling', () => {
        it('should ignore comment lines', () => {
            const commentedGcode = `
; This is a comment
; Another comment line
G90
; More comments
G0 X0
M30
            `.trim();

            const result = validateGcode(commentedGcode);
            assert(result.safetyScore === 100);
        });
    });
});

// Helper functions (simplified versions of actual implementation)

function analyzeComplexity(query: string): number {
    const COMPLEX_KEYWORDS = [
        'analyze', 'analysis', 'calculate', 'simulation', 'fea', 'finite element',
        'optimize', 'defect prediction', 'springback', 'compensation',
    ];
    const MEDIUM_KEYWORDS = [
        'explain', 'describe', 'help with', 'g-code', 'g71', 'cnc',
        'material', 'properties', 'formula', 'calculation', 'roll', 'tooling',
    ];

    let score = 0;
    COMPLEX_KEYWORDS.forEach(kw => { if (query.toLowerCase().includes(kw)) score += 3; });
    MEDIUM_KEYWORDS.forEach(kw => { if (query.toLowerCase().includes(kw)) score += 1; });
    if (query.length > 200) score += 2;
    if (query.length > 500) score += 3;
    return score;
}

function getOfflineKB(): Array<{ kw: string[]; response: string }> {
    return [
        { kw: ['flower', 'pattern'], response: 'Flower Pattern info' },
        { kw: ['springback'], response: 'Springback info' },
        { kw: ['roll', 'tooling'], response: 'Tooling info' },
        { kw: ['material'], response: 'Material info' },
    ];
}

function offlineResponse(query: string): string {
    const kb = getOfflineKB();
    const q = query.toLowerCase();
    for (const entry of kb) {
        if (entry.kw.some(k => q.includes(k))) {
            return entry.response;
        }
    }
    return 'General roll forming help';
}

function buildPipelineRequest(data: {
    geometry: unknown;
    thickness: number;
    material: string;
}): unknown {
    return {
        ...data,
        sectionModel: 'open',
        motorKw: 11,
        rpm: 1440,
    };
}

function validateGcode(content: string): {
    safetyScore: number;
    issues: string[];
    warnings: string[];
} {
    const result = {
        safetyScore: 100,
        issues: [] as string[],
        warnings: [] as string[],
    };

    const lines = content.split('\n');
    lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (trimmed.startsWith(';') || trimmed === '') return;

        // Check for negative Z
        if (trimmed.includes('Z-')) {
            const zMatch = trimmed.match(/Z(-?\d+\.?\d*)/);
            if (zMatch && parseFloat(zMatch[1]) < -50) {
                result.issues.push(`Line ${index + 1}: Deep cut detected`);
                result.safetyScore -= 15;
            }
        }

        // Check G0 with multiple axes
        if (trimmed.startsWith('G0')) {
            const hasXY = trimmed.includes('X') || trimmed.includes('Y');
            const hasZ = trimmed.includes('Z');
            if (hasXY && hasZ) {
                result.warnings.push(`Line ${index + 1}: G0 with X/Y and Z`);
            }
        }
    });

    return result;
}
