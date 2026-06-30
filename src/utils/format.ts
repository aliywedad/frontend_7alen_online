export function money(value: number | null | undefined) {
  return `MRU ${Number(value ?? 0).toLocaleString()}`
}

export function shortId(id: string) {
  return `#${id.slice(-6).toUpperCase()}`
}

export function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString()
}

export function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString()
}
