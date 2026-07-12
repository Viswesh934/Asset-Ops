const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api"

export class ApiError extends Error {
  status: number
  info: unknown

  constructor(message: string, status: number, info: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.info = info
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`
  
  const headers = new Headers(options.headers)
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json")
  }

  // Inject JWT authorization token if stored
  const token = localStorage.getItem("token")
  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  const config: RequestInit = {
    ...options,
    headers,
  }

  const response = await fetch(url, config)

  // Central body parsing
  const contentType = response.headers.get("content-type")
  const body: unknown = contentType && contentType.includes("application/json")
    ? await response.json()
    : await response.text()

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`
    if (body && typeof body === "object") {
      const bodyObj = body as Record<string, unknown>
      if (typeof bodyObj.error === "string") {
        errorMessage = bodyObj.error
      } else if (typeof bodyObj.message === "string") {
        errorMessage = bodyObj.message
      }
    } else if (typeof body === "string" && body.trim().length > 0) {
      errorMessage = body
    }
    
    throw new ApiError(errorMessage, response.status, body)
  }

  return body as T
}

export const api = {
  get: <T>(endpoint: string, options?: RequestInit) => 
    request<T>(endpoint, { ...options, method: "GET" }),
    
  post: <T>(endpoint: string, body?: unknown, options?: RequestInit) => 
    request<T>(endpoint, { 
      ...options, 
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body) 
    }),
    
  put: <T>(endpoint: string, body?: unknown, options?: RequestInit) => 
    request<T>(endpoint, { 
      ...options, 
      method: "PUT",
      body: body instanceof FormData ? body : JSON.stringify(body) 
    }),
    
  patch: <T>(endpoint: string, body?: unknown, options?: RequestInit) => 
    request<T>(endpoint, { 
      ...options, 
      method: "PATCH",
      body: body instanceof FormData ? body : JSON.stringify(body) 
    }),
    
  delete: <T>(endpoint: string, options?: RequestInit) => 
    request<T>(endpoint, { ...options, method: "DELETE" }),
}

