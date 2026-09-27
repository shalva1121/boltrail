import { Component, inject, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { ThemeService } from '../../theme.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './register.html',
  styleUrl: '../auth.css'
})
export class Register {
  theme = inject(ThemeService);
  private auth = inject(AuthService);
  private router = inject(Router);

  firstName = signal('');
  lastName = signal('');
  email = signal('');
  password = signal('');
  code = signal('');
  isVerificationStep = signal(false);

  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  toggleTheme(): void {
    this.theme.toggle();
  }

  private isPasswordStrong(password: string): boolean {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

    return password.length >= 8 && hasUpperCase && hasLowerCase && hasSpecialChar;
  }

  onSubmit(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (this.isVerificationStep()) {
      const email = this.email().trim();
      const code = this.code().trim();

      if (!email || !code) {
        this.errorMessage.set('Please enter the verification code sent to your email.');
        return;
      }

      this.isLoading.set(true);
      this.auth.verifyEmail({ email, code }).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.successMessage.set('Email verified! Redirecting to sign-in...');
          setTimeout(() => this.router.navigate(['/sign-in']), 1000);
        },
        error: (err) => {
          this.isLoading.set(false);
          const errorBody = err?.error;
          const msg =
            errorBody?.detail ??
            errorBody?.message ??
            errorBody?.error ??
            errorBody?.errors?.code?.[0] ??
            err?.message ??
            'Verification failed. Please try again.';
          this.errorMessage.set(msg);
        }
      });

      return;
    }

    const firstName = this.firstName().trim();
    const lastName = this.lastName().trim();
    const email = this.email().trim();
    const password = this.password();

    if (!firstName || !lastName || !email || !password) {
      this.errorMessage.set('Please fill in all fields.');
      return;
    }

    if (!this.isPasswordStrong(password)) {
      this.errorMessage.set('Password must be at least 8 characters and include uppercase, lowercase, and a special character.');
      return;
    }

    this.isLoading.set(true);

    this.auth.register({ firstName, lastName, email, password }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.isVerificationStep.set(true);
        this.successMessage.set('Account created. Check your email for the verification code.');
      },
      error: (err) => {
        this.isLoading.set(false);
        const errorBody = err?.error;
        const msg =
          errorBody?.detail ??
          errorBody?.message ??
          errorBody?.error ??
          errorBody?.errors?.Password?.[0] ??
          err?.message ??
          'Registration failed. Please try again.';
        this.errorMessage.set(msg);
      }
    });
  }
}
