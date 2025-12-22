// auth.js - Authentication and permissions middleware
class AuthManager {
  constructor() {
    this.roles = {
      guest: {
        name: 'Guest',
        permissions: ['view:public', 'read:catalog'],
        dashboardAccess: false,
      },
      researcher: {
        name: 'Researcher',
        permissions: ['view:public', 'read:catalog', 'download:metadata'],
        dashboardAccess: false,
      },
      curator: {
        name: 'Curator',
        permissions: [
          'view:public',
          'read:catalog',
          'write:artifacts',
          'edit:metadata',
          'generate:reports',
          'view:dashboard',
          'export:data',
          'propose:deaccession',
        ],
        dashboardAccess: true,
        defaultSection: 'overview',
      },
      board: {
        name: 'Board Member',
        permissions: [
          'view:public',
          'read:catalog',
          'view:dashboard',
          'view:reports',
          'approve:deaccession',
          'view:financial',
          'export:reports',
          'audit:readonly',
        ],
        dashboardAccess: true,
        defaultSection: 'reports',
      },
      auditor: {
        name: 'External Auditor',
        permissions: [
          'view:public',
          'read:catalog',
          'view:dashboard',
          'audit:full',
          'export:reports',
          'view:compliance',
        ],
        dashboardAccess: true,
        defaultSection: 'compliance',
      },
      admin: {
        name: 'System Administrator',
        permissions: ['*'],
        dashboardAccess: true,
        defaultSection: 'overview',
      },
    };

    this.currentUser = null;
    this.auditLog = this.loadStoredAuditLog();
    this.init();
  }

  init() {
    this.loadSession();
    this.protectRoutes();
    this.setupUI();
    this.startSessionTimer();
  }

  setSession({ username, role, name, twoFactor = false }) {
    const session = {
      username,
      role,
      name,
      timestamp: new Date().toISOString(),
      sessionId: 'fw-' + Date.now(),
      twoFactor,
    };
    localStorage.setItem('fw-auth', JSON.stringify(session));
    this.currentUser = session;
    this.logAudit('session_created', { userId: username, role, twoFactor });
  }

  loadSession() {
    const sessionData = localStorage.getItem('fw-auth');
    if (!sessionData) return;
    try {
      this.currentUser = JSON.parse(sessionData);
      this.logAudit('session_loaded', {
        userId: this.currentUser.username,
        role: this.currentUser.role,
      });

      const sessionAge = Date.now() - new Date(this.currentUser.timestamp).getTime();
      if (sessionAge > 24 * 60 * 60 * 1000) {
        this.logout('Session expired');
      }
    } catch (e) {
      console.error('Failed to parse session data:', e);
      this.clearSession();
    }
  }

  protectRoutes() {
    const path = window.location.pathname;
    if (path.endsWith('dashboard.html') || path.includes('dashboard/')) {
      if (!this.currentUser || !this.hasPermission('view:dashboard')) {
        this.redirectToLogin('Please log in to access the dashboard');
        return;
      }
      const userRole = this.roles[this.currentUser.role];
      if (!userRole || !userRole.dashboardAccess) {
        this.redirectToLogin('Insufficient permissions for dashboard access');
        return;
      }
    }

    if (path.endsWith('audit.html')) {
      if (!this.currentUser || !this.hasPermission('audit:full')) {
        this.redirectToLogin('Audit access requires elevated permissions');
        return;
      }
    }
  }

  setupUI() {
    if (!this.currentUser) return;
    this.updateUserInterface();
    this.applyRoleRestrictions();
  }

  updateUserInterface() {
    const userInfoEl = document.querySelector('.user-info');
    if (userInfoEl) {
      const initial = this.currentUser.name ? this.currentUser.name.charAt(0).toUpperCase() : 'U';
      userInfoEl.innerHTML = `
        <div class="user-avatar">${initial}</div>
        <div class="user-details">
          <div class="user-name">${this.currentUser.name || this.currentUser.username}</div>
          <div class="user-role">${this.roles[this.currentUser.role]?.name || 'User'}</div>
        </div>
      `;
    }

    if (document.title && !document.title.includes('|')) {
      const roleName = this.roles[this.currentUser.role]?.name;
      if (roleName) {
        document.title = `${document.title} | ${roleName}`;
      }
    }
  }

  applyRoleRestrictions() {
    if (!this.currentUser) return;
    const role = this.currentUser.role;

    const sections = {
      reports: ['board', 'curator', 'admin', 'auditor'],
      provenance: ['curator', 'admin'],
      conservation: ['curator', 'admin'],
      acquisitions: ['curator', 'admin'],
      compliance: ['auditor', 'admin'],
    };

    Object.entries(sections).forEach(([section, allowedRoles]) => {
      const sectionEl = document.querySelector(`[data-section="${section}"]`);
      if (sectionEl && !allowedRoles.includes(role)) {
        sectionEl.style.display = 'none';
      }
    });

    document.querySelectorAll('[data-permission]').forEach((element) => {
      const requiredPermission = element.getAttribute('data-permission');
      if (!this.hasPermission(requiredPermission)) {
        if (element.tagName === 'BUTTON' || element.tagName === 'A') {
          element.disabled = true;
          element.setAttribute('title', 'Insufficient permissions');
        } else {
          element.style.display = 'none';
        }
      }
    });

    if (!window.location.hash) {
      const defaultSection = this.roles[role]?.defaultSection;
      if (defaultSection && document.getElementById(defaultSection)) {
        window.location.hash = defaultSection;
      }
    }
  }

  hasPermission(permission) {
    if (!this.currentUser) return false;
    const role = this.roles[this.currentUser.role];
    if (!role) return false;
    if (role.permissions.includes('*')) return true;
    if (role.permissions.includes(permission)) return true;

    const [category] = permission.split(':');
    if (category) {
      return role.permissions.includes(`${category}:*`);
    }
    return false;
  }

  requirePermission(permission, action = 'perform this action') {
    if (!this.hasPermission(permission)) {
      this.showError(`You don't have permission to ${action}. Required: ${permission}`);
      this.logAudit('permission_denied', {
        permission,
        action,
        userId: this.currentUser?.username,
      });
      return false;
    }
    return true;
  }

  logAudit(event, data = {}) {
    const auditEntry = {
      id: 'audit-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      event,
      userId: this.currentUser?.username || 'anonymous',
      userRole: this.currentUser?.role || 'guest',
      userAgent: navigator.userAgent,
      ip: '127.0.0.1',
      path: window.location.pathname + window.location.hash,
      data,
    };

    this.auditLog.push(auditEntry);
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-1000);
    }
    localStorage.setItem('fw-audit-log', JSON.stringify(this.auditLog));
    console.log(`[AUDIT] ${event}`, auditEntry);
    return auditEntry;
  }

  getAuditLog(filters = {}) {
    let logs = [...this.auditLog];
    if (filters.userId) logs = logs.filter((log) => log.userId === filters.userId);
    if (filters.event) logs = logs.filter((log) => log.event === filters.event);
    if (filters.startDate) {
      const start = new Date(filters.startDate);
      logs = logs.filter((log) => new Date(log.timestamp) >= start);
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      logs = logs.filter((log) => new Date(log.timestamp) <= end);
    }
    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  exportAuditLog(format = 'json') {
    const logs = this.getAuditLog();
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
      this.downloadFile(blob, `audit-log-${new Date().toISOString().split('T')[0]}.json`);
    } else if (format === 'csv') {
      const headers = ['Timestamp', 'Event', 'User ID', 'User Role', 'Path', 'Data'];
      const rows = logs.map((log) => [
        log.timestamp,
        log.event,
        log.userId,
        log.userRole,
        log.path,
        JSON.stringify(log.data),
      ]);
      const csv = [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      this.downloadFile(blob, `audit-log-${new Date().toISOString().split('T')[0]}.csv`);
    }
    this.logAudit('audit_log_exported', { format, entryCount: logs.length });
  }

  downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  startSessionTimer() {
    setInterval(() => {
      if (!this.currentUser) return;
      const sessionAge = Date.now() - new Date(this.currentUser.timestamp).getTime();
      const remaining = 24 * 60 * 60 * 1000 - sessionAge;
      if (remaining < 5 * 60 * 1000 && remaining > 4 * 60 * 1000) {
        this.showWarning('Your session will expire in 5 minutes. Please save your work.');
      }
    }, 60 * 1000);
  }

  logout(reason = 'User initiated logout') {
    this.logAudit('user_logout', { reason });
    this.clearSession();
    this.redirectToLogin();
  }

  clearSession() {
    localStorage.removeItem('fw-auth');
    this.currentUser = null;
  }

  redirectToLogin(message = 'Please log in to continue') {
    localStorage.setItem('fw-auth-redirect', window.location.href);
    localStorage.setItem('fw-auth-message', message);
    window.location.href = 'login.html';
  }

  showError(message) {
    console.error('[AUTH ERROR]', message);
    if (typeof alert !== 'undefined') alert(`Error: ${message}`);
  }

  showWarning(message) {
    console.warn('[AUTH WARNING]', message);
  }

  loadStoredAuditLog() {
    const stored = localStorage.getItem('fw-audit-log');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse stored audit log', e);
      }
    }
    return [];
  }
}

window.AuthManager = new AuthManager();

// Intercept actions requiring permission
document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('click', (e) => {
    const button = e.target.closest('[data-permission]');
    if (button && button.hasAttribute('data-permission')) {
      const permission = button.getAttribute('data-permission');
      const action = button.getAttribute('data-action-description') || 'perform this action';
      if (!window.AuthManager.requirePermission(permission, action)) {
        e.preventDefault();
        e.stopPropagation();
      } else {
        window.AuthManager.logAudit('action_performed', {
          action: button.getAttribute('data-action') || 'unknown',
          permission,
          element: button.tagName,
          text: button.textContent.trim(),
        });
      }
    }
  });

  if (window.AuthManager.currentUser) {
    const sidebarFooter = document.querySelector('.sidebar-footer');
    if (sidebarFooter && !sidebarFooter.querySelector('.logout-btn')) {
      const logoutBtn = document.createElement('button');
      logoutBtn.className = 'logout-btn';
      logoutBtn.innerHTML = '🚪 Logout';
      logoutBtn.style.cssText = `
        background: none;
        border: 1px solid #dc2626;
        color: #dc2626;
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        cursor: pointer;
        font-size: 0.85rem;
        margin-top: 1rem;
        width: 100%;
      `;
      logoutBtn.addEventListener('click', () => {
        window.AuthManager.logout();
      });
      sidebarFooter.appendChild(logoutBtn);
    }
  }
});

// API simulation with auth check
window.FW_API = {
  async request(endpoint, data = {}, method = 'GET') {
    if (!window.AuthManager.currentUser) {
      return { error: 'Authentication required', status: 401 };
    }

    const endpointPermissions = {
      '/api/artifacts/create': 'write:artifacts',
      '/api/artifacts/update': 'edit:metadata',
      '/api/artifacts/delete': 'delete:artifacts',
      '/api/reports/generate': 'generate:reports',
      '/api/deaccessions/propose': 'propose:deaccession',
      '/api/deaccessions/approve': 'approve:deaccession',
      '/api/audit/logs': 'audit:full',
    };

    const requiredPermission = endpointPermissions[endpoint];
    if (requiredPermission && !window.AuthManager.hasPermission(requiredPermission)) {
      window.AuthManager.logAudit('api_permission_denied', {
        endpoint,
        requiredPermission,
        userId: window.AuthManager.currentUser.username,
      });
      return { error: 'Insufficient permissions', status: 403 };
    }

    window.AuthManager.logAudit('api_request', {
      endpoint,
      method,
      dataSize: JSON.stringify(data).length,
    });

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          status: 200,
          data: { message: 'Success', timestamp: new Date().toISOString() },
          metadata: {
            servedBy: 'fw-api-01',
            requestId: 'req-' + Date.now(),
          },
        });
      }, 300);
    });
  },
};
