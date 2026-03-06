import { createContext, useCallback, useContext, useEffect, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authService from '@/services/authService';
import {
  clearAuthStorage,
  getAccessToken,
  getStoredUser,
  setAccessToken,
  setRefreshToken,
  setStoredUser,
} from '@/utils/storage';

// ── State shape ────────────────────────────────────────────────────────────
const initialState = {
  user: getStoredUser(),
  isAuthenticated: Boolean(getAccessToken()),
  isLoading: false,
  error: null,
};

// ── Reducer ────────────────────────────────────────────────────────────────
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return { ...state, isLoading: true, error: null };
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return { ...state, isLoading: false, isAuthenticated: true, user: action.payload, error: null };
    case AUTH_ACTIONS.LOGIN_FAILURE:
      return { ...state, isLoading: false, error: action.payload };
    case AUTH_ACTIONS.LOGOUT:
      return { ...initialState, user: null, isAuthenticated: false };
    case AUTH_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };
    default:
      return state;
  }
};

// ── Context ────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const navigate = useNavigate();

  // Listen for global 401 events emitted by the Axios interceptor
  useEffect(() => {
    const handleUnauthorized = () => {
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      navigate('/login', { replace: true });
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [navigate]);

  const login = useCallback(
    async (credentials) => {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });
      try {
        const response = await authService.login(credentials);
        const { accessToken, refreshToken, user } = response.data;

        setAccessToken(accessToken);
        setRefreshToken(refreshToken);
        setStoredUser(user);

        dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: user });
        navigate('/dashboard', { replace: true });
      } catch (err) {
        const message = err.response?.data?.message || 'Login failed. Please try again.';
        dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: message });
      }
    },
    [navigate]
  );

  const logout = useCallback(() => {
    clearAuthStorage();
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
    navigate('/login', { replace: true });
  }, [navigate]);

  const clearError = useCallback(() => dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR }), []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};

// ── Hook ───────────────────────────────────────────────────────────────────
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};

export default AuthContext;
