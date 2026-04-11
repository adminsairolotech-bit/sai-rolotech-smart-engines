// Command Memory Agent - SAI RoloTech
// 50+ commands yaad rakho, context samjho, actions karo

interface Command {
  id: string;
  name: string;
  trigger: string[];
  description: string;
  action: string;
  category: string;
  usageCount: number;
  lastUsed: string;
  context: string[];
}

interface AgentMemory {
  commands: Command[];
  conversations: { role: string; text: string; timestamp: string }[];
  context: Record<string, any>;
  preferences: Record<string, any>;
}

const memory: AgentMemory = {
  commands: [
    // Navigation Commands
    { id: '1', name: 'Dashboard', trigger: ['dashboard', 'home', 'homepage', 'main'], description: 'Open dashboard', action: '/dashboard.html', category: 'navigation', usageCount: 0, lastUsed: '', context: ['web', 'ui'] },
    { id: '2', name: 'Login', trigger: ['login', 'signin', 'sign in', 'auth'], description: 'Login to app', action: '/login', category: 'navigation', usageCount: 0, lastUsed: '', context: ['auth', 'user'] },
    { id: '3', name: 'CRM', trigger: ['crm', 'leads', 'sales', 'pipeline'], description: 'Open CRM dashboard', action: '/crm', category: 'navigation', usageCount: 0, lastUsed: '', context: ['crm', 'business'] },

    // API Commands
    { id: '10', name: 'Health Check', trigger: ['health', 'status', 'server status', 'api alive'], description: 'Check API health', action: 'GET /api/health', category: 'api', usageCount: 0, lastUsed: '', context: ['api', 'monitoring'] },
    { id: '11', name: 'Admin Stats', trigger: ['stats', 'statistics', 'admin stats', 'dashboard stats'], description: 'Get admin statistics', action: 'GET /api/admin/stats', category: 'api', usageCount: 0, lastUsed: '', context: ['admin', 'stats'] },
    { id: '12', name: 'Integration Status', trigger: ['integrations', 'services', 'connections', 'api status'], description: 'Check integration status', action: 'GET /api/integration-status', category: 'api', usageCount: 0, lastUsed: '', context: ['api', 'integrations'] },

    // Lead Management
    { id: '20', name: 'Get Leads', trigger: ['leads', 'all leads', 'show leads', 'list leads'], description: 'Get all leads', action: 'GET /api/leads', category: 'leads', usageCount: 0, lastUsed: '', context: ['crm', 'leads'] },
    { id: '21', name: 'Lead Stats', trigger: ['lead stats', 'lead analytics', 'lead stats'], description: 'Get lead statistics', action: 'GET /api/lead-analytics', category: 'leads', usageCount: 0, lastUsed: '', context: ['crm', 'analytics'] },
    { id: '22', name: 'New Lead', trigger: ['new lead', 'add lead', 'create lead'], description: 'Create new lead', action: 'POST /new-lead', category: 'leads', usageCount: 0, lastUsed: '', context: ['crm', 'leads'] },
    { id: '23', name: 'Track Event', trigger: ['track', 'event', 'app event'], description: 'Track lead event', action: 'POST /api/track', category: 'leads', usageCount: 0, lastUsed: '', context: ['crm', 'tracking'] },

    // WhatsApp / CRM
    { id: '30', name: 'Send Welcome', trigger: ['welcome', 'welcome message', 'hello'], description: 'Send welcome message', action: 'POST /api/beta/send-wa', category: 'whatsapp', usageCount: 0, lastUsed: '', context: ['whatsapp', 'crm'] },
    { id: '31', name: 'Follow Up', trigger: ['followup', 'follow up', 'reminder'], description: 'Send follow-up message', action: 'POST /api/beta/send-wa', category: 'whatsapp', usageCount: 0, lastUsed: '', context: ['whatsapp', 'crm'] },
    { id: '32', name: 'Gmail Sync', trigger: ['gmail', 'email sync', 'sync emails'], description: 'Sync Gmail leads', action: 'POST /api/admin/gmail/sync', category: 'whatsapp', usageCount: 0, lastUsed: '', context: ['gmail', 'leads'] },

    // AI Features
    { id: '40', name: 'Buddy Chat', trigger: ['buddy', 'chat', 'ai help', 'help'], description: 'Chat with AI Buddy', action: 'POST /api/buddy-chat', category: 'ai', usageCount: 0, lastUsed: '', context: ['ai', 'chat'] },
    { id: '41', name: 'AI Quotation', trigger: ['quotation', 'quote', 'price'], description: 'Generate AI quotation', action: 'POST /api/ai-quotation', category: 'ai', usageCount: 0, lastUsed: '', context: ['ai', 'sales'] },
    { id: '42', name: 'Machine Guide', trigger: ['machine', 'guide', 'help machine'], description: 'Machine troubleshooting guide', action: 'POST /api/machine-guide', category: 'ai', usageCount: 0, lastUsed: '', context: ['ai', 'machines'] },
    { id: '43', name: 'Project Report', trigger: ['report', 'project report', 'loan'], description: 'Generate project report', action: 'POST /api/generate-project-report', category: 'ai', usageCount: 0, lastUsed: '', context: ['ai', 'pmegp'] },
    { id: '44', name: 'Analyze Quotation', trigger: ['analyze', 'analysis', 'check quote'], description: 'Analyze quotation', action: 'POST /api/analyze-quotation', category: 'ai', usageCount: 0, lastUsed: '', context: ['ai', 'sales'] },
    { id: '45', name: 'Smart Timing', trigger: ['timing', 'best time', 'when to call'], description: 'Get smart follow-up timing', action: 'POST /api/smart-timing', category: 'ai', usageCount: 0, lastUsed: '', context: ['ai', 'crm'] },

    // Engineering
    { id: '50', name: 'Roll Pass Design', trigger: ['roll pass', 'pass design', 'forming'], description: 'Roll pass design engine', action: 'POST /api/roll-pass', category: 'engineering', usageCount: 0, lastUsed: '', context: ['engineering', 'roll forming'] },
    { id: '51', name: 'Springback', trigger: ['springback', 'compensation'], description: 'Springback calculation', action: 'POST /api/springback', category: 'engineering', usageCount: 0, lastUsed: '', context: ['engineering', 'roll forming'] },
    { id: '52', name: 'BOM', trigger: ['bom', 'bill of materials', 'materials'], description: 'Generate BOM', action: 'POST /api/bom', category: 'engineering', usageCount: 0, lastUsed: '', context: ['engineering', 'materials'] },
    { id: '53', name: 'Flower Pattern', trigger: ['flower', 'pattern', 'station layout'], description: 'Flower pattern design', action: 'POST /api/flower-pattern', category: 'engineering', usageCount: 0, lastUsed: '', context: ['engineering', 'roll forming'] },

    // File Operations
    { id: '60', name: 'Upload File', trigger: ['upload', 'file upload'], description: 'Upload a file', action: 'POST /api/upload', category: 'files', usageCount: 0, lastUsed: '', context: ['files', 'storage'] },
    { id: '61', name: 'List Files', trigger: ['files', 'list files', 'my files'], description: 'List uploaded files', action: 'GET /api/files', category: 'files', usageCount: 0, lastUsed: '', context: ['files', 'storage'] },

    // Admin
    { id: '70', name: 'Verify Token', trigger: ['verify', 'token', 'auth verify'], description: 'Verify admin token', action: 'POST /api/admin/verify', category: 'admin', usageCount: 0, lastUsed: '', context: ['admin', 'auth'] },
    { id: '71', name: 'View Logs', trigger: ['logs', 'error logs', 'view logs'], description: 'View system logs', action: 'GET /api/admin/logs', category: 'admin', usageCount: 0, lastUsed: '', context: ['admin', 'debugging'] },
    { id: '72', name: 'Config', trigger: ['config', 'configuration', 'settings'], description: 'Get/set configuration', action: 'GET/PATCH /api/admin/config', category: 'admin', usageCount: 0, lastUsed: '', context: ['admin', 'config'] },

    // System
    { id: '80', name: 'System Info', trigger: ['system', 'info', 'server info'], description: 'Get system information', action: 'GET /api/system-info', category: 'system', usageCount: 0, lastUsed: '', context: ['system', 'info'] },
    { id: '81', name: 'Health Monitor', trigger: ['health monitor', 'watchdog', 'monitor'], description: 'System health monitoring', action: 'GET /api/health-monitor', category: 'system', usageCount: 0, lastUsed: '', context: ['system', 'monitoring'] },
    { id: '82', name: 'Auto Update', trigger: ['update', 'upgrade', 'check update'], description: 'Check for updates', action: 'POST /api/check-update', category: 'system', usageCount: 0, lastUsed: '', context: ['system', 'updates'] },

    // Utilities
    { id: '90', name: 'Help', trigger: ['help', 'commands', 'what can you do'], description: 'Show all available commands', action: 'SHOW_COMMANDS', category: 'utilities', usageCount: 0, lastUsed: '', context: ['help'] },
    { id: '91', name: 'Search', trigger: ['search', 'find', 'look for'], description: 'Search commands', action: 'SEARCH_COMMANDS', category: 'utilities', usageCount: 0, lastUsed: '', context: ['search'] },
    { id: '92', name: 'Learn', trigger: ['learn', 'new command', 'teach'], description: 'Learn new command', action: 'ADD_COMMAND', category: 'utilities', usageCount: 0, lastUsed: '', context: ['learning'] },
    { id: '93', name: 'Remember', trigger: ['remember', 'memorize', 'save'], description: 'Remember this for later', action: 'REMEMBER_CONTEXT', category: 'utilities', usageCount: 0, lastUsed: '', context: ['memory'] },
    { id: '94', name: 'Forget', trigger: ['forget', 'delete', 'remove'], description: 'Forget a command', action: 'DELETE_COMMAND', category: 'utilities', usageCount: 0, lastUsed: '', context: ['memory'] },
    { id: '95', name: 'Stats', trigger: ['stats', 'my stats', 'usage'], description: 'Show usage statistics', action: 'SHOW_STATS', category: 'utilities', usageCount: 0, lastUsed: '', context: ['stats'] },
  ],
  conversations: [],
  context: {},
  preferences: {}
};

// Agent functions
export function searchCommands(query: string): Command[] {
  const q = query.toLowerCase();
  return memory.commands.filter(cmd =>
    cmd.trigger.some(t => t.includes(q)) ||
    cmd.name.toLowerCase().includes(q) ||
    cmd.description.toLowerCase().includes(q) ||
    cmd.category.toLowerCase().includes(q)
  );
}

export function findCommand(trigger: string): Command | null {
  const t = trigger.toLowerCase().trim();
  return memory.commands.find(cmd =>
    cmd.trigger.some(tr => tr === t || tr.includes(t) || t.includes(tr))
  ) || null;
}

export function addCommand(cmd: Omit<Command, 'id' | 'usageCount' | 'lastUsed'>): Command {
  const newCmd: Command = {
    ...cmd,
    id: `custom_${Date.now()}`,
    usageCount: 0,
    lastUsed: ''
  };
  memory.commands.push(newCmd);
  return newCmd;
}

export function useCommand(id: string): void {
  const cmd = memory.commands.find(c => c.id === id);
  if (cmd) {
    cmd.usageCount++;
    cmd.lastUsed = new Date().toISOString();
  }
}

export function deleteCommand(id: string): boolean {
  const idx = memory.commands.findIndex(c => c.id === id);
  if (idx !== -1) {
    memory.commands.splice(idx, 1);
    return true;
  }
  return false;
}

export function getCommandsByCategory(category: string): Command[] {
  return memory.commands.filter(c => c.category === category);
}

export function getTopCommands(limit = 10): Command[] {
  return [...memory.commands]
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, limit);
}

export function getRecentCommands(limit = 10): Command[] {
  return [...memory.commands]
    .filter(c => c.lastUsed)
    .sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime())
    .slice(0, limit);
}

export function addToContext(key: string, value: any): void {
  memory.context[key] = value;
}

export function getContext(key: string): any {
  return memory.context[key];
}

export function addConversation(role: string, text: string): void {
  memory.conversations.push({
    role,
    text,
    timestamp: new Date().toISOString()
  });
  if (memory.conversations.length > 100) {
    memory.conversations = memory.conversations.slice(-100);
  }
}

export function getAgentMemory(): AgentMemory {
  return memory;
}

export function getStats() {
  return {
    totalCommands: memory.commands.length,
    totalConversations: memory.conversations.length,
    topCommands: getTopCommands(5),
    categories: [...new Set(memory.commands.map(c => c.category))],
    contextKeys: Object.keys(memory.context)
  };
}

export default {
  searchCommands,
  findCommand,
  addCommand,
  useCommand,
  deleteCommand,
  getCommandsByCategory,
  getTopCommands,
  getRecentCommands,
  addToContext,
  getContext,
  addConversation,
  getAgentMemory,
  getStats
};
