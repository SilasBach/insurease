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
        const policies = await fetchInsurances();
        setUser({ ...userData, policies });
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

  const fetchInsurances = async (): Promise<{
    [key: string]: string[];
  }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/policies/policies`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        return data.policies;
      } else {
        throw new Error('Failed to fetch folder structure');
      }
    } catch (error) {
      console.error(
        'An error occurred while fetching folder structure:',
        error,
      );
      throw error;
    }
  };

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
        const insurances = await fetchInsurances();
        const userWithInsurances = { ...userData, insurances };
        setUser(userWithInsurances);
        return userWithInsurances;
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

  const comparePolicies = async (
    policy1: string,
    policy2: string,
    query: string,
  ): Promise<string> => {
    try {
      const response = await fetch(`${API_BASE_URL}/compare-policies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ policy1, policy2, query }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server response:', errorData);
        throw new Error(errorData.detail || 'Failed to compare policies');
      }

      const data = await response.json();
      return data.answer;
    } catch (error) {
      console.error('Full error object:', error);
      if (error instanceof Error) {
        throw new Error(`Error comparing policies: ${error.message}`);
      } else {
        throw new Error('An unknown error occurred while comparing policies');
      }
    }
  };

  const askQuestion = async (question: string): Promise<string> => {
    try {
      const response = await fetch(`${API_BASE_URL}/question`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server response:', errorData);
        throw new Error(errorData.detail || 'Failed to get answer');
      }

      const data = await response.json();
      return data.answer;
    } catch (error) {
      console.error('Full error object:', error);
      if (error instanceof Error) {
        throw new Error(`Error asking question: ${error.message}`);
      } else {
        throw new Error('An unknown error occurred while asking the question');
      }
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
  const uploadPolicy = async (
    file: File,
    fileName: string,
    selectedInsurance: string,
  ): Promise<{ success: boolean; message: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('insurance_name', selectedInsurance);
    formData.append('policy_name', fileName);

    try {
      const response = await fetch(`${API_BASE_URL}/policies/upload-policy`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to upload Policy');
      }

      await checkAuthStatus(); // Refresh the user state to get the updated policies
      return { success: true, message: 'Policy uploaded successfully' };
    } catch (error) {
      console.error('An error occurred while uploading the Policy:', error);
      return {
        success: false,
        message: 'An error occurred while uploading the Policy',
      };
    }
  };

  const deletePolicy = async (
    selectedInsurance: string,
    filename: string,
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/policies/delete-policy/${selectedInsurance}/${filename}`,
        {
          method: 'DELETE',
          credentials: 'include',
        },
      );

      if (!response.ok) {
        throw new Error('Failed to delete Policy');
      }

      await checkAuthStatus(); // Refresh the user state to get the updated policies
      return { success: true, message: 'Policy deleted successfully' };
    } catch (error) {
      console.error('An error occurred while deleting the Policy:', error);
      return {
        success: false,
        message: 'An error occurred while deleting the Policy',
      };
    }
  };

  const addCompany = async (
    companyName: string,
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/insurance/insurance-companies`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: companyName }),
          credentials: 'include',
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to add insurance company');
      }

      await checkAuthStatus(); // Refresh the user state to get the updated policies
      return { success: true, message: 'Insurance company added successfully' };
    } catch (error) {
      console.error(
        'An error occurred while adding the insurance company:',
        error,
      );
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'An error occurred while adding the insurance company',
      };
    }
  };

  const deleteCompany = async (
    companyName: string,
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/insurance/insurance-companies/${companyName}`,
        {
          method: 'DELETE',
          credentials: 'include',
        },
      );

      if (!response.ok) {
        throw new Error('Failed to delete insurance company');
      }

      await checkAuthStatus(); // Refresh the user state to get the updated policies
      return {
        success: true,
        message: 'Insurance company deleted successfully',
      };
    } catch (error) {
      console.error(
        'An error occurred while deleting the insurance company:',
        error,
      );
      return {
        success: false,
        message: 'An error occurred while deleting the insurance company',
      };
    }
  };

  return {
    user,
    login,
    register,
    logout,
    loading,
    checkAuthStatus,
    askQuestion,
    fetchUserData,
    updateUser,
    comparePolicies,
    uploadPolicy,
    deletePolicy,
    addCompany,
    deleteCompany,
  };
  };
