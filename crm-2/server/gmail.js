import { google } from 'googleapis';

let connectionSettings = null;

async function getAccessToken() {
  if (
    connectionSettings &&
    connectionSettings.settings.expires_at &&
    new Date(connectionSettings.settings.expires_at).getTime() > Date.now()
  ) {
    return connectionSettings.settings.access_token;
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? 'depl ' + process.env.WEB_REPL_RENEWAL
    : null;

  if (!xReplitToken) throw new Error('X-Replit-Token not found');

  const resp = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-mail',
    {
      headers: {
        Accept: 'application/json',
        'X-Replit-Token': xReplitToken,
      },
    }
  );
  const data = await resp.json();
  connectionSettings = data.items?.[0];

  const accessToken =
    connectionSettings?.settings?.access_token ||
    connectionSettings?.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) throw new Error('Gmail not connected');
  return accessToken;
}

export async function getUncachableGmailClient() {
  const accessToken = await getAccessToken();
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.gmail({ version: 'v1', auth: oauth2Client });
}

// Parse lead info from email
function parseLeadFromEmail(message, headers) {
  const get = (name) => headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || '';
  const from = get('From');
  const subject = get('Subject');
  const date = get('Date');

  const nameMatch = from.match(/^"?([^"<]+)"?\s*</);
  const emailMatch = from.match(/<([^>]+)>/);
  const name = nameMatch ? nameMatch[1].trim() : from.split('@')[0];
  const email = emailMatch ? emailMatch[1] : from;

  // Detect lead source from subject
  let source = 'Gmail';
  let campaign = subject;
  const subjectLower = subject.toLowerCase();
  if (subjectLower.includes('google') || subjectLower.includes('ads')) source = 'Google Ads';
  else if (subjectLower.includes('form') || subjectLower.includes('inquiry') || subjectLower.includes('enquiry')) source = 'Contact Form';
  else if (subjectLower.includes('demo') || subjectLower.includes('trial')) source = 'Demo Request';
  else if (subjectLower.includes('quote') || subjectLower.includes('pricing')) source = 'Quote Request';
  else if (subjectLower.includes('referral') || subjectLower.includes('refer')) source = 'Referral';

  return {
    id: message.id,
    name,
    email,
    subject,
    source,
    campaign,
    time: new Date(date).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }),
    status: 'New',
    snippet: message.snippet || '',
  };
}

export async function fetchGmailLeads({ maxResults = 20, query = '' } = {}) {
  const gmail = await getUncachableGmailClient();

  // Search for lead-related emails
  const searchQuery = query || 'subject:(inquiry OR enquiry OR demo OR quote OR lead OR contact OR interest OR form) newer_than:30d';

  const listResp = await gmail.users.messages.list({
    userId: 'me',
    maxResults,
    q: searchQuery,
  });

  const messages = listResp.data.messages || [];
  if (messages.length === 0) return [];

  const leads = await Promise.all(
    messages.map(async (msg) => {
      try {
        const detail = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id,
          format: 'metadata',
          metadataHeaders: ['From', 'Subject', 'Date'],
        });
        return parseLeadFromEmail(detail.data, detail.data.payload?.headers || []);
      } catch {
        return null;
      }
    })
  );

  return leads.filter(Boolean);
}
