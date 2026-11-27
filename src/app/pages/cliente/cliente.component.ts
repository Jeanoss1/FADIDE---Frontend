import { Component, computed, effect, inject, untracked } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter, switchMap } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { getErrorMessage } from '../../core/utils/http-error';
import { Cliente } from '../../model/cliente';
import { ClienteService } from '../../services/cliente.service';
import { openConfirm } from '../../shared/confirm-dialog/confirm-dialog.component';
import { ClienteDialogComponent } from './cliente-dialog/cliente-dialog.component';
import { PagedList } from '../../shared/paged-list';

@Component({
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatSortModule,
    MatTableModule,
    MatTooltipModule
  ],
  selector: 'app-cliente',
  templateUrl: './cliente.component.html',
})
export class ClienteComponent {
  private readonly clienteService = inject(ClienteService);
  // Paginación, búsqueda, filtros y orden en el servidor
  protected readonly list = new PagedList(this.clienteService, { sort: 'razonSocial,asc' });
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  protected $clientes = this.clienteService.$dataChange;
  protected $canEdit = computed(() => this.authService.hasRole('ADMIN', 'GESTOR'));
  protected $displayedColumns = computed(() => {
    const cols = ['razonSocial', 'ruc', 'direccion', 'telefono'];
    return this.$canEdit() ? [...cols, 'actions'] : cols;
  });

  constructor() {
    effect(() => {
      const message = this.clienteService.$messageChange();
      if (message) {
        this.snackBar.open(message, 'OK', { duration: 2500, horizontalPosition: 'right', verticalPosition: 'top', panelClass: 'snack-ok' });
        untracked(() => this.clienteService.setMessageChange(''));
      }
    });
  }

  // Abre el modal: sin cliente = registrar, con cliente = editar
  openDialog(cliente?: Cliente) {
    this.dialog.open(ClienteDialogComponent, {
      data: cliente ?? null,
      width: '640px',
      maxWidth: '95vw',
      disableClose: true
    });
  }

  delete(cliente: Cliente) {
    openConfirm(this.dialog, {
      title: 'Eliminar cliente',
      message: `¿Seguro que deseas eliminar a "${cliente.razonSocial}"? Esta acción no se puede deshacer.`
    }).pipe(
      filter(Boolean),
      switchMap(() => this.clienteService.delete(cliente.idCliente))
    ).subscribe({
      next: () => {
        // Mutación silenciosa: se quita la fila del signal sin volver a consultar al backend
        this.clienteService.removeLocal(c => c.idCliente === cliente.idCliente);
        this.clienteService.setMessageChange('Cliente eliminado');
      },
      error: err => this.snackBar.open(getErrorMessage(err), 'OK', { duration: 4000, panelClass: 'snack-error' })
    });
  }
}
