import { Component, computed, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, RouterOutlet } from '@angular/router';
import { filter, switchMap, tap } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { getErrorMessage } from '../../core/utils/http-error';
import { Cliente } from '../../model/cliente';
import { ClienteService } from '../../services/cliente.service';
import { openConfirm } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatSortModule,
    MatTableModule,
    MatTooltipModule,
    RouterLink,
    RouterOutlet
  ],
  selector: 'app-cliente',
  templateUrl: './cliente.component.html',
})
export class ClienteComponent {
  private readonly clienteService = inject(ClienteService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  protected $dataSource = signal(new MatTableDataSource<Cliente>());
  protected $paginator = viewChild(MatPaginator);
  protected $sort = viewChild(MatSort);

  protected $clientes = this.clienteService.$dataChange;
  protected $canEdit = computed(() => this.authService.hasRole('ADMIN', 'GESTOR'));
  protected $displayedColumns = computed(() => {
    const cols = ['razonSocial', 'ruc', 'direccion', 'telefono'];
    return this.$canEdit() ? [...cols, 'actions'] : cols;
  });

  constructor() {
    this.clienteService.findAll().subscribe(data => this.clienteService.setDataChange(data));

    effect(() => {
      const ds = this.$dataSource();
      ds.data = this.$clientes();
      ds.paginator = this.$paginator();
      ds.sort = this.$sort();
    });

    effect(() => {
      const message = this.clienteService.$messageChange();
      if (message) {
        this.snackBar.open(message, 'OK', { duration: 2500, horizontalPosition: 'right', verticalPosition: 'top', panelClass: 'snack-ok' });
        untracked(() => this.clienteService.setMessageChange(''));
      }
    });
  }

  applyFilter(e: Event) {
    const filterValue = (e.target as HTMLInputElement).value;
    this.$dataSource().filter = filterValue.trim().toLowerCase();
  }

  delete(cliente: Cliente) {
    openConfirm(this.dialog, {
      title: 'Eliminar cliente',
      message: `¿Seguro que deseas eliminar a "${cliente.razonSocial}"? Esta acción no se puede deshacer.`
    }).pipe(
      filter(Boolean),
      switchMap(() => this.clienteService.delete(cliente.idCliente)),
      switchMap(() => this.clienteService.findAll()),
      tap(data => this.clienteService.setDataChange(data)),
      tap(() => this.clienteService.setMessageChange('Cliente eliminado'))
    ).subscribe({
      error: err => this.snackBar.open(getErrorMessage(err), 'OK', { duration: 4000, panelClass: 'snack-error' })
    });
  }
}
