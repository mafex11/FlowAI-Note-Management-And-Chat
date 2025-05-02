import pdf from 'pdf-parse';

export async function parsePdf(buffer: Buffer): Promise<string> {
  try {
    console.log('Starting PDF parsing with buffer of size:', buffer.length);
    
    // Explicitly configure dataType to avoid file path lookup
    const options = {
      // Maximum number of pages to parse
      max: 0,
      // Disable version and other info
      version: false,
      // Force using the buffer directly
      pagerender: undefined,
      // Set data type to Buffer explicitly
      dataType: 'buffer' as const
    };
    
    // Pass options to ensure it treats input as buffer
    const data = await pdf(buffer, options);
    
    if (!data || !data.text) {
      console.error('PDF parsing produced no text output');
      return 'No text content could be extracted from this PDF.';
    }
    
    console.log('PDF parsing complete. Extracted text length:', data.text.length);
    return data.text;
  } catch (error) {
    console.error('Error parsing PDF:', error);
    
    // More detailed error message
    let errorMessage = 'Failed to parse PDF file';
    if (error instanceof Error) {
      errorMessage = `${errorMessage}: ${error.message}`;
    }
    
    throw new Error(errorMessage);
  }
} 