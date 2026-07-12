import { SupabaseClient } from "@supabase/supabase-js"

export class StorageService {
  /**
   * Uploads a file to a Supabase bucket
   * @param supabase The initialized Supabase client
   * @param bucket Name of the bucket
   * @param filePath Path where the file should be stored in the bucket
   * @param fileBuffer The file content (Buffer)
   * @param contentType The mime type of the file
   */
  static async uploadFile(
    supabase: SupabaseClient,
    bucket: string,
    filePath: string,
    fileBuffer: Buffer,
    contentType?: string
  ) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileBuffer, {
        contentType,
        upsert: true,
      })

    if (error) {
      throw error
    }

    return data
  }

  /**
   * Deletes a file or files from a Supabase bucket
   */
  static async deleteFile(
    supabase: SupabaseClient,
    bucket: string,
    filePath: string
  ) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove([filePath])

    if (error) {
      throw error
    }

    return data
  }

  /**
   * Generates a signed URL for temporary access to a file
   * @param supabase The initialized Supabase client
   * @param bucket Name of the bucket
   * @param filePath Path of the file in the bucket
   * @param expiresIn Number of seconds before the link expires (default 1 hour)
   */
  static async getSignedUrl(
    supabase: SupabaseClient,
    bucket: string,
    filePath: string,
    expiresIn = 3600
  ) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn)

    if (error) {
      throw error
    }

    return data?.signedUrl
  }

  /**
   * Returns the public URL of a public file
   */
  static getPublicUrl(
    supabase: SupabaseClient,
    bucket: string,
    filePath: string
  ) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)

    return data.publicUrl
  }
}
