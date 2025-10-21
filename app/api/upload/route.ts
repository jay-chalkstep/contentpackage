import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase, LOGOS_BUCKET } from '@/lib/supabase';

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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const companyName = formData.get('companyName') as string;
    const domain = formData.get('domain') as string;
    const logoType = formData.get('logoType') as string;

    if (!file || !companyName) {
      return NextResponse.json(
        { error: 'File and company name are required' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `${companyName.toLowerCase().replace(/\s+/g, '_')}_${timestamp}.${fileExt}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(LOGOS_BUCKET)
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file to storage' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(LOGOS_BUCKET)
      .getPublicUrl(fileName);

    // Step 1: Create or find brand (within organization)
    const brandDomain = domain || `${companyName.toLowerCase().replace(/\s+/g, '')}.com`;

    const { data: existingBrand } = await supabase
      .from('brands')
      .select('id')
      .eq('domain', brandDomain)
      .eq('organization_id', orgId)
      .single();

    let brandId: string;

    if (existingBrand) {
      brandId = existingBrand.id;
    } else {
      const { data: newBrand, error: brandError } = await supabase
        .from('brands')
        .insert({
          company_name: companyName,
          domain: brandDomain,
          organization_id: orgId,
        })
        .select()
        .single();

      if (brandError) {
        console.error('Brand creation error:', brandError);
        await supabase.storage.from(LOGOS_BUCKET).remove([fileName]);
        return NextResponse.json(
          { error: 'Failed to create brand' },
          { status: 500 }
        );
      }

      brandId = newBrand.id;
    }

    // Step 2: Save logo variant to database
    const { data: logoData, error: dbError } = await supabase
      .from('logo_variants')
      .insert({
        brand_id: brandId,
        organization_id: orgId,
        logo_url: publicUrl,
        logo_type: fileExt,
        logo_format: logoType,
        is_uploaded: true,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);

      // Try to delete uploaded file if database insert fails
      await supabase.storage.from(LOGOS_BUCKET).remove([fileName]);

      return NextResponse.json(
        { error: 'Failed to save logo information' },
        { status: 500 }
      );
    }

    // Step 3: Set as primary logo variant if brand doesn't have one
    const { data: brandData } = await supabase
      .from('brands')
      .select('primary_logo_variant_id')
      .eq('id', brandId)
      .single();

    if (!brandData?.primary_logo_variant_id) {
      await supabase
        .from('brands')
        .update({ primary_logo_variant_id: logoData.id })
        .eq('id', brandId);
    }

    return NextResponse.json({
      message: 'Logo uploaded successfully',
      data: logoData
    });
  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Configure max file size for the route (optional)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5mb',
    },
  },
};