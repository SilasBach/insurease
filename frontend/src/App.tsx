import {
  BrowserRouter as Router, // Importing Router components from 'react-router-dom' for navigation
  Route,
  Routes,
  Navigate,
} from 'react-router-dom';
import Login from './components/Login'; // Importing Login component
import Register from './components/Register'; // Importing Register component
import Gpt from './components/gpt'; // Importing Gpt component for chatbot interface
import Nav from './components/Nav'; // Importing Nav component for navigation bar
import UpdateUser from './components/UpdateUser'; // Importing UpdateUser component for updating user details
import AdminUsers from './components/admin_users'; // Importing Admin component for admin dashboard
import { useAuth } from './hooks/useAuth'; // Importing useAuth hook for user authentication
import AdminPolicies from './components/admin_policies';

function App() {
  const { user, login, logout, loading, register } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <div
        className="flex w-full bg-cover text-white"
        style={{ backgroundImage: 'url(../src/assets/background1.png)' }}
      >
        <Nav user={user} logout={logout} />
      </div>
      <div
        className="flex h-[100vh] items-center justify-center overflow-auto bg-cover pt-16 text-white"
        style={{
          backgroundImage: 'url(../src/assets/background3.png)',
          backgroundPosition: 'center',
        }}
      >
        <Routes>
          <Route
            path="/login"
            element={!user ? <Login onLogin={login} /> : <Navigate to="/gpt" />}
          />
          <Route
            path="/register"
            element={
              !user ? (
                <Register onRegistration={register} />
              ) : (
                <Navigate to="/gpt" />
              )
            }
          />
          <Route
            path="/gpt"
            element={user ? <Gpt /> : <Navigate to="/login" />}
          />
          <Route
            path="/update-user"
            element={
              user ? (
                <UpdateUser userId={user.user_id} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/admin_users"
            element={
              user && user.role === 'admin' ? (
                <AdminUsers />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/"
            element={
              user ? (
                user.role === 'admin' ? (
                  <Navigate to="/admin_users" />
                ) : (
                  <Navigate to="/gpt" />
                )
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/admin_policies"
            element={
              user && user.role === 'admin' ? (
                <AdminPolicies />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
