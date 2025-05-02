import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/db';
import Document from '@/models/document';
import { answerQuestion } from '@/lib/perplexity';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { question, specificDocumentIds } = await req.json();

    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Get relevant documents
    let query: any = { user: session.user.id };
    
    // If specificDocumentIds is provided, only search within those documents
    if (specificDocumentIds && specificDocumentIds.length > 0) {
      query._id = { $in: specificDocumentIds };
    }

    const documents = await Document.find(query).select('title content');

    if (documents.length === 0) {
      return NextResponse.json({
        answer: "You haven't uploaded any documents yet. Please upload some notes first."
      });
    }

    // Process question with Perplexity AI
    const answer = await answerQuestion(question, documents);

    return NextResponse.json({ answer });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process question' },
      { status: 500 }
    );
  }
} 