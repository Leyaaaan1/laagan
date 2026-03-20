import { BASE_URL } from '@env';

const API_BASE_URL = BASE_URL;

// ── GET /profiles/me ──────────────────────────────────────────────────────────
export const getMyProfile = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/profiles/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (response.ok) {
      return { success: true, data: result };
    } else {
      return { success: false, message: result.message || 'Failed to fetch profile' };
    }
  } catch (error) {
    console.error('getMyProfile error:', error);
    return { success: false, message: 'Network error occurred' };
  }
};

// ── GET /profiles/{username} ──────────────────────────────────────────────────
export const getProfileByUsername = async (token, username) => {
  try {
    const response = await fetch(`${API_BASE_URL}/profiles/${username}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (response.ok) {
      return { success: true, data: result };
    } else {
      return { success: false, message: result.message || 'Failed to fetch profile' };
    }
  } catch (error) {
    console.error('getProfileByUsername error:', error);
    return { success: false, message: 'Network error occurred' };
  }
};

// ── PUT /profiles/edit ────────────────────────────────────────────────────────
export const updateMyProfile = async (token, updates) => {
  try {
    const response = await fetch(`${API_BASE_URL}/profiles/edit`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    const result = await response.json();

    if (response.ok) {
      return { success: true, data: result };
    } else {
      return { success: false, message: result.message || 'Failed to update profile' };
    }
  } catch (error) {
    console.error('updateMyProfile error:', error);
    return { success: false, message: 'Network error occurred' };
  }
};

export const addRiderType = async (token, typeName) => {
  try {
    const response = await fetch(`${API_BASE_URL}/profiles/add/rider-types/${encodeURIComponent(typeName)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (response.ok) {
      return { success: true, data: result };
    } else {
      return { success: false, message: result.message || 'Failed to add rider type' };
    }
  } catch (error) {
    console.error('addRiderType error:', error);
    return { success: false, message: 'Network error occurred' };
  }
};

// ── DELETE /profiles/rider-types/{typeName} ───────────────────────────────────
export const removeRiderType = async (token, typeName) => {
  try {
    const response = await fetch(`${API_BASE_URL}/profiles/rider-types/${encodeURIComponent(typeName)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (response.ok) {
      return { success: true, data: result };
    } else {
      return { success: false, message: result.message || 'Failed to remove rider type' };
    }
  } catch (error) {
    console.error('removeRiderType error:', error);
    return { success: false, message: 'Network error occurred' };
  }
};