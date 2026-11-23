import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { api, session, setUnauthorizedHandler } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(session.user);

  const logout = useCallback(() => { session.clear(); setUser(null); }, []);
  useEffect(() => { setUnauthorizedHandler(logout); }, [logout]);

  const login = useCallback(async (email, password, role) => {
    const data = await api.post('auth/login', { email, password, role });
    session.save(data.token, data.user);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const data = await api.post('auth/register', { name, email, password });
    session.save(data.token, data.user);
    setUser(data.user);
    return data.user;
  }, []);

  const value = useMemo(() => ({ user, login, register, logout }), [user, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

/** Só deixa passar quem tem o perfil esperado; os demais vão para o login certo. */
export function RequireRole({ role, children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to={role === 'teacher' ? '/login/professor' : '/login/aluno'} state={{ from: location.pathname }} replace />;
  if (user.role !== role) return <Navigate to={user.role === 'teacher' ? '/professor/dashboard' : '/aluno/inicio'} replace />;
  return children;
}
