/**
 * Alternative PDF parser that handles buffer inputs directly
 * without relying on pdf-parse which has file path issues
 */

// We'll use a pure buffer-based approach without any file path dependencies
export async function parsePdfAlt(buffer: Buffer): Promise<string> {
  try {
    // Safety check for empty buffer
    if (!buffer || buffer.length === 0) {
      console.error('Empty buffer provided to PDF parser');
      return 'No content to parse: empty buffer provided.';
    }

    console.log('Starting alternative PDF parsing with buffer of size:', buffer.length);
    
    // Simple check for PDF signature
    const signature = buffer.slice(0, 5).toString();
    
    if (!signature.startsWith('%PDF-')) {
      console.error('Invalid PDF signature:', signature);
      // Just return a placeholder rather than throwing an error
      return 'This does not appear to be a valid PDF file. The file may be corrupted or in an unsupported format.';
    }
    
    // This is a simple function that extracts text-like content from a PDF
    // It's not perfect but should work for basic text extraction
    // without relying on file paths or complex libraries
    let extractedText = '';
    
    try {
      // Search for text objects in the PDF (marked by "BT" and "ET" tags)
      let pos = 0;
      while (pos < buffer.length) {
        const btIndex = buffer.indexOf(Buffer.from('BT'), pos);
        if (btIndex === -1) break;
        
        const etIndex = buffer.indexOf(Buffer.from('ET'), btIndex);
        if (etIndex === -1) break;
        
        // Extract content between BT and ET (text objects)
        const textObject = buffer.slice(btIndex, etIndex + 2);
        
        // Look for text strings (usually enclosed in () or <>)
        let textPos = 0;
        while (textPos < textObject.length) {
          // Check for text in parentheses
          const openParenIndex = textObject.indexOf(Buffer.from('('), textPos);
          if (openParenIndex !== -1 && openParenIndex < textObject.length) {
            const closeParenIndex = findClosingParenthesis(textObject, openParenIndex);
            if (closeParenIndex !== -1) {
              try {
                const textContent = textObject.slice(openParenIndex + 1, closeParenIndex).toString('utf8');
                if (textContent.trim().length > 0) {
                  extractedText += textContent + ' ';
                }
              } catch (charError) {
                console.warn('Error converting text segment to string:', charError);
                // Continue processing despite this error
              }
              textPos = closeParenIndex + 1;
              continue;
            }
          }
          
          // Move to next position if no parenthesis found
          textPos++;
        }
        
        pos = etIndex + 2;
      }
    } catch (parsingError) {
      console.error('Error during PDF text extraction:', parsingError);
      // Continue to fallback extraction
    }
    
    // Fallback: If no text found between BT/ET tags, try to extract any text-like content
    if (extractedText.trim().length === 0) {
      console.log('No text found between BT/ET tags, trying fallback extraction');
      
      try {
        // Simple ASCII text extraction (imperfect but better than nothing)
        for (let i = 0; i < buffer.length - 1; i++) {
          const byte = buffer[i];
          // Only include printable ASCII characters
          if (byte >= 32 && byte <= 126) {
            extractedText += String.fromCharCode(byte);
          } else if (byte === 10 || byte === 13) {
            extractedText += '\n';
          }
          
          // Process in chunks to avoid memory issues
          if (i % 100000 === 0) {
            extractedText = cleanupPdfText(extractedText);
          }
        }
      } catch (fallbackError) {
        console.error('Error during fallback text extraction:', fallbackError);
        // Return what we've got so far, even if it's incomplete
      }
    }
    
    // Clean up the extracted text
    try {
      extractedText = cleanupPdfText(extractedText);
    } catch (cleanupError) {
      console.error('Error cleaning up text:', cleanupError);
      // Use what we have without cleanup if cleanup fails
    }
    
    console.log('Alternative PDF parsing complete. Extracted text length:', extractedText.length);
    
    if (extractedText.trim().length === 0) {
      return 'No text content could be extracted from this PDF. The file may be scanned images or protected.';
    }
    
    // Limit the size of the extracted text to avoid overwhelming the system
    const maxTextLength = 100000; // 100KB of text should be enough
    if (extractedText.length > maxTextLength) {
      console.log(`Truncating extracted text from ${extractedText.length} to ${maxTextLength} characters`);
      extractedText = extractedText.substring(0, maxTextLength) + 
        `\n\n[Note: Text has been truncated. Original length: ${extractedText.length} characters]`;
    }
    
    return extractedText;
  } catch (error) {
    console.error('Error in alternative PDF parsing:', error);
    
    // Simple error fallback that won't throw
    return 'Failed to parse PDF. The document may be encrypted, damaged, or in an unsupported format.';
  }
}

// Helper function to find the closing parenthesis
function findClosingParenthesis(buffer: Buffer, openIndex: number): number {
  try {
    let depth = 1;
    for (let i = openIndex + 1; i < buffer.length; i++) {
      // Check for escaped parentheses
      if (buffer[i] === 92 && i + 1 < buffer.length) { // Backslash '\'
        i++; // Skip the next character (escaped)
        continue;
      }
      
      if (buffer[i] === 40) { // Open parenthesis '('
        depth++;
      } else if (buffer[i] === 41) { // Close parenthesis ')'
        depth--;
        if (depth === 0) {
          return i;
        }
      }
      
      // Safety check to avoid infinite loops
      if (i - openIndex > 10000) {
        return -1; // Give up if we've checked too many characters
      }
    }
    return -1;
  } catch (error) {
    console.error('Error in findClosingParenthesis:', error);
    return -1;
  }
}

// Helper function to clean up extracted PDF text
function cleanupPdfText(text: string): string {
  try {
    return text
      .replace(/\s+/g, ' ')           // Replace multiple spaces with single space
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
      .trim();
  } catch (error) {
    console.error('Error in cleanupPdfText:', error);
    return text; // Return the original text if cleanup fails
  }
} 