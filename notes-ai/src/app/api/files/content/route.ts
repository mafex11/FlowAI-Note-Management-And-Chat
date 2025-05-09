import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');

    if (!filePath) {
      return new NextResponse('File path is required', { status: 400 });
    }

    const workspacePath = process.env.WORKSPACE_PATH || '.';
    const fullPath = path.join(workspacePath, filePath);

    // Security check: ensure the file is within the workspace
    if (!fullPath.startsWith(path.resolve(workspacePath))) {
      return new NextResponse('Access denied', { status: 403 });
    }

    const content = await fs.promises.readFile(fullPath, 'utf-8');
    return NextResponse.json({ content });
  } catch (error) {
    console.error('Error reading file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 