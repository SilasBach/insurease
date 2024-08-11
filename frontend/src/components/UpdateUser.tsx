import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BUREAU_AFFILIATIONS, User } from '../interfaces/interfaces';
import { useAuth } from '../hooks/useAuth';
import { ErrorMessage, SuccessMessage } from '../utils/msg';

interface UpdateUserProps {
  userId: string;
}

const UpdateUser: React.FC<UpdateUserProps> = ({ userId }) => {
  const [userData, setUserData] = useState<User | null>(null);
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [bureauAffiliation, setBureauAffiliation] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { fetchUserData, updateUser } = useAuth();

  const loadUserData = useCallback(async () => {
    try {
      const data = await fetchUserData(userId);
      setUserData(data);
      setFullName(data.fullName || '');
      setBureauAffiliation(data.bureauAffiliation || '');
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      if (error instanceof Error && error.message.includes('401')) {
        navigate('/login');
      }
    }
  }, [userId, fetchUserData, navigate]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage('');

    try {
      const updateData: Partial<User> & { password?: string } = {
        fullName: fullName || undefined,
        bureauAffiliation: bureauAffiliation || undefined,
      };

      if (password) {
        updateData.password = password;
      }

      const updatedUser = await updateUser(userId, updateData);
      setUserData(updatedUser);
      setSuccessMessage('User updated successfully!');
      setPassword(''); // Clear the password field after successful update
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred');
      }
      if (error instanceof Error && error.message.includes('401')) {
        navigate('/login');
      }
    }
  };

  if (!userData) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="relative rounded-md border border-slate-600 bg-slate-800 bg-opacity-30 p-8 shadow-lg backdrop-blur-lg backdrop-filter">
        <h1 className="mb-6 text-center text-4xl font-bold">Update User</h1>
        <form onSubmit={handleSubmit}>
          <div className="relative my-4">
            <input
              type="text"
              className="peer block w-72 appearance-none border-0 border-b-2 border-gray-300 bg-transparent px-0 py-2.5 text-sm text-white focus:border-blue-600 focus:text-white focus:outline-none focus:ring-0 dark:focus:border-blue-500"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <label
              htmlFor=""
              className="top-3 -z-10 origin-[0] scale-75 transform text-sm duration-300 peer-focus:left-0 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-600 peer-focus:dark:text-blue-500"
            >
              Full Name
            </label>
          </div>
          <div className="relative my-4">
            <input
              type="password"
              className="peer block w-72 appearance-none border-0 border-b-2 border-gray-300 bg-transparent px-0 py-2.5 text-sm text-white focus:border-blue-600 focus:text-white focus:outline-none focus:ring-0 dark:focus:border-blue-500"
              placeholder="(leave blank to keep current)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <label
              htmlFor=""
              className="top-3 -z-10 origin-[0] scale-75 transform text-sm duration-300 peer-focus:left-0 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-600 peer-focus:dark:text-blue-500"
            >
              New Password
            </label>
          </div>
          <div className="relative my-4">
            <select
              className="peer block w-72 appearance-none border-0 border-b-2 border-gray-300 bg-transparent px-0 py-2.5 text-sm text-white focus:border-blue-600 focus:text-white focus:outline-none focus:ring-0 dark:focus:border-blue-500"
              value={bureauAffiliation}
              onChange={(e) => setBureauAffiliation(e.target.value)}
            >
              <option value="" disabled>
                Select Bureau Affiliation
              </option>
              {Object.values(BUREAU_AFFILIATIONS).map((bureau) => (
                <option key={bureau} value={bureau} className="text-black">
                  {bureau}
                </option>
              ))}
            </select>
            <label
              htmlFor=""
              className="top-3 -z-10 origin-[0] scale-75 transform text-sm duration-300 peer-focus:left-0 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-600 peer-focus:dark:text-blue-500"
            >
              Bureau Affiliation
            </label>
          </div>
          <button
            type="submit"
            className="mb-4 mt-6 w-full rounded bg-blue-500 py-2 text-[18px] transition-colors duration-300 hover:bg-blue-600"
          >
            Update
          </button>
        </form>
        <div className="mt-8">
          <h2 className="mb-2 text-xl font-bold">Current User Data:</h2>
          <p>Email: {userData.email}</p>
          <p>Full Name: {userData.fullName}</p>
          <p>Bureau Affiliation: {userData.bureauAffiliation}</p>
          <p>Account Status: {userData.accountStatus}</p>
        </div>
      </div>
      <div>{successMessage && <SuccessMessage message={successMessage} />}</div>
      <div>{error && <ErrorMessage error={error} />}</div>
    </div>
  );
};
export default UpdateUser;
