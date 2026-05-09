const OWNER = 'woosoosoo';
const REPO  = 'travel-blog';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { filename, content, password } = req.body || {};
  if (!password || password !== process.env.EDIT_PW)
    return res.status(401).json({ error: 'Unauthorized' });
  if (!filename || !content)
    return res.status(400).json({ error: 'Missing filename or content' });

  const token = process.env.GITHUB_TOKEN;
  if (!token) return res.status(500).json({ error: 'Server not configured' });

  // 디렉토리 탐색 방지
  const safeName = filename.replace(/[/\\]/g, '_');
  const filePath = `images/${safeName}`;
  const apiUrl   = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath}`;
  const headers  = {
    Authorization: `token ${token}`,
    'Content-Type': 'application/json',
    'User-Agent': 'travel-blog-api',
  };

  try {
    const getRes = await fetch(apiUrl, { headers });
    const sha = getRes.ok ? (await getRes.json()).sha : null;

    const putRes = await fetch(apiUrl, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        message: `add image: ${safeName}`,
        content,
        ...(sha ? { sha } : {}),
      }),
    });

    if (!putRes.ok) {
      const err = await putRes.json();
      return res.status(500).json({ error: err.message || 'GitHub API error' });
    }
    return res.json({ ok: true, path: filePath });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
