import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { Readable } from 'stream';
import cloudinary from '@/lib/cloudinary';
import connectToDatabase from '@/lib/db';
import Document from '@/models/document';
import { parsePdfRobust } from '@/lib/pdf-parser-robust';
import { extractTopicsAndSummarize } from '@/lib/perplexity';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Define types for Cloudinary upload result
interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  [key: string]: unknown;
}

// Define session type to avoid 'user' property errors
interface ExtendedSession {
  user?: {
    id: string;
    email?: string;
    name?: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions as Record<string, unknown>) as ExtendedSession;
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Processing upload request from user:', session.user.id);
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    
    // Subject and course code will be auto-detected by AI
    const userProvidedSubject = formData.get('subject') as string;
    const userProvidedCourseCode = formData.get('courseCode') as string;

    if (!file || !title) {
      return NextResponse.json(
        { error: 'File and title are required' },
        { status: 400 }
      );
    }

    console.log('Upload request received for file:', file.name, 'size:', file.size, 'type:', file.type);

    // Check file type
    if (!file.name.endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'Only PDF files are supported' },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    try {
      console.log('Converting file to buffer...');
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      console.log('File converted to buffer of size:', buffer.length);

      // Basic validation
      if (!buffer || buffer.length === 0) {
        console.error('Empty buffer after conversion');
        return NextResponse.json(
          { error: 'Failed to process the PDF file: empty buffer' },
          { status: 422 }
        );
      }

      // Parse PDF content using our robust parser
      console.log('Parsing PDF content with robust parser...');
      let pdfText;
      try {
        pdfText = await parsePdfRobust(buffer);
        console.log('PDF parsing complete. Text length:', pdfText.length);

        // Check if the parser returned an error string
        if (pdfText.startsWith('Error') || 
            pdfText.startsWith('Failed') || 
            pdfText.startsWith('Buffer') ||
            pdfText.startsWith('Invalid') ||
            pdfText.startsWith('Could not') ||
            pdfText.startsWith('No ')) {
          console.error('PDF parser returned error:', pdfText);
          return NextResponse.json(
            { error: `PDF parsing failed: ${pdfText}` },
            { status: 422 }
          );
        }
      } catch (pdfError: unknown) {
        const errorDetail = pdfError instanceof Error 
          ? `${pdfError.name}: ${pdfError.message}` 
          : 'Unknown parsing error';
        
        console.error('PDF parsing error:', errorDetail);
        if (pdfError instanceof Error && pdfError.stack) {
          console.error('Error stack:', pdfError.stack);
        }
        
        return NextResponse.json(
          { error: `PDF parsing failed: ${errorDetail}` },
          { status: 422 }
        );
      }

      // Upload to Cloudinary
      console.log('Uploading to Cloudinary...');
      let uploadResult: CloudinaryUploadResult;
      try {
        uploadResult = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'notes-ai',
              resource_type: 'auto',
              format: 'pdf',
              allowed_formats: ['pdf'],
              max_file_size: 10485760, // 10MB limit
            },
            (error, result) => {
              if (error) {
                console.error('Cloudinary upload error:', error);
                reject(new Error(`Cloudinary upload failed: ${error.message}`));
              } else if (!result) {
                console.error('Cloudinary returned empty result');
                reject(new Error('Cloudinary upload failed: No result returned'));
              } else {
                console.log('Cloudinary upload successful:', result);
                resolve(result as CloudinaryUploadResult);
              }
            }
          );

          // Create a readable stream from the buffer
          const readable = new Readable();
          readable._read = () => {}; // _read method is required but we don't need to implement it
          readable.push(buffer);
          readable.push(null);

          // Handle stream errors
          readable.on('error', (error) => {
            console.error('Stream error during upload:', error);
            reject(new Error(`Stream error: ${error.message}`));
          });

          // Pipe the buffer to Cloudinary
          readable.pipe(uploadStream);
        });
      } catch (uploadError) {
        console.error('Cloudinary upload failed:', uploadError);
        return NextResponse.json(
          { error: `Failed to upload to Cloudinary: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}` },
          { status: 500 }
        );
      }

      if (!uploadResult || !uploadResult.secure_url) {
        console.error('Invalid Cloudinary upload result:', uploadResult);
        return NextResponse.json(
          { error: 'Failed to get secure URL from Cloudinary upload' },
          { status: 500 }
        );
      }

      console.log('Cloudinary upload complete, URL:', uploadResult.secure_url);

      // Process content with Perplexity AI
      console.log('Processing content with Perplexity AI...');
      const aiAnalysis = await extractTopicsAndSummarize(pdfText);
      console.log('AI analysis complete:', JSON.stringify(aiAnalysis));
      
      // Use AI-detected subject and course code, but fall back to user-provided values if available
      const subject = userProvidedSubject || aiAnalysis.subject || 'General';
      const courseCode = userProvidedCourseCode || aiAnalysis.courseCode || undefined;
      
      // Connect to database
      console.log('Connecting to database...');
      await connectToDatabase();

      // Save document information
      console.log('Creating document in database...');
      const document = await Document.create({
        title,
        subject,
        course_code: courseCode,
        user: session.user.id,
        file_url: uploadResult.secure_url,
        cloudinary_id: uploadResult.public_id,
        original_text: pdfText,
        content: pdfText,
        summary: aiAnalysis.summary,
        topics: aiAnalysis.topics,
      });
      console.log('Document created with ID:', document._id);

      return NextResponse.json({ 
        success: true,
        document: {
          id: document._id,
          title: document.title,
          subject: document.subject,
          course_code: document.course_code,
          file_url: document.file_url,
          summary: document.summary,
          topics: document.topics,
          created_at: document.createdAt
        }
      }, { status: 201 });
    } catch (parseError) {
      console.error('Error processing PDF file:', parseError);
      return NextResponse.json(
        { error: `Error processing PDF: ${parseError instanceof Error ? parseError.message : 'Unknown error'}` },
        { status: 422 }
      );
    }
  } catch (error) {
    console.error('Upload error:', error);
    
    // Provide more detailed error message
    let errorMessage = 'Failed to upload and process file';
    if (error instanceof Error) {
      errorMessage = `${errorMessage}: ${error.message}`;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 