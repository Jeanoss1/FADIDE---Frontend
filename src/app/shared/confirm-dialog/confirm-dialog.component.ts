import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmData {
  title: string;
  message: string;
  confirmText?: string;
}

@Component({
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  selector: 'app-confirm-dialog',
  template: `
    <h2 mat-dialog-title class="title"><mat-icon>warning_amber</mat-icon> {{ data.title }}</h2>
    <mat-dialog-content>{{ data.message }}</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">Cancelar</button>
      <button mat-flat-button class="cancel-button" [mat-dialog-close]="true">
        {{ data.confirmText ?? 'Sí, eliminar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `.title { display: flex; align-items: center; gap: 8px; } .title mat-icon { color: var(--fd-danger); }`,
})
export class ConfirmDialogComponent {
  protected readonly data = inject<ConfirmData>(MAT_DIALOG_DATA);
}

// Abre el diálogo y devuelve un observable con true/false
export function openConfirm(dialog: MatDialog, data: ConfirmData) {
  return dialog.open(ConfirmDialogComponent, { data, width: '420px' }).afterClosed();
}
