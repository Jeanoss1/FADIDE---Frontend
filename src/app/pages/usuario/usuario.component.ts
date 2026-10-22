import { Component, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { RouterLink, RouterOutlet } from '@angular/router';
import { Usuario } from '../../model/usuario';
import { UsuarioService } from '../../services/usuario.service';

// Solo ADMIN (el backend restringe /api/usuarios a ese rol)
@Component({
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
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
  private readonly snackBar = inject(MatSnackBar);

  protected $dataSource = signal(new MatTableDataSource<Usuario>());
  protected $paginator = viewChild(MatPaginator);
  protected $sort = viewChild(MatSort);

  protected $usuarios = this.usuarioService.$dataChange;
  protected displayedColumns = ['nombreCompleto', 'correo', 'documento', 'nombreRol', 'activo'];

  constructor() {
    this.usuarioService.findAll().subscribe(data => this.usuarioService.setDataChange(data));

    effect(() => {
      const ds = this.$dataSource();
      ds.data = this.$usuarios();
      ds.paginator = this.$paginator();
      ds.sort = this.$sort();
    });

    effect(() => {
      const message = this.usuarioService.$messageChange();
      if (message) {
        this.snackBar.open(message, 'OK', { duration: 2500, horizontalPosition: 'right', verticalPosition: 'top', panelClass: 'snack-ok' });
        untracked(() => this.usuarioService.setMessageChange(''));
      }
    });
  }

  applyFilter(e: Event) {
    const filterValue = (e.target as HTMLInputElement).value;
    this.$dataSource().filter = filterValue.trim().toLowerCase();
  }
}
