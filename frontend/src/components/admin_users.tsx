import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../interfaces/interfaces';
import { useAuth } from '../hooks/useAuth';
import { ErrorMessage, SuccessMessage } from '../utils/msg';

type Policy = string;
type Company = string;
type Policies = Record<Company, Policy[]>;

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const { updateUser, fetchUsers, deleteUser, user } = useAuth();

  // Get policies from user object, defaulting to an empty object if undefined
  const policies: Policies = user?.policies || {};

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedUsers = await fetchUsers();
      setUsers(fetchedUsers);
    } catch (error) {
      setError('An error occurred while fetching users');
      console.error('An error occurred while fetching users:', error);
      if (error instanceof Error && error.message === 'Failed to fetch users') {
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleUpdateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingUser) return;

    try {
      await updateUser(editingUser.id, {
        fullName: editingUser.fullName,
        bureauAffiliation: editingUser.bureauAffiliation,
        role: editingUser.role,
        accountStatus: editingUser.accountStatus,
      });

      setSuccessMessage('User updated successfully');
      loadUsers(); // Refresh the user list
      handleCloseModal();
    } catch (error) {
      console.error('An error occurred during update:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred');
      }
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(userId);
        setSuccessMessage('User deleted successfully');
        loadUsers(); // Refresh the user list
      } catch (error) {
        console.error('An error occurred while deleting user:', error);
        setError('Failed to delete user');
      }
    }
  };

  return (
    <div className="flex h-5/6 w-2/3 flex-col rounded-md border border-slate-600 bg-slate-800  bg-opacity-30 p-8 shadow-lg backdrop-blur-lg backdrop-filter">
      <div className="flex-grow overflow-hidden">
        <h1 className="mb-6 text-center text-3xl font-bold text-white">
          Users
        </h1>
        {isLoading ? (
          <p className="text-white">Loading users...</p>
        ) : users.length === 0 ? (
          <p className="text-white">No users found.</p>
        ) : (
          <div className="h-5/6 overflow-auto rounded-md border">
            <table className="min-w-full text-white">
              <thead className="sticky top-0 bg-slate-700">
                <tr>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Full Name</th>
                  <th className="px-4 py-2">Selected Company</th>
                  <th className="px-4 py-2">Role</th>
                  <th className="px-4 py-2">Account Status</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="border px-4 py-2">{user.email}</td>
                    <td className="border px-4 py-2">{user.fullName}</td>
                    <td className="border px-4 py-2">
                      {user.bureauAffiliation}
                    </td>
                    <td className="border px-4 py-2">{user.role}</td>
                    <td className="border px-4 py-2">{user.accountStatus}</td>
                    <td className="border py-2 pl-4">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="mr-2 rounded border-2 border-blue-400 bg-blue-700 px-4 py-2 text-white hover:bg-blue-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="rounded border-2 border-red-400 bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden outline-none focus:outline-none">
          <div className="relative mx-auto my-6 w-auto max-w-3xl">
            <div className="relative flex w-full flex-col rounded-lg border-0 border-gray-400 bg-gray-500 shadow-lg outline-none focus:outline-none">
              <div className="flex items-start justify-between rounded-t border-b border-solid border-slate-200 p-5">
                <h3 className="text-3xl font-semibold text-white">Edit User</h3>
                <button
                  className="float-right ml-auto border-0 bg-transparent p-1 text-3xl font-semibold leading-none text-black opacity-5 outline-none focus:outline-none"
                  onClick={handleCloseModal}
                >
                  <span className="block h-6 w-6 bg-transparent text-2xl text-black opacity-5 outline-none focus:outline-none">
                    ×
                  </span>
                </button>
              </div>
              <form onSubmit={handleUpdateUser}>
                <div className="relative flex-auto p-6">
                  <div className="mb-4">
                    <label
                      className="mb-2 block text-sm font-bold text-white"
                      htmlFor="fullName"
                    >
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      value={editingUser.fullName}
                      onChange={(e) =>
                        setEditingUser({
                          ...editingUser,
                          fullName: e.target.value,
                        })
                      }
                      className="w-full rounded border px-3 py-2 text-black"
                    />
                  </div>
                  <div className="mb-4">
                    <label
                      className="mb-2 block text-sm font-bold text-white"
                      htmlFor="bureauAffiliation"
                    >
                      Selected Company
                    </label>
                    <select
                      id="bureauAffiliation"
                      value={editingUser.bureauAffiliation}
                      onChange={(e) =>
                        setEditingUser({
                          ...editingUser,
                          bureauAffiliation: e.target.value,
                        })
                      }
                      className="w-full rounded border px-3 py-2 text-black"
                    >
                      <option value="" disabled>
                        Select Company
                      </option>
                      {Object.keys(policies).map((company) => (
                        <option key={company} value={company}>
                          {company}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-4">
                    <label
                      className="mb-2 block text-sm font-bold text-white"
                      htmlFor="role"
                    >
                      Role
                    </label>
                    <select
                      id="role"
                      value={editingUser.role}
                      onChange={(e) =>
                        setEditingUser({
                          ...editingUser,
                          role: e.target.value,
                        })
                      }
                      className="w-full rounded border px-3 py-2 text-black"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="mb-4">
                    <label
                      className="mb-2 block text-sm font-bold text-white"
                      htmlFor="accountStatus"
                    >
                      Account Status
                    </label>
                    <select
                      id="accountStatus"
                      value={editingUser.accountStatus}
                      onChange={(e) =>
                        setEditingUser({
                          ...editingUser,
                          accountStatus: e.target.value,
                        })
                      }
                      className="w-full rounded border px-3 py-2 text-black"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-end rounded-b border-t border-solid border-slate-200 p-6">
                  <button
                    className="background-transparent mb-1 mr-1 px-6 py-2 text-sm font-bold uppercase text-red-500 outline-none transition-all duration-150 ease-linear focus:outline-none"
                    type="button"
                    onClick={handleCloseModal}
                  >
                    Close
                  </button>
                  <button
                    className="mb-1 mr-1 rounded bg-emerald-500 px-6 py-3 text-sm font-bold uppercase text-white shadow outline-none transition-all duration-150 ease-linear hover:shadow-lg focus:outline-none active:bg-emerald-600"
                    type="submit"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {error && <ErrorMessage error={error} />}
      {successMessage && <SuccessMessage message={successMessage} />}
    </div>
  );
};

export default AdminUsers;
