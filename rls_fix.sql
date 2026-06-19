-- Izinkan semua pengguna yang login (Admin, Juri, Peserta) untuk melihat data Karya
DROP POLICY IF EXISTS "Allow authenticated users to read submissions" ON public.submissions;
CREATE POLICY "Allow authenticated users to read submissions"
ON public.submissions
FOR SELECT
TO authenticated
USING (true);

-- Izinkan semua pengguna yang login untuk melihat data Pendaftaran
DROP POLICY IF EXISTS "Allow authenticated users to read registrations" ON public.registrations;
CREATE POLICY "Allow authenticated users to read registrations"
ON public.registrations
FOR SELECT
TO authenticated
USING (true);

-- Izinkan semua pengguna yang login untuk melihat data Tabel Relasi (Teams)
DROP POLICY IF EXISTS "Allow authenticated users to read teams" ON public.teams;
CREATE POLICY "Allow authenticated users to read teams"
ON public.teams
FOR SELECT
TO authenticated
USING (true);
