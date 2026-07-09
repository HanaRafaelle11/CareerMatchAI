/**
 * Sanitizes a file name for Supabase Storage.
 * 1. Normalizes accents using normalize("NFD") and strips combining characters.
 * 2. Replaces invalid characters (anything other than alphanumeric, hyphens, and underscores) with underscores.
 * 3. Preserves the original file extension.
 *
 * Example: "Currículo - Rafaela Souza.pdf" -> "Curriculo_-_Rafaela_Souza.pdf"
 */
export function sanitizeFileName(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf('.');
  let name = fileName;
  let ext = '';
  
  if (lastDotIndex !== -1) {
    name = fileName.substring(0, lastDotIndex);
    ext = fileName.substring(lastDotIndex);
  }

  // Remove accents using normalize("NFD") and replace combining marks
  const normalizedName = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // Replace invalid characters with underscore.
  // Valid characters: a-zA-Z0-9, -, _
  const sanitizedName = normalizedName.replace(/[^a-zA-Z0-9-_]/g, '_');

  return sanitizedName + ext;
}
