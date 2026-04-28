import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { authApi, getAuthToken, setAuthToken, type AuthClient } from "@/lib/api";

export interface User {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  clientCode: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    email: string;
    password: string;
    name: string;
    phone: string;
    city?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refresh: async () => {},
});

const USER_KEY = "auth_user";

function toUser(c: AuthClient): User {
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    clientCode: c.client_code,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const storedToken = await getAuthToken();
        const storedUserRaw = await AsyncStorage.getItem(USER_KEY);
        if (storedToken && storedUserRaw) {
          setToken(storedToken);
          setUser(JSON.parse(storedUserRaw));
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const persist = useCallback(async (t: string, u: User) => {
    await setAuthToken(t);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(u));
    setToken(t);
    setUser(u);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await authApi.login({
        email: email.trim().toLowerCase(),
        password,
      });
      await persist(res.token, toUser(res.client));
    },
    [persist],
  );

  const register = useCallback(
    async (input: {
      email: string;
      password: string;
      name: string;
      phone: string;
      city?: string;
    }) => {
      const res = await authApi.register({
        ...input,
        email: input.email.trim().toLowerCase(),
      });
      await persist(res.token, toUser(res.client));
    },
    [persist],
  );

  const logout = useCallback(async () => {
    await setAuthToken(null);
    await AsyncStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const me = await authApi.me();
      const u: User = {
        id: me.id,
        name: me.name,
        email: me.email,
        phone: me.phone,
        clientCode: me.client_code,
      };
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(u));
      setUser(u);
    } catch {
      // token invalid → logout
      await logout();
    }
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, register, logout, refresh }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
