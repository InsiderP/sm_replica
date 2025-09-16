import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Uploads a file to Supabase Storage and returns the public URL (if isPublic=true) or storage path.
 * @param supabase Supabase client instance
 * @param bucket Bucket name
 * @param filePath Path within the bucket (e.g., 'user-uploads/avatar.png')
 * @param file File data (Buffer or Blob)
 * @param isPublic Whether to return a public URL (default: true)
 */
export async function uploadToStorage(
  supabase: SupabaseClient,
  bucket: string,
  filePath: string,
  file: Buffer | Blob,
  isPublic: boolean = true
): Promise<string> {
  const { error } = await supabase.storage.from(bucket).upload(filePath, file, {
    upsert: true,
  });
  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  if (isPublic) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
  }
  return `${bucket}/${filePath}`;
} 