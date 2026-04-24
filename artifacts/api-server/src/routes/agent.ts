import { Router } from "express";
import {
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
  getStats,
} from "../lib/agentMemory.js";

const router = Router();

router.get("/search", (req, res): void => {
  const { q } = req.query;
  if (!q) {
    res.status(400).json({ error: 'Query parameter "q" required' });
    return;
  }

  const results = searchCommands(String(q));
  res.json({ success: true, query: q, count: results.length, results });
});

router.get("/find", (req, res): void => {
  const { trigger } = req.query;
  if (!trigger) {
    res.status(400).json({ error: "Trigger parameter required" });
    return;
  }

  const cmd = findCommand(String(trigger));
  if (!cmd) {
    res.status(404).json({ error: "Command not found" });
    return;
  }

  res.json({ success: true, command: cmd });
});

router.get("/", (_req, res): void => {
  const memory = getAgentMemory();
  res.json({
    success: true,
    total: memory.commands.length,
    commands: memory.commands,
  });
});

router.get("/category/:category", (req, res): void => {
  const { category } = req.params;
  const commands = getCommandsByCategory(category);
  res.json({ success: true, category, count: commands.length, commands });
});

router.get("/top", (req, res): void => {
  const limit = parseInt(String(req.query.limit ?? "10"), 10) || 10;
  const commands = getTopCommands(limit);
  res.json({ success: true, count: commands.length, commands });
});

router.get("/recent", (req, res): void => {
  const limit = parseInt(String(req.query.limit ?? "10"), 10) || 10;
  const commands = getRecentCommands(limit);
  res.json({ success: true, count: commands.length, commands });
});

router.get("/stats", (_req, res): void => {
  const stats = getStats();
  res.json({ success: true, stats });
});

router.post("/", (req, res): void => {
  const { name, trigger, description, action, category, context } = req.body;

  if (!name || !trigger || !action) {
    res.status(400).json({
      error: "Missing required fields: name, trigger, action",
    });
    return;
  }

  const normalizedTrigger = Array.isArray(trigger) ? trigger.map(String) : [String(trigger)];
  if (findCommand(normalizedTrigger[0])) {
    res.status(409).json({ error: "Command with this trigger already exists" });
    return;
  }

  const cmd = addCommand({
    name,
    trigger: normalizedTrigger,
    description: description || "",
    action,
    category: category || "custom",
    context: context || [],
  });

  res.json({ success: true, message: "Command added", command: cmd });
});

router.post("/:id/use", (req, res): void => {
  const { id } = req.params;
  useCommand(id);
  res.json({ success: true, message: "Command usage tracked" });
});

router.delete("/:id", (req, res): void => {
  const { id } = req.params;
  const deleted = deleteCommand(id);
  if (!deleted) {
    res.status(404).json({ error: "Command not found" });
    return;
  }

  res.json({ success: true, message: "Command deleted" });
});

router.post("/context", (req, res): void => {
  const { key, value } = req.body;
  if (!key) {
    res.status(400).json({ error: "Key required" });
    return;
  }

  addToContext(key, value);
  res.json({ success: true, message: "Context updated" });
});

router.get("/context/:key", (req, res): void => {
  const { key } = req.params;
  const value = getContext(key);
  res.json({ success: true, key, value });
});

router.post("/converse", (req, res): void => {
  const { role, text } = req.body;
  if (!role || !text) {
    res.status(400).json({ error: "role and text required" });
    return;
  }

  addConversation(role, text);
  res.json({ success: true, message: "Added to conversation history" });
});

router.get("/memory", (_req, res): void => {
  const memory = getAgentMemory();
  res.json({ success: true, memory });
});

export default router;
