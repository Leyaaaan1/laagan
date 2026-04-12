import {api} from './Apiclient';

export const getMyProfile = async (token = null) => {
  try {
    const response = await api.get('/profiles/me', token);
    if (!response.ok)
      return {success: false, message: `HTTP ${response.status}`};
    const result = await response.json();
    return {success: true, data: result};
  } catch (error) {
    console.error('getMyProfile error:', error);
    return {success: false, message: error.message};
  }
};

export const getProfileByUsername = async (username, token = null) => {
  try {
    const response = await api.get(`/profiles/${username}`, token);
    const result = await response.json();
    if (response.ok) return {success: true, data: result};
    return {
      success: false,
      message: result.message || 'Failed to fetch profile',
    };
  } catch (error) {
    console.error('getProfileByUsername error:', error);
    return {success: false, message: error.message};
  }
};

export const updateMyProfile = async (updates, token = null) => {
  try {
    const response = await api.put('/profiles/edit', updates, token);
    const result = await response.json();
    if (response.ok) return {success: true, data: result};
    return {
      success: false,
      message: result.message || 'Failed to update profile',
    };
  } catch (error) {
    console.error('updateMyProfile error:', error);
    return {success: false, message: error.message};
  }
};

export const addRiderType = async (typeName, token = null) => {
  try {
    const response = await api.post(
      `/profiles/add/rider-types/${encodeURIComponent(typeName)}`,
      {},
      token,
    );
    const result = await response.json();
    if (response.ok) return {success: true, data: result};
    return {
      success: false,
      message: result.message || 'Failed to add rider type',
    };
  } catch (error) {
    console.error('addRiderType error:', error);
    return {success: false, message: error.message};
  }
};

export const removeRiderType = async (typeName, token = null) => {
  try {
    const response = await api.delete(
      `/profiles/rider-types/${encodeURIComponent(typeName)}`,
      token,
    );
    const result = await response.json();
    if (response.ok) return {success: true, data: result};
    return {
      success: false,
      message: result.message || 'Failed to remove rider type',
    };
  } catch (error) {
    console.error('removeRiderType error:', error);
    return {success: false, message: error.message};
  }
};
