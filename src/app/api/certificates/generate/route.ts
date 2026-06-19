import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateCertificatePDF } from '@/lib/pdf-generator';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { eventId, winners = [] } = await request.json();

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    // 1. Fetch event
    const { data: event, error: eventErr } = await supabase
      .from('events')
      .select('title')
      .eq('id', eventId)
      .single();

    if (eventErr || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // 2. Fetch all approved registrations
    const { data: registrations, error: regErr } = await supabase
      .from('registrations')
      .select('*, users(full_name, email)')
      .eq('event_id', eventId)
      .eq('status', 'APPROVED');

    if (regErr || !registrations) {
      return NextResponse.json({ error: 'No approved registrations found' }, { status: 404 });
    }

    // Convert winners array to a map for easy lookup
    const winnersMap = new Map<string, string>();
    winners.forEach((w: { regId: string; rank: string }) => {
      winnersMap.set(w.regId, w.rank);
    });

    // 3. Process each approved registration
    const results = [];
    for (const reg of registrations) {
      const winnerRank = winnersMap.get(reg.id);
      const isWinner = !!winnerRank;
      const certType = isWinner ? 'WINNER' : 'PARTICIPATION';
      const name = reg.users?.full_name || 'Peserta';

      try {
        // Generate PDF Buffer
        const pdfBuffer = await generateCertificatePDF(
          name,
          event.title,
          certType,
          winnerRank
        );

        // Upload PDF to Supabase Storage
        const filePath = `${eventId}/${reg.id}.pdf`;
        const { error: uploadErr } = await supabase.storage
          .from('certificates')
          .upload(filePath, pdfBuffer, {
            contentType: 'application/pdf',
            upsert: true,
          });

        if (uploadErr) {
          console.error(`Error uploading cert for reg ${reg.id}:`, uploadErr);
          // Standard fallback: in case the bucket is not public or does not exist,
          // we still want to save a record in the database with a dummy link or raise the error.
          // Let's print out the error and throw it.
          throw uploadErr;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('certificates')
          .getPublicUrl(filePath);

        // Save to certificates table
        const { data: certRecord, error: dbErr } = await supabase
          .from('certificates')
          .upsert({
            registration_id: reg.id,
            event_id: eventId,
            user_id: reg.user_id,
            type: certType,
            winner_rank: winnerRank || null,
            file_url: publicUrl,
          }, {
            onConflict: 'registration_id',
          })
          .select()
          .single();

        if (dbErr) throw dbErr;
        results.push({ regId: reg.id, success: true, certId: certRecord.id });
      } catch (err) {
        console.error(`Failed to process certificate for reg ${reg.id}:`, err);
        results.push({ regId: reg.id, success: false, error: (err as Error).message });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.filter(r => r.success).length} of ${registrations.length} certificates.`,
      details: results,
    });
  } catch (err) {
    console.error('Batch certificate generation error:', err);
    return NextResponse.json({ error: (err as Error).message || 'Internal server error' }, { status: 500 });
  }
}
