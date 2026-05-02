import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, finalize } from 'rxjs';
import { of } from 'rxjs';

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  date_joined: string;
  pk?: number;
  username?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password1: string;
  password2: string;
  first_name?: string;
  last_name?: string;
}

export interface AuthResponse {
  user?: User;
  key?: string;
  access?: string;
  refresh?: string;
}

export interface TokenResponse {
  access: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = `${environment.apiBaseUrl}/api/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient) {
    // Auth initialization is handled by APP_INITIALIZER in app.config.ts
  }

  private checkAuthStatus(): void {
    const token = this.getAccessToken();
    if (token) {
      this.http
        .get<User>(`${this.baseUrl}/user/`, {
          headers: this.getAuthHeaders(),
        })
        .pipe(
          catchError(() => {
            this.clearTokens();
            return of(null);
          }),
        )
        .subscribe({
          next: (user) => {
            if (user) {
              this.currentUserSubject.next(user);
              this.isAuthenticatedSubject.next(true);
            } else {
              // User API call succeeded but returned null - not authenticated
              this.isAuthenticatedSubject.next(false);
            }
          },
          error: () => {
            // Error in HTTP call - not authenticated
            this.isAuthenticatedSubject.next(false);
          },
        });
    } else {
      // No token in localStorage - not authenticated
      this.isAuthenticatedSubject.next(false);
    }
  }

  public initializeAuth(): Promise<boolean> {
    return new Promise((resolve) => {
      const token = this.getAccessToken();
      if (token) {
        this.http
          .get<User>(`${this.baseUrl}/user/`, {
            headers: this.getAuthHeaders(),
          })
          .pipe(
            catchError(() => {
              this.clearTokens();
              return of(null);
            }),
          )
          .subscribe({
            next: (user) => {
              if (user) {
                this.currentUserSubject.next(user);
                this.isAuthenticatedSubject.next(true);
                resolve(true);
              } else {
                this.isAuthenticatedSubject.next(false);
                resolve(false);
              }
            },
            error: () => {
              this.isAuthenticatedSubject.next(false);
              resolve(false);
            },
          });
      } else {
        this.isAuthenticatedSubject.next(false);
        resolve(false);
      }
    });
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.getAccessToken();
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login/`, credentials).pipe(
      tap((response) => {
        if (response.access) {
          this.setTokens(response.access, response.refresh || '');
        }
        if (response.user) {
          this.currentUserSubject.next(response.user);
          this.isAuthenticatedSubject.next(true);
        }
      }),
    );
  }

  register(data: RegisterData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/registration/`, data).pipe(
      tap((response) => {
        if (response.access) {
          this.setTokens(response.access, response.refresh || '');
        }
        if (response.user) {
          this.currentUserSubject.next(response.user);
          this.isAuthenticatedSubject.next(true);
        }
      }),
    );
  }

  logout(): Observable<any> {
    return this.http
      .post(
        `${this.baseUrl}/logout/`,
        {},
        {
          headers: this.getAuthHeaders(),
        },
      )
      .pipe(
        finalize(() => {
          this.clearTokens();
        }),
      );
  }

  refreshToken(): Observable<TokenResponse | null> {
    const refreshToken = this.getRefreshToken();
    return this.http
      .post<TokenResponse>(`${this.baseUrl}/token/refresh/`, {
        refresh: refreshToken,
      })
      .pipe(
        tap((response) => {
          this.setAccessToken(response.access);
        }),
        catchError(() => {
          this.clearTokens();
          return of(null);
        }),
      );
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/user/`, {
      headers: this.getAuthHeaders(),
    });
  }

  updateUser(userData: Partial<User>): Observable<User> {
    return this.http
      .put<User>(`${this.baseUrl}/user/`, userData, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        tap((user) => {
          this.currentUserSubject.next(user);
        }),
      );
  }

  // Google OAuth login
  googleLogin(accessToken: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/google/`, {
        access_token: accessToken,
      })
      .pipe(
        tap((response) => {
          if (response.access) {
            this.setTokens(response.access, response.refresh || '');
          }
          if (response.user) {
            this.currentUserSubject.next(response.user);
            this.isAuthenticatedSubject.next(true);
          }
        }),
      );
  }

  // Forgot password - request reset email
  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/forgot-password/`, { email });
  }

  // Reset password with token
  resetPassword(uid: string, token: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/reset-password-confirm/`, {
      uid,
      token,
      new_password: newPassword,
    });
  }

  private setTokens(access: string, refresh: string): void {
    if (typeof window !== 'undefined' && localStorage) {
      localStorage.setItem('access_token', access);
      if (refresh) {
        localStorage.setItem('refresh_token', refresh);
      }
    }
  }

  private setAccessToken(access: string): void {
    if (typeof window !== 'undefined' && localStorage) {
      localStorage.setItem('access_token', access);
    }
  }

  private getAccessToken(): string | null {
    if (typeof window !== 'undefined' && localStorage) {
      return localStorage.getItem('access_token');
    }
    return null;
  }

  private getRefreshToken(): string | null {
    if (typeof window !== 'undefined' && localStorage) {
      return localStorage.getItem('refresh_token');
    }
    return null;
  }

  private clearTokens(): void {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        console.log('Tokens cleared from localStorage');
      }
    } catch (e) {
      console.error('Error clearing tokens:', e);
    }
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    console.log('Auth state cleared, isAuthenticated:', this.isAuthenticatedSubject.value);
  }

  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  get isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  get token(): string | null {
    return this.getAccessToken();
  }
}
