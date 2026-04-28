import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule],
  templateUrl: './forgot-password-modal.html',
  styleUrl: './forgot-password-modal.scss',
})
export class ForgotPasswordModalComponent {
  @Input() isOpen = false;
  @Output() closeModal = new EventEmitter<void>();
  @Output() backToSignIn = new EventEmitter<void>();

  email = '';
  emailSent = false;
  isLoading = false;

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService,
  ) {}

  onSubmit() {
    if (!this.email || !this.isValidEmail(this.email)) {
      this.notificationService.error('Please enter a valid email address');
      return;
    }

    this.isLoading = true;

    this.authService.forgotPassword(this.email).subscribe({
      next: (response) => {
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

  resendEmail(event: Event) {
    event.preventDefault();

    if (!this.email) {
      this.notificationService.error('Email is not set');
      return;
    }

    this.isLoading = true;

    this.authService.forgotPassword(this.email).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.notificationService.success('Reset link has been resent!');
      },
      error: (error) => {
        this.isLoading = false;
        const errorMessage =
          error?.error?.error || 'Failed to resend reset link. Please try again.';
        this.notificationService.error(errorMessage);
      },
    });
  }

  close() {
    setTimeout(() => {
      this.email = '';
      this.emailSent = false;
      this.isLoading = false;
    }, 300);
    this.closeModal.emit();
  }

  goBackToSignIn() {
    setTimeout(() => {
      this.email = '';
      this.emailSent = false;
      this.isLoading = false;
    }, 300);
    this.backToSignIn.emit();
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
