import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../hooks/useAuth';
import fetchMock from 'jest-fetch-mock';

// Enable fetch mocks
fetchMock.enableMocks();

// Mock API_BASE_URL
jest.mock('../config', () => ({
  API_BASE_URL: 'http://localhost:3000',
}));

jest.mock('../hooks/useAuth', () => ({
  ...jest.requireActual('../hooks/useAuth'),
  checkAuthStatus: jest.fn(),
}));

describe('useAuth hook', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  test('initial state', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({ user_id: '123', role: 'user' }),
    );
    fetchMock.mockResponseOnce(
      JSON.stringify({ policies: { folder1: ['policy1', 'policy2'] } }),
    );

    const { result } = renderHook(() => useAuth());

    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBe(null);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.user).toEqual({
      user_id: '123',
      role: 'user',
      policies: { folder1: ['policy1', 'policy2'] },
    });
  });

  test('login success', async () => {
    // Mock the token response
    fetchMock.mockResponseOnce(
      JSON.stringify({ user_id: '123', role: 'user' }),
    );

    // Mock the policies response
    fetchMock.mockResponseOnce(
      JSON.stringify({ policies: { folder1: ['policy1', 'policy2'] } }),
    );

    const { result } = renderHook(() => useAuth(true)); // Pass true to skip initial check

    let user;
    await act(async () => {
      user = await result.current.login({
        email: 'test@example.com',
        password: 'password',
      });
    });

    expect(user).toEqual({
      user_id: '123',
      role: 'user',
      insurances: { folder1: ['policy1', 'policy2'] },
    });

    expect(result.current.user).toEqual({
      user_id: '123',
      role: 'user',
      insurances: { folder1: ['policy1', 'policy2'] },
    });
  });

  test('login failure', async () => {
    // Mock the failed login response
    fetchMock.mockResponseOnce(
      JSON.stringify({ detail: 'Invalid credentials' }),
      { status: 401 },
    );

    const { result } = renderHook(() => useAuth(true));

    await expect(async () => {
      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        });
      });
    }).rejects.toThrow('Invalid credentials');

    expect(result.current.user).toBe(null);
  });

  test('fetchInsurances', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({ policies: { folder1: ['policy1', 'policy2'] } }),
    );

    const { result } = renderHook(() => useAuth(true));

    let policies;
    await act(async () => {
      policies = await result.current.fetchInsurances();
    });

    expect(policies).toEqual({ folder1: ['policy1', 'policy2'] });
  });

  test('checkAuthStatus - authenticated', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({ user_id: '123', role: 'user' }),
    );
    fetchMock.mockResponseOnce(
      JSON.stringify({ policies: { folder1: ['policy1', 'policy2'] } }),
    );

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.user).toEqual({
      user_id: '123',
      role: 'user',
      policies: { folder1: ['policy1', 'policy2'] },
    });
  });

  test('checkAuthStatus - not authenticated', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({ detail: 'Not authenticated' }),
      { status: 401 },
    );

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.user).toBe(null);
  });
  test('register success', async () => {
    // Mock the registration response
    fetchMock.mockResponseOnce(
      JSON.stringify({ message: 'User registered successfully' }),
      { status: 201 },
    );

    // Mock the login response (called after successful registration)
    fetchMock.mockResponseOnce(
      JSON.stringify({ user_id: '123', role: 'user' }),
    );

    // Mock the policies response (called after successful login)
    fetchMock.mockResponseOnce(
      JSON.stringify({ policies: { folder1: ['policy1', 'policy2'] } }),
    );

    const { result } = renderHook(() => useAuth(true));

    await act(async () => {
      await result.current.register({
        email: 'newuser@example.com',
        password: 'newpassword',
        fullName: 'Existing',
        bureauAffiliation: 'TRYG',
      });
    });

    expect(result.current.user).toEqual({
      user_id: '123',
      role: 'user',
      insurances: { folder1: ['policy1', 'policy2'] },
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://localhost:3000/users/',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          email: 'newuser@example.com',
          password: 'newpassword',
          fullName: 'Existing',
          bureauAffiliation: 'TRYG',
        }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://localhost:3000/token',
      expect.any(Object),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      'http://localhost:3000/policies/policies',
      expect.any(Object),
    );
  });

  test('register failure', async () => {
    // Mock the failed registration response
    fetchMock.mockResponseOnce(
      JSON.stringify({ detail: 'Email already exists' }),
      { status: 400 },
    );

    const { result } = renderHook(() => useAuth(true));

    await expect(async () => {
      await act(async () => {
        await result.current.register({
          email: 'existinguser@example.com',
          password: 'password',
          fullName: 'Existing',
          bureauAffiliation: 'TRYG',
        });
      });
    }).rejects.toThrow('Email already exists');

    expect(result.current.user).toBe(null);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/users/',
      expect.any(Object),
    );
  });
  test('comparePolicies success', async () => {
    // Mock the compare policies response
    fetchMock.mockResponseOnce(JSON.stringify({ answer: 'Comparison result' }));

    const { result } = renderHook(() => useAuth(true));

    let comparisonResult;
    await act(async () => {
      comparisonResult = await result.current.comparePolicies(
        'policy1',
        'policy2',
        'What are the differences?',
      );
    });

    expect(comparisonResult).toBe('Comparison result');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/chatbot/compare-policies',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          policy1: 'policy1',
          policy2: 'policy2',
          query: 'What are the differences?',
        }),
      }),
    );
  });

  test('comparePolicies failure', async () => {
    // Mock the failed compare policies response
    fetchMock.mockResponseOnce(
      JSON.stringify({ detail: 'Comparison failed' }),
      { status: 400 },
    );

    const { result } = renderHook(() => useAuth(true));

    await expect(async () => {
      await act(async () => {
        await result.current.comparePolicies(
          'policy1',
          'policy2',
          'What are the differences?',
        );
      });
    }).rejects.toThrow(/Error comparing policies:/);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('askQuestion success', async () => {
    // Mock the ask question response
    fetchMock.mockResponseOnce(JSON.stringify({ answer: 'Question answer' }));

    const { result } = renderHook(() => useAuth(true));

    let questionResult;
    await act(async () => {
      questionResult = await result.current.askQuestion(
        'What is the meaning of life?',
      );
    });

    expect(questionResult).toBe('Question answer');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/chatbot/question',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ question: 'What is the meaning of life?' }),
      }),
    );
  });

  test('askQuestion failure', async () => {
    // Mock the failed ask question response
    fetchMock.mockResponseOnce(
      JSON.stringify({ detail: 'Question answering failed' }),
      { status: 400 },
    );

    const { result } = renderHook(() => useAuth(true));

    await expect(async () => {
      await act(async () => {
        await result.current.askQuestion('What is the meaning of life?');
      });
    }).rejects.toThrow(/Error asking question:/);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('fetchUserData success', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      fullName: 'Test User',
      role: 'user',
    };

    fetchMock.mockResponseOnce(JSON.stringify(mockUser));

    const { result } = renderHook(() => useAuth(true));

    let userData;
    await act(async () => {
      userData = await result.current.fetchUserData('123');
    });

    expect(userData).toEqual(mockUser);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/users/123',
      expect.objectContaining({
        method: 'GET',
        credentials: 'include',
      }),
    );
  });

  test('fetchUserData failure', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ detail: 'User not found' }), {
      status: 404,
    });

    const { result } = renderHook(() => useAuth(true));

    await expect(async () => {
      await act(async () => {
        await result.current.fetchUserData('nonexistent');
      });
    }).rejects.toThrow('Failed to fetch user data');

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('updateUser success', async () => {
    const updatedUser = {
      id: '123',
      email: 'updated@example.com',
      fullName: 'Updated User',
      role: 'admin',
    };

    fetchMock.mockResponseOnce(JSON.stringify(updatedUser));

    const { result } = renderHook(() => useAuth(true));

    let resultUser;
    await act(async () => {
      resultUser = await result.current.updateUser('123', {
        email: 'updated@example.com',
        role: 'admin',
      });
    });

    expect(resultUser).toEqual(updatedUser);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/users/123',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ email: 'updated@example.com', role: 'admin' }),
      }),
    );
  });

  test('updateUser failure', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ detail: 'Update failed' }), {
      status: 400,
    });

    const { result } = renderHook(() => useAuth(true));

    await expect(async () => {
      await act(async () => {
        await result.current.updateUser('123', {
          email: 'invalid@example.com',
        });
      });
    }).rejects.toThrow('Failed to update user');

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('fetchUsers success', async () => {
    const mockUsers = [
      {
        _id: '1',
        email: 'user1@example.com',
        fullName: 'User One',
        role: 'user',
      },
      {
        _id: '2',
        email: 'user2@example.com',
        fullName: 'User Two',
        role: 'admin',
      },
    ];

    fetchMock.mockResponseOnce(JSON.stringify(mockUsers));

    const { result } = renderHook(() => useAuth(true));

    let users;
    await act(async () => {
      users = await result.current.fetchUsers();
    });

    expect(users).toEqual([
      {
        id: '1',
        email: 'user1@example.com',
        fullName: 'User One',
        role: 'user',
      },
      {
        id: '2',
        email: 'user2@example.com',
        fullName: 'User Two',
        role: 'admin',
      },
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/users/',
      expect.objectContaining({
        credentials: 'include',
      }),
    );
  });

  test('fetchUsers failure', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ detail: 'Fetch failed' }), {
      status: 400,
    });

    const { result } = renderHook(() => useAuth(true));

    await expect(async () => {
      await act(async () => {
        await result.current.fetchUsers();
      });
    }).rejects.toThrow('Failed to fetch users');

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  test('deleteUser success', async () => {
    fetchMock.mockResponseOnce('', { status: 204 });

    const { result } = renderHook(() => useAuth(true));

    await act(async () => {
      await result.current.deleteUser('123');
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/users/123',
      expect.objectContaining({
        method: 'DELETE',
        credentials: 'include',
      }),
    );
  });

  test('deleteUser failure', async () => {
    fetchMock.mockResponseOnce('', { status: 400 });

    const { result } = renderHook(() => useAuth(true));

    await expect(async () => {
      await act(async () => {
        await result.current.deleteUser('123');
      });
    }).rejects.toThrow('Failed to delete user');

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('uploadPolicy success', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({ message: 'Policy uploaded successfully' }),
    );

    const { result } = renderHook(() => useAuth(true));

    const file = new File(['dummy content'], 'test.pdf', {
      type: 'application/pdf',
    });
    let uploadResult;

    await act(async () => {
      uploadResult = await result.current.uploadPolicy(
        file,
        'Test Policy',
        'Test Insurance',
      );
    });

    expect(uploadResult).toEqual({
      success: true,
      message: 'Policy uploaded successfully',
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/policies/upload-policy',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
      }),
    );
  });

  test('uploadPolicy failure', async () => {
    fetchMock.mockResponseOnce('', { status: 400 });

    const { result } = renderHook(() => useAuth(true));

    const file = new File(['dummy content'], 'test.pdf', {
      type: 'application/pdf',
    });
    let uploadResult;

    await act(async () => {
      uploadResult = await result.current.uploadPolicy(
        file,
        'Test Policy',
        'Test Insurance',
      );
    });

    expect(uploadResult).toEqual({
      success: false,
      message: 'An error occurred while uploading the Policy',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('deletePolicy success', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({ message: 'Policy deleted successfully' }),
    );

    const { result } = renderHook(() => useAuth(true));

    let deleteResult;

    await act(async () => {
      deleteResult = await result.current.deletePolicy(
        'Test Insurance',
        'test.pdf',
      );
    });

    expect(deleteResult).toEqual({
      success: true,
      message: 'Policy deleted successfully',
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/policies/delete-policy/Test Insurance/test.pdf',
      expect.objectContaining({
        method: 'DELETE',
        credentials: 'include',
      }),
    );
  });

  test('deletePolicy failure', async () => {
    fetchMock.mockResponseOnce('', { status: 400 });

    const { result } = renderHook(() => useAuth(true));

    let deleteResult;

    await act(async () => {
      deleteResult = await result.current.deletePolicy(
        'Test Insurance',
        'test.pdf',
      );
    });

    expect(deleteResult).toEqual({
      success: false,
      message: 'An error occurred while deleting the Policy',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('addCompany success', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({ message: 'Insurance company added successfully' }),
    );

    const { result } = renderHook(() => useAuth(true));

    let addResult;

    await act(async () => {
      addResult = await result.current.addCompany('New Insurance Co');
    });

    expect(addResult).toEqual({
      success: true,
      message: 'Insurance company added successfully',
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/insurance/insurance-companies',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'New Insurance Co' }),
        credentials: 'include',
      }),
    );
  });

  test('addCompany failure', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({ detail: 'Company already exists' }),
      { status: 400 },
    );

    const { result } = renderHook(() => useAuth(true));

    let addResult;

    await act(async () => {
      addResult = await result.current.addCompany('Existing Insurance Co');
    });

    expect(addResult).toEqual({
      success: false,
      message: 'Company already exists',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('deleteCompany success', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({ message: 'Insurance company deleted successfully' }),
    );

    const { result } = renderHook(() => useAuth(true));

    let deleteResult;

    await act(async () => {
      deleteResult = await result.current.deleteCompany('Old Insurance Co');
    });

    expect(deleteResult).toEqual({
      success: true,
      message: 'Insurance company deleted successfully',
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/insurance/insurance-companies/Old Insurance Co',
      expect.objectContaining({
        method: 'DELETE',
        credentials: 'include',
      }),
    );
  });

  test('deleteCompany failure', async () => {
    fetchMock.mockResponseOnce('', { status: 400 });

    const { result } = renderHook(() => useAuth(true));

    let deleteResult;

    await act(async () => {
      deleteResult = await result.current.deleteCompany(
        'Nonexistent Insurance Co',
      );
    });

    expect(deleteResult).toEqual({
      success: false,
      message: 'An error occurred while deleting the insurance company',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
