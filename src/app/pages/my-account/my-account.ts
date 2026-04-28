import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-my-account',
  standalone: true,
  imports: [CommonModule, RouterModule, MatSidenavModule, MatListModule, MatIconModule, MatCardModule],
  templateUrl: './my-account.html',
  styleUrl: './my-account.scss',
})
export class MyAccountPage implements OnInit {
  user: User | null = null;
  activeRoute = '';
  currentUrl = '';
  isOrdersPage = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe((user: User | null) => {
      this.user = user;
    });

    // Track active route and current URL
    this.router.events.subscribe(() => {
      this.updateActiveRoute();
      this.currentUrl = this.router.url;
      this.isOrdersPage = this.router.url.includes('/account/orders');
    });
    this.updateActiveRoute();
    this.currentUrl = this.router.url;
    this.isOrdersPage = this.router.url.includes('/account/orders');
  }

  private updateActiveRoute() {
    const urlSegments = this.router.url.split('/');
    this.activeRoute = urlSegments[urlSegments.length - 1] || 'profile';
  }

  navigate(path: string) {
    if (path === '') {
      this.router.navigate(['/account']);
    } else {
      this.router.navigate(['/account', path]);
    }
  }

  isActive(path: string): boolean {
    // For empty path (profile), check if URL is exactly /account or ends with /account
    if (path === '') {
      return this.currentUrl === '/account';
    }
    // For other paths, check if URL ends with the path segment
    return this.currentUrl.endsWith('/' + path);
  }
}
