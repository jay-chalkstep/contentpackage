import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerAdminClient } from '@/lib/supabase/server';
import { CARD_TEMPLATES_BUCKET } from '@/lib/supabase';

// Mark as dynamic to prevent build-time evaluation
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  console.log('\n=== API /card-upload START ===');

  try {
    // Get organization and user from Clerk
    console.log('Step 1: Authenticating with Clerk...');
    const { orgId, userId } = await auth();
    console.log('Auth result:', { orgId, userId });

    if (!orgId) {
      console.error('❌ No organization ID found');
      return NextResponse.json(
        { error: 'Organization required. Please select or create an organization.' },
        { status: 403 }
      );
    }

    if (!userId) {
      console.error('❌ No user ID found');
      return NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401 }
      );
    }

    console.log('Step 2: Parsing form data...');
    const supabase = createServerAdminClient();
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const templateName = formData.get('templateName') as string;

    console.log('Form data parsed:', {
      hasFile: !!file,
      fileName: file?.name,
      fileType: file?.type,
      fileSize: file?.size,
      templateName,
    });

    if (!file || !templateName) {
      console.error('❌ Missing required fields');
      return NextResponse.json(
        { error: 'File and template name are required' },
        { status: 400 }
      );
    }

    // Generate unique filename
    console.log('Step 3: Generating unique filename...');
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}-${templateName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.${fileExtension}`;
    console.log('Generated filename:', fileName);

    // Convert File to ArrayBuffer for Supabase
    console.log('Step 4: Converting file to buffer...');
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log('Buffer created, size:', buffer.length, 'bytes');

    // Upload to Supabase Storage
    console.log('Step 5: Uploading to Supabase Storage...');
    console.log('Storage bucket:', CARD_TEMPLATES_BUCKET);
    console.log('Upload options:', {
      contentType: file.type,
      cacheControl: '3600',
    });

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(CARD_TEMPLATES_BUCKET)
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error('❌ Storage upload failed');
      console.error('Upload error:', uploadError);
      console.error('Upload error details:', {
        message: uploadError.message,
        name: uploadError.name,
        statusCode: (uploadError as any).statusCode,
      });

      return NextResponse.json(
        {
          error: 'Failed to upload file to storage',
          details: uploadError.message,
        },
        { status: 500 }
      );
    }

    console.log('✅ Storage upload successful');
    console.log('Upload data:', uploadData);

    // Get public URL
    console.log('Step 6: Getting public URL...');
    const { data: urlData } = supabase.storage
      .from(CARD_TEMPLATES_BUCKET)
      .getPublicUrl(fileName);
    console.log('Public URL generated:', urlData.publicUrl);

    // Save metadata to database
    console.log('Step 7: Saving metadata to database...');
    const insertData = {
      template_name: templateName,
      template_url: urlData.publicUrl,
      organization_id: orgId,
      created_by: userId,
      file_type: file.type,
      file_size: file.size,
    };
    console.log('Insert data:', insertData);

    const { data: dbData, error: dbError } = await supabase
      .from('templates')
      .insert(insertData)
      .select()
      .single();

    if (dbError) {
      console.error('❌ Database insert failed');
      console.error('Database error:', dbError);
      console.error('Database error details:', {
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint,
        code: dbError.code,
      });

      // Try to clean up uploaded file
      console.log('Attempting to clean up uploaded file...');
      const { error: deleteError } = await supabase.storage
        .from(CARD_TEMPLATES_BUCKET)
        .remove([fileName]);

      if (deleteError) {
        console.error('Failed to delete file during cleanup:', deleteError);
      } else {
        console.log('File deleted successfully during cleanup');
      }

      return NextResponse.json(
        {
          error: 'Failed to save template metadata',
          details: dbError.message || 'Database insert failed',
          code: dbError.code,
          hint: dbError.hint,
        },
        { status: 500 }
      );
    }

    console.log('✅ Database insert successful');
    console.log('DB data:', dbData);
    console.log('=== API /card-upload SUCCESS ===\n');

    return NextResponse.json({
      success: true,
      template: dbData,
    });
  } catch (error) {
    console.error('\n❌❌❌ UNHANDLED ERROR in /card-upload ❌❌❌');
    console.error('Error:', error);
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'N/A');
    console.error('=== API /card-upload FAILED ===\n');

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}