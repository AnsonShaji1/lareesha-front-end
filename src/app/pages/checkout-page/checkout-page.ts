import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';
import { CartService, CartItem } from '../../services/cart';
import { NotificationService } from '../../services/notification.service';
import { AddressService, Address } from '../../services/address.service';
import { AddressDialogComponent } from '../../components/address-dialog/address-dialog';
import { ApiService, CreateOrderResponse } from '../../services/api.service';
import { RazorpayService, RazorpayResponse } from '../../services/razorpay.service';
import { Subscription, finalize } from 'rxjs';

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatDialogModule, MatRadioModule],
  templateUrl: './checkout-page.html',
  styleUrl: './checkout-page.scss',
})
export class CheckoutPage implements OnInit, OnDestroy {
  cartItems: CartItem[] = [];
  subtotal = 0;
  shipping = 0;
  tax = 0;
  total = 0;
  orderPlaced = false;
  orderNumber = '';
  orderId: number | null = null; // Store order ID for post-payment navigation
  isProcessing = false;
  currentRazorpayOrderId = ''; // Store for payment cancellation
  private timerInterval: any;

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
    'Andaman and Nicobar Islands',
    'Chandigarh',
    'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi',
    'Jammu and Kashmir',
    'Ladakh',
    'Lakshadweep',
    'Puducherry',
  ];

  checkoutForm = {
    firstName: '',
    lastName: '',
    address: '',
    apartment: '',
    zipCode: '',
    state: '',
    country: 'India',
    phone: '',
    city: '',
  };

  // Address management properties
  savedAddresses: Address[] = [];
  selectedAddressId: number | null = null;

  private subscription?: Subscription;

  constructor(
    private cartService: CartService,
    private router: Router,
    private notificationService: NotificationService,
    private addressService: AddressService,
    private apiService: ApiService,
    private razorpayService: RazorpayService,
    private dialog: MatDialog,
  ) {}

  ngOnInit() {
    this.subscription = this.cartService.cartItems$.subscribe((items: CartItem[]) => {
      this.cartItems = items;
      if (items.length === 0 && !this.orderPlaced) {
        this.router.navigate(['/']);
      }
      this.calculateTotals();
    });

    // Load saved addresses
    this.loadSavedAddresses();
  }

  loadSavedAddresses() {
    this.addressService.getAddresses().subscribe({
      next: (addresses: Address[]) => {
        this.savedAddresses = addresses;
        // Auto-select default address if available
        const defaultAddress = addresses.find((a) => a.is_default);
        if (defaultAddress) {
          this.selectedAddressId = defaultAddress.id;
        }
      },
      error: (error) => {
        console.error('Error loading addresses:', error);
        // Continue with address selection
      },
    });
  }

  openAddressDialog() {
    const dialogRef = this.dialog.open(AddressDialogComponent, {
      width: '600px',
      data: { isNew: true, isFirstAddress: this.savedAddresses.length === 0 },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadSavedAddresses();
      }
    });
  }

  editAddress(address: Address) {
    const dialogRef = this.dialog.open(AddressDialogComponent, {
      width: '600px',
      data: { ...address, isNew: false },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadSavedAddresses();
      }
    });
  }

  deleteAddress(address: Address) {
    if (confirm(`Are you sure you want to delete the address: ${address.full_name}?`)) {
      this.addressService.deleteAddress(address.id).subscribe({
        next: () => {
          this.notificationService.success('Address deleted successfully');
          // If the deleted address was selected, clear the selection
          if (this.selectedAddressId === address.id) {
            this.selectedAddressId = null;
          }
          // If the deleted address was default and there are other addresses, set another as default
          if (address.is_default) {
            const remainingAddresses = this.savedAddresses.filter((a) => a.id !== address.id);
            if (remainingAddresses.length > 0) {
              const firstRemainingAddress = remainingAddresses[0];
              this.addressService.setDefaultAddress(firstRemainingAddress.id).subscribe({
                next: () => {
                  this.loadSavedAddresses();
                },
                error: (error) => {
                  console.error('Error setting default address:', error);
                  this.loadSavedAddresses();
                },
              });
            } else {
              this.loadSavedAddresses();
            }
          } else {
            this.loadSavedAddresses();
          }
        },
        error: (error) => {
          console.error('Error deleting address:', error);
          this.notificationService.error('Failed to delete address');
        },
      });
    }
  }

  selectAddress(addressId: number) {
    this.selectedAddressId = addressId;
  }

  formatPhoneNumber(event: any) {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length > 10) {
      value = value.slice(0, 10);
    }
    if (value.length > 0) {
      if (value.length <= 5) {
        event.target.value = value;
      } else {
        event.target.value = `${value.slice(0, 5)} ${value.slice(5)}`;
      }
    }
    this.checkoutForm.phone = value;
  }

  formatPinCode(event: any) {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length > 6) {
      value = value.slice(0, 6);
    }
    event.target.value = value;
    this.checkoutForm.zipCode = value;
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  calculateTotals() {
    // Call backend API to calculate totals based on product-specific tax and shipping
    this.apiService.calculateTotals().subscribe({
      next: (response) => {
        this.subtotal = response.subtotal;
        this.shipping = response.shipping;
        this.tax = response.tax;
        this.total = response.total;
      },
      error: (error: any) => {
        console.error('Error calculating totals:', error);
        // Fallback to frontend calculation if backend fails
        this.subtotal = this.cartService.getTotal();
        this.shipping = this.subtotal >= 12500 ? 0 : 800;
        this.tax = (this.subtotal + this.shipping) * 0.08;
        this.total = this.subtotal + this.shipping + this.tax;
      },
    });
  }

  placeOrder() {
    // Validate address selection
    if (!this.selectedAddressId) {
      this.notificationService.error('Please select a delivery address');
      return;
    }

    const selectedAddress = this.savedAddresses.find((a) => a.id === this.selectedAddressId);
    if (!selectedAddress) {
      this.notificationService.error('Please select a valid address');
      return;
    }

    // Validate cart is not empty
    if (this.cartItems.length === 0) {
      this.notificationService.error('Your cart is empty');
      return;
    }

    this.isProcessing = true;

    // Prepare order data - only send shipping_address_id
    const orderData = {
      shipping_address_id: selectedAddress.id,
    };

    // Call backend to create order and get Razorpay details
    this.apiService.createOrder(orderData).subscribe({
      next: (response: CreateOrderResponse) => {
        this.orderNumber = response.order_number;
        this.orderId = response.id; // Store order ID for post-payment navigation
        this.openRazorpayPayment(response, selectedAddress);
      },
      error: (error: any) => {
        this.isProcessing = false;
        console.error('Error creating order:', error);
        const errorMessage = error.error?.error || 'Failed to create order';
        this.notificationService.error(errorMessage);
      },
    });
  }

  openRazorpayPayment(orderResponse: CreateOrderResponse, address: Address) {
    // Ensure razorpay_order_id is present
    if (!orderResponse.razorpay_order_id) {
      this.notificationService.error('Failed to initialize payment. Please try again.');
      this.isProcessing = false;
      return;
    }

    // Store order ID for cancellation handling
    this.currentRazorpayOrderId = orderResponse.razorpay_order_id;

    const options = {
      key: orderResponse.razorpay_key,
      amount: orderResponse.amount,
      currency: 'INR',
      name: 'Lareesha Luxe',
      description: `Order ${orderResponse.order_number}`,
      order_id: orderResponse.razorpay_order_id,
      timeout: 900, // 15 minutes timeout in seconds (matches STOCK_RESERVATION_MINUTES)
      method: {
        upi: true, // 👈 enables UPI properly
      },
      prefill: {
        name: address.full_name,
        email: address.email,
        contact: address.phone,
      },
      theme: {
        color: '#D4AF37', // Gold color for luxury brand
      },
      handler: (response: RazorpayResponse) => {
        this.verifyPayment(response);
      },
      modal: {
        ondismiss: () => {
          // User cancelled payment - release stock reservation
          this.isProcessing = false;
          if (this.timerInterval) {
            clearInterval(this.timerInterval);
          }
          this.notificationService.warning('Payment cancelled');
          // Call payment_failed to release stock immediately, then return home
          if (this.currentRazorpayOrderId) {
            this.apiService
              .paymentFailed(this.currentRazorpayOrderId)
              .pipe(
                finalize(() => {
                  this.cartService.clearCart();
                  this.router.navigate(['/']);
                }),
              )
              .subscribe({
                next: (response) => {
                  console.log('Stock released after payment cancellation:', response);
                },
                error: (error) => {
                  console.error('Error releasing stock:', error);
                },
              });
          } else {
            this.cartService.clearCart();
            this.router.navigate(['/']);
          }
        },
      },
    };

    this.razorpayService.openPaymentModal(options);
  }

  verifyPayment(response: RazorpayResponse) {
    const verificationData = {
      razorpay_order_id: response.razorpay_order_id,
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_signature: response.razorpay_signature,
    };

    this.apiService.verifyPayment(verificationData).subscribe({
      next: (order) => {
        // Clear timer on successful payment
        if (this.timerInterval) {
          clearInterval(this.timerInterval);
        }

        // Payment successful
        this.isProcessing = false;
        this.notificationService.success('Payment successful!');
        this.orderPlaced = true;

        // Clear cart after successful order
        this.cartService.clearCart();

        // Redirect to order detail page
        setTimeout(() => {
          if (this.orderId) {
            this.router.navigate(['/order', this.orderId]);
          } else {
            // Fallback to home if order ID is not available
            this.router.navigate(['/']);
          }
        }, 6000);
      },
      error: (error: any) => {
        // Clear timer on payment failure
        if (this.timerInterval) {
          clearInterval(this.timerInterval);
        }

        // Payment verification failed (invalid signature)
        this.isProcessing = false;
        console.error('Payment verification failed:', error);

        // Backend already:
        // - Set order status to 'payment_failed'
        // - Set payment_status to 'failed'
        // - Released stock reservations
        // So no need to call paymentFailed API again

        this.notificationService.error(
          'Payment verification failed. Please try again or contact support.',
        );
      },
    });
  }

  goBack() {
    this.router.navigate(['/']);
  }
}
