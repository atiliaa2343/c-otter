-- Seed data for research publications and community content
-- Run schema_research_community.sql first.
--
-- Re-runnable: every insert is guarded on a natural key so a second run is a
-- no-op rather than a duplicate. (These tables have no natural unique
-- constraint, so `on conflict do nothing` would insert duplicates every time.)

-- RESEARCH PUBLICATIONS (from components/Research.tsx)
insert into public.research_publications (citation, journal, year, is_featured, sort_order)
select v.citation, v.journal, v.year, v.is_featured, v.sort_order
from (values
  ('Ma, L., Keen II, L. D., Steinberg, J. L., Eddie, D., Tan, A., Keyser-Marcus, L., ... & Moeller, F. G. (2024). Relationship between central autonomic effective connectivity and heart rate variability: a resting-state fMRI dynamic causal modeling study. NeuroImage, 300, 120869.', 'NeuroImage', 2024, true, 0),
  ('Ma, L., Braun, S. E., Steinberg, J. L., Bjork, J. M., Martin, C. E., Keen II, L. D., & Moeller, F. G. (2024). Effect of scanning duration and sample size on reliability in resting state fMRI dynamic causal modeling analysis. NeuroImage, 292, 120604.', 'NeuroImage', 2024, false, 1),
  ('Kuno, C. B., Frankel, L., Ofosuhene, P., & Keen II, L. (2024). Validation of the Adult Eating Behavior Questionnaire (AEBQ) in a young adult Black sample in the US: Evaluating the psychometric properties and associations with BMI. Current Psychology, 43(35), 28590-28603.', 'Current Psychology', 2024, false, 2),
  ('Quarles, E., West, S. J., & Keen, L. (2024). Determining associations between Big Five personality traits and executive function in an undergraduate student sample. Journal of the International Neuropsychological Society, 1-8.', 'Journal of the International Neuropsychological Society', 2024, false, 3),
  ('Ma L, Keen LD II and Del Buono MG (2022) Editorial: Investigating substance use disorders using neuroimaging-based brain connectivity. Front. Psychiatry 13:992669. doi: 10.3389/fpsyt.2022.992669', 'Front. Psychiatry', 2022, false, 4),
  ('Bell, K. A., Coleman, E., Cooke, B. G., & Keen, L. D. (2022). Recreational cannabis use is associated with poorer sleep outcomes in young adult African Americans. Addictive Behaviors, 134, 107399.', 'Addictive Behaviors', 2022, false, 5),
  ('Keen II, L., Turner, A. D., George, L., & Lawrence, K. (2022). Cannabis use disorder severity and sleep quality among undergraduates attending a Historically Black University. Addictive Behaviors, 134, 107414.', 'Addictive Behaviors', 2022, false, 6),
  ('Keen, L., Turner, A. D., Harris, T., George, L., & Crump, J. (2021). Differences in internalizing symptoms between those with and without Cannabis Use Disorder among HBCU undergraduate students. JOURNAL OF AMERICAN COLLEGE HEALTH.', 'JOURNAL OF AMERICAN COLLEGE HEALTH', 2021, false, 7),
  ('Keen, L., Abbate, A., Clark, V., Moeller, F. G., & Tan, A. Y. (2020). Differences in heart rate among recent marijuana use groups. Minerva cardioangiologica.', 'Minerva cardioangiologica', 2020, false, 8),
  ('Keen II, L., Turner, A. D. (2015). Differential effects of self-reported lifetime marijuana use on interleukin-1 alpha and tumor necrosis factor in African American adults. Journal of behavioral medicine, 1-8.', 'Journal of behavioral medicine', 2015, false, 9)
) as v(citation, journal, year, is_featured, sort_order)
where not exists (
  select 1 from public.research_publications p where p.citation = v.citation
);

-- COMMUNITY CATEGORIES (from components/Community.tsx)
insert into public.community_categories (title, description, icon, color, sort_order)
select v.title, v.description, v.icon, v.color, v.sort_order
from (values
  ('Volunteer Opportunities', null::text, 'hand-right', '#10B981', 0),
  ('Food Pantry & Basic Needs', null::text, 'fast-food', '#F59E0B', 1)
) as v(title, description, icon, color, sort_order)
where not exists (
  select 1 from public.community_categories c where c.title = v.title
);

-- COMMUNITY ITEMS + LISTINGS
-- Looks up each parent category by title so this stays re-runnable even
-- though the categories get fresh uuids on first insert.
insert into public.community_items (category_id, title, description, icon, sort_order)
select c.id, v.title, v.description, v.icon, v.sort_order
from (values
  ('Volunteer Opportunities', 'Events', 'Find volunteer events and opportunities', 'calendar', 0),
  ('Volunteer Opportunities', 'Community', 'Connect with local organizations and partners', 'people', 1),
  ('Food Pantry & Basic Needs', 'Financial Assistance', 'Emergency funds, grants, and financial support', 'card', 2),
  ('Food Pantry & Basic Needs', 'Tutoring & Study Help', 'Academic support and tutoring services', 'book', 3),
  ('Food Pantry & Basic Needs', 'Campus Services', 'Campus offices and support services', 'business', 4)
) as v(category_title, title, description, icon, sort_order)
join public.community_categories c on c.title = v.category_title
where not exists (
  select 1 from public.community_items i where i.title = v.title
);

insert into public.community_listings (item_id, title, description, contact, date_time, link, sort_order)
select i.id, v.title, v.description, v.contact, v.date_time, v.link, v.sort_order
from (values
  ('Events', 'Campus Cleanup Day', 'Help clean up the campus grounds and gardens', 'Student Activities Office - (555) 123-4567', 'Saturday, March 22 - 9:00 AM to 12:00 PM', 'https://campus.edu/cleanup', 0),
  ('Events', 'Food Bank Sorting', 'Sort and package food donations for distribution', 'Local Food Bank - (555) 234-5678', 'Sunday, March 23 - 10:00 AM to 2:00 PM', 'https://foodbank.org/volunteer', 1),
  ('Events', 'Tutor Math at Elementary', 'Help elementary students with math homework', 'Lincoln Elementary - (555) 345-6789', 'Weekdays - 3:00 PM to 5:00 PM', 'https://lincolnschool.edu/tutoring', 2),
  ('Events', 'Animal Shelter Volunteering', 'Care for animals and help with shelter operations', 'City Animal Shelter - (555) 456-7890', 'Flexible Hours', 'https://animalshelter.org/volunteer', 3),
  ('Events', 'Community Garden Planting', 'Plant vegetables and maintain community garden beds', 'Parks & Rec Department - (555) 567-8901', 'Saturday, March 29 - 8:00 AM to 11:00 AM', 'https://parksrecrec.org/garden', 4),
  ('Community', 'Local Food Bank', 'Weekly sorting and food distribution', 'info@foodbank.org - (555) 234-5678', 'Ongoing', 'https://foodbank.org', 0),
  ('Community', 'Homeless Shelter', 'Meal service and tutoring for residents', 'shelter@homelesshelp.org - (555) 345-6789', 'Flexible Shifts', 'https://homelesshelp.org', 1),
  ('Community', 'Elementary Schools', 'After-school mentoring program', 'mentor@schools.org - (555) 456-7890', 'School Days - 2:30 PM to 4:30 PM', 'https://schools.org/mentor', 2),
  ('Community', 'Animal Shelter', 'Animal care, walking, and socialization', 'volunteer@animalshelter.org - (555) 567-8901', 'Any Time', 'https://animalshelter.org', 3),
  ('Community', 'Community Gardens', 'Planting and maintenance of garden beds', 'gardens@parks.org - (555) 678-9012', 'Seasonal', 'https://communitygardens.org', 4),
  ('Financial Assistance', 'Emergency Student Fund', 'One-time grants for students in crisis', 'financialaid@campus.edu - (555) 111-2222', 'Mon-Fri - 8:00 AM to 5:00 PM', 'https://campus.edu/emergencyfund', 0),
  ('Financial Assistance', 'Book Vouchers', 'Vouchers for textbooks and course materials', 'bookstore@campus.edu - (555) 222-3333', 'Mon-Fri - 9:00 AM to 6:00 PM', 'https://campus.edu/bookvouchers', 1),
  ('Financial Assistance', 'Transportation Assistance', 'Bus passes and gas cards for students', 'transport@campus.edu - (555) 333-4444', 'Mon-Fri - 8:00 AM to 5:00 PM', 'https://campus.edu/transport', 2),
  ('Financial Assistance', 'Financial Counseling', 'Budget planning and financial wellness support', 'counseling@campus.edu - (555) 444-5555', 'Mon-Fri - 9:00 AM to 4:00 PM', 'https://campus.edu/financialcounseling', 3),
  ('Tutoring & Study Help', 'Peer Tutoring Center', 'Free one-on-one tutoring in all subjects', 'tutoring@campus.edu - (555) 111-2222', 'Mon-Sun - 10:00 AM to 8:00 PM', 'https://campus.edu/tutoring', 0),
  ('Tutoring & Study Help', 'Writing Center', 'Essay review, feedback, and writing support', 'writing@campus.edu - (555) 222-3333', 'Mon-Fri - 9:00 AM to 6:00 PM', 'https://campus.edu/writingcenter', 1),
  ('Tutoring & Study Help', 'Study Groups', 'Subject-specific study sessions and group tutoring', 'academicsupport@campus.edu - (555) 333-4444', 'Varies by Group', 'https://campus.edu/studygroups', 2),
  ('Tutoring & Study Help', 'Online Resources', 'Access to Khan Academy, Quizlet Plus, and more', 'library@campus.edu - (555) 444-5555', '24/7 Online', 'https://campus.edu/onlineresources', 3),
  ('Campus Services', 'Counseling Center', 'Mental health support and counseling services', 'counseling@campus.edu - (555) 111-2222', 'Mon-Fri - 8:00 AM to 5:00 PM', 'https://campus.edu/counseling', 0),
  ('Campus Services', 'Career Services', 'Resume reviews, job fairs, and career guidance', 'careers@campus.edu - (555) 222-3333', 'Mon-Fri - 9:00 AM to 5:00 PM', 'https://campus.edu/careers', 1),
  ('Campus Services', 'Student Health Center', 'Medical care and health services', 'health@campus.edu - (555) 333-4444', 'Mon-Fri - 8:00 AM to 6:00 PM', 'https://campus.edu/health', 2),
  ('Campus Services', 'Disability Services', 'Accommodations and support for students with disabilities', 'disability@campus.edu - (555) 444-5555', 'Mon-Fri - 8:00 AM to 5:00 PM', 'https://campus.edu/disability', 3),
  ('Campus Services', 'International Student Office', 'Visa support and international student services', 'international@campus.edu - (555) 555-6666', 'Mon-Fri - 9:00 AM to 5:00 PM', 'https://campus.edu/international', 4)
) as v(item_title, title, description, contact, date_time, link, sort_order)
join public.community_items i on i.title = v.item_title
where not exists (
  select 1 from public.community_listings l where l.title = v.title
);
