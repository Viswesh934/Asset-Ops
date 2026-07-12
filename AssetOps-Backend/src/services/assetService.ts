import { eq, and, ne } from "drizzle-orm"
import { DrizzleDb } from "../db/connection"
import {
  asset,
  resourceBooking,
  notification,
  assetCategory,
} from "../db/schema"

/**
 * Book a shared resource with overlap validation
 */
export async function bookResource(
  data: {
    assetId: string
    startTime: string
    endTime: string
    bookedForDepartmentId?: string | null
  },
  userId: string,
  db: DrizzleDb
) {
  return await db.transaction(async (tx) => {
    const assetArr = await tx
      .select()
      .from(asset)
      .where(eq(asset.id, data.assetId))
      .limit(1)

    if (assetArr.length === 0) {
      throw new Error("Asset not found")
    }

    const selectedAsset = assetArr[0]
    if (!selectedAsset.isBookable) {
      throw new Error("Asset is not marked as a bookable/shared resource")
    }

    const start = new Date(data.startTime)
    const end = new Date(data.endTime)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error("Invalid start or end time")
    }

    if (start >= end) {
      throw new Error("Start time must be before end time")
    }

    const existingBookings = await tx
      .select()
      .from(resourceBooking)
      .where(
        and(
          eq(resourceBooking.assetId, data.assetId),
          ne(resourceBooking.status, "Cancelled")
        )
      )

    const hasOverlap = existingBookings.some((booking) => {
      const bStart = new Date(booking.startTime)
      const bEnd = new Date(booking.endTime)
      return start < bEnd && end > bStart
    })

    if (hasOverlap) {
      throw new Error("Overlap validation failed: This resource is already booked during the requested timeslot")
    }

    const now = new Date()
    let status: "Upcoming" | "Ongoing" = "Upcoming"
    if (start <= now && end >= now) {
      status = "Ongoing"
    }

    const [newBooking] = await tx
      .insert(resourceBooking)
      .values({
        assetId: data.assetId,
        bookedByUserId: userId,
        bookedForDepartmentId: data.bookedForDepartmentId || null,
        startTime: data.startTime,
        endTime: data.endTime,
        status,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning()

    const friendlyStart = start.toLocaleString()
    const friendlyEnd = end.toLocaleString()
    await tx.insert(notification).values({
      userId,
      type: "Booking Confirmed",
      message: `Booking confirmed for ${selectedAsset.name} from ${friendlyStart} to ${friendlyEnd}.`,
      relatedEntityType: "resource_booking",
      relatedEntityId: newBooking.id,
      createdBy: userId,
    })

    return newBooking
  })
}

/**
 * List all bookable resources
 */
export async function listBookableResources(db: DrizzleDb) {
  return await db
    .select({
      id: asset.id,
      name: asset.name,
      assetTag: asset.assetTag,
      location: asset.location,
      status: asset.status,
    })
    .from(asset)
    .where(and(eq(asset.isBookable, true), ne(asset.status, "Retired"), ne(asset.status, "Disposed")))
}

/**
 * List all asset categories
 */
export async function listCategories(db: DrizzleDb) {
  return await db
    .select()
    .from(assetCategory)
    .where(eq(assetCategory.status, "Active"))
}
