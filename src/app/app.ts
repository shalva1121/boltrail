import { Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { Header } from './header/header';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('project4.0');

  private readonly router = inject(Router);
  private readonly noHeaderRoutes = ['/register', '/sign-in'];
  showHeader = signal(!this.noHeaderRoutes.includes(this.router.url));

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => {
        this.showHeader.set(!this.noHeaderRoutes.includes(event.urlAfterRedirects));
      });
  }
}
