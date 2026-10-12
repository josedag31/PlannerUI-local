/** Una fecha límite guardada a medianoche es una fecha sin hora (el
 * formulario solo pone hora si se rellena el campo de hora). */
export function tieneHora(d: Date) {
  return d.getHours() !== 0 || d.getMinutes() !== 0;
}

/** Hasta cuándo cuenta como "a tiempo": si la fecha límite no tiene hora, todo
 * ese día (completarla a las 18:00 del mismo día va a tiempo); si la tiene,
 * esa hora exacta. Lo usan el KPI "% a tiempo" del dashboard y la página
 * Hechas, para que nunca den veredictos distintos de la misma tarea. */
export function limiteEfectivo(due: Date) {
  if (tieneHora(due)) return due;
  const r = new Date(due);
  r.setHours(23, 59, 59, 999);
  return r;
}

export function completadaATiempo(doneAt: Date, dueDate: Date) {
  return doneAt <= limiteEfectivo(dueDate);
}
