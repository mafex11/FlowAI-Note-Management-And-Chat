/**
 * Robust PDF parser that uses multiple methods to extract text
 * with comprehensive error handling
 */

export async function parsePdfRobust(buffer: Buffer): Promise<string> {
  try {
    console.log('Starting robust PDF parsing with buffer size:', buffer.length);
    
    // Validate buffer
    if (!buffer) {
      const error = 'Buffer is null or undefined';
      console.error(error);
      return error;
    }
    
    if (buffer.length === 0) {
      const error = 'Empty buffer provided';
      console.error(error);
      return error;
    }
    
    console.log('Buffer validation successful');
    
    // Basic PDF validation
    try {
      if (buffer.length < 5) {
        const error = `Buffer too small to be a valid PDF: ${buffer.length} bytes`;
        console.error(error);
        return error;
      }
      
      const signature = buffer.slice(0, 5).toString();
      console.log('PDF signature check:', signature);
      
      if (!signature.startsWith('%PDF-')) {
        const error = `Invalid PDF signature: ${signature}`;
        console.error(error);
        return error;
      }
      
      console.log('PDF signature validation successful');
    } catch (signatureError) {
      console.error('Error checking PDF signature:', signatureError);
      return `Error validating PDF signature: ${signatureError instanceof Error ? signatureError.message : 'Unknown error'}`;
    }
    
    // Try multiple extraction methods in sequence
    let extractedText = '';
    let extractionSuccess = false;
    
    // Method 1: Direct text pattern extraction
    try {
      console.log('Attempting extraction method 1: direct text pattern');
      extractedText = extractTextPatterns(buffer);
      
      if (extractedText && extractedText.trim().length > 0) {
        console.log('Method 1 successful, text length:', extractedText.length);
        extractionSuccess = true;
      } else {
        console.log('Method 1 produced no text');
      }
    } catch (method1Error) {
      console.error('Error in extraction method 1:', method1Error);
    }
    
    // Method 2: Buffer scan extraction
    if (!extractionSuccess) {
      try {
        console.log('Attempting extraction method 2: buffer scan');
        extractedText = scanBufferForText(buffer);
        
        if (extractedText && extractedText.trim().length > 0) {
          console.log('Method 2 successful, text length:', extractedText.length);
          extractionSuccess = true;
        } else {
          console.log('Method 2 produced no text');
        }
      } catch (method2Error) {
        console.error('Error in extraction method 2:', method2Error);
      }
    }
    
    // Method 3: Last resort - slice-based extraction
    if (!extractionSuccess) {
      try {
        console.log('Attempting extraction method 3: last resort slice-based extraction');
        extractedText = lastResortExtraction(buffer);
        
        if (extractedText && extractedText.trim().length > 0) {
          console.log('Method 3 successful, text length:', extractedText.length);
          extractionSuccess = true;
        } else {
          console.log('Method 3 produced no text');
        }
      } catch (method3Error) {
        console.error('Error in extraction method 3:', method3Error);
      }
    }
    
    // Clean up text regardless of extraction method
    try {
      console.log('Performing final text cleanup');
      const originalLength = extractedText.length;
      extractedText = cleanupText(extractedText);
      console.log(`Text cleanup: ${originalLength} chars → ${extractedText.length} chars`);
    } catch (cleanupError) {
      console.error('Error during text cleanup:', cleanupError);
      // Continue with uncleaned text if cleanup fails
    }
    
    // Return results or error
    if (extractionSuccess && extractedText.trim().length > 0) {
      console.log('PDF extraction successful - final text length:', extractedText.length);
      
      // Limit text length to avoid issues with very large documents
      const maxLength = 200000; // 200KB of text
      if (extractedText.length > maxLength) {
        console.log(`Limiting text from ${extractedText.length} to ${maxLength} characters`);
        extractedText = extractedText.substring(0, maxLength) + 
          `\n\n[Text truncated from original length of ${extractedText.length} characters]`;
      }
      
      return extractedText;
    } else {
      const error = 'Could not extract text content from PDF after trying all methods';
      console.error(error);
      return error;
    }
  } catch (error) {
    // Catch-all for any unhandled errors
    const errorMessage = `Unhandled error in PDF parsing: ${error instanceof Error ? 
      `${error.name}: ${error.message}` : 'Unknown error'}`;
    console.error(errorMessage);
    
    if (error instanceof Error && error.stack) {
      console.error('Error stack:', error.stack);
    }
    
    return errorMessage;
  }
}

/**
 * Method 1: Extract text based on common PDF text patterns
 */
function extractTextPatterns(buffer: Buffer): string {
  console.log('Running text pattern extraction');
  let extractedText = '';
  
  try {
    // Convert part of the buffer to a string for pattern matching
    // Only process first portion of the file to avoid memory issues with large PDFs
    const bufferSize = Math.min(buffer.length, 2 * 1024 * 1024); // 2MB max
    console.log(`Processing ${bufferSize} bytes for pattern extraction`);
    
    const content = buffer.toString('utf8', 0, bufferSize);
    
    // Pattern 1: Text between parentheses after "BT" (Begin Text) markers
    try {
      console.log('Searching for text between parentheses after BT markers');
      const btRegex = /BT[^(]*\(([^)]+)\)/g;
      let match;
      
      while ((match = btRegex.exec(content)) !== null) {
        if (match[1] && match[1].trim()) {
          extractedText += match[1] + ' ';
        }
      }
      
      console.log('BT pattern search complete');
    } catch (btError) {
      console.error('Error in BT pattern search:', btError);
    }
    
    // Pattern 2: General text in parentheses (PDF text objects)
    try {
      console.log('Searching for general text in parentheses');
      const parenthesesRegex = /\(([^\\\(\)]+(?:\\.[^\\\(\)]*)*)\)/g;
      let match;
      
      while ((match = parenthesesRegex.exec(content)) !== null) {
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
        } catch (textProcessError) {
          console.warn('Error processing a text match:', textProcessError);
        }
      }
      
      console.log('Parentheses pattern search complete');
    } catch (parenthesesError) {
      console.error('Error in parentheses pattern search:', parenthesesError);
    }
    
    // Remove any binary data that might have been captured
    extractedText = extractedText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\xFF]/g, '');
    
    return extractedText;
  } catch (error) {
    console.error('Error in extractTextPatterns:', error);
    throw error; // Let the main function catch this
  }
}

/**
 * Method 2: Scan buffer for readable text
 */
function scanBufferForText(buffer: Buffer): string {
  console.log('Running buffer scan for text');
  let extractedText = '';
  
  try {
    // Use latin1 encoding for better handling of binary data
    const bufferStr = buffer.toString('latin1');
    
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
      
      // Process in chunks to avoid memory issues with very large files
      if (i % 500000 === 0 && i > 0) {
        console.log(`Processed ${i} characters...`);
        // Clean up periodically to save memory
        extractedText = cleanupText(extractedText);
      }
    }
    
    // Add any remaining text
    if (currentText.length > 20 && asciiCount > 15 && isReadableText(currentText)) {
      extractedText += currentText;
    }
    
    return extractedText;
  } catch (error) {
    console.error('Error in scanBufferForText:', error);
    throw error; // Let the main function catch this
  }
}

/**
 * Method 3: Last resort extraction - brute force approach
 */
function lastResortExtraction(buffer: Buffer): string {
  console.log('Running last resort extraction');
  
  try {
    let result = '';
    
    // Try UTF-8 first
    try {
      console.log('Attempting UTF-8 extraction');
      const utf8Text = buffer.toString('utf8');
      
      // Extract only printable characters
      const printable = utf8Text.replace(/[^\x20-\x7E\r\n\t]/g, ' ');
      // Collapse multiple spaces
      const cleaned = printable.replace(/\s+/g, ' ');
      
      if (cleaned && cleaned.trim().length > 100) {
        console.log('UTF-8 extraction produced content');
        result = cleaned;
      }
    } catch (utf8Error) {
      console.error('UTF-8 extraction failed:', utf8Error);
    }
    
    // If UTF-8 failed, try ASCII extraction
    if (!result || result.trim().length < 100) {
      console.log('Attempting ASCII extraction');
      let asciiText = '';
      
      // Process buffer directly, byte by byte
      for (let i = 0; i < buffer.length; i++) {
        const byte = buffer[i];
        if (byte >= 32 && byte <= 126) {
          asciiText += String.fromCharCode(byte);
        } else if (byte === 9 || byte === 10 || byte === 13) {
          asciiText += ' '; // Replace tabs and newlines with spaces
        }
      }
      
      // Clean up consecutive spaces
      const cleaned = asciiText.replace(/\s+/g, ' ').trim();
      
      if (cleaned && cleaned.length > 0) {
        console.log('ASCII extraction produced content');
        result = cleaned;
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error in lastResortExtraction:', error);
    throw error; // Let the main function catch this
  }
}

/**
 * Check if text appears to be readable content
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