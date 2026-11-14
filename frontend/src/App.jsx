import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import UsersList from './pages/UsersList.jsx';
import UserForm from './pages/UserForm.jsx';

function isAuthenticated() {
  return Boolean(localStorage.getItem('token'));
}

function PrivateRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <UsersList />
          </PrivateRoute>
        }
      />
      <Route
        path="/users/new"
        element={
          <PrivateRoute>
            <UserForm />
          </PrivateRoute>
        }
      />
      <Route
        path="/users/:id/edit"
        element={
          <PrivateRoute>
            <UserForm />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}
