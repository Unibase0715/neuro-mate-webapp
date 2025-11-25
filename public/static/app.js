// Neuro mate - Frontend Application

// API base URL
const API_BASE = '/api';

// Auth state
let authToken = localStorage.getItem('authToken');
let currentUser = null;

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
  // Check authentication
  if (authToken) {
    await checkAuth();
  }
  
  updateAuthUI();
  setupEventListeners();
});

// Authentication functions
async function checkAuth() {
  try {
    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      currentUser = data.user;
    } else {
      logout();
    }
  } catch (error) {
    console.error('Auth check failed:', error);
  }
}

function updateAuthUI() {
  const authButtons = document.getElementById('auth-buttons');
  const userInfo = document.getElementById('user-info');
  
  if (!authButtons || !userInfo) return;
  
  if (currentUser) {
    authButtons.style.display = 'none';
    userInfo.style.display = 'block';
    userInfo.innerHTML = `
      <span>${currentUser.email}</span>
      <span class="badge">${currentUser.plan}</span>
      <button onclick="logout()" class="btn btn-sm">ログアウト</button>
    `;
  } else {
    authButtons.style.display = 'block';
    userInfo.style.display = 'none';
  }
}

async function signup(email, password) {
  try {
    const response = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      authToken = data.token;
      currentUser = data.user;
      localStorage.setItem('authToken', authToken);
      updateAuthUI();
      return { success: true };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}

async function login(email, password) {
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      authToken = data.token;
      currentUser = data.user;
      localStorage.setItem('authToken', authToken);
      updateAuthUI();
      return { success: true };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}

function logout() {
  authToken = null;
  currentUser = null;
  localStorage.removeItem('authToken');
  updateAuthUI();
  window.location.href = '/';
}

// Diagnosis functions
async function submitDiagnosis(answers) {
  try {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const response = await fetch(`${API_BASE}/diagnosis/run`, {
      method: 'POST',
      headers,
      body: JSON.stringify(answers)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return { success: true, result: data.result };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}

// AI consultation functions
async function submitConsultation(input) {
  try {
    const response = await fetch(`${API_BASE}/ai/consult`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(input)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return { success: true, report: data.report };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}

// Coach functions
async function submitCoachLog(log) {
  try {
    const response = await fetch(`${API_BASE}/ai/coach/log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(log)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return { success: true, id: data.id };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}

async function getDailyPlan() {
  try {
    const response = await fetch(`${API_BASE}/ai/coach/plan`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return { success: true, plan: data.plan };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}

// Utility functions
function showLoading(element) {
  if (element) {
    element.innerHTML = '<div class="loading">読み込み中...</div>';
  }
}

function showError(element, message) {
  if (element) {
    element.innerHTML = `<div class="error">${message}</div>`;
  }
}

function setupEventListeners() {
  // Add event listeners as needed
}
