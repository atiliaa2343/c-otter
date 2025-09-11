# Explainations
- app: where the pages of the app go, for now there is only one page called index.js
- assets: Where you'll have to replace the icons with whatever Ce-otter needs
- components: where specific parts of the UI are defined
- db: Database management, Clients with typescript are done via type definitions in ```database.types.ts``` and ```supabase.ts``` for reading from the database, Inserts are done using Python SQLAchemy from the data excel files **NOTE**: Be careful because the default for these Python files is 'replace'. 

Config files for Nativewind support.
.env files for environment variables in db/ and the root. 

**WARNING**: Eventually will have to be coded into some secrets. Since according to the docs for expo go: https://docs.expo.dev/guides/environment-variables/ it warns "Do not store sensitive info, such as private keys, in EXPO_PUBLIC_ variables. These variables will be visible in plain-text in your compiled application."

# Project tree structure since September 11th, 2025
```
├── app
│   ├── index.tsx
│   └── _layout.tsx
├── app.json
├── Architecture.md
├── assets
│   ├── fonts
│   │   └── SpaceMono-Regular.ttf
│   └── images
│       ├── adaptive-icon.png
│       ├── favicon.png
│       ├── icon.png
│       ├── partial-react-logo.png
│       ├── react-logo@2x.png
│       ├── react-logo@3x.png
│       ├── react-logo.png
│       └── splash-icon.png
├── babel.config.js
├── components
│   ├── Collapsible.tsx
│   ├── ExternalLink.tsx
│   ├── HapticTab.tsx
│   ├── HelloWave.tsx
│   ├── ListLocations.tsx
│   ├── ParallaxScrollView.tsx
│   ├── ThemedText.tsx
│   ├── ThemedView.tsx
│   ├── ui
│   │   ├── IconSymbol.ios.tsx
│   │   ├── IconSymbol.tsx
│   │   ├── TabBarBackground.ios.tsx
│   │   └── TabBarBackground.tsx
│   └── UserForm.tsx
├── db
│   ├── data
│   │   ├── Health_Care_Organizations_in_Petersburg_VA_Phrases.xlsx
│   │   ├── healthcare_phrases.csv
│   │   ├── hours_of_operation.xlsx
│   │   └── locations.xlsx
│   ├── database.types.ts
│   ├── hours_of_ops_insert.py
│   ├── locations_insert.py
│   ├── read_excel.js
│   ├── supabase.ts
│   └── test_embedding.py
├── eslint.config.js
├── expo-env.d.ts
├── global.css
├── index.js
├── metro.config.js
├── nativewind-env.d.ts
├── NOTES.md
├── package.json
├── package-lock.json
├── README.md
├── setup.bash
├── tailwind.config.js
└── tsconfig.json
```

