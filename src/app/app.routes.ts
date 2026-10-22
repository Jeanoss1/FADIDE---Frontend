import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/guards/auth.guard';
import { LandingComponent } from './pages/public/landing/landing.component';
import { LoginComponent } from './pages/public/login/login.component';
import { RegisterComponent } from './pages/public/register/register.component';
import { LayoutComponent } from './pages/layout/layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ClienteComponent } from './pages/cliente/cliente.component';
import { ClienteEditComponent } from './pages/cliente/cliente-edit/cliente-edit.component';
import { ContratistaComponent } from './pages/contratista/contratista.component';
import { ContratistaEditComponent } from './pages/contratista/contratista-edit/contratista-edit.component';
import { ProyectoComponent } from './pages/proyecto/proyecto.component';
import { ProyectoEditComponent } from './pages/proyecto/proyecto-edit/proyecto-edit.component';
import { LicenciaComponent } from './pages/licencia/licencia.component';
import { LicenciaEditComponent } from './pages/licencia/licencia-edit/licencia-edit.component';
import { ContratoComponent } from './pages/contrato/contrato.component';
import { ContratoEditComponent } from './pages/contrato/contrato-edit/contrato-edit.component';
import { ContratoDetailComponent } from './pages/contrato/contrato-detail/contrato-detail.component';
import { SupervisionComponent } from './pages/supervision/supervision.component';
import { SupervisionEditComponent } from './pages/supervision/supervision-edit/supervision-edit.component';
import { SupervisionDetailComponent } from './pages/supervision/supervision-detail/supervision-detail.component';
import { PagoComponent } from './pages/pago/pago.component';
import { PagoEditComponent } from './pages/pago/pago-edit/pago-edit.component';
import { PenalidadComponent } from './pages/penalidad/penalidad.component';
import { PenalidadEditComponent } from './pages/penalidad/penalidad-edit/penalidad-edit.component';
import { UsuarioComponent } from './pages/usuario/usuario.component';
import { UsuarioEditComponent } from './pages/usuario/usuario-edit/usuario-edit.component';
import { ForbiddenComponent } from './pages/forbidden/forbidden.component';
import { MiObraComponent } from './pages/portal/mi-obra/mi-obra.component';

const STAFF = ['ADMIN', 'GESTOR', 'SUPERVISOR'];
const GESTION = ['ADMIN', 'GESTOR'];

export const routes: Routes = [
    { path: '', component: LandingComponent, title: 'SISCO | FADIDE' },
    { path: 'login', component: LoginComponent, canActivate: [guestGuard], title: 'Iniciar sesión | SISCO' },
    { path: 'register', component: RegisterComponent, canActivate: [guestGuard], title: 'Registrarse | SISCO' },
    {
        path: 'portal', component: MiObraComponent, canActivate: [authGuard, roleGuard],
        data: { roles: ['CLIENTE'] }, title: 'Mi Obra | SISCO'
    },
    {
        path: 'pages', component: LayoutComponent, canActivate: [authGuard, roleGuard], data: { roles: STAFF },
        canActivateChild: [roleGuard],
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            { path: 'dashboard', component: DashboardComponent, title: 'Dashboard | SISCO' },
            {
                path: 'cliente', component: ClienteComponent, title: 'Clientes | SISCO',
                children: [
                    { path: 'new', component: ClienteEditComponent, data: { roles: GESTION } },
                    { path: 'edit/:id', component: ClienteEditComponent, data: { roles: GESTION } }
                ]
            },
            {
                path: 'contratista', component: ContratistaComponent, title: 'Contratistas | SISCO',
                children: [
                    { path: 'new', component: ContratistaEditComponent, data: { roles: GESTION } },
                    { path: 'edit/:id', component: ContratistaEditComponent, data: { roles: GESTION } }
                ]
            },
            {
                path: 'proyecto', component: ProyectoComponent, title: 'Obras | SISCO',
                children: [
                    { path: 'new', component: ProyectoEditComponent, data: { roles: GESTION } },
                    { path: 'edit/:id', component: ProyectoEditComponent, data: { roles: GESTION } }
                ]
            },
            {
                path: 'licencia', component: LicenciaComponent, title: 'Licencias | SISCO',
                children: [
                    { path: 'new', component: LicenciaEditComponent, data: { roles: GESTION } },
                    { path: 'edit/:id', component: LicenciaEditComponent, data: { roles: GESTION } }
                ]
            },
            {
                path: 'contrato', component: ContratoComponent, title: 'Contratos | SISCO',
                children: [
                    { path: 'new', component: ContratoEditComponent, data: { roles: GESTION } }
                ]
            },
            { path: 'contrato/detail/:id', component: ContratoDetailComponent, title: 'Detalle del contrato | SISCO' },
            {
                path: 'supervision', component: SupervisionComponent, title: 'Supervisión | SISCO',
                children: [
                    { path: 'new', component: SupervisionEditComponent, data: { roles: ['SUPERVISOR'] } },
                    { path: 'edit/:id', component: SupervisionEditComponent, data: { roles: ['SUPERVISOR'] } }
                ]
            },
            { path: 'supervision/detail/:id', component: SupervisionDetailComponent, title: 'Bitácora | SISCO' },
            {
                path: 'pago', component: PagoComponent, title: 'Pagos | SISCO',
                children: [
                    { path: 'new', component: PagoEditComponent, data: { roles: GESTION } }
                ]
            },
            {
                path: 'penalidad', component: PenalidadComponent, title: 'Penalidades | SISCO',
                children: [
                    { path: 'new', component: PenalidadEditComponent, data: { roles: GESTION } }
                ]
            },
            {
                path: 'usuario', component: UsuarioComponent, data: { roles: ['ADMIN'] }, title: 'Usuarios | SISCO',
                children: [
                    { path: 'new', component: UsuarioEditComponent }
                ]
            },
            { path: 'forbidden', component: ForbiddenComponent, title: 'Acceso denegado | SISCO' },
        ]
    },
    { path: '**', redirectTo: '' }
];
