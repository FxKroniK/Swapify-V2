import { Routes } from '@angular/router';
import { RegisterComponent } from './features/auth/register/register.component';
import { LoginComponent } from './features/auth/login/login.component';
import { MainComponent } from './features/home/main/main.component';
import { ProfileComponent } from './features/home/profile/profile.component';
import { CreateProductComponent } from './features/home/products/create-product/create-product.component';
import { ContactComponent } from './features/home/contact/contact.component';
import { EditProductComponent } from './features/home/products/edit-product/edit-product.component';
import { ChatComponent } from './features/home/chat/chat.component';
import { ResetPasswordComponent } from './features/auth/reset-password/reset-password.component';
import { ProductDetailComponent } from './features/home/product-detail/product-detail.component';
import { CreateReviewComponent } from './features/home/create-review/create-review.component';
import { FavoritesComponent } from './features/home/favorites/favorites.component'; // Importar FavoritesComponent

export const routes: Routes = [
  { path: 'main', component: MainComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: '/main', pathMatch: 'full' },
  { path: 'home', redirectTo: '/main', pathMatch: 'full' },
  { path: 'profile', component: ProfileComponent },
  { path: 'profile/:userId', component: ProfileComponent },
  { path: 'viewOtherUser/:nickname', component: ProfileComponent },
  { path: 'create', component: CreateProductComponent },
  { path: 'edit/:id', component: EditProductComponent },
  { path: 'contact', component: ContactComponent },
  { path: 'chat/:id', component: ChatComponent },
  { path: 'chat', component: ChatComponent },
  { path: 'resetPassword', component: ResetPasswordComponent },
  { path: 'product/:id', component: ProductDetailComponent },
  { path: 'createReview/:productId', component: CreateReviewComponent },
  { path: 'favorites', component: FavoritesComponent }, // Nueva ruta para favoritos
  { path: '**', redirectTo: '/main' }
];