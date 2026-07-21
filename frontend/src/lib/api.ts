// Normalize BASE_URL: ensure it always ends with /api
// Handles both: NEXT_PUBLIC_API_URL=https://host.onrender.com
//           and: NEXT_PUBLIC_API_URL=https://host.onrender.com/api
const _rawUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const BASE_URL = _rawUrl.endsWith('/api') ? _rawUrl : `${_rawUrl.replace(/\/$/, '')}/api`;

const getHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('eimp_access_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
  }
  return response.json();
};

export const api = {
  // --- AUTH ---
  auth: {
    login: async (credentials: any) => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      return handleResponse(res);
    },
    me: async () => {
      const res = await fetch(`${BASE_URL}/auth/me`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    history: async () => {
      const res = await fetch(`${BASE_URL}/auth/login-history`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    }
  },

  // --- FIREWALL ---
  firewall: {
    getRules: async () => {
      const res = await fetch(`${BASE_URL}/firewall`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    createRule: async (rule: any) => {
      const res = await fetch(`${BASE_URL}/firewall`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(rule)
      });
      return handleResponse(res);
    },
    updateRule: async (id: string, rule: any) => {
      const res = await fetch(`${BASE_URL}/firewall/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(rule)
      });
      return handleResponse(res);
    },
    deleteRule: async (id: string) => {
      const res = await fetch(`${BASE_URL}/firewall/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    reorderRules: async (ruleIds: string[]) => {
      const res = await fetch(`${BASE_URL}/firewall/reorder`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ ruleIds })
      });
      return handleResponse(res);
    },
    simulatePacket: async (packet: any) => {
      const res = await fetch(`${BASE_URL}/firewall/simulate`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(packet)
      });
      return handleResponse(res);
    }
  },

  // --- DEVICES ---
  devices: {
    list: async () => {
      const res = await fetch(`${BASE_URL}/devices`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    get: async (id: string) => {
      const res = await fetch(`${BASE_URL}/devices/${id}`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    create: async (device: any) => {
      const res = await fetch(`${BASE_URL}/devices`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(device)
      });
      return handleResponse(res);
    },
    update: async (id: string, device: any) => {
      const res = await fetch(`${BASE_URL}/devices/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(device)
      });
      return handleResponse(res);
    },
    togglePower: async (id: string) => {
      const res = await fetch(`${BASE_URL}/devices/${id}/toggle`, {
        method: 'POST',
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    executeCmd: async (id: string, command: string) => {
      const res = await fetch(`${BASE_URL}/devices/${id}/command`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ command })
      });
      return handleResponse(res);
    }
  },

  // --- TICKETS ---
  tickets: {
    list: async () => {
      const res = await fetch(`${BASE_URL}/tickets`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    create: async (ticket: any) => {
      const res = await fetch(`${BASE_URL}/tickets`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(ticket)
      });
      return handleResponse(res);
    },
    update: async (id: string, ticket: any) => {
      const res = await fetch(`${BASE_URL}/tickets/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(ticket)
      });
      return handleResponse(res);
    },
    addComment: async (id: string, message: string) => {
      const res = await fetch(`${BASE_URL}/tickets/${id}/comment`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ message })
      });
      return handleResponse(res);
    },
    escalate: async (id: string) => {
      const res = await fetch(`${BASE_URL}/tickets/${id}/escalate`, {
        method: 'POST',
        headers: getHeaders()
      });
      return handleResponse(res);
    }
  },

  // --- VPN ---
  vpn: {
    list: async () => {
      const res = await fetch(`${BASE_URL}/vpn`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    disconnect: async (id: string) => {
      const res = await fetch(`${BASE_URL}/vpn/disconnect/${id}`, {
        method: 'POST',
        headers: getHeaders()
      });
      return handleResponse(res);
    }
  },

  // --- SECURITY ---
  security: {
    getAlerts: async () => {
      const res = await fetch(`${BASE_URL}/security/alerts`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    getSummary: async () => {
      const res = await fetch(`${BASE_URL}/security/summary`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    mitigate: async (id: string) => {
      const res = await fetch(`${BASE_URL}/security/mitigate/${id}`, {
        method: 'POST',
        headers: getHeaders()
      });
      return handleResponse(res);
    }
  },

  // --- AUDIT ---
  audit: {
    getLogs: async (filters: { category?: string; search?: string; status?: string } = {}) => {
      const query = new URLSearchParams(filters as any).toString();
      const res = await fetch(`${BASE_URL}/audit/logs?${query}`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    getAnalytics: async () => {
      const res = await fetch(`${BASE_URL}/audit/analytics`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    }
  },

  // --- ACTIVE DIRECTORY ---
  ad: {
    listUsers: async () => {
      const res = await fetch(`${BASE_URL}/ad/users`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    createUser: async (userData: any) => {
      const res = await fetch(`${BASE_URL}/ad/users`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(userData)
      });
      return handleResponse(res);
    },
    unlockUser: async (id: string) => {
      const res = await fetch(`${BASE_URL}/ad/users/${id}/unlock`, {
        method: 'POST',
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    lockUser: async (id: string) => {
      const res = await fetch(`${BASE_URL}/ad/users/${id}/lock`, {
        method: 'POST',
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    resetPassword: async (id: string, newPassword: string) => {
      const res = await fetch(`${BASE_URL}/ad/users/${id}/reset-password`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ newPassword })
      });
      return handleResponse(res);
    }
  }
};
