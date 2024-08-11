import { useState, useEffect, useCallback, useRef } from 'react';
import {
  UserState,
  LoginCredentials,
  RegistrationData,
  User,
} from '../interfaces/interfaces';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const useAuth = () => {
  const [user, setUser] = useState<UserState | null>(null);
  const [loading, setLoading] = useState(true);
  const userCache = useRef<{ [key: string]: User }>({});

  const checkAuthStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/check-auth`, {
        method: 'GET',
        credentials: 'include',
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<UserState> => {
    try {
      const formData = new URLSearchParams();
      formData.append('username', credentials.email);
      formData.append('password', credentials.password);

      const response = await fetch(`${API_BASE_URL}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
        credentials: 'include',
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        return userData;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    registrationData: RegistrationData,
  ): Promise<void> => {
    setLoading(true);
    try {
      const registerResponse = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
        credentials: 'include',
      });

      if (!registerResponse.ok) {
        const errorData = await registerResponse.json();
        throw new Error(errorData.detail || 'Registration failed');
      }

      await login({
        email: registrationData.email,
        password: registrationData.password,
      });
    } catch (error) {
      console.error('An error occurred during registration:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      setUser(null);
    } catch (error) {
      console.error('An error occurred during logout:', error);
    }
  };
  const fetchUserData = useCallback(async (userId: string): Promise<User> => {
    if (userCache.current[userId]) {
      return userCache.current[userId];
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        userCache.current[userId] = data;
        return data;
      } else {
        if (response.status === 401) {
          setUser(null);
        }
        throw new Error('Failed to fetch user data');
      }
    } catch (error) {
      console.error('An error occurred while fetching user data:', error);
      throw error;
    }
  }, []);

  interface UpdateUserData extends Partial<User> {
    password?: string;
  }

  const updateUser = async (
    userId: string,
    updateData: UpdateUserData,
  ): Promise<User> => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        return updatedUser;
      } else {
        if (response.status === 401) {
          setUser(null);
        }
        throw new Error('Failed to update user');
      }
    } catch (error) {
      console.error('An error occurred during update:', error);
      throw error;
    }
  };

  return {
    user,
    login,
    register,
    logout,
    loading,
    checkAuthStatus,
    fetchUserData,
    updateUser,
  };
  };
