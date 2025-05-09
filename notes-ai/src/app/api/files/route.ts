import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

async function getFileTree(dir: string, basePath: string = ''): Promise<FileNode[]> {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  const nodes: FileNode[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.join(basePath, entry.name);

    if (entry.isDirectory()) {
      const children = await getFileTree(fullPath, relativePath);
      nodes.push({
        name: entry.name,
        path: relativePath,
        type: 'directory',
        children
      });
    } else {
      nodes.push({
        name: entry.name,
        path: relativePath,
        type: 'file'
      });
    }
  }

  return nodes;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const workspacePath = process.env.WORKSPACE_PATH || '.';
    const files = await getFileTree(workspacePath);

    return NextResponse.json(files);
  } catch (error) {
    console.error('Error listing files:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 