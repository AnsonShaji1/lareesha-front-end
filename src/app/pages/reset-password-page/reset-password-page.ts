import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-reset-password-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './reset-password-page.html',
  styleUrl: './reset-password-page.scss',
})
export class ResetPasswordPageComponent implements OnInit {
  form: FormGroup;
  isLoading = false;
  isValidating = true;
  isTokenValid = false;
  showPassword = false;
  showConfirmPassword = false;
  uid: string = '';
  token: string = '';
  resetSuccessful = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private notificationService: NotificationService,
    private fb: FormBuilder,
  ) {
    this.form = this.fb.group(
      {
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator },
    );
  }

  ngOnInit() {
    // Get uid and token from URL
    this.route.params.subscribe((params) => {
      this.uid = params['uid'];
      this.token = params['token'];

      if (!this.uid || !this.token) {
        this.notificationService.error('Invalid reset link');
        this.router.navigate(['/']);
        return;
      }

      // Token validation is done when user tries to submit the form
      this.isValidating = false;
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.notificationService.error('Please fill in all fields correctly');
      return;
    }

    if (this.form.get('password')?.value.length < 8) {
      this.notificationService.error('Password must be at least 8 characters');
      return;
    }

    this.isLoading = true;

    this.authService
      .resetPassword(this.uid, this.token, this.form.get('password')?.value)
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.resetSuccessful = true;
          this.notificationService.success('Password reset successfully! Redirecting to login...');
          setTimeout(() => {
            this.router.navigate(['/']);
          }, 2000);
        },
        error: (error) => {
          this.isLoading = false;
          const errorMessage = error?.error?.error || 'Failed to reset password. Please try again.';
          this.notificationService.error(errorMessage);
        },
      });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  private passwordMatchValidator(control: FormGroup): { [key: string]: boolean } | null {
    const passwordControl = control.get('password');
    const confirmPasswordControl = control.get('confirmPassword');

    if (!passwordControl || !confirmPasswordControl) {
      return null;
    }

    return passwordControl.value === confirmPasswordControl.value
      ? null
      : { passwordMismatch: true };
  }
}
