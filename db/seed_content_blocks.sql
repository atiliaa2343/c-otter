-- Seeds content_blocks with the real text currently hardcoded in the app's
-- components, so admins start out editing actual content instead of an
-- empty table. Safe to run more than once — existing rows are left alone.

insert into public.content_blocks (tab, section_key, type, value) values
  ('home', 'hero_title', 'text', 'Ce. OTTER'),
  ('home', 'hero_tagline', 'text', 'Center for Outreach and Treatment Through Education and Research'),
  ('home', 'mission_text', 'text', 'The Center for Outreach & Treatment Through Education & Research is committed to provide community engagement, health education, medical services, and biomedical research training in the fields of Addiction, Public Health, Psychology, and other related fields to faculty, staff, students, and community stakeholders. Through the integration of education and research, the Ce. OTTER will help establish VSU as a health hub for surrounding communities.'),

  ('health', 'page_title', 'text', 'Health Education'),
  ('health', 'page_subtitle', 'text', 'Explore topics to learn about resources and support'),

  ('faculty', 'page_title', 'text', 'Team'),
  ('faculty', 'page_subtitle', 'text', 'Meet our dedicated research team'),
  ('faculty', 'lab_title', 'text', 'PNIRD Lab'),
  ('faculty', 'lab_description', 'text', 'Psychological Neuroscience & Interdisciplinary Research Division'),
  ('faculty', 'lab_institution', 'text', 'Virginia State University'),

  ('contact', 'page_title', 'text', 'Contact Us'),
  ('contact', 'page_subtitle', 'text', 'Get in touch with the C-OTTER Psychology Center'),
  ('contact', 'emergency_notice', 'text', 'This application provides general public health information and community resources and is not a substitute for emergency medical care, diagnosis, or crisis intervention. If you are experiencing a medical emergency or believe someone is in immediate danger, call 911 immediately or go to the nearest emergency room; for mental health emergencies or emotional distress, call or text 988 for the Suicide & Crisis Lifeline. If you need additional support connecting with healthcare or community services, please contact your local health department or healthcare provider directly.'),
  ('contact', 'footer_text', 'text', 'C-OTTER (c) 2024'),
  ('contact', 'footer_subtext', 'text', 'Connection, Outreach, Transformation, Teaching, Empowerment & Resources'),

  ('community', 'page_title', 'text', 'Community Resources'),
  ('community', 'page_subtitle', 'text', 'Connect with campus and local community support services'),

  ('research', 'page_title', 'text', 'Research'),
  ('research', 'page_subtitle', 'text', 'Exploring the frontiers of psychological science'),
  ('research', 'featured_publication', 'text', 'Ma, L., Keen II, L. D., Steinberg, J. L., Eddie, D., Tan, A., Keyser-Marcus, L., ... & Moeller, F. G. (2024). Relationship between central autonomic effective connectivity and heart rate variability: a resting-state fMRI dynamic causal modeling study. NeuroImage, 300, 120869.'),

  ('coloring_book', 'page_title', 'text', 'Coloring Page')
on conflict (tab, section_key) do nothing;
