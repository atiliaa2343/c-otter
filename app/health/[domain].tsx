import React from 'react';
import { View, Text, Image, ScrollView } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';

const BACKEND_URL = process.env.EXPO_PUBLIC_CONTENT_API || '';

interface AppItem {
  title: string;
  image: any;
  description?: string;
  features?: string[];
}

interface ResourceItem {
  name: string;
  address: string;
  phone?: string;
  description: string;
}

const cannabisResources: ResourceItem[] = [
  {
    name: 'SMART Recovery meetings',
    address: '',
    phone: '',
    description: 'Self-Management and Recovery Training offers an alternative to 12-step programs focusing on self-empowerment and self-reliance. Meetings help participants develop skills to manage cravings, build motivation, and create balanced lifestyles. We offer this as part of our treatment programs at FRC.',
  },
  {
    name: 'The Coleman Institute for Addiction Medicine',
    address: '204 N Hamilton St Suite B, Richmond, VA 23221',
    phone: '(804) 201-9218',
    description: 'Provides outpatient detox and addiction medicine services.',
  },
  {
    name: 'Skypoint Recovery Addiction & Mental Health Treatment',
    address: '3751 Nine Mile Rd, Richmond, VA 23223',
    phone: '(804) 492-7263',
    description: 'Offers addiction and mental health treatment, with 24/7 availability.',
  },
  {
    name: 'New Season Treatment Center – Richmond',
    address: '3021 Mechanicsville Tpke, Richmond, VA 23223',
    phone: '(877) 284-7074',
    description: 'An addiction treatment center with early-morning hours on weekdays.',
  },
  {
    name: 'REAL LIFE',
    address: '1111 N 25th St, Richmond, VA 23223',
    phone: '(804) 406-4111',
    description: 'Listed as an addiction treatment center.',
  },
];

const opioidResources: ResourceItem[] = [
  {
    name: 'Crossroads of Petersburg, VA (OBOT) Suboxone Clinic',
    address: '10531 South Crater Road, Petersburg, VA 23805',
    phone: '',
    description: 'Offers outpatient addiction treatment, medication-based recovery support, and individual therapy. The call center is open 24/7/365.',
  },
  {
    name: 'Foundations Health Petersburg',
    address: '2623 Park Avenue, Petersburg, VA 23805',
    phone: '',
    description: 'Provides outpatient medication-assisted treatment and counseling for opioid use disorder, plus aftercare planning and recovery support referrals.',
  },
  {
    name: 'Spero Health Petersburg',
    address: 'Petersburg, VA',
    phone: '',
    description: 'An outpatient option with Medicaid accepted in rehab directories. Focuses on Suboxone/MAT and recovery support services.',
  },
  {
    name: 'District 19 Community Services Board',
    address: '20 West Bank Street Suite 6, Petersburg, VA 23803',
    phone: '',
    description: 'Offers outpatient substance use treatment and is listed with Medicaid coverage in rehab directories.',
  },
  {
    name: 'Greater Reach Community Services Board',
    address: 'Petersburg and nearby areas',
    phone: '',
    description: 'Serves Petersburg and nearby areas with substance use treatment, counseling, and drug court services.',
  },
];

const opioidApps: AppItem[] = [
  {
    title: 'Pear reSET-O',
    image: require('../../assets/images/opioid/reset.png'),
    description: 'Pear reSET-O is a prescription digital therapeutic made specifically for opioid use disorder and used alongside outpatient treatment. It delivers a structured 12-week cognitive behavioral therapy program with weekly check-ins.',
    features: ['FDA-approved for opioid use disorder', 'Prescription required', 'CBT-based lessons and activities', 'Designed to support people already in treatment'],
  },
  {
    title: 'WEconnect',
    image: require('../../assets/images/opioid/weconnect.png'),
    description: 'WEconnect is a recovery support app that helps people stay engaged with treatment goals and daily recovery routines. It is often used with treatment programs, but it can also support people outside formal care.',
    features: ['Sobriety and meeting attendance tracking', 'Daily goal setting and progress tracking', 'Virtual meetings and peer support', 'Special-topic and community-specific meetings'],
  },
  {
    title: 'SoberTool',
    image: require('../../assets/images/opioid/sobertool.png'),
    description: 'SoberTool is built to help people handle cravings in the moment and avoid relapse. It focuses on immediate support when urges hit.',
    features: ['Craving-management tools', 'Relapse-prevention support', 'Sobriety tracking', 'Motivational messages and rewards'],
  },
  {
    title: 'Affect',
    image: require('../../assets/images/opioid/affect.png'),
    description: 'Affect is an all-in-one recovery app that offers a broader addiction recovery program, including support for opioids and other substances. It aims to combine treatment tools, habit-building, and mental health support in one place.',
    features: ['Structured recovery program', 'Supports opioids, alcohol, cannabis, stimulants, and prescription drugs', 'Rewards for progress', 'Mental health and healthy-habit support'],
  },
  {
    title: 'Nomo',
    image: require('../../assets/images/opioid/nomo.png'),
    description: 'Nomo is a sobriety-tracking app that helps users stay accountable to recovery goals. It is simple, flexible, and useful for building daily consistency.',
    features: ['Custom sobriety clocks', 'Mini exercises to stay focused', 'Encouragement and reminders', 'Search for accountability partners'],
  },
];

const cannabisApps: AppItem[] = [
  {
    title: 'rTribe',
    image: require('../../assets/images/cannabis/rTribe.jpeg'),
    description: 'rTribe is a peer-support recovery app that lets users connect anonymously with others and track progress. It is designed to make support more accessible during difficult moments.',
    features: ['Anonymous peer support', 'Progress tracking', 'Accessible during difficult moments'],
  },
  {
    title: 'Came to Believe in Sobriety',
    image: require('../../assets/images/cannabis/came to believe in sobriety.avif'),
    description: 'Came to Believe in Sobriety is a recovery app with goal-setting and milestone tracking. It uses a friendly interface to make the recovery process feel more approachable.',
    features: ['Goal setting', 'Milestone tracking', 'Friendly interface'],
  },
  {
    title: 'Quitzilla',
    image: require('../../assets/images/cannabis/quitzilla.png'),
    description: 'Quitzilla is a habit and sobriety tracker that can support people trying to stop opioid use by helping them build healthier routines. It is not opioid-specific, but it can still be useful for recovery habits and motivation.',
    features: ['Habit tracking', 'Sobriety tracking', 'Healthy routine building'],
  },
  {
    title: 'Grounded',
    image: require('../../assets/images/cannabis/grounded.png'),
    description: 'Grounded is designed for people trying to quit or cut back on weed, especially if they want a simple tracker and craving support. It focuses on helping users stay weed-free and manage cannabis withdrawal.',
    features: ['Simple tracker', 'Craving support', 'Withdrawal management'],
  },
  {
    title: 'Lucid',
    image: require('../../assets/images/cannabis/lucid.jpeg'),
    description: 'Lucid is a cannabis recovery app that helps people quit or reduce use with coaching and symptom tracking. It emphasizes structure, recovery milestones, and tools for handling cravings.',
    features: ['Coaching', 'Symptom tracking', 'Recovery milestones', 'Craving management tools'],
  },
];

export default function DomainPage() {
  const params = useLocalSearchParams() as { domain?: string };
  const domain = params.domain ?? 'general';
  const showOpioidApps = domain === 'opioids';
  const showCannabisApps = domain === 'cannabis';

  const appsToShow = showOpioidApps ? opioidApps : showCannabisApps ? cannabisApps : [];
  const resourcesToShow = showOpioidApps ? opioidResources : showCannabisApps ? cannabisResources : [];

  return (
    <>
      <Stack.Screen options={{ title: '', headerBackTitle: 'Categories', headerShown: true }} />
      <View style={{ flex: 1, backgroundColor: '#fff', padding: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', marginTop: 8, marginBottom: 8, textAlign: 'center' }}>
          {showOpioidApps ? 'Opioid Recovery' : showCannabisApps ? 'Cannabis Recovery' : 'Apps'}
        </Text>
        
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {resourcesToShow.length > 0 && (
            <>
              <Text style={{ fontSize: 18, fontWeight: '600', marginTop: 8, marginBottom: 8 }}>Local Resources</Text>
              {resourcesToShow.map((item, index) => (
                <View
                  key={`resource-${index}`}
                  style={{
                    backgroundColor: '#f8fafc',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    shadowColor: '#000',
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}>{item.name}</Text>
                  {item.address ? <Text style={{ fontSize: 13, color: '#4b5563', marginBottom: 2 }}>{item.address}</Text> : null}
                  {item.phone ? <Text style={{ fontSize: 13, color: '#4b5563', marginBottom: 6 }}>{item.phone}</Text> : null}
                  <Text style={{ fontSize: 13, color: '#6b7280', lineHeight: 18 }}>{item.description}</Text>
                </View>
              ))}
            </>
          )}
          
          <Text style={{ fontSize: 18, fontWeight: '600', marginTop: 8, marginBottom: 8 }}>Apps</Text>
          {appsToShow.map((item, index) => (
            <View
              key={index}
              style={{
                backgroundColor: '#f8fafc',
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
                shadowColor: '#000',
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Image
                  source={item.image}
                  style={{ width: 56, height: 56, marginRight: 16, borderRadius: 8, backgroundColor: '#fff' }}
                  resizeMode="contain"
                />
                <Text style={{ fontWeight: 'bold', fontSize: 18, flex: 1 }}>{item.title}</Text>
              </View>

              {item.description && (
                <Text style={{ fontSize: 14, color: '#4b5563', marginBottom: 12, lineHeight: 20 }}>
                  {item.description}
                </Text>
              )}

              {item.features && item.features.length > 0 && (
                <View>
                  <Text style={{ fontWeight: '600', fontSize: 14, marginBottom: 8, color: '#1f2937' }}>
                    Key features:
                  </Text>
                  {item.features.map((feature: string, idx: number) => (
                    <View key={idx} style={{ flexDirection: 'row', marginBottom: 4 }}>
                      <Text style={{ color: '#2563eb', marginRight: 8 }}>•</Text>
                      <Text style={{ fontSize: 13, color: '#6b7280', flex: 1 }}>{feature}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      </View>
    </>
  );
}
