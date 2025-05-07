import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { Chat } from '@/models/chat';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const chats = await Chat.findAndDecompress({ userId: session.user.email })
      .sort({ updatedAt: -1 })
      .limit(10);

    return NextResponse.json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messages, title } = await req.json();
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Invalid messages' }, { status: 400 });
    }

    await connectToDatabase();
    const chat = new Chat({
      userId: session.user.email,
      title: title || messages[0].content.slice(0, 50) + '...',
      messages,
      metadata: {
        totalTokens: messages.reduce((sum, msg) => sum + (msg.usage?.total_tokens || 0), 0),
        lastMessageDate: new Date()
      }
    });

    await chat.save();
    return NextResponse.json(chat);
  } catch (error) {
    console.error('Error saving chat:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 