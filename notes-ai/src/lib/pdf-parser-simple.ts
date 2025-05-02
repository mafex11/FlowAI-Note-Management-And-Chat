/**
 * Simple PDF parser that extracts basic text content
 * without relying on complex PDF libraries
 */

export async function parseSimplePdf(buffer: Buffer): Promise<string> {
  try {
    console.log('Starting simple PDF parsing with buffer size:', buffer.length);
    
    // Validate buffer
    if (!buffer || buffer.length === 0) {
      console.error('Invalid buffer provided to PDF parser');
      return 'No content to parse: invalid buffer provided.';
    }
    
    // Basic PDF validation
    const signature = buffer.slice(0, 5).toString();
    if (!signature.startsWith('%PDF-')) {
      console.error('Invalid PDF signature:', signature);
      return 'This does not appear to be a valid PDF file.';
    }
    
    console.log('Valid PDF detected, extracting text content...');
    
    // Convert to string and extract text content
    // This is a simplistic approach that won't work for all PDFs
    // but is more reliable for basic text extraction
    const content = buffer.toString('utf8', 0, Math.min(buffer.length, 1000000)); // Limit to 1MB to avoid memory issues
    
    // Extract text-like content
    let extractedText = '';
    
    // Find text between parentheses (common in PDF text objects)
    const regex = /\(([^\\\(\)]+(?:\\.[^\\\(\)]*)*)\)/g;
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      try {
        const text = match[1]
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t')
          .replace(/\\\(/g, '(')
          .replace(/\\\)/g, ')')
          .replace(/\\\\/g, '\\');
            
        if (text.trim() && isReadableText(text)) {
          extractedText += text + ' ';
        }
      } catch (err) {
        // Ignore errors for individual matches
        console.warn('Error processing a text match:', err);
      }
    }
    
    console.log('Text extraction complete, cleaning up...');
    
    // Clean up the extracted text
    extractedText = cleanupText(extractedText);
    
    console.log('Extraction complete. Text length:', extractedText.length);
    
    if (extractedText.trim().length === 0) {
      // If no text was found, try a different approach
      console.log('No text found with primary method, trying fallback extraction...');
      
      extractedText = extractTextContentFallback(buffer);
      extractedText = cleanupText(extractedText);
      
      console.log('Fallback extraction complete. Text length:', extractedText.length);
    }
    
    if (extractedText.trim().length === 0) {
      return 'No readable text content could be extracted from this PDF.';
    }
    
    return extractedText;
  } catch (error) {
    console.error('Error parsing PDF:', error);
    return `Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

/**
 * Fallback method to extract text from PDF
 */
function extractTextContentFallback(buffer: Buffer): string {
  try {
    // Look for text that appears to be readable
    const bufferStr = buffer.toString('latin1'); // Use latin1 for better binary data handling
    let extractedText = '';
    
    // Extract chunks of ASCII text
    let currentText = '';
    let asciiCount = 0;
    
    for (let i = 0; i < bufferStr.length; i++) {
      const charCode = bufferStr.charCodeAt(i);
      
      // Only include printable ASCII characters and basic whitespace
      if ((charCode >= 32 && charCode <= 126) || // Printable ASCII
          charCode === 9 || charCode === 10 || charCode === 13) { // Tab, LF, CR
        
        currentText += bufferStr[i];
        
        if (charCode >= 32 && charCode <= 126) {
          asciiCount++;
        }
        
        // If we have a reasonable chunk of ASCII text, add it
        if (currentText.length > 20 && asciiCount > 15) {
          if (isReadableText(currentText)) {
            extractedText += currentText + ' ';
          }
          currentText = '';
          asciiCount = 0;
        }
      } else {
        // Non-ASCII character encountered, check if we should keep current text
        if (currentText.length > 20 && asciiCount > 15 && isReadableText(currentText)) {
          extractedText += currentText + ' ';
        }
        currentText = '';
        asciiCount = 0;
      }
    }
    
    // Add any remaining text
    if (currentText.length > 20 && asciiCount > 15 && isReadableText(currentText)) {
      extractedText += currentText;
    }
    
    return extractedText;
  } catch (error) {
    console.error('Error in fallback text extraction:', error);
    return '';
  }
}

/**
 * Check if text appears to be readable content rather than random chars
 */
function isReadableText(text: string): boolean {
  if (!text || text.length < 4) return false;
  
  // Check for a minimum ratio of letters to other characters
  const letterCount = (text.match(/[a-zA-Z]/g) || []).length;
  const letterRatio = letterCount / text.length;
  
  // Check for reasonable word-like sequences
  const wordLikeSequences = (text.match(/[a-zA-Z]{2,}/g) || []).length;
  
  // Text is likely readable if it has a good proportion of letters
  // and contains some word-like sequences
  return letterRatio > 0.3 && wordLikeSequences > 0;
}

/**
 * Clean up extracted text
 */
function cleanupText(text: string): string {
  if (!text) return '';
  
  return text
    .replace(/\s+/g, ' ')               // Replace multiple spaces with single space
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
    .trim();
} 