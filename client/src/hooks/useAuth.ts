import { useState, useEffect } from "react";
import type { AuthData } from "@/types/wallet";

export function useAuth() {
  const [authData, setAuthData] = useState<AuthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth data
    const storedAuth = localStorage.getItem('auth');
    if (storedAuth) {
      try {
        setAuthData(JSON.parse(storedAuth));
      } catch (error) {
        localStorage.removeItem('auth');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (data: AuthData) => {
    setAuthData(data);
    localStorage.setItem('auth', JSON.stringify(data));
  };

  const logout = () => {
    setAuthData(null);
    localStorage.removeItem('auth');
  };

  return {
    user: authData?.user,
    wallet: authData?.wallet,
    isLoading,
    isAuthenticated: !!authData,
    login,
    logout,
  };
}
