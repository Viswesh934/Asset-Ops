import bcrypt from "bcryptjs"
import { eq, and, inArray, sql } from "drizzle-orm"
import { DrizzleDb } from "../db/connection"
import {
  userMaster,
  userRoleMap,
  rolePermission,
  employee,
} from "../db/schema"

export class AuthService {
  /**
   * Authenticate a user with email and password
   */
  static async loginUser(email: string, password: string, db: DrizzleDb) {
    const emailNormalized = email.toLowerCase()

    // 1. Fetch user from user_master
    const userArr = await db
      .select()
      .from(userMaster)
      .where(eq(sql`lower(${userMaster.login})`, emailNormalized))
      .limit(1)

    if (!userArr.length) {
      throw new Error("Invalid credentials")
    }

    const user = userArr[0]

    // 2. Check if account is active
    if (!user.isActive) {
      throw new Error("Account is locked")
    }

    // 3. Verify password
    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
      throw new Error("Invalid credentials")
    }

    // 4. Get active roles
    const rolesArr = await db
      .select({ role: userRoleMap.role })
      .from(userRoleMap)
      .where(and(eq(userRoleMap.userId, user.id), eq(userRoleMap.isActive, true)))

    const roles = Array.from(new Set(rolesArr.map(r => r.role)))

    // 5. Get active permissions associated with the roles
    const permissionsArr = roles.length
      ? await db
          .select({ permission: rolePermission.permission })
          .from(rolePermission)
          .where(and(inArray(rolePermission.role, roles as any), eq(rolePermission.isActive, true)))
      : []

    const permissions = Array.from(new Set(permissionsArr.map(p => p.permission)))

    return {
      user,
      roles,
      permissions,
    }
  }

  /**
   * Register a new user with Employee role only
   */
  static async signupUser(
    data: {
      email: string
      password?: string
      username: string
      name: string
      departmentId?: string | null
    },
    db: DrizzleDb
  ) {
    const emailNormalized = data.email.toLowerCase()
    const usernameNormalized = data.username.trim()

    // Default password if not provided
    const passwordToHash = data.password || "Password123"

    // Use a transaction to ensure atomic insert across tables
    return await db.transaction(async (tx) => {
      // 1. Check if user already exists
      const existingUser = await tx
        .select()
        .from(userMaster)
        .where(eq(sql`lower(${userMaster.login})`, emailNormalized))
        .limit(1)

      if (existingUser.length > 0) {
        throw new Error("Email already registered")
      }

      // Check username uniqueness
      const existingUsername = await tx
        .select()
        .from(userMaster)
        .where(eq(sql`lower(${userMaster.username})`, usernameNormalized.toLowerCase()))
        .limit(1)

      if (existingUsername.length > 0) {
        throw new Error("Username already taken")
      }

      // 2. Hash password
      const passwordHash = await bcrypt.hash(passwordToHash, 10)

      // 3. Create entry in user_master
      const [newUser] = await tx
        .insert(userMaster)
        .values({
          login: emailNormalized,
          password: passwordHash,
          username: usernameNormalized,
          isActive: true,
          resetPassword: false,
          defaultUser: false,
        })
        .returning()

      // 4. Create entry in user_role_map (signup creates Employee role ONLY)
      await tx.insert(userRoleMap).values({
        userId: newUser.id,
        role: "Employee",
        isActive: true,
      })

      // 5. Create entry in employee directory
      await tx.insert(employee).values({
        userId: newUser.id,
        name: data.name.trim(),
        email: emailNormalized,
        departmentId: data.departmentId || null,
        status: "Active",
      })

      return {
        id: newUser.id,
        email: newUser.login,
        username: newUser.username,
        role: "Employee",
      }
    })
  }

  /**
   * Reset user's password and return a temporary password
   */
  static async forgotPassword(email: string, db: DrizzleDb) {
    const emailNormalized = email.toLowerCase()

    // 1. Fetch user from user_master
    const userArr = await db
      .select()
      .from(userMaster)
      .where(eq(sql`lower(${userMaster.login})`, emailNormalized))
      .limit(1)

    if (!userArr.length) {
      throw new Error("User not found")
    }

    const user = userArr[0]

    // 2. Generate a temporary password
    const tempPassword = "Temp" + Math.random().toString(36).substring(2, 10).toUpperCase()
    const passwordHash = await bcrypt.hash(tempPassword, 10)

    // 3. Update user_master (set new password and mark resetPassword as true)
    await db
      .update(userMaster)
      .set({
        password: passwordHash,
        resetPassword: true,
      })
      .where(eq(userMaster.id, user.id))

    return {
      success: true,
      email: user.login,
      tempPassword,
      message: "Password reset successful. Use the temporary password to login.",
    }
  }
}
