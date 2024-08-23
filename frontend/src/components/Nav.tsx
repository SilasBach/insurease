import { NavLink, useNavigate } from 'react-router-dom';
import { UserState } from '../interfaces/interfaces';

interface NavProps {
  user: UserState | null;
  logout: () => Promise<void>;
}

function Nav({ user, logout }: NavProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="fixed left-1 right-1 top-1 rounded-md border border-slate-600 bg-slate-800 bg-opacity-30 p-4 backdrop-blur-sm">
      <div className="container mx-auto flex items-center justify-between">
        <div className="text-xl font-bold text-white">InsurEase</div>
        <div className="flex items-center">
          {user && (
            <>
              {user.role === 'admin' ? (
                <>
                  <NavLink
                    to="/admin_users"
                    className="mr-4 text-white hover:text-blue-300"
                  >
                    Users
                  </NavLink>
                  <NavLink
                    to="/admin_policies"
                    className="mr-4 text-white hover:text-blue-300"
                  >
                    Policies
                  </NavLink>
                </>
              ) : (
                <>
                  <NavLink
                    to="/update-user"
                    className="mr-4 text-white hover:text-blue-300"
                  >
                    Update Profile
                  </NavLink>
                  <NavLink
                    to="/gpt"
                    className="mr-4 text-white hover:text-blue-300"
                  >
                    GPT
                  </NavLink>
                </>
              )}
              <button
                onClick={handleLogout}
                className="text-white hover:text-blue-300"
              >
                Log out
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Nav;
