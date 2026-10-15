import { useState, useEffect } from 'react';
import { supabase } from '@/db/supabase';

type ContentBlockValue = string | null;

interface UseContentBlocksResult {
  blocks: Record<string, ContentBlockValue>;
  loading: boolean;
  error: Error | null;
}

const FALLBACKS: Record<string, Record<string, string>> = {
  home: {
    hero_title: 'Ce. OTTER',
    hero_tagline: 'Center for Outreach and Treatment Through Education and Research',
    mission_text: 'The Center for Outreach & Treatment Through Education & Research is committed to provide community engagement, health education, medical services, and biomedical research training in the fields of Addiction, Public Health, Psychology, and other related fields to faculty, staff, students, and community stakeholders. Through the integration of education and research, the Ce. OTTER will help establish VSU as a health hub for surrounding communities.',
    page_title: 'Ce. OTTER',
    page_subtitle: 'Center for Outreach and Treatment Through Education and Research',
  },
  health: {
    page_title: 'Health Education',
    page_subtitle: 'Explore topics to learn about resources and support',
  },
  faculty: {
    page_title: 'Team',
    page_subtitle: 'Meet our dedicated research team',
    lab_title: 'PNIRD Lab',
    lab_description: 'Psychological Neuroscience & Interdisciplinary Research Division',
    lab_institution: 'Virginia State University',
  },
  contact: {
    page_title: 'Contact Us',
    page_subtitle: 'Get in touch with the C-OTTER Psychology Center',
    emergency_notice: 'This application provides general public health information and community resources and is not a substitute for emergency medical care, diagnosis, or crisis intervention. If you are experiencing a medical emergency or believe someone is in immediate danger, call 911 immediately or go to the nearest emergency room; for mental health emergencies or emotional distress, call or text 988 for the Suicide & Crisis Lifeline. If you need additional support connecting with healthcare or community services, please contact your local health department or healthcare provider directly.',
    footer_text: 'C-OTTER © 2024',
    footer_subtext: 'Connection, Outreach, Transformation, Teaching, Empowerment & Resources',
  },
  research: {
    page_title: 'Research',
    page_subtitle: 'Exploring the frontiers of psychological science',
    highlighted_title: 'Latest Publication',
    highlighted_text: 'Ma, L., Keen II, L. D., Steinberg, J. L., Eddie, D., Tan, A., Keyser-Marcus, L., ... & Moeller, F. G. (2024). Relationship between central autonomic effective connectivity and heart rate variability: a resting-state fMRI dynamic causal modeling study. NeuroImage, 300, 120869.',
    section_title: 'Publications',
    footnote: '*Student Authors; Bolded names represent PNIRD Lab members',
  },
  community: {
    page_title: 'Community Resources',
    page_subtitle: 'Connect with campus and local community support services',
    volunteer_title: 'Volunteer Opportunities',
    food_pantry_title: 'Food Pantry & Basic Needs',
  },
  coloring_book: {
    page_title: 'Coloring Page',
    page_subtitle: 'Relax and express your creativity',
  },
};

export function useContentBlocks(tab: string): UseContentBlocksResult {
  const [blocks, setBlocks] = useState<Record<string, ContentBlockValue>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchBlocks = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('content_blocks')
          .select('section_key, value, image_url, type')
          .eq('tab', tab);

        if (fetchError) {
          throw fetchError;
        }

        if (mounted) {
          const result: Record<string, ContentBlockValue> = {};
          if (data) {
            for (const row of data) {
              result[row.section_key] = row.type === 'image' ? row.image_url : row.value;
            }
          }
          setBlocks(result);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchBlocks();

    return () => {
      mounted = false;
    };
  }, [tab]);

  const fallbacks = FALLBACKS[tab] ?? {};

  const mergedBlocks = Object.keys(fallbacks).reduce((acc, key) => {
    acc[key] = blocks[key] ?? fallbacks[key];
    return acc;
  }, {} as Record<string, ContentBlockValue>);

  return {
    blocks: mergedBlocks,
    loading,
    error,
  };
}