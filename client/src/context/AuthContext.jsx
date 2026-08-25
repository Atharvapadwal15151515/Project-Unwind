import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  getCurrentUser,
  loginUser,
  logoutAllDevices,
  logoutUser,
  refreshSession,
  registerUser
} from "../services/authService";

import {
  clearAccessToken,
  hasUsableAccessToken
} from "../services/api";

import {
  getDeviceInformation
} from "../utils/deviceInfo";

const AuthContext =
  createContext(null);

/*
  React StrictMode mounts development
  components twice. Both mounts share
  this authentication request.
*/
let initialAuthenticationPromise =
  null;

async function requestCurrentUser() {
  if (!hasUsableAccessToken()) {
    await refreshSession();
  }

  return getCurrentUser();
}

function initializeAuthenticationOnce() {
  if (!initialAuthenticationPromise) {
    initialAuthenticationPromise =
      requestCurrentUser();
  }

  return initialAuthenticationPromise;
}

export function AuthProvider({
  children
}) {
  const [user, setUser] =
    useState(null);

  const [
    initializing,
    setInitializing
  ] = useState(true);

  const loadCurrentUser =
    useCallback(async () => {
      try {
        const currentUser =
          await requestCurrentUser();

        setUser(currentUser);

        return currentUser;
      } catch (error) {
        clearAccessToken();
        setUser(null);

        throw error;
      }
    }, []);

  useEffect(() => {
    let active = true;

    const initializeAuthentication =
      async () => {
        try {
          const currentUser =
            await initializeAuthenticationOnce();

          if (active) {
            setUser(currentUser);
          }
        } catch {
          if (active) {
            clearAccessToken();
            setUser(null);
          }
        } finally {
          if (active) {
            setInitializing(false);
          }
        }
      };

    initializeAuthentication();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleSessionExpired =
      () => {
        setUser(null);
        clearAccessToken();
      };

    window.addEventListener(
      "unwind:session-expired",
      handleSessionExpired
    );

    return () => {
      window.removeEventListener(
        "unwind:session-expired",
        handleSessionExpired
      );
    };
  }, []);

  const login =
    useCallback(
      async ({
        identifier,
        password,
        rememberMe = false
      }) => {
        const deviceInformation =
          getDeviceInformation();

        const response =
          await loginUser({
            identifier,
            password,
            rememberMe,
            ...deviceInformation
          });

        const completeUser =
          await getCurrentUser();

        setUser(completeUser);

        return {
          ...response,
          data: {
            ...response.data,
            user: completeUser
          }
        };
      },
      []
    );

  const register =
    useCallback(
      async (payload) =>
        registerUser(payload),
      []
    );

  const logout =
    useCallback(async () => {
      try {
        await logoutUser();
      } finally {
        setUser(null);
      }
    }, []);

  const logoutEverywhere =
    useCallback(async () => {
      try {
        await logoutAllDevices();
      } finally {
        setUser(null);
      }
    }, []);

  const value =
    useMemo(
      () => ({
        user,
        initializing,

        isAuthenticated:
          Boolean(user),

        login,
        register,
        logout,
        logoutEverywhere,

        refreshUser:
          loadCurrentUser,

        setUser
      }),
      [
        user,
        initializing,
        login,
        register,
        logout,
        logoutEverywhere,
        loadCurrentUser
      ]
    );

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}