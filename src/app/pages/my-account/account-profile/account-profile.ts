import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';
import { ApiService } from '../../../services/api.service';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-account-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
  ],
  templateUrl: './account-profile.html',
  styleUrl: './account-profile.scss',
})
export class AccountProfileComponent implements OnInit {
  user: User | null = null;
  isEditing = false;
  isSaving = false;

  formData = {
    first_name: '',
    last_name: '',
    email: '',
    gender: '',
    phone: '',
  };

  genderOptions = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Other', value: 'other' },
    { label: 'Prefer not to say', value: 'prefer_not_to_say' },
  ];

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private apiService: ApiService,
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe((user: User | null) => {
      if (user) {
        this.user = user;
        this.formData.first_name = user.first_name;
        this.formData.last_name = user.last_name;
        this.formData.email = user.email;
        this.formData.gender = user.gender || '';
        this.formData.phone = user.phone || '';
      }
    });
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
  }

  saveProfile() {
    this.isSaving = true;
    const profileData = {
      first_name: this.formData.first_name,
      last_name: this.formData.last_name,
      phone: this.formData.phone,
      gender: this.formData.gender,
    };

    this.apiService.updateUserProfile(profileData).subscribe({
      next: (response) => {
        this.isSaving = false;
        this.isEditing = false;
        this.notificationService.success('Profile updated successfully!');
        // Update the current user in auth service if needed
        if (response) {
          this.user = response;
        }
      },
      error: (error) => {
        this.isSaving = false;
        console.error('Error updating profile:', error);
        this.notificationService.error('Failed to update profile. Please try again.');
      },
    });
  }

  cancel() {
    if (this.user) {
      this.formData.first_name = this.user.first_name;
      this.formData.last_name = this.user.last_name;
      this.formData.email = this.user.email;
      this.formData.gender = this.user.gender || '';
      this.formData.phone = this.user.phone || '';
    }
    this.isEditing = false;
  }
}
