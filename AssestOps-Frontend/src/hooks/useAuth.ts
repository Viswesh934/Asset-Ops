import { useState } from "react"
import { api, ApiError } from "../utils/api"

export function useAuth() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [tempPassword, setTempPassword] = useState<string | null>(null)

  const resetState = () => {
    setError(null)
    setSuccessMsg(null)
    setTempPassword(null)
  }

  const login = async (email: string, password: string): Promise<{ accessToken: string; user: string } | null> => {
    setLoading(true)
    setError(null)
    setSuccessMsg(null)
    setTempPassword(null)

    try {
      const response = await api.post<{
        user: string
        userId: string
        accessToken: string
        roles: string[]
      }>("/login", { email, password })

      return {
        accessToken: response.accessToken,
        user: response.user,
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError("An unexpected network error occurred.")
      }
      return null
    } finally {
      setLoading(false)
    }
  }

  const signup = async (email: string, password: string, username: string, name: string): Promise<boolean> => {
    setLoading(true)
    setError(null)
    setSuccessMsg(null)
    setTempPassword(null)

    try {
      await api.post("/signup", {
        email,
        password,
        username,
        name,
      })
      setSuccessMsg("Account created successfully! You can now log in.")
      return true
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError("An unexpected network error occurred.")
      }
      return false
    } finally {
      setLoading(false)
    }
  }

  const forgotPassword = async (email: string): Promise<boolean> => {
    setLoading(true)
    setError(null)
    setSuccessMsg(null)
    setTempPassword(null)

    try {
      const response = await api.post<{
        success: boolean
        tempPassword?: string
        message: string
      }>("/forgot-password", { email })

      setSuccessMsg(response.message)
      if (response.tempPassword) {
        setTempPassword(response.tempPassword)
      }
      return true
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError("An unexpected network error occurred.")
      }
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    successMsg,
    tempPassword,
    login,
    signup,
    forgotPassword,
    resetState,
  }
}
