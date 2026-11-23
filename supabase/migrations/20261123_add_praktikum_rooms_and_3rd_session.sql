-- Migration: Add 3 Physics Practical Exam rooms (40 students across 3 sessions) and 3rd session option
-- Run this in Supabase Project -> SQL Editor if your database was already initialized.

insert into public.rooms (name, category, sort_order, is_active)
values
  ('PRAKTIKUM FISIKA SESI 1 - IKHWAN', 'IKHWAN', 12, true),
  ('PRAKTIKUM FISIKA SESI 2 - AKHWAT', 'AKHWAT', 13, true),
  ('PRAKTIKUM FISIKA SESI 3 - AKHWAT', 'AKHWAT', 14, true)
on conflict (name) do nothing;

insert into public.students (room_id, student_no, nis, name, kelas, is_active)
values
  ((SELECT id FROM public.rooms WHERE name = 'PRAKTIKUM FISIKA SESI 1 - IKHWAN'), 1, '262710066', 'AMANDO SAKTIKA ARDHANI', 'X IPA 1', true),
  ((SELECT id FROM public.rooms WHERE name = 'PRAKTIKUM FISIKA SESI 1 - IKHWAN'), 2, '262710063', 'XANDER NATHANIEL BUDIYANTO', 'X IPA 1', true),
  ((SELECT id FROM public.rooms WHERE name = 'PRAKTIKUM FISIKA SESI 1 - IKHWAN'), 3, '262710009', 'ATTALAH RADITYA HAKIM', 'X IPA 1', true),
  ((SELECT id FROM public.rooms WHERE name = 'PRAKTIKUM FISIKA SESI 1 - IKHWAN'), 4, '262710059', 'SYAZWI SALEH', 'X IPA 1', true),
  ((SELECT id FROM public.rooms WHERE name = 'PRAKTIKUM FISIKA SESI 1 - IKHWAN'), 5, '262710016', 'DHAFFY RAFISQY RAMADHAN HARTONO', 'X IPA 1', true),
  ((SELECT id FROM public.rooms WHERE name = 'PRAKTIKUM FISIKA SESI 1 - IKHWAN'), 6, '262710054', 'RAJA DARIAN KSATRIA', 'X IPA 1', true),
  ((SELECT id FROM public.rooms WHERE name = 'PRAKTIKUM FISIKA SESI 1 - IKHWAN'), 7, '262710021', 'FARREL AHNAF GINTING', 'X IPA 1', true),
  ((SELECT id FROM public.rooms WHERE name = 'PRAKTIKUM FISIKA SESI 1 - IKHWAN'), 8, '262710065', 'RAHMAT ADRIAN SITORUS', 'X IPA 1', true),
  ((SELECT id FROM public.rooms WHERE name = 'PRAKTIKUM FISIKA SESI 1 - IKHWAN'), 9, '262710025', 'GERALD ATHALLAH AYUNG', 'X IPA 1', true),
  ((SELECT id FROM public.rooms WHERE name = 'PRAKTIKUM FISIKA SESI 1 - IKHWAN'), 10, '262710053', 'RAFA HAYFA SASMITA', 'X IPA 1', true),
  ((SELECT id FROM public.rooms WHERE name = 'PRAKTIKUM FISIKA SESI 1 - IKHWAN'), 11, '262710067', 'HAIBAN AMANULLAH RUSYDAN', 'X IPA 1', true),
  ((SELECT id FROM public.rooms WHERE name = 'PRAKTIKUM FISIKA SESI 1 - IKHWAN'), 12, '262710052', 'RADHIKA ARSYA ADHYASTHA', 'X IPA 1', true),
  ((SELECT id FROM public.rooms WHERE name = 'PRAKTIKUM FISIKA SESI 1 - IKHWAN'), 13, '262710038', 'MUHAMMAD ABYAN AKMAL WAFA', 'X IPA 1', true),
  ((SELECT id FROM public.rooms WHERE name = 'PRAKTIKUM FISIKA SESI 1 - IKHWAN'), 14, '262710049', 'PRINCE NAVEEN YUMASA', 'X IPA 1', true),
  ((SELECT id FROM public.rooms WHERE name = 'PRAKTIKUM FISIKA SESI 1 - IKHWAN'), 15, '262710041', 'MUHAMMAD FATHAN MUBIINA', 'X IPA 1', true),
  ((SELECT id FROM public.rooms WHERE name = 'PRAKTIKUM FISIKA SESI 1 - IKHWAN'), 16, '262710048', 'PRAWIRA RAFIF HAMBALI', 'X IPA 1', true),
  ((SELECT id FROM public.rooms WHERE name = 'PRAKTIKUM FISIKA SESI 1 - IKHWAN'), 17, '262710042', 'MUHAMMAD KENZIE ABIE', 'X IPA 1', true),
  ((SELECT id FROM public.rooms WHERE name = 'PRAKTIKUM FISIKA SESI 1 - IKHWAN'), 18, '262710068', 'MUHAMMAD TORIQ AL AKBAR', 'X IPA 1', true),
  ((SELECT id FROM public.rooms WHERE name = 'PRAKTIKUM FISIKA SESI 2 - AKHWAT'), 1, '262710010', 'AUDREY ATHA NITYASA', 'X IPA 2', true),
  ((SELECT id FROM public.rooms WHERE name = 'PRAKTIKUM FISIKA SESI 2 - AKHWAT'), 2, '262710057', 'RESTA PUTRI ODELIA RAHMAH', 'X IPA 3', true),
  ((SELECT id FROM public.rooms WHERE name = 'PRAKTIKUM FISIKA SESI 2 - AKHWAT'), 3, '262710014', 'CARISSA ZHAFIRA ZIARAMADHAN', 'X IPA 2', true),
  ((SELECT id FROM public.rooms WHERE name = 'PRAKTIKUM FISIKA SESI 2 - AKHWAT'), 4, '262710047', 'ODHELIA HUTRI MADHANEA', 'X IPA 3', true),
  ((SELECT id FROM public.rooms WHERE name = 'PRAKTIKUM FISIKA SESI 2 - AKHWAT'), 5, '262710017', 'ELVIRA NATAVIA MAYPUTRI HASAN', 'X IPA 2', true),
  ((SELECT id FROM public.rooms WHERE name = 'PRAKTIKUM FISIKA SESI 2 - AKHWAT'), 6, '262710046', 'NAZMA EISHA SELVANA', 'X IPA 3', true),
  ((SELECT id FROM public.rooms WHERE name = 'PRAKTIKUM FISIKA SESI 2 - AKHWAT'), 7, '262710019', 'FADIYAH NIDA NAIFAH', 'X IPA 2', true),
  ((SELECT id FROM public.rooms WHERE name = 'PRAKTIKUM FISIKA SESI 2 - AKHWAT'), 8, '262710032', 'KHANZA HAYFA SAKHI', 'X IPA 3', true),
  ((SELECT id FROM public.rooms WHERE name = 'PRAKTIKUM FISIKA SESI 2 - AKHWAT'), 9, '262710029', 'JIHAN KHANSA ADZKIYA HELGA', 'X IPA 2', true),
  ((SELECT id FROM public.rooms WHERE name = 'PRAKTIKUM FISIKA SESI 2 - AKHWAT'), 10, '262710031', 'KEISHA SHAQILE PRASETYA', 'X IPA 3', true),
  ((SELECT id FROM public.rooms WHERE name = 'PRAKTIKUM FISIKA SESI 2 - AKHWAT'), 11, '262710030', 'KAYYISA MAZEA ARLYM', 'X IPA 2', true),
  ((SELECT id FROM public.rooms WHERE name = 'PRAKTIKUM FISIKA SESI 2 - AKHWAT'), 12, '262710027', 'HASYA RENATA PUTRI', 'X IPA 3', true),
  ((SELECT id FROM public.rooms WHERE name = 'PRAKTIKUM FISIKA SESI 3 - AKHWAT'), 1, '262710045', 'NAMIRA MAHARANI REYHALIL', 'X IPA 2', true),
  ((SELECT id FROM public.rooms WHERE name = 'PRAKTIKUM FISIKA SESI 3 - AKHWAT'), 2, '262710026', 'HASFAH PUTRI SAFANA', 'X IPA 3', true),
  ((SELECT id FROM public.rooms WHERE name = 'PRAKTIKUM FISIKA SESI 3 - AKHWAT'), 3, '262710050', 'QUEENZA ANNISAVA HERRI', 'X IPA 2', true),
  ((SELECT id FROM public.rooms WHERE name = 'PRAKTIKUM FISIKA SESI 3 - AKHWAT'), 4, '262710024', 'GENDIS NAWIRA ANWAR', 'X IPA 3', true),
  ((SELECT id FROM public.rooms WHERE name = 'PRAKTIKUM FISIKA SESI 3 - AKHWAT'), 5, '262710058', 'SYAQUILA JANEETA LAURIE', 'X IPA 2', true),
  ((SELECT id FROM public.rooms WHERE name = 'PRAKTIKUM FISIKA SESI 3 - AKHWAT'), 6, '262710012', 'BELVA CALLISTA', 'X IPA 3', true),
  ((SELECT id FROM public.rooms WHERE name = 'PRAKTIKUM FISIKA SESI 3 - AKHWAT'), 7, '262710060', 'TARA AZKIA HALONA YUSTISIO', 'X IPA 2', true),
  ((SELECT id FROM public.rooms WHERE name = 'PRAKTIKUM FISIKA SESI 3 - AKHWAT'), 8, '262710007', 'ARINA ZAHIRA', 'X IPA 3', true),
  ((SELECT id FROM public.rooms WHERE name = 'PRAKTIKUM FISIKA SESI 3 - AKHWAT'), 9, '262710062', 'WANDA ZHAFIRA NUR IZZATUNNISA', 'X IPA 2', true),
  ((SELECT id FROM public.rooms WHERE name = 'PRAKTIKUM FISIKA SESI 3 - AKHWAT'), 10, '262710003', 'ALVIRA NAUROH SAAJIDAH', 'X IPA 3', true)
on conflict (room_id, nis) do nothing;

-- Update Session options to include 3rd session
update public.form_fields
set options = '["1st","2nd","3rd"]'::jsonb
where field_key = 'session';

-- Update Room dropdown fallback options
update public.form_fields
set options = '["RUANG 1 - AKHWAT","RUANG 2 - AKHWAT","RUANG 3 - AKHWAT","RUANG 4 - AKHWAT","RUANG 5 - AKHWAT","RUANG 6 - IKHWAN","RUANG 7 - IKHWAN","RUANG 8 - IKHWAN","RUANG 9 - IKHWAN","RUANG 10 - IKHWAN","RUANG 11 - IKHWAN","PRAKTIKUM FISIKA SESI 1 - IKHWAN","PRAKTIKUM FISIKA SESI 2 - AKHWAT","PRAKTIKUM FISIKA SESI 3 - AKHWAT"]'::jsonb
where field_key = 'room';
