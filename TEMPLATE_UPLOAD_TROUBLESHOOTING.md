# Template Upload Troubleshooting Guide

## Enhanced Error Logging (v3.6.2)

This document explains the comprehensive error logging added to the template upload system to help debug issues quickly.

## What Was Added

### Frontend Logging (TemplateUploadModal.tsx)
The upload modal now logs detailed information at every step:

1. **File Information**: Name, type, size, last modified
2. **Request Details**: FormData creation, API endpoint
3. **Response Details**: Status code, headers, content type
4. **Response Body**: Full JSON or text response
5. **Error Details**: Error type, message, stack trace

### Backend Logging (API /card-upload)
The API route now logs comprehensive information:

1. **Authentication**: Clerk orgId and userId
2. **Form Parsing**: File details and template name
3. **Filename Generation**: Generated storage filename
4. **Buffer Conversion**: Buffer size in bytes
5. **Storage Upload**: Bucket name, upload options, success/failure
6. **Public URL**: Generated URL for the uploaded file
7. **Database Insert**: Full insert data object
8. **Database Errors**: Message, details, hint, code
9. **Cleanup Operations**: File deletion if DB insert fails
10. **Unhandled Errors**: Catch-all for unexpected errors

## How to Read the Console Output

### Successful Upload
```
=== TEMPLATE UPLOAD DEBUG ===
File: { name: 'template.png', type: 'image/png', size: 123456, ... }
Template Name: My Template
FormData created, sending to /api/card-upload...
Response status: 200 OK
Response JSON: { success: true, template: {...} }
✅ Upload successful!
=== END TEMPLATE UPLOAD DEBUG ===

API Output:
=== API /card-upload START ===
Step 1: Authenticating with Clerk...
Auth result: { orgId: 'org_xxx', userId: 'user_xxx' }
Step 2: Parsing form data...
Form data parsed: { hasFile: true, fileName: 'template.png', ... }
Step 3: Generating unique filename...
Generated filename: 1234567890-my-template.png
Step 4: Converting file to buffer...
Buffer created, size: 123456 bytes
Step 5: Uploading to Supabase Storage...
Storage bucket: templates
✅ Storage upload successful
Step 6: Getting public URL...
Public URL generated: https://...
Step 7: Saving metadata to database...
Insert data: { template_name: 'My Template', ... }
✅ Database insert successful
DB data: { id: 'uuid', ... }
=== API /card-upload SUCCESS ===
```

### Failed Upload - Database Error
```
=== TEMPLATE UPLOAD DEBUG ===
...
Response status: 500 Internal Server Error
❌ Upload failed with status: 500
Error data: { error: 'Failed to save template metadata', details: '...' }
❌ Upload error (catch block): Error: Failed to save template metadata: ...
=== END TEMPLATE UPLOAD DEBUG ===

API Output:
...
Step 7: Saving metadata to database...
Insert data: { template_name: 'My Template', ... }
❌ Database insert failed
Database error details: {
  message: 'column "organization_id" does not exist',
  code: '42703',
  hint: 'Perhaps you meant to reference column "templates.id"'
}
Attempting to clean up uploaded file...
File deleted successfully during cleanup
```

### Failed Upload - Storage Error
```
API Output:
...
Step 5: Uploading to Supabase Storage...
Storage bucket: templates
❌ Storage upload failed
Upload error details: {
  message: 'Bucket not found',
  statusCode: 404
}
```

## Common Error Codes

### Database Errors (PostgreSQL)
- **42703**: Column does not exist
  - Solution: Run migration 19 to add missing columns
- **42P01**: Table does not exist
  - Solution: Verify migration 13 ran successfully
- **23505**: Unique constraint violation
  - Solution: Template with same name may already exist
- **23503**: Foreign key constraint violation
  - Solution: Check organization_id is valid

### Storage Errors
- **404**: Bucket not found
  - Solution: Create 'templates' bucket in Supabase Storage
- **403**: Permission denied
  - Solution: Check storage RLS policies
- **413**: File too large
  - Solution: File exceeds 10MB limit

### Authentication Errors
- **401**: No user ID
  - Solution: User not authenticated with Clerk
- **403**: No organization ID
  - Solution: User needs to select/create organization

## What to Look For

### 1. Check Authentication
Look for:
```
Auth result: { orgId: 'org_xxx', userId: 'user_xxx' }
```
Both should have values, not `null` or `undefined`.

### 2. Check File Parsing
Look for:
```
Form data parsed: {
  hasFile: true,
  fileName: '...',
  fileType: 'image/...',
  fileSize: number
}
```

### 3. Check Storage Upload
Look for:
```
✅ Storage upload successful
Upload data: { path: '...', ... }
```

### 4. Check Database Insert
Look for:
```
Insert data: {
  template_name: '...',
  template_url: 'https://...',
  organization_id: 'org_...',
  created_by: 'user_...',
  file_type: 'image/...',
  file_size: number
}
```

Verify all fields are present and have valid values.

### 5. Check for Error Details
If you see ❌, look immediately below for:
- **message**: Human-readable error
- **code**: PostgreSQL error code
- **hint**: Suggested fix
- **details**: Additional context

## Migration Checklist

If you're getting database errors, verify these migrations ran:

- [ ] Migration 04: Adds `created_by` to `card_templates`
- [ ] Migration 12: Adds `organization_id` to `card_templates`
- [ ] Migration 13: Renames `card_templates` → `templates`
- [ ] Migration 19: Ensures both columns exist on `templates` table

Run this query in Supabase to verify:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'templates'
AND column_name IN ('organization_id', 'created_by')
ORDER BY column_name;
```

Expected result: 2 rows showing both columns exist.

## Getting Help

When reporting issues, include:
1. Full console output from `=== TEMPLATE UPLOAD DEBUG ===` to `=== END TEMPLATE UPLOAD DEBUG ===`
2. Full server console output from `=== API /card-upload START ===` to end
3. Screenshot of any error displayed in UI
4. Browser and version (Chrome, Firefox, Safari, etc.)
5. Deployment environment (local dev, Vercel, etc.)

This comprehensive logging will pinpoint exactly where the upload is failing.
