import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useThemeColor } from "@/hooks/useThemeColor";

export default function Research() {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const primaryColor = useThemeColor({}, 'primary');
  const cardBg = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');

  return (
    <ScrollView style={[styles.container, { backgroundColor }]}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: textColor }]}>Research</Text>
          <Text style={[styles.subtitle, { color: textSecondary }]}>
            Exploring the frontiers of psychological science
          </Text>
        </View>
        
        {/* Highlighted Presentation Section */}
        <View style={[styles.highlightedSection, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={[styles.featuredBadge, { backgroundColor: primaryColor }]}>
            <Text style={styles.featuredBadgeText}>Featured</Text>
          </View>
          <Text style={[styles.highlightedTitle, { color: textColor }]}>Latest Publication</Text>
          <Text style={[styles.highlightedText, { color: textSecondary }]}>
            Ma, L., Keen II, L. D., Steinberg, J. L., Eddie, D., Tan, A., Keyser-Marcus, L., ... & Moeller, F. G. (2024). 
            Relationship between central autonomic effective connectivity and heart rate variability: a resting-state fMRI dynamic causal modeling study.{'\n'}
            <Text style={[styles.highlightedJournal, { color: primaryColor }]}> NeuroImage</Text>, 300, 120869.
          </Text>
        </View>

        {/* Published Manuscripts & Presentations */}
        <Text style={[styles.sectionTitle, { color: textColor }]}>Publications</Text>
        
        <View style={styles.publicationsList}>
          <PublicationItem
            text="Ma, L., Keen II, L. D., Steinberg, J. L., Eddie, D., Tan, A., Keyser-Marcus, L., ... & Moeller, F. G. (2024). Relationship between central autonomic effective connectivity and heart rate variability: a resting-state fMRI dynamic causal modeling study. NeuroImage, 300, 120869."
            primaryColor={primaryColor}
            textSecondary={textSecondary}
          />
          
          <PublicationItem
            text="Ma, L., Braun, S. E., Steinberg, J. L., Bjork, J. M., Martin, C. E., Keen II, L. D., & Moeller, F. G. (2024). Effect of scanning duration and sample size on reliability in resting state fMRI dynamic causal modeling analysis. NeuroImage, 292, 120604."
            primaryColor={primaryColor}
            textSecondary={textSecondary}
          />
          
          <PublicationItem
            text="Kuno, C. B., Frankel, L., Ofosuhene, P., & Keen II, L. (2024). Validation of the Adult Eating Behavior Questionnaire (AEBQ) in a young adult Black sample in the US: Evaluating the psychometric properties and associations with BMI. Current Psychology, 43(35), 28590-28603."
            primaryColor={primaryColor}
            textSecondary={textSecondary}
          />
          
          <PublicationItem
            text="Quarles, E., West, S. J., & Keen, L. (2024). Determining associations between Big Five personality traits and executive function in an undergraduate student sample. Journal of the International Neuropsychological Society, 1-8."
            primaryColor={primaryColor}
            textSecondary={textSecondary}
          />
          
          <PublicationItem
            text="Ma L, Keen LD II and Del Buono MG (2022) Editorial: Investigating substance use disorders using neuroimaging-based brain connectivity. Front. Psychiatry 13:992669. doi: 10.3389/fpsyt.2022.992669"
            primaryColor={primaryColor}
            textSecondary={textSecondary}
          />
          
          <PublicationItem
            text="Bell, K. A., Coleman, E., Cooke, B. G., & Keen, L. D. (2022). Recreational cannabis use is associated with poorer sleep outcomes in young adult African Americans. Addictive Behaviors, 134, 107399."
            primaryColor={primaryColor}
            textSecondary={textSecondary}
          />
          
          <PublicationItem
            text="Keen II, L., Turner, A. D., George, L., & Lawrence, K. (2022). Cannabis use disorder severity and sleep quality among undergraduates attending a Historically Black University. Addictive Behaviors, 134, 107414."
            primaryColor={primaryColor}
            textSecondary={textSecondary}
          />
          
          <PublicationItem
            text="Keen, L., Turner, A. D., Harris, T., George, L., & Crump, J. (2021). Differences in internalizing symptoms between those with and without Cannabis Use Disorder among HBCU undergraduate students. JOURNAL OF AMERICAN COLLEGE HEALTH."
            primaryColor={primaryColor}
            textSecondary={textSecondary}
          />
          
          <PublicationItem
            text="Keen, L., Abbate, A., Clark, V., Moeller, F. G., & Tan, A. Y. (2020). Differences in heart rate among recent marijuana use groups. Minerva cardioangiologica."
            primaryColor={primaryColor}
            textSecondary={textSecondary}
          />
          
          <PublicationItem
            text="Keen II, L., Turner, A. D. (2015). Differential effects of self-reported lifetime marijuana use on interleukin-1 alpha and tumor necrosis factor in African American adults. Journal of behavioral medicine, 1-8."
            primaryColor={primaryColor}
            textSecondary={textSecondary}
          />
          
          <Text style={[styles.footnote, { color: textSecondary }]}>
            *Student Authors; Bolded names represent PNIRD Lab members
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

interface PublicationItemProps {
  text: string;
  primaryColor: string;
  textSecondary: string;
}

function PublicationItem({ text, primaryColor, textSecondary }: PublicationItemProps) {
  const cardBg = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  
  return (
    <View style={[styles.publicationItem, { backgroundColor: cardBg, borderColor: cardBorder }]}>
      <Text style={styles.bullet}>•</Text>
      <Text style={[styles.publicationText, { color: textSecondary }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  highlightedSection: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  featuredBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  featuredBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  highlightedTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  highlightedText: {
    fontSize: 15,
    lineHeight: 24,
  },
  highlightedJournal: {
    fontStyle: 'italic',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  publicationsList: {
    gap: 12,
  },
  publicationItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  bullet: {
    fontSize: 16,
    marginRight: 10,
    color: '#2563eb',
    fontWeight: 'bold',
  },
  publicationText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
  },
  footnote: {
    marginTop: 20,
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
