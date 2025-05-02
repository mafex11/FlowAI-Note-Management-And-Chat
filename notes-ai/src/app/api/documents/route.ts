import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/db';
import Document from '@/models/document';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to database
    await connectToDatabase();

    // Get URL parameters
    const { searchParams } = new URL(req.url);
    const subject = searchParams.get('subject');
    const courseCode = searchParams.get('courseCode');

    // Build query
    const query: any = { user: session.user.id };
    if (subject) query.subject = subject;
    if (courseCode) query.course_code = courseCode;

    // Get documents
    const documents = await Document.find(query)
      .select('title subject course_code file_url summary topics createdAt')
      .sort({ createdAt: -1 });

    // Transform documents for response
    const transformedDocuments = documents.map(doc => ({
      id: doc._id,
      title: doc.title,
      subject: doc.subject,
      course_code: doc.course_code,
      file_url: doc.file_url,
      summary: doc.summary,
      topics: doc.topics,
      created_at: doc.createdAt
    }));

    return NextResponse.json({ documents: transformedDocuments });
  } catch (error) {
    console.error('Documents fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
} 