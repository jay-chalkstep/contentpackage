'use server';

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';

/**
 * Server Action to delete a brand and all associated data
 */
export async function deleteBrand(brandId: string) {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return { error: 'Unauthorized' };
    }

    const supabase = createServerClient();

    // Fetch logo variants to delete storage files
    const { data: logoVariants } = await supabase
      .from('logo_variants')
      .select('logo_url')
      .eq('brand_id', brandId)
      .eq('organization_id', orgId);

    // Delete logo files from storage
    if (logoVariants && logoVariants.length > 0) {
      const filesToDelete: string[] = [];
      logoVariants.forEach((variant) => {
        const url = variant.logo_url;
        const match = url.match(/\/logos\/([^?]+)/);
        if (match && match[1]) {
          filesToDelete.push(match[1]);
        }
      });

      if (filesToDelete.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('logos')
          .remove(filesToDelete);

        if (storageError) {
          console.error('Storage deletion error:', storageError);
          // Continue with database deletion even if storage fails
        }
      }
    }

    // Delete the brand (cascade delete variants, colors, fonts)
    const { error: deleteError } = await supabase
      .from('brands')
      .delete()
      .eq('id', brandId)
      .eq('organization_id', orgId);

    if (deleteError) {
      console.error('Error deleting brand:', deleteError);
      return { error: deleteError.message };
    }

    revalidatePath('/brands');
    revalidatePath('/search');

    return { success: true };
  } catch (error) {
    console.error('Server action error:', error);
    return { error: 'An unexpected error occurred' };
  }
}
