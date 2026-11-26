import { Component, computed, effect, inject, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { RouterLink, RouterOutlet } from '@angular/router';
import { Usuario } from '../../model/usuario';
import { UsuarioService } from '../../services/usuario.service';
import { PagedList } from '../../shared/paged-list';
import { FiltrosListadoComponent, SelectFiltro } from '../../shared/filtros-listado/filtros-listado.component';
import { RolService } from '../../services/rol.service';

// Solo ADMIN (el backend restringe /api/usuarios a ese rol)
@Component({
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressBarModule,
    FiltrosListadoComponent,
    MatSortModule,
    MatTableModule,
    RouterLink,
    RouterOutlet
  ],
  selector: 'app-usuario',
  templateUrl: './usuario.component.html',
})
export class UsuarioComponent {
  private readonly usuarioService = inject(UsuarioService);
  // Paginación, búsqueda, filtros y orden en el servidor
  protected readonly list = new PagedList(this.usuarioService, { sort: 'nombreCompleto,asc', sortMap: { nombreRol: 'rol.nombre' } });
  private readonly $roles = toSignal(inject(RolService).findAll(), { initialValue: [] });
  protected readonly $filtros = computed<SelectFiltro[]>(() => [
    { key: 'idRol', label: 'Rol', options: this.$roles().map(r => ({ value: r.idRol, label: r.nombre })) },
    { key: 'estado', label: 'Estado', options: [{ value: 'ACTIVO', label: 'Activo' }, { value: 'INACTIVO', label: 'Inactivo' }] }
  ]);
  private readonly snackBar = inject(MatSnackBar);

  protected $usuarios = this.usuarioService.$dataChange;
  protected displayedColumns = ['nombreCompleto', 'correo', 'documento', 'nombreRol', 'activo'];

  constructor() {
    effect(() => {
      const message = this.usuarioService.$messageChange();
      if (message) {
        this.snackBar.open(message, 'OK', { duration: 2500, horizontalPosition: 'right', verticalPosition: 'top', panelClass: 'snack-ok' });
        untracked(() => this.usuarioService.setMessageChange(''));
      }
    });
  }
}
