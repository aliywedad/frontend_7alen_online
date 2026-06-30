import { API_URL } from '../constants'

export async function apiFetch<T>(
  path: string,
  token: string,
  options: RequestInit = {},
): Promise<T> {
  const isFormData = options.body instanceof FormData
  const reqHeaders: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  }
  if (!isFormData) reqHeaders['Content-Type'] = 'application/json'
  Object.assign(reqHeaders, options.headers ?? {})

  const response = await fetch(`${API_URL}${path}`, { ...options, headers: reqHeaders })
  const json = await response.json().catch(() => ({})) as Record<string, unknown>
  if (!response.ok) throw new Error((json['error'] as string | undefined) ?? 'Request failed')
  return json as T
}
