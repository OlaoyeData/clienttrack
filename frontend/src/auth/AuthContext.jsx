import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, getToken, setToken, clearToken, setUnauthorizedHandler } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [isAuthed, setIsAuthed] = useState(!!getToken());

  useEffect(() => {
    setReady(true);
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await api.login({ email, password });
    setToken(data.access_token);
    setIsAuthed(true);
  }, []);

  const register = useCallback(async (fullName, email, password) => {
    await api.register({ full_name: fullName, email, password });
    await login(email, password);
  }, [login]);

  const logout = useCallback(() => {
    clearToken();
    setIsAuthed(false);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearToken();
      setIsAuthed(false);
    });
  }, []);

  return (
    <AuthContext.Provider value={{ ready, isAuthed, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
