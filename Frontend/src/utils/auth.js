import { jwtDecode } from 'jwt-decode';
import Wrapper from './wrapper';
import { BASE_URL } from '../config/config';

class AuthService {
  static TOKEN_KEY = 'token';
  static USER_KEY = 'user';
  static REFRESH_TOKEN_KEY = 'refreshToken';

  static getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static getRefreshToken() {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static setTokens(accessToken, refreshToken) {
    localStorage.setItem(this.TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  static setUser(user) {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  static getUser() {
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  static decodeToken(token) {
    if (!token) return null;
    try {
      return jwtDecode(token);
    } catch {
      return null;
    }
  }

  static isTokenExpired(token) {
    if (!token) return true;
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) return true;
      return (decoded.exp * 1000) <= (new Date().getTime() + 60000);
    } catch {
      return true;
    }
  }

  static clearAuth() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  static persistSession() {
    const accessToken = this.getToken();
    const refreshToken = this.getRefreshToken();
    if (accessToken && refreshToken) {
      sessionStorage.setItem(this.TOKEN_KEY, accessToken);
      sessionStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    }
  }

  static restoreSession() {
    const accessToken = sessionStorage.getItem(this.TOKEN_KEY);
    const refreshToken = sessionStorage.getItem(this.REFRESH_TOKEN_KEY);
    if (accessToken && refreshToken) {
      this.setTokens(accessToken, refreshToken);
    }
  }

  static isAuthenticated() {
    const token = this.getToken();
    return token && !this.isTokenExpired(token);
  }

  static async refreshToken() {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }
    try {
      const response = await Wrapper.axios.post(`${BASE_URL}/user/refresh-token`, {
        refreshToken,
      });
      const { accessToken, refreshToken: newRefreshToken } = response.data;
      this.setTokens(accessToken, newRefreshToken);
      return accessToken;
    } catch (error) {
      console.error("Error refreshing token:", error);
      this.clearAuth();
      window.location.href = '/login';
      throw error;
    }
  }

  static async ensureValidToken() {
    const token = this.getToken();
    if (!token || this.isTokenExpired(token)) {
      return await this.refreshToken();
    }
    return token;
  }

  static async logout() {
    try {
      const token = await this.ensureValidToken();
      await Wrapper.axios.post(`${BASE_URL}/user/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      this.clearAuth();
      window.location.href = '/login';
    }
  }
}

export default AuthService;