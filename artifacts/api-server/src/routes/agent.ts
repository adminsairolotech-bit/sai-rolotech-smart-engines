import { Router } from 'express';
import {
  searchCommands, findCommand, addCommand, useCommand,
  deleteCommand, getCommandsByCategory, getTopCommands,
  getRecentCommands, addToContext, getContext,
  addConversation, getAgentMemory, getStats
} from '../lib/agentMemory.js';

const router = Router();

// Search commands
router.get('/search', (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Query parameter "q" required' });
  }
  const results = searchCommands(q as string);
  res.json({ success: true, query: q, count: results.length, results });
});

// Find command by trigger
router.get('/find', (req, res) => {
  const { trigger } = req.query;
  if (!trigger) {
    return res.status(400).json({ error: 'Trigger parameter required' });
  }
  const cmd = findCommand(trigger as string);
  if (!cmd) {
    return res.status(404).json({ error: 'Command not found' });
  }
  res.json({ success: true, command: cmd });
});

// Get all commands
router.get('/', (_req, res) => {
  const memory = getAgentMemory();
  res.json({
    success: true,
    total: memory.commands.length,
    commands: memory.commands
  });
});

// Get commands by category
router.get('/category/:category', (req, res) => {
  const { category } = req.params;
  const commands = getCommandsByCategory(category);
  res.json({ success: true, category, count: commands.length, commands });
});

// Get top commands
router.get('/top', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 10;
  const commands = getTopCommands(limit);
  res.json({ success: true, count: commands.length, commands });
});

// Get recent commands
router.get('/recent', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 10;
  const commands = getRecentCommands(limit);
  res.json({ success: true, count: commands.length, commands });
});

// Get stats
router.get('/stats', (_req, res) => {
  const stats = getStats();
  res.json({ success: true, stats });
});

// Add new command
router.post('/', (req, res) => {
  const { name, trigger, description, action, category, context } = req.body;

  if (!name || !trigger || !action) {
    return res.status(400).json({
      error: 'Missing required fields: name, trigger, action'
    });
  }

  // Check if command already exists
  if (findCommand(Array.isArray(trigger) ? trigger[0] : trigger)) {
    return res.status(409).json({ error: 'Command with this trigger already exists' });
  }

  const cmd = addCommand({
    name,
    trigger: Array.isArray(trigger) ? trigger : [trigger],
    description: description || '',
    action,
    category: category || 'custom',
    context: context || []
  });

  res.json({ success: true, message: 'Command added', command: cmd });
});

// Use command (track usage)
router.post('/:id/use', (req, res) => {
  const { id } = req.params;
  useCommand(id);
  res.json({ success: true, message: 'Command usage tracked' });
});

// Delete command
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const deleted = deleteCommand(id);
  if (!deleted) {
    return res.status(404).json({ error: 'Command not found' });
  }
  res.json({ success: true, message: 'Command deleted' });
});

// Context management
router.post('/context', (req, res) => {
  const { key, value } = req.body;
  if (!key) {
    return res.status(400).json({ error: 'Key required' });
  }
  addToContext(key, value);
  res.json({ success: true, message: 'Context updated' });
});

router.get('/context/:key', (req, res) => {
  const { key } = req.params;
  const value = getContext(key);
  res.json({ success: true, key, value });
});

// Conversation history
router.post('/converse', (req, res) => {
  const { role, text } = req.body;
  if (!role || !text) {
    return res.status(400).json({ error: 'role and text required' });
  }
  addConversation(role, text);
  res.json({ success: true, message: 'Added to conversation history' });
});

router.get('/memory', (_req, res) => {
  const memory = getAgentMemory();
  res.json({ success: true, memory });
});

export default router;
