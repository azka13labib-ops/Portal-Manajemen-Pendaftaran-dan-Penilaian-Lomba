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
      .select('title, registration_mode')
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

    const results = [];

    // 3. Process each approved registration
    for (const reg of registrations) {
      const winnerRank = winnersMap.get(reg.id);
      const isWinner = !!winnerRank;
      const certType = isWinner ? 'WINNER' : 'PARTICIPATION';
      
      // Determine who gets the certificate (array of users)
      const recipients: { user_id: string, full_name: string }[] = [];
      
      if (event.registration_mode === 'TEAM' && reg.team_id) {
        // Include the leader (who registered)
        recipients.push({
          user_id: reg.user_id,
          full_name: reg.users?.full_name || 'Peserta',
        });
        
        // Fetch confirmed team members
        const { data: teamMembers } = await supabase
          .from('team_members')
          .select('user_id, users(full_name)')
          .eq('team_id', reg.team_id)
          .eq('status', 'CONFIRMED');
          
        if (teamMembers) {
          for (const member of teamMembers) {
            // Avoid duplicating if leader is somehow in team_members
            if (member.user_id !== reg.user_id) {
              recipients.push({
                user_id: member.user_id,
                full_name: (member.users as unknown as { full_name: string })?.full_name || 'Peserta',
              });
            }
          }
        }
      } else {
        // Individual mode
        recipients.push({
          user_id: reg.user_id,
          full_name: reg.users?.full_name || 'Peserta',
        });
      }

      // Generate certificate for each recipient
      for (const recipient of recipients) {
        try {
          // Generate PDF Buffer
          const pdfBuffer = await generateCertificatePDF(
            recipient.full_name,
            event.title,
            certType,
            winnerRank
          );

          // Upload PDF to Supabase Storage
          const filePath = `${eventId}/${reg.id}-${recipient.user_id}.pdf`;
          const { error: uploadErr } = await supabase.storage
            .from('certificates')
            .upload(filePath, pdfBuffer, {
              contentType: 'application/pdf',
              upsert: true,
            });

          if (uploadErr) {
            console.error(`Error uploading cert for user ${recipient.user_id}:`, uploadErr);
            throw uploadErr;
          }

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('certificates')
            .getPublicUrl(filePath);

          // Save to certificates table (requires UNIQUE(registration_id, user_id) constraint in DB)
          const { data: certRecord, error: dbErr } = await supabase
            .from('certificates')
            .upsert({
              registration_id: reg.id,
              event_id: eventId,
              user_id: recipient.user_id,
              type: certType,
              winner_rank: winnerRank || null,
              file_url: publicUrl,
            }, {
              onConflict: 'registration_id,user_id',
            })
            .select()
            .single();

          if (dbErr) throw dbErr;
          results.push({ regId: reg.id, userId: recipient.user_id, success: true, certId: certRecord.id });
        } catch (err) {
          console.error(`Failed to process certificate for user ${recipient.user_id}:`, err);
          results.push({ regId: reg.id, userId: recipient.user_id, success: false, error: (err as Error).message });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed certificates for ${results.filter(r => r.success).length} participants.`,
      details: results,
    });
  } catch (err) {
    console.error('Batch certificate generation error:', err);
    return NextResponse.json({ error: (err as Error).message || 'Internal server error' }, { status: 500 });
  }
}
