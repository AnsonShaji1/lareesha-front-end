import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService, User } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

declare var google: any;

const GOOGLE_GSI_SCRIPT = 'https://accounts.google.com/gsi/client';

@Component({
  selector: 'app-auth-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './auth-form.html',
  styleUrl: './auth-form.scss',
})
export class AuthFormComponent implements OnChanges {
  @Input({ required: true }) mode!: 'signin' | 'signup';

  @Output() authenticated = new EventEmitter<User>();

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

  isLoading = false;
  showSignInPassword = false;
  showSignUpPassword = false;
  showSignUpConfirmPassword = false;
  googleClientId = '41053520171-fue6151ivhr37aoq33t6lmmdg9b2cpai.apps.googleusercontent.com';

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
  ) {
    this.ensureGoogleScript();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] && !changes['mode'].firstChange) {
      this.signInForm = { email: '', password: '' };
      this.signUpForm = {
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
      };
      this.showSignInPassword = false;
      this.showSignUpPassword = false;
      this.showSignUpConfirmPassword = false;
    }
  }

  toggleSignInPasswordVisibility(): void {
    this.showSignInPassword = !this.showSignInPassword;
  }

  toggleSignUpPasswordVisibility(): void {
    this.showSignUpPassword = !this.showSignUpPassword;
  }

  toggleSignUpConfirmPasswordVisibility(): void {
    this.showSignUpConfirmPassword = !this.showSignUpConfirmPassword;
  }

  private ensureGoogleScript(): void {
    if (document.querySelector(`script[src="${GOOGLE_GSI_SCRIPT}"]`)) {
      this.tryInitGoogle();
      return;
    }
    const script = document.createElement('script');
    script.src = GOOGLE_GSI_SCRIPT;
    script.async = true;
    script.defer = true;
    script.onload = () => this.tryInitGoogle();
    document.head.appendChild(script);
  }

  private tryInitGoogle(): void {
    if (typeof google === 'undefined' || !google.accounts) {
      return;
    }
    google.accounts.id.initialize({
      client_id: this.googleClientId,
      callback: (response: any) => this.handleGoogleLogin(response),
    });
  }

  onSignInSubmit(): void {
    if (!this.signInForm.email || !this.signInForm.password) {
      this.notificationService.error('Please fill in all fields');
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
          this.notificationService.success('Welcome back!');
          this.authenticated.emit(response.user);
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          const message =
            error.error?.non_field_errors?.[0] ||
            error.error?.detail ||
            error.error?.email?.[0] ||
            'Invalid email or password';
          this.notificationService.error(message);
        },
      });
  }

  onSignupSubmit(): void {
    if (
      !this.signUpForm.firstName ||
      !this.signUpForm.lastName ||
      !this.signUpForm.email ||
      !this.signUpForm.password
    ) {
      this.notificationService.error('Please fill in all required fields');
      return;
    }

    if (this.signUpForm.password.length < 8) {
      this.notificationService.error('Password must be at least 8 characters long');
      return;
    }

    if (this.signUpForm.password !== this.signUpForm.confirmPassword) {
      this.notificationService.error('Passwords do not match');
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
          this.notificationService.success('Account created successfully! Welcome!');
          this.authenticated.emit(response.user);
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          let message = 'Registration failed. Please try again.';
          if (error.error?.email && Array.isArray(error.error.email)) {
            message = error.error.email[0];
          } else if (error.error?.password1 && Array.isArray(error.error.password1)) {
            message = error.error.password1[0];
          } else if (error.error?.password2 && Array.isArray(error.error.password2)) {
            message = error.error.password2[0];
          } else if (error.error?.username && Array.isArray(error.error.username)) {
            message = error.error.username[0];
          } else if (error.error?.password && Array.isArray(error.error.password)) {
            message = error.error.password[0];
          } else if (error.error?.detail) {
            message = error.error.detail;
          } else if (typeof error.error === 'string') {
            message = error.error;
          }

          this.notificationService.error(message);
        },
      });
  }

  private handleGoogleLogin(response: any): void {
    if (response.credential) {
      this.isLoading = true;
      const credential = response.credential;

      this.authService.googleLogin(credential).subscribe({
        next: (authResponse) => {
          this.notificationService.success('Welcome back!');
          this.authenticated.emit(authResponse.user);
          this.isLoading = false;
        },
        error: (_error) => {
          this.isLoading = false;
          this.notificationService.error('Google login failed. Please try again.');
        },
      });
    }
  }

  initiateGoogleSignIn(event: Event): void {
    event.preventDefault();
    this.tryInitGoogle();
    if (typeof google !== 'undefined' && google.accounts) {
      google.accounts.id.renderButton({
        prompt: 'select_account',
        callback: (resp: any) => this.handleGoogleLogin(resp),
      });
      google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          const btn = document.querySelector('[data-google-signin-active]');
          if (btn) {
            google.accounts.id.renderButton(btn, {
              callback: (resp: any) => this.handleGoogleLogin(resp),
            });
          }
        }
      });
    }
  }

  // forgot-password is now a dedicated page (see template routerLink)
}
