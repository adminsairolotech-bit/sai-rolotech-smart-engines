import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase, isSupabaseConfigured } from '../supabase.js';

const router = Router();
const JWT_SECRET = process.env.SESSION_SECRET || 'sai-rolotech-crm-secret-2024';

function ensureSupabase(res) {
  if (isSupabaseConfigured) return true;
  res.status(503).json({ error: 'Supabase auth is not configured on this server' });
  return false;
}

function normalizeIdentifier(value = '') {
  return String(value).trim().toLowerCase();
}

async function findUserByIdentifier(identifier) {
  const clean = normalizeIdentifier(identifier);
  if (!clean) return { user: null, error: null };

  const column = clean.includes('@') ? 'email' : 'username';
  const { data: users, error } = await supabase
    .from('app_users')
    .select('*')
    .eq(column, clean)
    .limit(1);

  if (error) return { user: null, error };
  return { user: users?.[0] || null, error: null };
}

router.post('/login', async (req, res) => {
  try {
    if (!ensureSupabase(res)) return;
    const identifier = req.body?.identifier || req.body?.email || req.body?.username;
    const { password } = req.body || {};
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Username/email and password required' });
    }

    const { user, error } = await findUserByIdentifier(identifier);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password_hash, ...safeUser } = user;
    res.json({ success: true, token, user: safeUser });
  } catch (err) {
    console.error('[auth/login]', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/register', async (req, res) => {
  try {
    if (!ensureSupabase(res)) return;
    const username =
      req.body?.username ||
      (req.body?.email ? String(req.body.email).split('@')[0].trim().toLowerCase() : '');
    const { password, name, email, phone, role } = req.body || {};
    if (!username || !password || !name) {
      return res.status(400).json({ error: 'Username, password, and name required' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from('app_users')
      .insert([{
        username: String(username).trim().toLowerCase(),
        password_hash: passwordHash,
        name: String(name).trim(),
        email: email ? String(email).trim().toLowerCase() : null,
        phone: phone ? String(phone).trim() : null,
        role: role || 'machine_user',
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Username already exists' });
      }
      console.error('[auth/register]', error);
      return res.status(500).json({ error: 'Registration failed' });
    }

    const { password_hash, ...safeUser } = data;
    res.json({ success: true, user: safeUser });
  } catch (err) {
    console.error('[auth/register]', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.get('/me', async (req, res) => {
  try {
    if (!ensureSupabase(res)) return;
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = jwt.verify(token, JWT_SECRET);
    const { data: user, error } = await supabase
      .from('app_users')
      .select('id, username, name, email, phone, role, avatar_url, is_active, created_at')
      .eq('id', decoded.id)
      .single();

    if (error || !user) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

router.get('/users', async (req, res) => {
  try {
    if (!ensureSupabase(res)) return;
    const { data, error } = await supabase
      .from('app_users')
      .select('id, username, name, email, phone, role, avatar_url, is_active, created_at')
      .order('created_at', { ascending: false });

    if (error) { console.error('[auth/users]', error); return res.status(500).json({ error: 'Failed to fetch users' }); }
    res.json({ success: true, users: data });
  } catch (err) {
    console.error('[auth/users]', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.post('/change-password', async (req, res) => {
  try {
    if (!ensureSupabase(res)) return;
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password required' });
    }
    if (String(newPassword).length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { data: user, error } = await supabase
      .from('app_users')
      .select('id, password_hash')
      .eq('id', decoded.id)
      .single();

    if (error || !user) return res.status(404).json({ error: 'User not found' });

    const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const { error: updateError } = await supabase
      .from('app_users')
      .update({ password_hash: passwordHash })
      .eq('id', decoded.id);

    if (updateError) {
      console.error('[auth/change-password]', updateError);
      return res.status(500).json({ error: 'Password update failed' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('[auth/change-password]', err);
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
