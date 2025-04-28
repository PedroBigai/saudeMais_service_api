import { Metricas } from "./loadUserData";

export function calcularStreak(metricas: Metricas[], tipo: 'calorias' | 'hidratacao'): number {
    let streak = 0;
  
    for (const metrica of metricas) {
      const meta = metrica[tipo].meta;
      const consumido = metrica[tipo].consumido;
  
      // Se não tiver valor de meta ou consumido, ignora o dia
      if (meta == null || consumido == null) {
        break;
      }
  
      // Permite até 100 abaixo da meta
      if (consumido >= (meta - 100)) {
        streak++;
      } else {
        break; // Quebrou a sequência
      }
    }
  
    return streak;
  }