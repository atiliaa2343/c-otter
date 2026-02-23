import React from 'react';
import { View, Text, ScrollView, StyleSheet, Linking } from 'react-native';

export default function Research() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Research</Text>
        
        {/* Highlighted Presentation Section */}
        <View style={styles.highlightedSection}>
          <Text style={styles.highlightedTitle}>Featured Presentation</Text>
          <View style={styles.highlightedCard}>
            <Text style={styles.highlightedText}>
              Ma, L., Keen II, L. D., Steinberg, J. L., Eddie, D., Tan, A., Keyser-Marcus, L., ... & Moeller, F. G. (2024). 
              Relationship between central autonomic effective connectivity and heart rate variability: a resting-state fMRI dynamic causal modeling study. 
              <Text style={styles.highlightedJournal}> NeuroImage</Text>, 300, 120869.
            </Text>
          </View>
        </View>

        {/* Published Manuscripts & Presentations */}
        <Text style={styles.sectionTitle}>Published Manuscripts & Presentations</Text>
        
        <View style={styles.publicationsList}>
          <PublicationItem
            text="Ma, L., Keen II, L. D., Steinberg, J. L., Eddie, D., Tan, A., Keyser-Marcus, L., ... & Moeller, F. G. (2024). Relationship between central autonomic effective connectivity and heart rate variability: a resting-state fMRI dynamic causal modeling study. NeuroImage, 300, 120869."
          />
          
          <PublicationItem
            text="Ma, L., Braun, S. E., Steinberg, J. L., Bjork, J. M., Martin, C. E., Keen II, L. D., & Moeller, F. G. (2024). Effect of scanning duration and sample size on reliability in resting state fMRI dynamic causal modeling analysis. NeuroImage, 292, 120604."
          />
          
          <PublicationItem
            text="Kuno, C. B., Frankel, L., Ofosuhene, P., & Keen II, L. (2024). Validation of the Adult Eating Behavior Questionnaire (AEBQ) in a young adult Black sample in the US: Evaluating the psychometric properties and associations with BMI. Current Psychology, 43(35), 28590-28603."
          />
          
          <PublicationItem
            text="Quarles, E., West, S. J., & Keen, L. (2024). Determining associations between Big Five personality traits and executive function in an undergraduate student sample. Journal of the International Neuropsychological Society, 1-8."
          />
          
          <PublicationItem
            text="Ma L, Keen LD II and Del Buono MG (2022) Editorial: Investigating substance use disorders using neuroimaging-based brain connectivity. Front. Psychiatry 13:992669. doi: 10.3389/fpsyt.2022.992669"
          />
          
          <PublicationItem
            text="Bell, K. A., Coleman, E., Cooke, B. G., & Keen, L. D. (2022). Recreational cannabis use is associated with poorer sleep outcomes in young adult African Americans. Addictive Behaviors, 134, 107399."
          />
          
          <PublicationItem
            text="Keen II, L., Turner, A. D., George, L., & Lawrence, K. (2022). Cannabis use disorder severity and sleep quality among undergraduates attending a Historically Black University. Addictive Behaviors, 134, 107414."
          />
          
          <PublicationItem
            text="IANNACCONE, G., ABBATE, A., KEEN II, L., & PORTO, I. Minerva Cardiology and Angiology 2021 August; 69 (4): 475-6."
          />
          
          <PublicationItem
            text="Keen, L., Turner, A. D., Harris, T., George, L., & Crump, J. (2021). Differences in internalizing symptoms between those with and without Cannabis Use Disorder among HBCU undergraduate students. JOURNAL OF AMERICAN COLLEGE HEALTH."
          />
          
          <PublicationItem
            text="Ravindra, K., Del Buono, M. G., Chiabrando, J. G., Westman, P., Bressi, E., Kadariya, D., ... Keen, L. & Abbate, A. (2021). Clinical features and outcomes between African American and Caucasian patients with Takotsubo Syndrome. Minerva Cardioangiologica."
          />
          
          <PublicationItem
            text="Larry Keen, Lauren George, Georgia Williams, Gwenna Blanden & Mara Ramirez (2020) Assessing the validity of the Self-Report Webexec Questionnaire: Self-report vs performance neurocognitive inferences, Applied Neuropsychology: Adult, DOI: 10.1080/23279095.2020.1843041"
          />
          
          <PublicationItem
            text="Keen, L., Abbate, A., Clark, V., Moeller, F. G., & Tan, A. Y. (2020). Differences in heart rate among recent marijuana use groups. Minerva cardioangiologica."
          />
          
          <PublicationItem
            text="Clark, V. R., Keen, L., Brooks, J., Boyd, K., & Watkins, B. (2020). Fish Preparation as a Predictor of Cardiovascular Activity in African American Men and Women. Journal of Clinical Nutrition and Food Chemistry."
          />
          
          <PublicationItem
            text="Keen, II. L., Tan, A. Y., & Abbate, A. (2020). Inverse associations between parasympathetic activity and cognitive flexibility in African Americans: Preliminary findings. International Journal of Psychophysiology."
          />
          
          <PublicationItem
            text="Keen, L., Arias, A., Abbate, A., & Moeller, F. G. (2020). Heart Rate Variability as a Link Between Brain-Elicited Substance Cues and Substance Use Severity. Biological Psychiatry: Cognitive Neuroscience and Neuroimaging, 5, 560-561."
          />
          
          <PublicationItem
            text="Keen, L, HarrIs, T., Blanden, G.*, & George, L.*, & Williams, G.* (2019). The Self-Compassion Scale's Validity in a HBCU Undergraduate Sample. Virginia Social Science Journal, 53, 72-81."
          />
          
          <PublicationItem
            text="Callender, C.O., Mwendwa, D.T., Gholson,G., Wright, R.S., Keen, L., Adesibikan, B., Madhere, S., Apprey, V., Bonney, G., Michael, M., Magnus-Lawson, B., Ivy, G., Idris-Suleiman, L., Hernandez, A., Herren, O., & Campbell, A.L. (2019). BMI, waist size, GFR: In African American Blacks. Journal of Obesity and Weight-loss Medication."
          />
          
          <PublicationItem
            text="Keen II, L., Abbate, A., Blanden, G.*, Priddie, C.*, Moeller, F. G., & Rathore, M. (2019). Confirmed marijuana use and lymphocyte count in black people living with HIV. Drug and alcohol dependence."
          />
          
          <PublicationItem
            text="Blanden, G.*, Butts, C.*, Reid, M., & Keen, L. (2018). Self-reported lifetime violence exposure and self-compassion associated with satisfaction of life in historically Black college and university students. Journal of interpersonal violence, 0886260518791596."
          />
          
          <PublicationItem
            text="Keen II, L., Turner, A., Pereira, D., Callender, C., Campbell, A. The Psychoneuroimmunological Influences of Marijuana Use: Past and Future Directions. New Trends and Advanced Methods in Interdisciplinary Mathematical Sciences, STEAM-H: Science In Press."
          />
          
          <PublicationItem
            text="Sceidell, J., Lejuez, C., Golin, C., Adimora, A., Wohl, D., Keen II, L., Hamond, M., Judon-Monk, S., Khan, M. (2017). Patterns of Mood and Personality Factors and Associations with STI-HIV-Related Drug and Sex Risk among African American Inmates: Heightened Vulnerability of Men with Antisocial Personality. Substance Use & Misuse, 1-10."
          />
          
          <PublicationItem
            text="Turner, A.D., Smith, C.E., Ong, J.C. (2017). Is Purpose in Life Associated with Less Sleep Disturbance in Older Adults? Sleep Science and Practice 1:14."
          />
          
          <PublicationItem
            text="Turner, A.D., James, B.D., Capuano, A.W., Aggarwal, N.T. & Barnes, L.L. (2017). Perceived Stress and Cognitive Decline in Different Cognitive Domains in a Cohort of Older African Americans. American Journal of Geriatric Psychiatry 25(1):25-34."
          />
          
          <PublicationItem
            text="Keen II, L., *Blanden, G., *Rehmani, N. Lifetime Marijuana Use and Sexually Transmitted Infection Prevalence in a Sample of Black College Students. (2016). Addictive Behaviors."
          />
          
          <PublicationItem
            text="Turner, A. D., Buchman, A., Lim, A., Bennett, D, & Barnes, L.L. (2016). Characteristics of Self-reported Sleep in Older African Americans and Non-Hispanic White Americans. Ethnicity and Disease 26(4):521-528."
          />
          
          <PublicationItem
            text="Crawford, M.R., Turner, A.D., Wyatt, J.K., Fogg, L.F., & Ong, J.C. (2015) Evaluating treatment of sleep apnea and comorbid insomnia using an incomplete factorial design. Contemporary Clinical Trials 47:146-152."
          />
          
          <PublicationItem
            text="Harris, T. S., & *Ramsey, M. (2015). Paternal modeling, household availability, and paternal intake as predictors of fruit, vegetable, and sweetened beverage consumption among African American children. Appetite, 85, 171-177."
          />
          
          <PublicationItem
            text="Fleischman, D.A., Yang, J., Arfanakis, K.A., Arvanitakis, Z., Turner, A.D., Barnes, L.L., Bennett, D.A., Buchman, A.S. (2015) Physical activity, motor function and white matter hyperintensity burden in healthy old adults. Neurology 84(13):1294-1300."
          />
          
          <PublicationItem
            text="Keen II, L., Turner, A. D. (2015). Differential effects of self-reported lifetime marijuana use on interleukin-1 alpha and tumor necrosis factor in African American adults. Journal of behavioral medicine, 1-8."
          />
          
          <PublicationItem
            text="Keen II, L., Turner, A. D., Mwendwa, D., Callender, C., & Campbell Jr, A. (2015). Depressive Symptomatology and Respiratory Sinus Arrhythmia in a Non-Clinical Sample of Middle-Aged African Americans. Biological psychology."
          />
          
          <PublicationItem
            text="Scheidell, J. D., Clifford, L. M., Dunne, E. M., Keen II, L. D., & Latimer, W. W. (2015). Gender Differences in Planning Ability and Hepatitis C Virus among People who Inject Drugs. Addictive Behaviors."
          />
          
          <PublicationItem
            text="Harris, T., Sideris, J., Serpell, Z., Burchinal, M., & Pickett, C. (2014). Domain-specific cognitive stimulation and maternal sensitivity as predictors of early academic outcomes among low-income African American preschoolers. The Journal of Negro Education, 83(1), 15-28."
          />
          
          <PublicationItem
            text="Keen II, L., Ennis Whitehead, N., Clifford, L. Rose, J., Latimer, W. (2014). Perceived Barriers to Treatment in a Community-Based Sample of African American Men and Women. Journal of Psychoactive Drugs."
          />
          
          <PublicationItem
            text="Keen II, L., Turner, A. (2014). The Influence of Interleukin-6 on Neurocognition as a Function of Lifetime Marijuana Use in a Community Based Sample of African Americans: Journal of International Neuropsychology."
          />
          
          <PublicationItem
            text="Keen II, L., Pereira, D., Latimer, W. (2014). Self-Reported Lifetime Marijuana Use and Interleukin-6 Levels in Middle-Aged African Americans. Drug and Alcohol Dependence."
          />
          
          <PublicationItem
            text="Keen II, L., Khan, M., Clifford, L., Harrell, P., Latimer, W. (2014). Differences in Prevalence of HIV and HCV between Blacks and Whites Based on Patterns of Injection and Non-Injection Drug Use in Baltimore City. Journal of Addictive Behaviors."
          />
          
          <PublicationItem
            text="Keen II, L., Dyer, T., Ennis Whitehead, N., Rose, J. and Latimer, W. (2014). Binge Drinking and Stimulant Use Associated with HIV Status in Heterosexual African American Men. Journal of Addictive Behaviors."
          />
          
          <PublicationItem
            text="Whitehead Ennis, N., Trenz, R., Keen II, L., Rose, J., Latimer, W. (2013) Younger versus Older African Americans: Patterns and Prevalence of Illicit Drug Use. Journal of Aging and Health."
          />
          
          <PublicationItem
            text="Mwendwa, D., Sims, R., Madhere, S., Thomas, J., Keen II, L., Callender, C., & Campbell Jr., A. (2012) The Influence of Coping with Perceived Racism and Stress on Lipid Levels in African Americans. Journal of the National Medical Association"
          />
          
          <Text style={styles.footnote}>
            *Student Authors; Bolded names represent PNIRD Lab members
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

interface PublicationItemProps {
  text: string;
}

function PublicationItem({ text }: PublicationItemProps) {
  return (
    <View style={styles.publicationItem}>
      <Text style={styles.bullet}>•</Text>
      <Text style={styles.publicationText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 40,
    marginBottom: 30,
    color: '#1a1a1a',
    textAlign: 'center',
  },
  highlightedSection: {
    marginBottom: 40,
  },
  highlightedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2563eb',
  },
  highlightedCard: {
    backgroundColor: '#e0f2fe',
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
    padding: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  highlightedText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1e3a8a',
  },
  highlightedJournal: {
    fontStyle: 'italic',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1a1a1a',
  },
  publicationsList: {
    gap: 15,
  },
  publicationItem: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
    color: '#4b5563',
  },
  footnote: {
    marginTop: 20,
    fontSize: 12,
    fontStyle: 'italic',
    color: '#6b7280',
  },
});
