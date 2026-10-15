import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { saveUploadedFile, type UploadResult } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      // Check single file field
      const singleFile = formData.get('file') as File | null;
      if (singleFile) {
        files.push(singleFile);
      }
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided for upload' }, { status: 400 });
    }

    const uploadedResults: UploadResult[] = [];
    const errors: string[] = [];

    for (const file of files) {
      if (!(file instanceof File) || file.size === 0) continue;
      try {
        const result = await saveUploadedFile(file);
        uploadedResults.push(result);
      } catch (err) {
        errors.push(err instanceof Error ? err.message : `Failed to upload ${file.name}`);
      }
    }

    if (uploadedResults.length === 0 && errors.length > 0) {
      return NextResponse.json({ error: errors.join(', ') }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      files: uploadedResults,
      urls: uploadedResults.map((r) => r.url),
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
