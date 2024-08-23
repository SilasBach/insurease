import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { ErrorMessage, SuccessMessage } from '../utils/msg';

const AdminPolicies: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [selectedInsurance, setSelectedInsurance] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState<string>('');
  const [isAddCompanyModalOpen, setIsAddCompanyModalOpen] = useState(false);
  const { user, uploadPolicy, deletePolicy, addCompany, deleteCompany } =
    useAuth();
  const insuranceCompanies = user?.policies ? Object.keys(user.policies) : [];

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleFileNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFileName(event.target.value);
  };

  const handleInsuranceChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setSelectedInsurance(event.target.value);
    setError(null);
    setSuccessMessage(null);
  };

  const handleUploadPolicy = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!file || !fileName) {
      setError('Please select a file and provide a file name');
      return;
    }
    if (!selectedInsurance) {
      setError('Please select an insurance company');
      return;
    }

    const result = await uploadPolicy(file, fileName, selectedInsurance);
    if (result.success) {
      setSuccessMessage(result.message);
      setFile(null);
      setFileName('');
      setIsModalOpen(false);
    } else {
      setError(result.message);
    }
  };

  const handleDeletePolicy = async (filename: string) => {
    setError(null);
    setSuccessMessage(null);

    if (!selectedInsurance) {
      setError('Please select an insurance company');
      return;
    }
    if (window.confirm('Are you sure you want to delete this Policy?')) {
      const result = await deletePolicy(selectedInsurance, filename);
      if (result.success) {
        setSuccessMessage(result.message);
      } else {
        setError(result.message);
      }
    }
  };

  const handleAddCompany = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!newCompanyName) {
      setError('Please enter a company name');
      return;
    }

    const result = await addCompany(newCompanyName);
    if (result.success) {
      setSuccessMessage(result.message);
      setNewCompanyName('');
      setIsAddCompanyModalOpen(false);
    } else {
      setError(result.message);
    }
  };

  const handleDeleteCompany = async () => {
    setError(null);
    setSuccessMessage(null);

    if (!selectedInsurance) {
      setError('Please select an insurance company to delete');
      return;
    }

    if (
      window.confirm(
        `Are you sure you want to delete the insurance company "${selectedInsurance}" and all its policies?`,
      )
    ) {
      const result = await deleteCompany(selectedInsurance);
      if (result.success) {
        setSuccessMessage(result.message);
        setSelectedInsurance('');
      } else {
        setError(result.message);
      }
    }
  };

  useEffect(() => {
    if (error || successMessage) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccessMessage(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [error, successMessage]);

  return (
    <div className="flex h-5/6 w-2/3 flex-col rounded-md border border-slate-600 bg-slate-800 bg-opacity-30 p-8 shadow-lg backdrop-blur-lg backdrop-filter">
      <div className="flex-grow overflow-hidden">
        <h1 className="mb-6 text-center text-3xl font-bold text-white">
          Insurance Companys & Policies
        </h1>

        {user ? (
          <>
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center">
                <select
                  value={selectedInsurance}
                  onChange={handleInsuranceChange}
                  className="m-1 rounded border-2 border-gray-400 bg-gray-500 p-2 px-4 py-2 text-white hover:bg-gray-800"
                >
                  <option value="">Select Insurance Company</option>
                  {insuranceCompanies.map((company) => (
                    <option key={company} value={company}>
                      {company}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setIsAddCompanyModalOpen(true)}
                  className="m-1 rounded border-2 border-gray-400 bg-gray-500 p-2 px-4 py-2 text-white hover:bg-gray-800"
                >
                  Add New Insurance Company
                </button>
              </div>
              {selectedInsurance && (
                <div className="flex items-center">
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="m-1 rounded border-2 border-gray-400 bg-gray-500 p-2 px-4 py-2 text-white hover:bg-gray-800"
                  >
                    Add New Policy
                  </button>
                  <button
                    onClick={handleDeleteCompany}
                    className="m-1 rounded border-2 border-gray-400 bg-red-600 p-2 px-4 py-2 text-white hover:bg-red-700"
                  >
                    Delete Company
                  </button>
                </div>
              )}
            </div>
            {!selectedInsurance ? (
              <p className="text-white">
                Please select an insurance company to view policies.
              </p>
            ) : !user.policies ||
              !user.policies[selectedInsurance] ||
              user.policies[selectedInsurance].length === 0 ? (
              <p className="text-white">
                No policies found for the selected insurance company.
              </p>
            ) : (
              <div className="h-5/6 overflow-auto rounded-md border">
                <table className="min-w-full text-white">
                  <thead className="sticky top-0 bg-slate-700">
                    <tr>
                      <th className="px-4 py-2">Policies</th>
                      <th className="px-4 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {user.policies[selectedInsurance].map((filename) => (
                      <tr key={filename}>
                        <td className="border px-4 py-2">{filename}</td>
                        <td className="border py-2 pl-4">
                          <button
                            onClick={() => handleDeletePolicy(filename)}
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
          </>
        ) : (
          <p className="text-white">Loading policies...</p>
        )}
      </div>
      {error && <ErrorMessage error={error} />}
      {successMessage && <SuccessMessage message={successMessage} />}
      {/* Modal for adding new policy */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden outline-none focus:outline-none">
          <div className="relative mx-auto my-6 w-auto max-w-3xl">
            <div className="relative flex w-full flex-col rounded-lg border-0 border-gray-400 bg-gray-500 shadow-lg outline-none focus:outline-none">
              <div className="flex items-start justify-between rounded-t border-b border-solid border-slate-200 p-5">
                <h3 className="text-3xl font-semibold">Add Policy</h3>
                <button
                  className="float-right ml-auto border-0 bg-transparent p-1 text-3xl font-semibold leading-none text-black opacity-5 outline-none focus:outline-none"
                  onClick={() => setIsModalOpen(false)}
                >
                  <span className="block h-6 w-6 bg-transparent text-2xl text-black opacity-5 outline-none focus:outline-none">
                    ×
                  </span>
                </button>
              </div>
              <form
                onSubmit={handleUploadPolicy}
                className="relative flex-auto p-6"
              >
                <select
                  value={selectedInsurance}
                  onChange={handleInsuranceChange}
                  className="mb-4 w-full rounded border border-gray-300 p-2 text-black"
                >
                  <option value="">Select Insurance Company</option>
                  {insuranceCompanies.map((company) => (
                    <option key={company} value={company}>
                      {company}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={fileName}
                  onChange={handleFileNameChange}
                  placeholder="Enter policy name"
                  className="mb-4 w-full rounded border border-gray-300 p-2 text-black"
                />
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf"
                  className="mb-4 w-full rounded border border-gray-300 p-2 text-white"
                />
                <div className="flex items-center justify-end rounded-b border-t border-solid border-slate-200 pt-6">
                  <button
                    className="background-transparent mb-1 mr-1 px-6 py-2 text-sm font-bold uppercase text-red-500 outline-none transition-all duration-150 ease-linear focus:outline-none"
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Close
                  </button>
                  <button
                    className="mb-1 mr-1 rounded bg-emerald-500 px-6 py-3 text-sm font-bold uppercase text-white shadow outline-none transition-all duration-150 ease-linear hover:shadow-lg focus:outline-none active:bg-emerald-600"
                    type="submit"
                  >
                    Add Policy
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal for adding new insurance company */}
      {isAddCompanyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden outline-none focus:outline-none">
          <div className="relative mx-auto my-6 w-auto max-w-3xl">
            <div className="relative flex w-full flex-col rounded-lg border-0 border-gray-400 bg-gray-500 shadow-lg outline-none focus:outline-none">
              <div className="flex items-start justify-between rounded-t border-b border-solid border-slate-200 p-5">
                <h3 className="text-3xl font-semibold">
                  Add New Insurance Company
                </h3>
                <button
                  className="float-right ml-auto border-0 bg-transparent p-1 text-3xl font-semibold leading-none text-black opacity-5 outline-none focus:outline-none"
                  onClick={() => setIsAddCompanyModalOpen(false)}
                >
                  <span className="block h-6 w-6 bg-transparent text-2xl text-black opacity-5 outline-none focus:outline-none">
                    ×
                  </span>
                </button>
              </div>
              <form
                onSubmit={handleAddCompany}
                className="relative flex-auto p-6"
              >
                <input
                  type="text"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  placeholder="Enter company name"
                  className="mb-4 w-full rounded border border-gray-300 p-2 text-black"
                />
                <div className="flex items-center justify-end rounded-b border-t border-solid border-slate-200 pt-6">
                  <button
                    className="background-transparent mb-1 mr-1 px-6 py-2 text-sm font-bold uppercase text-red-500 outline-none transition-all duration-150 ease-linear focus:outline-none"
                    type="button"
                    onClick={() => setIsAddCompanyModalOpen(false)}
                  >
                    Close
                  </button>
                  <button
                    className="mb-1 mr-1 rounded bg-emerald-500 px-6 py-3 text-sm font-bold uppercase text-white shadow outline-none transition-all duration-150 ease-linear hover:shadow-lg focus:outline-none active:bg-emerald-600"
                    type="submit"
                  >
                    Add Company
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPolicies;
