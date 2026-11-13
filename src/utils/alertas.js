// Presentación de las alertas del backend (tb_alerta), compartida por la campana y el Dashboard.

const TIPOS = {
  VENCIMIENTO: { label: 'Vencimiento', icon: 'mdi-calendar-alert', color: '#B42318' },
  SIN_VENTAS: { label: 'Días sin ventas', icon: 'mdi-cart-off', color: '#B7791F' },
  INFORMATIVA: { label: 'Informativa', icon: 'mdi-information-outline', color: '#2563EB' },
};

export function alertaTipo(tipo) {
  return TIPOS[tipo] || { label: tipo || 'Alerta', icon: 'mdi-bell-outline', color: '#6B6F76' };
}

// "hace 5 min", "hace 3 h", "hace 2 días"; después de una semana, la fecha.
export function haceCuanto(value) {
  if (!value) return '';
  const minutos = Math.max(0, Math.round((Date.now() - new Date(value)) / 60000));
  if (minutos < 1) return 'ahora';
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.round(horas / 24);
  if (dias <= 7) return dias === 1 ? 'ayer' : `hace ${dias} días`;
  return new Date(value).toLocaleDateString('es-PE', { dateStyle: 'short' });
}

// Lleva a SIRE → Ventas con el cliente (y el periodo, si la alerta tiene uno) ya elegidos.
export function alertaLink(alerta) {
  const query = { ruc: alerta.clienteRuc };
  if (alerta.periodo) query.periodo = alerta.periodo;
  return { path: '/sire/ventas', query };
}
