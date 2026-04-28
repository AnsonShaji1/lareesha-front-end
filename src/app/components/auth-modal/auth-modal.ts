import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService, User } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

declare var google: any;

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './auth-modal.html',
  styleUrl: './auth-modal.scss',
})
export class AuthModalComponent implements OnInit {
  @Input() isOpen = false;
  @Input() mode: 'signin' | 'signup' = 'signin';

  @Output() closeModal = new EventEmitter<void>();
  @Output() authenticated = new EventEmitter<User>();
  @Output() forgotPassword = new EventEmitter<void>();

  signInForm = {
    email: '',
    password: '',
  };

  signUpForm = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  };

  errorMessage = '';
  isLoading = false;
  googleClientId = '41053520171-fue6151ivhr37aoq33t6lmmdg9b2cpai.apps.googleusercontent.com'; // Will be replaced with actual ID

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit() {
    this.initializeGoogleSignIn();
  }

  private initializeGoogleSignIn() {
    // Initialize Google Sign-In SDK
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      if (typeof google !== 'undefined' && google.accounts) {
        google.accounts.id.initialize({
          client_id: this.googleClientId,
          callback: (response: any) => this.handleGoogleLogin(response),
        });
      }
    };
  }

  switchMode(mode: 'signin' | 'signup') {
    this.mode = mode;
    this.errorMessage = '';
    // Reset forms when switching modes
    this.signInForm = {
      email: '',
      password: '',
    };
    this.signUpForm = {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    };
  }

  onSignIn() {
    console.log('Sign In submitted:', this.signInForm);

    if (!this.signInForm.email || !this.signInForm.password) {
      this.errorMessage = 'Please fill in all fields';
      return;
    }

    this.isLoading = true;
    this.authService
      .login({
        email: this.signInForm.email,
        password: this.signInForm.password,
      })
      .subscribe({
        next: (response) => {
          console.log('Login successful:', response);
          this.notificationService.success('Welcome back!');
          this.authenticated.emit(response.user);
          this.close();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Login error:', error);
          this.isLoading = false;
          this.errorMessage =
            error.error?.non_field_errors?.[0] ||
            error.error?.detail ||
            error.error?.email?.[0] ||
            'Invalid email or password';
          this.notificationService.error(this.errorMessage);
          this.isLoading = false;
        },
      });
  }

  onSignup() {
    console.log('Sign Up submitted:', this.signUpForm);
    this.errorMessage = '';

    if (
      !this.signUpForm.firstName ||
      !this.signUpForm.lastName ||
      !this.signUpForm.email ||
      !this.signUpForm.password
    ) {
      this.errorMessage = 'Please fill in all required fields';
      return;
    }

    if (this.signUpForm.password.length < 8) {
      this.errorMessage = 'Password must be at least 8 characters long';
      return;
    }

    if (this.signUpForm.password !== this.signUpForm.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }
    this.isLoading = true;
    this.authService
      .register({
        first_name: this.signUpForm.firstName,
        last_name: this.signUpForm.lastName,
        email: this.signUpForm.email,
        password1: this.signUpForm.password,
        password2: this.signUpForm.confirmPassword,
      })
      .subscribe({
        next: (response) => {
          console.log('Registration successful:', response);
          this.notificationService.success('Account created successfully! Welcome!');
          this.authenticated.emit(response.user);
          this.close();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Registration error:', error);
          this.isLoading = false;

          // Extract error message from various possible error fields
          if (error.error?.email && Array.isArray(error.error.email)) {
            this.errorMessage = error.error.email[0];
          } else if (error.error?.password1 && Array.isArray(error.error.password1)) {
            this.errorMessage = error.error.password1[0];
          } else if (error.error?.password2 && Array.isArray(error.error.password2)) {
            this.errorMessage = error.error.password2[0];
          } else if (error.error?.username && Array.isArray(error.error.username)) {
            this.errorMessage = error.error.username[0];
          } else if (error.error?.password && Array.isArray(error.error.password)) {
            this.errorMessage = error.error.password[0];
          } else if (error.error?.detail) {
            this.errorMessage = error.error.detail;
          } else if (typeof error.error === 'string') {
            this.errorMessage = error.error;
          } else {
            this.errorMessage = 'Registration failed. Please try again.';
          }

          // Show error notification
          this.notificationService.error(this.errorMessage);
          this.isLoading = false;
        },
      });
  }

  handleGoogleLogin(response: any) {
    if (response.credential) {
      this.isLoading = true;
      const credential = response.credential;

      // Decode JWT to get user info
      const parts = credential.split('.');
      const decoded = JSON.parse(atob(parts[1]));

      // Login with Google token
      this.authService.googleLogin(credential).subscribe({
        next: (authResponse) => {
          console.log('Google login successful:', authResponse);
          this.notificationService.success('Welcome back!');
          this.authenticated.emit(authResponse.user);
          this.close();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Google login error:', error);
          this.isLoading = false;
          this.errorMessage = 'Google login failed. Please try again.';
          this.notificationService.error(this.errorMessage);
        },
      });
    }
  }

  initiateGoogleSignIn(event: Event) {
    event.preventDefault();
    if (typeof google !== 'undefined' && google.accounts) {
      google.accounts.id.renderButton({
        prompt: 'select_account',
        callback: (response: any) => this.handleGoogleLogin(response),
      });
      google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Fallback to regular sign-in
          const signInButton = document.querySelector('[data-google-signin]');
          if (signInButton) {
            google.accounts.id.renderButton(signInButton, {
              callback: (response: any) => this.handleGoogleLogin(response),
            });
          }
        }
      });
    }
  }

  onForgotPassword() {
    console.log('Forgot password clicked');
    this.forgotPassword.emit();
  }

  close() {
    this.closeModal.emit();
    this.errorMessage = '';
  }
}
