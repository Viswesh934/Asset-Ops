import { create } from 'zustand'
import type { Department, OrgCategory, OrgEmployee } from '../types'

interface OrgState {
  departments: Department[]
  categories: OrgCategory[]
  employees: OrgEmployee[]
  loading: boolean
  error: string | null
  token: string | null
  
  initialize: () => Promise<void>
  fetchAll: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  addDepartment: (name: string, headUserId?: string | null, parentDepartmentId?: string | null) => Promise<void>
  addCategory: (name: string, type: 'Hardware' | 'Software' | 'Facilities' | 'Furniture', description: string) => Promise<void>
  addEmployee: (name: string, email: string, departmentId?: string | null) => Promise<void>
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export const useOrgStore = create<OrgState>((set, get) => ({
  departments: [],
  categories: [],
  employees: [],
  loading: false,
  error: null,
  token: null,

  login: async (email, password) => {
    set({ loading: true, error: null })
    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Invalid credentials')
      }
      const data = await res.json()
      set({ token: data.accessToken, loading: false })
      await get().fetchAll()
    } catch (err: any) {
      set({ error: err.message || 'Login failed', loading: false })
      throw err
    }
  },

  initialize: async () => {
    // Check for pre-existing token in localStorage first
    const storedToken = localStorage.getItem("token")
    if (storedToken) {
      set({ token: storedToken })
      await get().fetchAll()
      return
    }

    // Avoid double initialization
    if (get().token || get().loading) return

    // Auto login in background for demo/dev purposes in local environment only
    if (import.meta.env.DEV) {
      set({ loading: true, error: null })
      try {
        const email = import.meta.env.VITE_AUTO_LOGIN_EMAIL || 'admin@example.com'
        const password = import.meta.env.VITE_AUTO_LOGIN_PASSWORD || 'admin123'
        const res = await fetch(`${API_BASE_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        if (!res.ok) {
          throw new Error('Default auth configuration failed. Ensure backend seed was run.')
        }
        const data = await res.json()
        set({ token: data.accessToken })
        await get().fetchAll()
      } catch (err: any) {
        set({ error: err.message || 'Failed to initialize system state', loading: false })
      }
    }
  },

  fetchAll: async () => {
    const token = get().token
    if (!token) return

    set({ loading: true, error: null })
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
      }

      const [deptRes, catRes, empRes] = await Promise.all([
        fetch(`${API_BASE_URL}/departments`, { headers }),
        fetch(`${API_BASE_URL}/categories`, { headers }),
        fetch(`${API_BASE_URL}/employees`, { headers }),
      ])

      if (!deptRes.ok || !catRes.ok || !empRes.ok) {
        throw new Error('Failed to fetch org setup resources')
      }

      const deptsRaw = await deptRes.json()
      const catsRaw = await catRes.json()
      const empsRaw = await empRes.json()

      // Map API departments
      const departments: Department[] = deptsRaw.map((d: any) => ({
        id: d.id,
        name: d.name,
        head: d.headName || '--',
        headUserId: d.headUserId,
        parentDept: d.parentDepartmentName || '--',
        parentDepartmentId: d.parentDepartmentId,
        status: d.status,
      }))

      // Map API categories (resolve customFields to category types)
      const categories: OrgCategory[] = catsRaw.map((c: any) => {
        let type = 'Hardware'
        try {
          const parsed = JSON.parse(c.customFields || '{}')
          if (parsed.type) type = parsed.type
        } catch (e) {
          if (c.customFields) type = c.customFields
        }
        return {
          id: c.id,
          name: c.name,
          type: type as any,
          description: c.description || '',
          status: c.status,
        }
      })

      // Map API employees
      const employees: OrgEmployee[] = empsRaw.map((e: any) => ({
        id: e.id,
        name: e.name,
        email: e.email,
        department: e.departmentName || '--',
        departmentId: e.departmentId,
        role: e.role || 'Employee',
        status: e.status,
        userId: e.userId,
      }))

      set({ departments, categories, employees, loading: false })
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch data', loading: false })
    }
  },

  addDepartment: async (name, headUserId = null, parentDepartmentId = null) => {
    const token = get().token
    if (!token) throw new Error('Unauthenticated')

    set({ loading: true, error: null })
    try {
      const res = await fetch(`${API_BASE_URL}/add-item`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'department',
          name,
          headUserId: headUserId || undefined,
          parentDepartmentId: parentDepartmentId || undefined,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to add department')
      }

      await get().fetchAll()
    } catch (err: any) {
      set({ error: err.message || 'Failed to add department', loading: false })
      throw err
    }
  },

  addCategory: async (name, type, description) => {
    const token = get().token
    if (!token) throw new Error('Unauthenticated')

    set({ loading: true, error: null })
    try {
      const res = await fetch(`${API_BASE_URL}/add-item`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'category',
          name,
          description,
          customFields: JSON.stringify({ type }),
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to add category')
      }

      await get().fetchAll()
    } catch (err: any) {
      set({ error: err.message || 'Failed to add category', loading: false })
      throw err
    }
  },

  addEmployee: async (name, email, departmentId = null) => {
    // To register an employee, we call /signup, which is a public route,
    // creating both the userMaster login and the employee directory entry.
    set({ loading: true, error: null })
    try {
      // Auto generate a unique username from the email
      const username = email.split('@')[0] + Math.floor(Math.random() * 1000)
      
      const res = await fetch(`${API_BASE_URL}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          username,
          departmentId: departmentId || undefined,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to register employee')
      }

      await get().fetchAll()
    } catch (err: any) {
      set({ error: err.message || 'Failed to register employee', loading: false })
      throw err
    }
  },
}))
