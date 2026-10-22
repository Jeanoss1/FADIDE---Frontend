import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { map } from 'rxjs';
import { AuthService, ROL_LABEL } from '../../core/services/auth.service';
import { RolNombre } from '../../model/rol';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  roles: RolNombre[];
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const ALL: RolNombre[] = ['ADMIN', 'GESTOR', 'SUPERVISOR'];

// Menú agrupado como en el prototipo: Entidades, Campo y Administración
const MENU: MenuSection[] = [
  {
    title: 'General',
    items: [{ label: 'Dashboard', icon: 'space_dashboard', route: '/pages/dashboard', roles: ALL }],
  },
  {
    title: 'Entidades',
    items: [
      { label: 'Clientes', icon: 'groups', route: '/pages/cliente', roles: ALL },
      { label: 'Contratistas', icon: 'engineering', route: '/pages/contratista', roles: ALL },
      { label: 'Licencias', icon: 'description', route: '/pages/licencia', roles: ALL },
      { label: 'Obras', icon: 'apartment', route: '/pages/proyecto', roles: ALL },
      { label: 'Contratos', icon: 'assignment', route: '/pages/contrato', roles: ALL },
    ],
  },
  {
    title: 'Campo',
    items: [{ label: 'Supervisión', icon: 'fact_check', route: '/pages/supervision', roles: ALL }],
  },
  {
    title: 'Administración',
    items: [
      { label: 'Pagos', icon: 'payments', route: '/pages/pago', roles: ALL },
      { label: 'Penalidades', icon: 'report_problem', route: '/pages/penalidad', roles: ALL },
      { label: 'Usuarios', icon: 'manage_accounts', route: '/pages/usuario', roles: ['ADMIN'] },
    ],
  },
];

@Component({
  imports: [
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatToolbarModule,
    MatTooltipModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet
  ],
  selector: 'app-layout',
  styleUrl: './layout.component.css',
  templateUrl: './layout.component.html',
})
export class LayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly breakpoint = inject(BreakpointObserver);

  protected $session = this.authService.$session;
  protected $isMobile = toSignal(
    this.breakpoint.observe('(max-width: 960px)').pipe(map(r => r.matches)),
    { initialValue: false }
  );

  protected $menu = computed(() => {
    const rol = this.authService.$rol();
    return MENU
      .map(section => ({ ...section, items: section.items.filter(i => i.roles.includes(rol)) }))
      .filter(section => section.items.length > 0);
  });

  protected $initials = computed(() => {
    const name = this.$session()?.nombreCompleto ?? '';
    return name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('');
  });

  protected $rolLabel = computed(() => {
    const rol = this.authService.$rol();
    return rol ? ROL_LABEL[rol] : '';
  });

  logout() {
    this.authService.logout();
  }
}
