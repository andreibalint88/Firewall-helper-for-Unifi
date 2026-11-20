const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const https = require('https');

// Store active sessions (in production, use Redis or database)
const activeSessions = new Map();

// Create HTTPS agent that ignores self-signed certificates
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

// Helper to make requests to UniFi controller
async function unifiRequest(url, options = {}) {
  const fetchOptions = {
    ...options,
    agent: httpsAgent,
    timeout: 10000,
  };

  try {
    const response = await fetch(url, fetchOptions);
    return response;
  } catch (error) {
    console.error('UniFi request error:', error.message);
    throw new Error(`Failed to connect to UniFi controller: ${error.message}`);
  }
}

// POST /api/unifi/connect - Connect to UniFi controller
router.post('/connect', async (req, res) => {
  const { controllerUrl, username, password, site = 'default' } = req.body;

  if (!controllerUrl || !username || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const baseUrl = controllerUrl.replace(/\/$/, '');
    
    // Try UniFi OS authentication (UDM Pro, Cloud Key Gen2+)
    const authUrl = `${baseUrl}/api/auth/login`;
    
    const response = await unifiRequest(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      // Try legacy authentication for older controllers
      const legacyAuthUrl = `${baseUrl}/api/login`;
      const legacyResponse = await unifiRequest(legacyAuthUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!legacyResponse.ok) {
        return res.status(401).json({ 
          error: 'Authentication failed',
          details: `HTTP ${response.status} - Check your credentials`
        });
      }

      // Legacy auth succeeded
      const cookies = legacyResponse.headers.get('set-cookie');
      const csrfToken = legacyResponse.headers.get('x-csrf-token');
      
      const sessionId = `session-${Date.now()}`;
      activeSessions.set(sessionId, {
        controllerUrl: baseUrl,
        site,
        cookies,
        csrfToken,
        createdAt: Date.now(),
      });

      return res.json({
        success: true,
        sessionId,
        message: 'Connected to UniFi controller (legacy mode)',
      });
    }

    // UniFi OS auth succeeded
    const cookies = response.headers.get('set-cookie');
    const csrfToken = response.headers.get('x-csrf-token');
    
    const sessionId = `session-${Date.now()}`;
    activeSessions.set(sessionId, {
      controllerUrl: baseUrl,
      site,
      cookies,
      csrfToken,
      createdAt: Date.now(),
    });

    res.json({
      success: true,
      sessionId,
      message: 'Connected to UniFi controller',
    });

  } catch (error) {
    console.error('Connection error:', error);
    res.status(500).json({ 
      error: 'Connection failed',
      details: error.message 
    });
  }
});

// GET /api/unifi/firewall-rules - Get firewall rules
router.get('/firewall-rules', async (req, res) => {
  const { sessionId } = req.headers;
  
  if (!sessionId || !activeSessions.has(sessionId)) {
    return res.status(401).json({ error: 'Not connected to UniFi controller' });
  }

  const session = activeSessions.get(sessionId);
  
  try {
    // Try new API first (UniFi OS 3.x+)
    let url = `${session.controllerUrl}/proxy/network/v2/api/firewall/${session.site}/rules`;
    
    let response = await unifiRequest(url, {
      method: 'GET',
      headers: {
        'Cookie': session.cookies,
        'X-CSRF-Token': session.csrfToken || '',
      },
    });

    // If new API fails, try legacy API
    if (!response.ok) {
      url = `${session.controllerUrl}/api/s/${session.site}/rest/firewallrule`;
      response = await unifiRequest(url, {
        method: 'GET',
        headers: {
          'Cookie': session.cookies,
        },
      });
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch firewall rules: HTTP ${response.status}`);
    }

    const data = await response.json();
    
    // Normalize the response format
    const rules = data.data || data;
    
    res.json({
      success: true,
      rules: Array.isArray(rules) ? rules : [],
    });

  } catch (error) {
    console.error('Fetch firewall rules error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch firewall rules',
      details: error.message 
    });
  }
});

// GET /api/unifi/firewall-groups - Get firewall groups
router.get('/firewall-groups', async (req, res) => {
  const { sessionId } = req.headers;
  
  if (!sessionId || !activeSessions.has(sessionId)) {
    return res.status(401).json({ error: 'Not connected to UniFi controller' });
  }

  const session = activeSessions.get(sessionId);
  
  try {
    const url = `${session.controllerUrl}/api/s/${session.site}/rest/firewallgroup`;
    
    const response = await unifiRequest(url, {
      method: 'GET',
      headers: {
        'Cookie': session.cookies,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch firewall groups: HTTP ${response.status}`);
    }

    const data = await response.json();
    
    res.json({
      success: true,
      groups: data.data || data || [],
    });

  } catch (error) {
    console.error('Fetch firewall groups error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch firewall groups',
      details: error.message 
    });
  }
});

// GET /api/unifi/networks - Get network configurations
router.get('/networks', async (req, res) => {
  const { sessionId } = req.headers;
  
  if (!sessionId || !activeSessions.has(sessionId)) {
    return res.status(401).json({ error: 'Not connected to UniFi controller' });
  }

  const session = activeSessions.get(sessionId);
  
  try {
    const url = `${session.controllerUrl}/api/s/${session.site}/rest/networkconf`;
    
    const response = await unifiRequest(url, {
      method: 'GET',
      headers: {
        'Cookie': session.cookies,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch networks: HTTP ${response.status}`);
    }

    const data = await response.json();
    
    res.json({
      success: true,
      networks: data.data || data || [],
    });

  } catch (error) {
    console.error('Fetch networks error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch networks',
      details: error.message 
    });
  }
});

// PUT /api/unifi/firewall-rules/:id - Update firewall rule
router.put('/firewall-rules/:id', async (req, res) => {
  const { sessionId } = req.headers;
  const { id } = req.params;
  const updates = req.body;
  
  if (!sessionId || !activeSessions.has(sessionId)) {
    return res.status(401).json({ error: 'Not connected to UniFi controller' });
  }

  const session = activeSessions.get(sessionId);
  
  try {
    const url = `${session.controllerUrl}/api/s/${session.site}/rest/firewallrule/${id}`;
    
    const response = await unifiRequest(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': session.cookies,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`Failed to update firewall rule: HTTP ${response.status}`);
    }

    const data = await response.json();
    
    res.json({
      success: true,
      rule: data.data || data,
    });

  } catch (error) {
    console.error('Update firewall rule error:', error);
    res.status(500).json({ 
      error: 'Failed to update firewall rule',
      details: error.message 
    });
  }
});

// POST /api/unifi/firewall-rules - Create firewall rule
router.post('/firewall-rules', async (req, res) => {
  const { sessionId } = req.headers;
  const ruleData = req.body;
  
  if (!sessionId || !activeSessions.has(sessionId)) {
    return res.status(401).json({ error: 'Not connected to UniFi controller' });
  }

  const session = activeSessions.get(sessionId);
  
  try {
    const url = `${session.controllerUrl}/api/s/${session.site}/rest/firewallrule`;
    
    const response = await unifiRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': session.cookies,
      },
      body: JSON.stringify(ruleData),
    });

    if (!response.ok) {
      throw new Error(`Failed to create firewall rule: HTTP ${response.status}`);
    }

    const data = await response.json();
    
    res.json({
      success: true,
      rule: data.data || data,
    });

  } catch (error) {
    console.error('Create firewall rule error:', error);
    res.status(500).json({ 
      error: 'Failed to create firewall rule',
      details: error.message 
    });
  }
});

// DELETE /api/unifi/firewall-rules/:id - Delete firewall rule
router.delete('/firewall-rules/:id', async (req, res) => {
  const { sessionId } = req.headers;
  const { id } = req.params;
  
  if (!sessionId || !activeSessions.has(sessionId)) {
    return res.status(401).json({ error: 'Not connected to UniFi controller' });
  }

  const session = activeSessions.get(sessionId);
  
  try {
    const url = `${session.controllerUrl}/api/s/${session.site}/rest/firewallrule/${id}`;
    
    const response = await unifiRequest(url, {
      method: 'DELETE',
      headers: {
        'Cookie': session.cookies,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete firewall rule: HTTP ${response.status}`);
    }
    
    res.json({
      success: true,
      message: 'Firewall rule deleted',
    });

  } catch (error) {
    console.error('Delete firewall rule error:', error);
    res.status(500).json({ 
      error: 'Failed to delete firewall rule',
      details: error.message 
    });
  }
});

// POST /api/unifi/disconnect - Disconnect from UniFi controller
router.post('/disconnect', async (req, res) => {
  const { sessionId } = req.headers;
  
  if (sessionId && activeSessions.has(sessionId)) {
    const session = activeSessions.get(sessionId);
    
    try {
      // Try to logout from UniFi controller
      const logoutUrl = `${session.controllerUrl}/api/logout`;
      await unifiRequest(logoutUrl, {
        method: 'POST',
        headers: {
          'Cookie': session.cookies,
        },
      });
    } catch (error) {
      console.error('Logout error (non-critical):', error.message);
    }
    
    activeSessions.delete(sessionId);
  }
  
  res.json({ success: true, message: 'Disconnected' });
});

module.exports = router;
