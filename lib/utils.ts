import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Argentina/Buenos_Aires',
  })
}

export function phaseLabel(phase: string): string {
  const map: Record<string, string> = {
    GROUP: 'Fase de Grupos',
    ROUND_OF_32: 'Ronda de 32',
    ROUND_OF_16: 'Octavos de Final',
    QUARTERFINAL: 'Cuartos de Final',
    SEMIFINAL: 'Semifinal',
    THIRD_PLACE: 'Tercer Puesto',
    FINAL: 'Final',
  }
  return map[phase] ?? phase
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    PENDING: 'Pendiente',
    APPROVED: 'Aprobada',
    REJECTED: 'Rechazada',
    DRAFT: 'Borrador',
    SUBMITTED: 'Enviada',
    SCORED: 'Puntuada',
  }
  return map[status] ?? status
}
