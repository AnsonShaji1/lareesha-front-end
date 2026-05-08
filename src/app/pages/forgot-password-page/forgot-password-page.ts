import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password-page',
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
  templateUrl: './forgot-password-page.html',
  styleUrl: './forgot-password-page.scss',
})
export class ForgotPasswordPage {
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  email = '';
  emailSent = false;
  isLoading = false;

  onSubmit(): void {
    if (!this.email || !this.isValidEmail(this.email)) {
      this.notificationService.error('Please enter a valid email address');
      return;
    }

    this.isLoading = true;
    this.authService.forgotPassword(this.email).subscribe({
      next: () => {
        this.isLoading = false;
        this.emailSent = true;
        this.notificationService.success('Reset link has been sent to your email!');
      },
      error: (error) => {
        this.isLoading = false;
        const errorMessage = error?.error?.error || 'Failed to send reset link. Please try again.';
        this.notificationService.error(errorMessage);
      },
    });
  }

  resendEmail(event: Event): void {
    event.preventDefault();

    if (!this.email) {
      this.notificationService.error('Email is not set');
      return;
    }

    this.isLoading = true;
    this.authService.forgotPassword(this.email).subscribe({
      next: () => {
        this.isLoading = false;
        this.notificationService.success('Reset link has been resent!');
      },
      error: (error) => {
        this.isLoading = false;
        const errorMessage = error?.error?.error || 'Failed to resend reset link. Please try again.';
        this.notificationService.error(errorMessage);
      },
    });
  }

  backToSignIn(): void {
    const qp = { ...this.route.snapshot.queryParams };
    void this.router.navigate(['/sign-in'], { queryParams: qp });
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

