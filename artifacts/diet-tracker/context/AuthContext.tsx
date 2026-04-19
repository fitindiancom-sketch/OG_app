import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface User {
  id: string;
  name: string;
  assignedPlanId: string | null;
  planStartDate: string | null;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (userId: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
});

export const DEMO_USERS: { id: string; name: string; password: string; assignedPlanId: string; planStartDate: string }[] = [
  {
    id: "user001",
    name: "Sarah Johnson",
    password: "diet123",
    assignedPlanId: "plan001",
    planStartDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "user002",
    name: "Mike Chen",
    password: "healthy2024",
    assignedPlanId: "plan001",
    planStartDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "admin001",
    name: "Admin",
    password: "admin123",
    assignedPlanId: "plan001",
    planStartDate: new Date().toISOString(),
  },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const storedToken = await AsyncStorage.getItem("auth_token");
        const storedUser = await AsyncStorage.getItem("auth_user");
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (userId: string, password: string) => {
    const found = DEMO_USERS.find(
      (u) => u.id === userId.trim() && u.password === password
    );
    if (!found) {
      throw new Error("Invalid user ID or password");
    }

    const mockToken = `jwt_${found.id}_${Date.now()}`;
    const userData: User = {
      id: found.id,
      name: found.name,
      assignedPlanId: found.assignedPlanId,
      planStartDate: found.planStartDate,
    };

    await AsyncStorage.setItem("auth_token", mockToken);
    await AsyncStorage.setItem("auth_user", JSON.stringify(userData));
    setToken(mockToken);
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem("auth_token");
    await AsyncStorage.removeItem("auth_user");
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
