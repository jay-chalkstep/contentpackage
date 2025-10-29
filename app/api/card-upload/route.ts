import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerAdminClient } from '@/lib/supabase/server';
import { CARD_TEMPLATES_BUCKET } from '@/lib/supabase';

// Mark as dynamic to prevent build-time evaluation
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Get organization from Clerk
    const { orgId } = await auth();

    if (!orgId) {
      return NextResponse.json(
        { error: 'Organization required. Please select or create an organization.' },
        { status: 403 }
      );
    }

    const supabase = createServerAdminClient();
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const templateName = formData.get('templateName') as string;

    if (!file || !templateName) {
      return NextResponse.json(
        { error: 'File and template name are required' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}-${templateName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.${fileExtension}`;

    // Convert File to ArrayBuffer for Supabase
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(CARD_TEMPLATES_BUCKET)
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(CARD_TEMPLATES_BUCKET)
      .getPublicUrl(fileName);

    // Save metadata to database
    const { data: dbData, error: dbError } = await supabase
      .from('templates')
      .insert({
        template_name: templateName,
        template_url: urlData.publicUrl,
        organization_id: orgId,
        file_type: file.type,
        file_size: file.size,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Try to clean up uploaded file
      await supabase.storage
        .from(CARD_TEMPLATES_BUCKET)
        .remove([fileName]);

      return NextResponse.json(
        { error: 'Failed to save template metadata' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      template: dbData,
    });
  } catch (error) {
    console.error('Card upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}