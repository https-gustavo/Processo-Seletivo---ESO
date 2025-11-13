export function formatVBucks(value: number | null | undefined): string {
  if (typeof value !== 'number' || !isFinite(value)) return 'N/D'
  return new Intl.NumberFormat('pt-BR').format(value)
}

