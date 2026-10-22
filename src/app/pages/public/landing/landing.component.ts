import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  imports: [MatButtonModule, MatIconModule, RouterLink],
  selector: 'app-landing',
  styleUrl: './landing.component.css',
  templateUrl: './landing.component.html',
})
export class LandingComponent {
  protected readonly authService = inject(AuthService);
  protected $menuOpen = signal(false);
  protected year = new Date().getFullYear();

  protected features = [
    {
      icon: 'photo_camera',
      title: 'Supervisión de Campo',
      text: 'Control mediante cuadernos de obra digitales y registros fotográficos en tiempo real.'
    },
    {
      icon: 'event_available',
      title: 'Gestión de Plazos',
      text: 'Monitoreo automatizado del avance cronológico para evitar penalidades.'
    },
    {
      icon: 'verified_user',
      title: 'Conformidad Transparente',
      text: 'Liquidaciones y aprobaciones basadas en evidencias técnicas objetivas.'
    }
  ];

  protected services = [
    { icon: 'assignment', title: 'Gestión de contratos', text: 'Registro de contratos, montos, plazos y estados con alertas de vencimiento.' },
    { icon: 'apartment', title: 'Control de obras', text: 'Obras por cliente, contratistas asignados y licencias de edificación.' },
    { icon: 'fact_check', title: 'Bitácora de supervisión', text: 'Avance físico porcentual con evidencias y observaciones de campo.' },
    { icon: 'payments', title: 'Pagos y conformidad', text: 'Seguimiento de pagos por contrato y emisión de conformidad del servicio.' },
    { icon: 'report_problem', title: 'Penalidades', text: 'Aplicación de penalidades en UIT según las cláusulas contractuales.' },
    { icon: 'person_pin', title: 'Portal del cliente', text: 'El cliente consulta el avance de su obra desde cualquier dispositivo.' }
  ];

  protected stats = [
    { value: '100%', label: 'Trazabilidad documental' },
    { value: '24/7', label: 'Acceso a la información' },
    { value: '2 UIT', label: 'Riesgo de penalidad controlado' }
  ];
}
