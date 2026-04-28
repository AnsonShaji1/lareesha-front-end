import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NotificationService } from '../../services/notification.service';
import { AddressService } from '../../services/address.service';

@Component({
  selector: 'app-address-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './address-dialog.html',
  styleUrl: './address-dialog.scss',
})
export class AddressDialogComponent implements OnInit {
  form: FormGroup;
  isLoading = false;
  isEditMode = false;
  isFirstAddress = false;
  isDefaultDisabled = false;

  indianStates = [
    'Andhra Pradesh',
    'Arunachal Pradesh',
    'Assam',
    'Bihar',
    'Chhattisgarh',
    'Goa',
    'Gujarat',
    'Haryana',
    'Himachal Pradesh',
    'Jharkhand',
    'Karnataka',
    'Kerala',
    'Madhya Pradesh',
    'Maharashtra',
    'Manipur',
    'Meghalaya',
    'Mizoram',
    'Nagaland',
    'Odisha',
    'Punjab',
    'Rajasthan',
    'Sikkim',
    'Tamil Nadu',
    'Telangana',
    'Tripura',
    'Uttar Pradesh',
    'Uttarakhand',
    'West Bengal',
  ];

  constructor(
    private fb: FormBuilder,
    private addressService: AddressService,
    private notificationService: NotificationService,
    private dialogRef: MatDialogRef<AddressDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    this.form = this.fb.group({
      full_name: ['', [Validators.required]],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      email: ['', [Validators.required, Validators.email]],
      address_line_1: ['', [Validators.required]],
      address_line_2: [''],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      zip_code: ['', [Validators.required, Validators.pattern(/^\d{5,6}$/)]],
      country: ['India', [Validators.required]],
      is_default: [false],
    });
  }

  ngOnInit() {
    // If this is the first address (no addresses exist), make it default and disable the checkbox
    if (this.data && this.data.isFirstAddress) {
      this.isFirstAddress = true;
      this.isDefaultDisabled = true;
      this.form.patchValue({ is_default: true });
      // Disable the checkbox control
      this.form.get('is_default')?.disable({ emitEvent: false });
    }

    // If editing an existing address, populate form with its data
    if (this.data && this.data.id) {
      this.isEditMode = true;
      this.form.patchValue(this.data);
      // Re-enable the checkbox for editing (even if it was a first address initially)
      this.isDefaultDisabled = true; // Keep it disabled unless user explicitly decides
    }
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notificationService.error('Please fill all required fields correctly');
      return;
    }

    this.isLoading = true;

    const operation = this.isEditMode
      ? this.addressService.updateAddress(this.data.id, this.form.value)
      : this.addressService.createAddress(this.form.value);

    operation.subscribe({
      next: (response: any) => {
        this.isLoading = false;
        const message = this.isEditMode
          ? 'Address updated successfully'
          : 'Address added successfully';
        this.notificationService.success(message);
        this.dialogRef.close(true);
      },
      error: (error: any) => {
        this.isLoading = false;
        const errorMessage = error?.error?.error || 'Failed to save address';
        this.notificationService.error(errorMessage);
      },
    });
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}
