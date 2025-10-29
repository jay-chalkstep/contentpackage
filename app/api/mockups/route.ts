import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-context';
import { createServerAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/mockups
 * Save a new mockup/asset
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await getUserContext();
    const supabase = createServerAdminClient();

    const formData = await request.formData();
    const imageBlob = formData.get('image') as Blob;
    const mockupName = formData.get('mockupName') as string;
    const logoId = formData.get('logoId') as string;
    const templateId = formData.get('templateId') as string;
    const folderId = formData.get('folderId') as string | null;
    const projectId = formData.get('projectId') as string | null;
    const logoX = parseFloat(formData.get('logoX') as string);
    const logoY = parseFloat(formData.get('logoY') as string);
    const logoScale = parseFloat(formData.get('logoScale') as string);

    if (!mockupName || !logoId || !templateId || !imageBlob) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Upload image to storage
    const fileName = `${Date.now()}-${mockupName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('card-mockups')
      .upload(fileName, imageBlob, {
        contentType: 'image/png',
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error('[mockups] Storage upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload image', details: uploadError.message },
        { status: 500 }
      );
    }

    // Get public URL
    console.log('\n=== MOCKUP SAVE: Getting Public URL ===');
    console.log('Bucket: card-mockups');
    console.log('Filename:', fileName);

    const { data: urlData } = supabase.storage
      .from('card-mockups')
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    console.log('Generated URL:', publicUrl);
    console.log('URL length:', publicUrl?.length);
    console.log('URL preview:', publicUrl?.substring(0, 120) + (publicUrl?.length > 120 ? '...' : ''));

    // Save to database
    const mockupData = {
      mockup_name: mockupName,
      logo_id: logoId,
      template_id: templateId,
      organization_id: orgId,
      created_by: userId,
      folder_id: folderId || null,
      project_id: projectId || null,
      logo_x: logoX,
      logo_y: logoY,
      logo_scale: logoScale,
      mockup_image_url: publicUrl
    };

    console.log('Mockup data to insert:');
    console.log('- mockup_name:', mockupName);
    console.log('- mockup_image_url length:', mockupData.mockup_image_url?.length);
    console.log('- mockup_image_url:', mockupData.mockup_image_url);

    const { data: dbData, error: dbError } = await supabase
      .from('assets')
      .insert(mockupData)
      .select()
      .single();

    if (dbError) {
      console.error('[mockups] Database error:', {
        code: dbError.code,
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint,
        mockupData
      });
      return NextResponse.json(
        {
          error: 'Database error',
          details: dbError.message,
          code: dbError.code
        },
        { status: 500 }
      );
    }

    console.log('✅ Mockup saved successfully');
    console.log('Returned from DB:');
    console.log('- ID:', dbData.id);
    console.log('- mockup_image_url length:', dbData.mockup_image_url?.length);
    console.log('- mockup_image_url:', dbData.mockup_image_url);
    console.log('=== END MOCKUP SAVE ===\n');

    return NextResponse.json({ mockup: dbData });
  } catch (error) {
    console.error('[mockups] Error:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      {
        error: 'Failed to save mockup',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
