/**
 * PERSISTENT MEMORY SYSTEM
 * Long-term memory for AI agent
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs/promises";

interface MemoryEntry {
  id: number;
  key: string;
  value: string;
  context: string;
  createdAt: string;
  accessedAt: string;
  accessCount: number;
}

export class PersistentMemory {
  private db: Database.Database;
  private kbDir: string;

  constructor() {
    const dbPath = path.join(process.cwd(), "data", "memory.db");
    this.kbDir = path.join(process.cwd(), "data", "knowledge");

    // Ensure directories exist
    fs.mkdir(path.dirname(dbPath), { recursive: true }).catch(() => {});
    fs.mkdir(this.kbDir, { recursive: true }).catch(() => {});

    this.db = new Database(dbPath);
    this.init();
  }

  private init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS memory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        context TEXT DEFAULT '',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        accessed_at TEXT DEFAULT CURRENT_TIMESTAMP,
        access_count INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS conversation (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS knowledge_base (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL,
        topic TEXT NOT NULL,
        content TEXT NOT NULL,
        source TEXT DEFAULT '',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_memory_key ON memory(key);
      CREATE INDEX IF NOT EXISTS idx_conv_session ON conversation(session_id);
      CREATE INDEX IF NOT EXISTS idx_kb_category ON knowledge_base(category);
    `);
  }

  // Memory operations
  set(key: string, value: string, context = "") {
    const stmt = this.db.prepare(`
      INSERT INTO memory (key, value, context) VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = ?, context = ?, accessed_at = CURRENT_TIMESTAMP
    `);
    stmt.run(key, value, context, value, context);
  }

  get(key: string): string | null {
    const stmt = this.db.prepare(`
      UPDATE memory SET access_count = access_count + 1, accessed_at = CURRENT_TIMESTAMP
      WHERE key = ?
    `);
    stmt.run(key);

    const row = this.db.prepare("SELECT value FROM memory WHERE key = ?").get(key) as { value: string } | undefined;
    return row?.value || null;
  }

  delete(key: string) {
    this.db.prepare("DELETE FROM memory WHERE key = ?").run(key);
  }

  search(query: string): MemoryEntry[] {
    const stmt = this.db.prepare(`
      SELECT * FROM memory
      WHERE key LIKE ? OR value LIKE ? OR context LIKE ?
      ORDER BY access_count DESC
      LIMIT 20
    `);
    const q = `%${query}%`;
    return stmt.all(q, q, q) as MemoryEntry[];
  }

  // Conversation history
  addMessage(sessionId: string, role: "user" | "assistant", content: string) {
    this.db.prepare(`
      INSERT INTO conversation (session_id, role, content) VALUES (?, ?, ?)
    `).run(sessionId, role, content);
  }

  getHistory(sessionId: string, limit = 50): Array<{ role: string; content: string }> {
    const stmt = this.db.prepare(`
      SELECT role, content FROM conversation
      WHERE session_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `);
    return stmt.all(sessionId, limit) as Array<{ role: string; content: string }>;
  }

  clearHistory(sessionId: string) {
    this.db.prepare("DELETE FROM conversation WHERE session_id = ?").run(sessionId);
  }

  // Knowledge Base
  loadKnowledge(kb: KnowledgeBase) {
    for (const entry of kb.entries) {
      this.db.prepare(`
        INSERT OR IGNORE INTO knowledge_base (category, topic, content, source)
        VALUES (?, ?, ?, ?)
      `).run(kb.category, entry.topic, entry.content, kb.source);
    }
  }

  queryKnowledge(category?: string, query?: string): KnowledgeEntry[] {
    let sql = "SELECT * FROM knowledge_base";
    const params: string[] = [];
    const conditions: string[] = [];

    if (category) {
      conditions.push("category = ?");
      params.push(category);
    }
    if (query) {
      conditions.push("(topic LIKE ? OR content LIKE ?)");
      const q = `%${query}%`;
      params.push(q, q);
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }

    sql += " ORDER BY created_at DESC LIMIT 20";

    return this.db.prepare(sql).all(...params) as KnowledgeEntry[];
  }

  addKnowledge(category: string, topic: string, content: string, source = "") {
    this.db.prepare(`
      INSERT INTO knowledge_base (category, topic, content, source)
      VALUES (?, ?, ?, ?)
    `).run(category, topic, content, source);
  }

  // Stats
  getStats() {
    return {
      memories: this.db.prepare("SELECT COUNT(*) as count FROM memory").get() as { count: number },
      conversations: this.db.prepare("SELECT COUNT(*) as count FROM conversation").get() as { count: number },
      knowledgeEntries: this.db.prepare("SELECT COUNT(*) as count FROM knowledge_base").get() as { count: number },
    };
  }
}

interface KnowledgeBase {
  category: string;
  source: string;
  entries: KnowledgeEntry[];
}

interface KnowledgeEntry {
  topic: string;
  content: string;
}
