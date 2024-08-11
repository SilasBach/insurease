import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RegistrationData,
  BUREAU_AFFILIATIONS,
} from '../interfaces/interfaces';
import { ErrorMessage } from '../utils/msg';

interface RegisterProps {
  onRegistration: (registrationData: RegistrationData) => Promise<void>;
}

const Register: React.FC<RegisterProps> = ({ onRegistration }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [bureauAffiliation, setBureauAffiliation] = useState('');
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    try {
      await onRegistration({
        email,
        password,
        fullName,
        bureauAffiliation,
      });
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred during registration.');
      }
    }
  };

  return (
    <div>
      <div className="relative rounded-md border border-slate-600 bg-slate-800 bg-opacity-30 p-8 shadow-lg backdrop-blur-lg backdrop-filter">
        <h1 className="mb-6 text-center text-4xl font-bold">Register</h1>
        <form onSubmit={handleSubmit}>
          <div className="relative my-4">
            <input
              type="text"
              className="peer block w-72 appearance-none border-0 border-b-2 border-gray-300 bg-transparent px-0 py-2.5 text-sm text-white focus:border-blue-600 focus:text-white focus:outline-none focus:ring-0 dark:focus:border-blue-500"
              placeholder="mail@mail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <label
              htmlFor=""
              className="top-3 -z-10 origin-[0] scale-75 transform text-sm duration-300 peer-focus:left-0 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-600 peer-focus:dark:text-blue-500"
            >
              E-Mail
            </label>
          </div>
          <div className="relative my-4">
            <input
              type="password"
              className="peer block w-72 appearance-none border-0 border-b-2 border-gray-300 bg-transparent px-0 py-2.5 text-sm text-white focus:border-blue-600 focus:text-white focus:outline-none focus:ring-0 dark:focus:border-blue-500"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <label
              htmlFor=""
              className="top-3 -z-10 origin-[0] scale-75 transform text-sm duration-300 peer-focus:left-0 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-600 peer-focus:dark:text-blue-500"
            >
              Your Password
            </label>
          </div>
          <div className="relative my-4">
            <input
              type="text"
              className="peer block w-72 appearance-none border-0 border-b-2 border-gray-300 bg-transparent px-0 py-2.5 text-sm text-white focus:border-blue-600 focus:text-white focus:outline-none focus:ring-0 dark:focus:border-blue-500"
              placeholder="Jens Lars Larsen"
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
            Register
          </button>
          <button
            type="button"
            className="mb-4 w-full rounded py-2 text-[18px] transition-colors duration-300 hover:text-blue-600"
            onClick={() => navigate('/login')}
          >
            Already have an account? Login
          </button>
        </form>
      </div>
      <div>{error && <ErrorMessage error={error} />}</div>
    </div>
  );
};

export default Register;
