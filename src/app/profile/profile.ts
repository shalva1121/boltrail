import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ThemeService } from '../theme.service';
import { AuthService, ChangePasswordPayload, UserProfile } from '../services/auth.service';
import { BookingService } from '../booking/booking.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile {
  theme = inject(ThemeService);
  private auth = inject(AuthService);
  private bookingService = inject(BookingService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  rawProfile = signal<UserProfile | null>(null);
  bookings = signal<any[]>([]);
  bookingsLoading = signal(false);
  bookingsError = signal('');
  bookingsPage = signal(1);
  selectedBookingId = signal<number | string | null>(null);
  deletingBookingId = signal<number | string | null>(null);
  filterFrom = signal('');
  filterTo = signal('');
  isFiltering = signal(false);

  pictureUrl = signal('');
  firstName = signal('');
  lastName = signal('');
  email = signal('');
  phone = signal('');
  address = signal('');
  dateOfBirth = signal('');
  activeTab = signal<'profile' | 'bookings' | 'settings'>('profile');
  currentPassword = signal('');
  newPassword = signal('');
  passwordLoading = signal(false);
  deleteLoading = signal(false);
  confirmDelete = signal(false);
  passwordSuccessMessage = signal('');
  passwordErrorMessage = signal('');
  deleteErrorMessage = signal('');
  isLoading = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  constructor() {
    this.loadProfile();
    if (this.route.snapshot.queryParamMap.get('tab') === 'bookings') {
      this.openTab('bookings');
    }
  }

  toggleTheme(): void {
    this.theme.toggle();
  }

  loadProfile(): void {
    this.isLoading.set(true);
    this.auth.getUser().subscribe({
      next: (profile) => {
        this.isLoading.set(false);
        this.rawProfile.set(profile);
        this.pictureUrl.set(profile.pictureUrl ?? '');
        this.firstName.set(profile.firstName ?? '');
        this.lastName.set(profile.lastName ?? '');
        this.email.set(profile.email ?? '');
        this.phone.set(profile.phone ?? '');
        this.address.set(profile.address ?? '');
        this.dateOfBirth.set(profile.dateOfBirth ?? '');
      },
      error: (err) => {
        this.isLoading.set(false);
        const errorBody = err?.error;
        this.errorMessage.set(
          errorBody?.detail ??
          errorBody?.message ??
          errorBody?.error ??
          err?.message ??
          'Unable to load profile.'
        );
      }
    });
  }

  loadBookings(page = 1): void {
    this.bookingsPage.set(page);
    this.bookingsLoading.set(true);
    this.bookingsError.set('');

    if (this.isFiltering() && this.filterFrom() && this.filterTo()) {
      this.bookingService.getUserBookingsFiltered(this.filterFrom(), this.filterTo(), 12, page).subscribe({
        next: bookings => {
          this.bookingsLoading.set(false);
          this.bookings.set(bookings);
        },
        error: err => {
          this.bookingsLoading.set(false);
          const errorBody = err?.error;
          this.bookingsError.set(
            errorBody?.detail ??
            errorBody?.message ??
            errorBody?.error ??
            err?.message ??
            'Unable to load bookings.'
          );
        }
      });
      return;
    }

    this.bookingService.getUserBookings(page, 10).subscribe({
      next: bookings => {
        this.bookingsLoading.set(false);
        this.bookings.set(bookings);
      },
      error: err => {
        this.bookingsLoading.set(false);
        const errorBody = err?.error;
        this.bookingsError.set(
          errorBody?.detail ??
          errorBody?.message ??
          errorBody?.error ??
          err?.message ??
          'Unable to load bookings.'
        );
      }
    });
  }

  applyFilter(): void {
    if (!this.filterFrom() || !this.filterTo()) {
      return;
    }
    this.isFiltering.set(true);
    this.loadBookings(1);
  }

  clearFilter(): void {
    this.filterFrom.set('');
    this.filterTo.set('');
    this.isFiltering.set(false);
    this.loadBookings(1);
  }

  viewDetails(bookingId: number | string | null): void {
    if (bookingId == null) {
      return;
    }
    this.router.navigate(['/bookings', bookingId]);
  }

  openTab(tab: 'profile' | 'bookings' | 'settings'): void {
    this.activeTab.set(tab);
    if (tab === 'bookings') {
      this.loadBookings(1);
    }
  }

  toggleBookingDetails(bookingId: number | string | null): void {
    this.selectedBookingId.set(this.selectedBookingId() === bookingId ? null : bookingId);
  }

  deleteBooking(bookingId: number | string | null): void {
    if (bookingId == null) {
      return;
    }

    this.deletingBookingId.set(bookingId);
    this.bookingsError.set('');

    this.bookingService.deleteBooking(bookingId).subscribe({
      next: () => {
        this.deletingBookingId.set(null);
        this.selectedBookingId.set(null);
        this.loadBookings(this.bookingsPage());
      },
      error: (err) => {
        this.deletingBookingId.set(null);
        const errorBody = err?.error;
        this.bookingsError.set(
          errorBody?.detail ??
          errorBody?.message ??
          errorBody?.error ??
          err?.message ??
          'Unable to delete booking.'
        );
      }
    });
  }

  saveChanges(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    this.isLoading.set(true);
    const payload: UserProfile = {
      pictureUrl: this.pictureUrl(),
      firstName: this.firstName(),
      lastName: this.lastName(),
      email: this.email(),
      phone: this.phone(),
      address: this.address(),
      dateOfBirth: this.dateOfBirth()
    };

    this.auth.updateUser(payload).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.successMessage.set('Profile updated successfully.');
      },
      error: (err) => {
        this.isLoading.set(false);
        const errorBody = err?.error;
        this.errorMessage.set(
          errorBody?.detail ??
          errorBody?.message ??
          errorBody?.error ??
          err?.message ??
          'Unable to update profile.'
        );
      }
    });
  }

  changePassword(): void {
    this.passwordErrorMessage.set('');
    this.passwordSuccessMessage.set('');

    const currentPassword = this.currentPassword();
    const newPassword = this.newPassword();

    if (!currentPassword || !newPassword) {
      this.passwordErrorMessage.set('Please enter both current and new passwords.');
      return;
    }

    this.passwordLoading.set(true);

    const payload: ChangePasswordPayload = {
      currentPassword,
      newPassword
    };

    this.auth.changePassword(payload).subscribe({
      next: () => {
        this.passwordLoading.set(false);
        this.auth.logout();
      },
      error: (err) => {
        this.passwordLoading.set(false);
        const errorBody = err?.error;
        this.passwordErrorMessage.set(
          errorBody?.detail ??
          errorBody?.message ??
          errorBody?.error ??
          err?.message ??
          'Unable to update password.'
        );
      }
    });
  }

  openDeleteConfirmation(): void {
    this.deleteErrorMessage.set('');
    this.confirmDelete.set(true);
  }

  cancelDelete(): void {
    this.confirmDelete.set(false);
  }

  deleteAccount(): void {
    this.deleteErrorMessage.set('');
    this.deleteLoading.set(true);

    this.auth.deleteProfile().subscribe({
      next: () => {
        this.deleteLoading.set(false);
        this.confirmDelete.set(false);
        this.auth.logout();
      },
      error: (err) => {
        this.deleteLoading.set(false);
        const errorBody = err?.error;
        this.deleteErrorMessage.set(
          errorBody?.detail ??
          errorBody?.message ??
          errorBody?.error ??
          err?.message ??
          'Unable to delete account.'
        );
      }
    });
  }

  signOut(): void {
    this.auth.logout();
  }
}
