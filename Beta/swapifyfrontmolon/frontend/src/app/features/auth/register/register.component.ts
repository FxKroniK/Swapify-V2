import { Component } from '@angular/core';
import { AuthService } from '../../../services/auth-service/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  useremail: string = '';
  nickname: string = '';
  password: string = '';
  confirmPassword: string = '';
  passwordMismatch: boolean = false; // Nueva propiedad para controlar si las contraseñas coinciden
  error: string | null = null;
  successMessage: string | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    console.log('onSubmit ejecutado', this.useremail, this.nickname, this.password);
    this.error = null;
    this.successMessage = null;
    this.passwordMismatch = false; // Reiniciar passwordMismatch

    // Validar campos vacíos
    if (!this.useremail || !this.nickname || !this.password || !this.confirmPassword) {
      this.error = 'Por favor, complete todos los campos.';
      console.log('Campos incompletos');
      return;
    }

    // Validar que las contraseñas coincidan
    if (this.password !== this.confirmPassword) {
      this.passwordMismatch = true; // Establecer passwordMismatch a true
      console.log('Las contraseñas no coinciden');
      alert('Las contraseñas no coinciden. Por favor, verifica e inténtalo de nuevo.');
      return;
    }

    const registerData = {
      username: this.nickname,
      useremail: this.useremail,
      password: this.password,
    };

    console.log('Enviando datos:', registerData);
    this.authService.register(registerData).subscribe({
      next: (response) => {
        console.log('Respuesta del backend:', response);
        this.successMessage = '¡Registro exitoso! Redirigiendo al login...';
        this.useremail = '';
        this.nickname = '';
        this.password = '';
        this.confirmPassword = '';
        setTimeout(() => this.router.navigate(['/login']), 2000); // Redirigir después de 2 segundos
      },
      error: (err) => {
        console.log('Error del backend:', err);
        this.error = 'Error al registrar: ' + (err.error?.message || 'Inténtalo de nuevo.');
      }
    });
  }

  irAMain() {
    this.router.navigate(['/main']);
  }
}