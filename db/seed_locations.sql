-- Real data from db/data/Health_Care_Organizations_in_Petersburg_VA_Phrases.xlsx
-- and db/data/hours_of_operation.xlsx. Safe to run more than once.

insert into public.locations (id, name, address, phone_number, theme, hours_summary) values
  (1, 'Petersburg Healthcare Center', '287 E South Blvd, Petersburg, VA 23805', '(804) 733-1190', 'Nursing Home', '24 hours'),
  (2, 'Encompass Health Rehabilitation Hospital of Petersburg', '95 Medical Park Blvd, Petersburg, VA 23805', '(804) 504-8100', 'Rehabilitation Center', '24 hours'),
  (3, 'Bon Secours-Southside Medical Center', '200 Medical Park Blvd, Petersburg, VA 23805', '(804) 765-5000', 'Hospital', '24 hours'),
  (4, 'Hiram Davis Medical Center', '110 7th Ave, Petersburg, VA 23803', '(804) 524-7420', 'Mental Health Services', '24 hours but front desk is 6a-9p'),
  (5, 'Poplar Springs Hospital', '350 Poplar Dr, Petersburg, VA 23805', '(866) 546-2229', 'Mental Health Clinic', '24 hours'),
  (6, 'Battlefield Park Healthcare Center', '250 Flank Rd, Petersburg, VA 23805', '(804) 861-2223', 'Nursing Home', '24 hours'),
  (7, 'Central Virginia Health Services (CVHS) Petersburg', '321C Poplar Dr, Petersburg, VA 23805', '(804) 733-5591', 'Medical Clinic', 'Monday/Tues/Wed/Friday: 8a-5p; Thursday: 8a-6:30p; Sat/Sun: Closed'),
  (8, 'Southside Regional Home Health', '43 Rives Rd Suite 2, Petersburg, VA 23805', '(804) 862-8345', 'Home health care service', 'Mon-Fri: 8a-4:30p; Sat/Sun: Closed'),
  (9, 'Virginia South Psychiatric', '269 Medical Park Blvd, Petersburg, VA 23805', '(804) 861-0700', 'Mental health clinic', 'Mon-Fri: 8a-6:30; Sat/Sun: Closed'),
  (10, 'Central State Hospital', '26317 W Washington St, Petersburg, VA 23803', '(804) 524-7000', 'Psychiatric Hospital', '24 hours')
on conflict (id) do nothing;

insert into public.hours_of_operation (location_id, open_time, close_time, monday, tuesday, wednesday, thursday, friday, saturday, sunday) values
  (1,  null,     null,     true,  true,  true,  true,  true,  true,  true),
  (2,  null,     null,     true,  true,  true,  true,  true,  true,  true),
  (3,  null,     null,     true,  true,  true,  true,  true,  true,  true),
  (4,  null,     null,     true,  true,  true,  true,  true,  true,  true),
  (5,  null,     null,     true,  true,  true,  true,  true,  true,  true),
  (6,  null,     null,     true,  true,  true,  true,  true,  true,  true),
  (7,  '08:00',  '17:00',  true,  true,  true,  false, true,  false, false),
  (7,  '08:00',  '18:30',  false, false, false, true,  false, false, false),
  (8,  '08:00',  '16:30',  true,  true,  true,  true,  true,  false, false),
  (9,  '08:00',  '18:30',  true,  true,  true,  true,  true,  false, false),
  (10, null,     null,     true,  true,  true,  true,  true,  true,  true);
