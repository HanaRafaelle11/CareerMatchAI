export function cleanHtmlToPlainText(html: string): string {
  if (!html) return '';
  
  let text = html;
  
  // Basic HTML entity decoding
  const entities: { [key: string]: string } = {
    '&nbsp;': ' ',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'"
  };
  
  for (const [entity, value] of Object.entries(entities)) {
    text = text.replace(new RegExp(entity, 'gi'), value);
  }

  // Handle numeric character references
  text = text.replace(/&#\d+;/g, (match) => {
    const num = parseInt(match.replace(/\D/g, ''), 10);
    return String.fromCharCode(num);
  });

  // Strip scripts and styles completely
  text = text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Convert list items to bullet points with a space
  text = text.replace(/<li\b[^>]*>/gi, '• ');
  text = text.replace(/<\/li>/gi, '\n');

  // Convert break tags to single newlines
  text = text.replace(/<br\s*\/?>/gi, '\n');

  // Convert headings to bold styling or newlines
  text = text.replace(/<\/h[1-6]>/gi, '\n\n');
  text = text.replace(/<h[1-6]\b[^>]*>/gi, '\n\n');

  // Convert paragraph closures to double newlines
  text = text.replace(/<\/p>/gi, '\n\n');
  text = text.replace(/<p\b[^>]*>/gi, '\n');

  // Convert divs to newlines
  text = text.replace(/<\/div>/gi, '\n');
  text = text.replace(/<div\b[^>]*>/gi, '\n');

  // Strip all other HTML tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Collapse multiple spaces and trim
  text = text
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n') // Limit consecutive empty lines to 2
    .trim();

  return text;
}
