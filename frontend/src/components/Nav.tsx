import { NavLink, useNavigate } from 'react-router-dom';
import { UserState } from '../interfaces/interfaces';


function Nav({ user, logout }: NavProps) {
  const navigate = useNavigate();

  return (
    <nav className="fixed left-1 right-1 top-1 rounded-md border border-slate-600 bg-slate-800 bg-opacity-30 p-4 backdrop-blur-sm">
      <div className="container mx-auto flex items-center justify-between">
        <div className="text-xl font-bold text-white">InsurEase</div>
        <div className="flex items-center">
                <>
                  <NavLink
                    to="/update-user"
                    className="mr-4 text-white hover:text-blue-300"
                  >
                    Update Profile
                  </NavLink>
                </>
        </div>
      </div>
    </nav>
  );
}

export default Nav;
