import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth-service/auth.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [[FormsModule, RouterLink, CommonModule]],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent {
  user: { id: number; username: string; credits: number } | null = null;

  constructor(private router: Router, private authService: AuthService) {}

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']); // Redirigir al login después de cerrar sesión
  }

  irARegistro() {
    this.router.navigate(['/register']);
  }
  
  irAProfile() {
    this.router.navigate(['/profile']);
  }

  irALogin() {
    this.router.navigate(['/login']);
  }
  irAContacta() {
    this.router.navigate(['/contact']);
  }
}
