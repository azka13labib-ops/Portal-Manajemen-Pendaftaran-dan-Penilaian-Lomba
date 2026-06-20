import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize a Supabase client with the service role key
// to bypass RLS and delete files regardless of policies
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;
    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    // 1. Delete files in registration-docs bucket
    const { data: regFiles, error: regListErr } = await supabaseAdmin.storage
      .from('registration-docs')
      .list(eventId + '/');

    if (!regListErr && regFiles && regFiles.length > 0) {
      const filesToRemove = regFiles.map(f => `${eventId}/${f.name}`);
      await supabaseAdmin.storage.from('registration-docs').remove(filesToRemove);
    }

    // 2. Delete files in submission-files bucket
    const { data: subFiles, error: subListErr } = await supabaseAdmin.storage
      .from('submission-files')
      .list(eventId + '/');

    if (!subListErr && subFiles && subFiles.length > 0) {
      const filesToRemove = subFiles.map(f => `${eventId}/${f.name}`);
      await supabaseAdmin.storage.from('submission-files').remove(filesToRemove);
    }

    // 3. Delete the event from the database
    // (Cascade deletes will handle the rest of the related data)
    const { error: dbError } = await supabaseAdmin
      .from('events')
      .delete()
      .eq('id', eventId);

    if (dbError) {
      console.error('Database deletion error:', dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Event and associated files deleted successfully' });
  } catch (error: any) {
    console.error('API Error during event deletion:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
