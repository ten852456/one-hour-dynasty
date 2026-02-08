import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET() {
  try {
    // Read the WHITEPAPER.md file from the docs directory
    const docsPath = join(process.cwd(), '../docs/WHITEPAPER.md');
    const content = await readFile(docsPath, 'utf-8');

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error reading WHITEPAPER.md:', error);
    return new NextResponse('Error loading documentation', {
      status: 500,
    });
  }
}
