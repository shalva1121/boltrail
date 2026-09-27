import { Component, inject, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { ThemeService } from '../../theme.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './sign-in.html',
  styleUrl: '../auth.css'
})
export class SignIn {
  theme = inject(ThemeService);
  private auth = inject(AuthService);
  private router = inject(Router);

  email = signal('');
  password = signal('');
  rememberMe = signal(false);

  isLoading = signal(false);
  errorMessage = signal('');

  isForgotPassword = signal(false);
  forgotEmail = signal('');
  forgotIsLoading = signal(false);
  forgotErrorMessage = signal('');
  forgotSuccessMessage = signal('');

  toggleTheme(): void {
    this.theme.toggle();
  }

  showForgotPassword(): void {
    this.isForgotPassword.set(true);
    this.forgotEmail.set(this.email());
    this.forgotErrorMessage.set('');
    this.forgotSuccessMessage.set('');
  }

  cancelForgotPassword(): void {
    this.isForgotPassword.set(false);
    this.forgotErrorMessage.set('');
    this.forgotSuccessMessage.set('');
  }

  onForgotPasswordSubmit(): void {
    this.forgotErrorMessage.set('');
    this.forgotSuccessMessage.set('');

    const email = this.forgotEmail().trim();

    if (!email) {
      this.forgotErrorMessage.set('Please enter your email.');
      return;
    }

    this.forgotIsLoading.set(true);

    this.auth.forgotPassword(email).subscribe({
      next: () => {
        this.forgotIsLoading.set(false);
        this.forgotSuccessMessage.set('Password reset instructions have been sent to your email.');
      },
      error: (err) => {
        this.forgotIsLoading.set(false);
        const msg =
          err?.error?.message ??
          err?.error?.error ??
          err?.message ??
          'Could not send reset email. Please try again.';
        this.forgotErrorMessage.set(msg);
      }
    });
  }

  onSubmit(): void {
    this.errorMessage.set('');

    const email = this.email().trim();
    const password = this.password();

    if (!email || !password) {
      this.errorMessage.set('Please enter your email and password.');
      return;
    }

    this.isLoading.set(true);

    this.auth.login({ email, password }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg =
          err?.error?.message ??
          err?.error?.error ??
          err?.message ??
          'Invalid email or password.';
        this.errorMessage.set(msg);
      }
    });
  }
}
