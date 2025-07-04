import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ResetPasswordService } from '../../../services/reset-password/reset-password.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent {
  newPassword: string = '';
  confirmPassword: string = '';
  errorMessage: string = '';

  constructor(
    private resetPasswordService: ResetPasswordService,
    private router: Router
  ) {}

  onSubmit(): void {
    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      return;
    }

    const token = this.getTokenFromUrl();

    if (!token) {
      this.errorMessage = 'Token de recuperación no encontrado.';
      return;
    }

    this.resetPasswordService.confirmPasswordReset(token, this.newPassword).subscribe({
      next: () => {
        console.log('Contraseña restablecida exitosamente.');
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Error al restablecer la contraseña:', error);
        this.errorMessage = 'Ocurrió un error al restablecer la contraseña.';
      }
    });
  }

  private getTokenFromUrl(): string {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('token') || '';
  }
}
