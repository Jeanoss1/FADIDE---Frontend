import { Component, inject } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { RouterOutlet } from '@angular/router';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  constructor() {
    // Usa la variante "outlined" de Material Icons en todos los <mat-icon>
    inject(MatIconRegistry).setDefaultFontSetClass('material-icons-outlined');
  }
}
