import { faqEntries } from './faqKnowledge.js';

export const supportPageKnowledge = Object.freeze([
  {
    title: 'Home and getting started',
    label: 'Home',
    url: '/',
    keywords: 'home start account welcome platform',
    content: 'Ìdíléwa brings African language learning, culture, family activities, and technology learning together. The home page links to the Language Academy, Voice Lessons, Code, AI Conversation, Heritage, tutors, and family features. Visitors can explore activities and create an account when they want to save supported progress.',
  },
  {
    title: 'Language Academy',
    label: 'Language Academy',
    url: '/?view=academy',
    keywords: 'language Yorùbá Yoruba Igbo Hausa Kiswahili Swahili Pidgin lessons academy',
    content: 'The Language Academy currently highlights Yorùbá, Igbo, Hausa, and Kiswahili. Activities welcome beginners and include lessons, listening, pronunciation practice, and English explanations where available. Nigerian Pidgin is available in AI Conversation and selected Plotweaver voice tools where supported; language availability varies by service.',
  },
  {
    title: 'Languages and courses',
    label: 'Languages and Courses',
    url: '/languages',
    keywords: 'language course levels modules lessons curriculum',
    content: 'Language Discovery introduces the supported learning paths and language tools. The course experience organizes learning into levels, modules, and lessons; the focused lesson page provides prompts, answer validation, and progress rewards. Check the pages for the current activities offered in each language.',
  },
  {
    title: 'Focused lesson practice',
    label: 'Lessons',
    url: '/lesson',
    keywords: 'lesson practice prompt answer validate progress reward',
    content: 'The focused lesson page presents learning prompts, checks learner answers, and can award progress rewards. Available lessons depend on the selected language and course path.',
  },
  {
    title: 'Structured language courses',
    label: 'Courses',
    url: '/course',
    keywords: 'course curriculum modules levels lessons practice',
    content: 'The Courses page organizes language learning into structured levels, modules, and lessons. The available content depends on the selected language and learning path; use the course page to see the current lessons and continue into focused practice.',
  },
  {
    title: 'Voice Lessons and pronunciation',
    label: 'Voice Lessons',
    url: '/voice_lessons',
    keywords: 'voice speaking pronunciation listening speech audio trainer',
    content: 'Voice Lessons provides age-adaptive language practice, listening and speaking activities, and pronunciation tools. Browser microphone permissions and device capabilities affect microphone features. Plotweaver provides supported speech and transcription features; language coverage varies by service, so an unavailable feature should not be assumed to work for every language.',
  },
  {
    title: 'Voice African Language Trainer',
    label: 'Trainer',
    url: '/voice_lessons',
    keywords: 'trainer voice audio soundboard tone pronunciation lessons',
    content: 'The older Trainer address redirects to the current Voice Lessons experience. Voice Lessons offers age-adaptive learning paths, listening and speaking activities, and supported speech tools. Available languages and features vary by activity and provider support; microphone tools require browser permission and a compatible device.',
  },
  {
    title: 'Speech and language tools',
    label: 'Voice Tools',
    url: '/voices',
    keywords: 'voice translate translation text to speech transcription speech to text cloning Plotweaver Pidgin Nigerian',
    content: 'Ìdíléwa offers supported voice and translation tools through Plotweaver, including speech generation, transcription, translation, and an opt-in voice-cloning flow. Nigerian Pidgin is available in selected Plotweaver voice tools where supported. Availability differs by language and operation. Voice cloning requires explicit permission for the recording; never upload a child’s or another person’s voice without informed permission. Generated audio and recordings are not stored by Idilewa.',
  },
  {
    title: 'AI Conversation',
    label: 'AI Conversation',
    url: '/ai-conversation',
    keywords: 'AI chat Gemini Ollama conversation practice language coach messages saved',
    content: 'AI Conversation is a language practice experience for Yorùbá, Igbo, Hausa, Kiswahili, and Nigerian Pidgin. The server-side provider selected for the deployment (Gemini or local Ollama Desktop) generates replies; Plotweaver handles supported speech and reply translation. Authenticated conversation history can be saved to the account, while anonymous chats are not saved by Idilewa. Users should not enter personal or identifying information.',
  },
  {
    title: 'Code Playground and Development Center',
    label: 'Code Playground',
    url: '/code',
    keywords: 'code coding STEM programming Scratch games development center',
    content: 'The Code Playground and Development Center provide beginner-friendly coding, computational-thinking activities, language-aware coding lessons, and games. Some activities offer difficulty choices. Code execution depends on the configured runner service; the page reports execution failures rather than treating them as successful runs.',
  },
  {
    title: 'Kids Arcade',
    label: 'Kids Arcade',
    url: '/?view=codeLab#all-coding-games',
    keywords: 'kids arcade games Turbo Racers Balloon Ludo score progress',
    content: 'Turbo Racers and Balloon Ludo are available in the Code Playground All games catalogue. Completed results can update learner progress; guests use browser-local progress and signed-in learners use supported account sync. Saved game results contain score, outcome, language, and difficulty, not player names.',
  },
  {
    title: 'Creative Studio',
    label: 'Creative Studio',
    url: '/creative-studio',
    keywords: 'creative studio drawing art stories animation toon 3D projects',
    content: 'Creative Studio lets learners explore drawing, toon creation, 3D scenes, animation, and storytelling. Project-saving and return-to-project behavior can depend on the device and browser. Creative Studio is not the same as the Code Playground, which remains available separately.',
  },
  {
    title: 'Heritage Library',
    label: 'Heritage Library',
    url: '/heritage-library',
    keywords: 'heritage culture stories traditions riddles oral history',
    content: 'The Heritage Library brings together cultural stories, Oríkì, Òwe, traditions, riddles, and related learning resources. Cultural material should be understood with its speaker, source, and community context; the site treats culture as living knowledge rather than decoration.',
  },
  {
    title: 'Oral Traditions',
    label: 'Oral Traditions',
    url: '/oral',
    keywords: 'oral tradition poetry proverb song spoken word genre',
    content: 'The Oral Traditions pages introduce Oríkì, Òwe, spoken word, song, and related cultural genres. Learning materials emphasize attribution, speaker context, permission, and respect for the communities that carry these traditions.',
  },
  {
    title: 'Òwe and proverb activities',
    label: 'Òwe',
    url: '/owe',
    keywords: 'Owe proverb meaning translation story reflection contribute',
    content: 'Òwe pages support learning about proverbs through original text, translations, stories, and reflection. A proverb contribution submitted while signed in is private to that account and is not published automatically; guest contributions stay on the current device. Personal reflections remain on the device. One proverb page discusses “Sùúrù ni baba ìwà” as one common rendering, not as the only possible wording.',
  },
  {
    title: 'Òwe detail and meaning',
    label: 'Òwe Meaning',
    url: '/owe_detail',
    keywords: 'owe detail Sùúrù ni baba ìwà proverb meaning translation variation',
    content: 'The Òwe detail page explores “Sùúrù ni baba ìwà” and gives “Patience is the father of good character” as one common classroom rendering. Speakers may render the final word differently, so meaning depends on voice and context.',
  },
  {
    title: 'Oríkì',
    label: 'Oríkì',
    url: '/oriki',
    keywords: 'Oriki Yoruba praise poetry remembrance attribution',
    content: 'The Oríkì page explores Yorùbá praise poetry and remembrance, including rhythm, speaker, attribution, and permission. Cultural interpretations can vary; the page should not be treated as a substitute for community knowledge or a fluent speaker.',
  },
  {
    title: 'Culture Keepers',
    label: 'Culture Keepers',
    url: '/keepers',
    keywords: 'culture keepers attribution privacy community agency',
    content: 'Culture Keepers foregrounds attribution, privacy, and community agency in sharing cultural knowledge. Cultural information should be credited appropriately and shared with permission where required.',
  },
  {
    title: 'Family Portal and Parent Safety',
    label: 'For Families',
    url: '/parents',
    keywords: 'family parent guardian child account consent privacy dashboard',
    content: 'The Family Portal supports parent sign-up and sign-in, guardian-approved family links, learner progress, connection updates, and account settings. Child account access depends on the guardian approval flow. Parent and learner data is protected behind authenticated, role-checked services. This workflow does not replace legal identity verification or educator background checks.',
  },
  {
    title: 'Family Tasks',
    label: 'Family Tasks',
    url: '/family-tasks',
    keywords: 'family task parent assign submit approval points rewards',
    content: 'A linked parent can assign Family Tasks. Learners can submit work, and points are added only after parent approval. Access requires the appropriate authenticated family link; the assistant cannot view or change a family’s private tasks.',
  },
  {
    title: 'Tutor discovery and booking',
    label: 'Tutorship',
    url: '/tutor',
    keywords: 'tutor teacher booking lessons messaging availability rates',
    content: 'Tutor pages show sample educator profiles and discovery experiences. Live online tutor booking and tutor messaging are not currently enabled; displayed profiles are not confirmation of a real appointment or availability. Do not share personal or child contact information through tutor pages.',
  },
  {
    title: 'Educator Portal',
    label: 'Educator Portal',
    url: '/educator-portal',
    keywords: 'educator teacher portal invitation guardian learners lessons profile',
    content: 'The Educator Portal includes invitation-based educator access and guardian-approved learner connections, with educator tools for lessons, messages, profiles, availability, and settings. Access requires a valid invitation and required guardian approval. It is not a public tutor-booking system.',
  },
  {
    title: 'Privacy and family safety',
    label: 'Privacy',
    url: '/parents.html#/privacy',
    keywords: 'privacy data accounts children browser storage Supabase review delete',
    content: 'The Privacy page says supported lesson and game progress syncs for signed-in learners. Proverb contributions submitted while signed in are private to the account and are not published automatically; guest contributions, personal reflections, drafts, preferences, and profile photos stay in the current browser. Common support questions are answered from a local Idilewa help guide; questions that need a generated reply and recent messages are sent to the server-side provider configured for the deployment (Gemini or local Ollama Desktop). Idilewa does not save support chats. Child accounts require guardian email approval, and tutor connections require separate approval. Do not enter sensitive child details. Families can clear browser data or contact Idilewa to request review or deletion of account data.',
  },
  {
    title: 'Contact the Idilewa team',
    label: 'Contact',
    url: '/parents.html#/contact',
    keywords: 'contact support help accessibility school partnership safety email',
    content: 'The Contact page welcomes questions about learning, schools, accessibility, and the platform. It notes that school and tutor listings are previews, teacher connections remain disabled pending safeguarding verification, and the inbox is not an emergency service. Use the Contact page for its current email address and do not send passwords, one-time codes, or sensitive child information.',
  },
  {
    title: 'Pricing and plans',
    label: 'Pricing',
    url: '/pricing',
    keywords: 'pricing cost free plan family school payment billing subscription',
    content: 'The current Family and School learning plans are $0 USD per month. No payment details are collected and no subscription is started. There are no paid plans at present. The Pricing page is the source for current plan features and availability.',
  },
  {
    title: 'Profile and learning progress',
    label: 'Profile and Progress',
    url: '/profile',
    keywords: 'profile progress points streak badges account save sync',
    content: 'Learner progress pages can show points, streaks, badges, and learning activity. Guests keep supported progress in browser-local state; supported signed-in flows can sync progress to the account. Not every activity currently saves to a remote account.',
  },
  {
    title: 'Milestone Achievement',
    label: 'Milestones',
    url: '/milestones',
    keywords: 'milestone achievement life adventures challenge game badges progress',
    content: 'Milestone Achievement is an interactive life-adventures learning game. Challenge progress is saved on the current device; when a learner is signed in, supported progress can sync to the learner account. The page shows an explicit status if account synchronization fails.',
  },
  {
    title: 'About Ìdíléwa',
    label: 'About Ìdíléwa',
    url: '/about',
    keywords: 'about mission history African language technology culture',
    content: 'Ìdíléwa connects African language learning, oral memory, cultural storytelling, family learning, and technology education. Its product approach treats culture as living knowledge carried by people across generations.',
  },
  {
    title: 'Help Centre and contact',
    label: 'Help Centre',
    url: '/faq',
    keywords: 'help FAQ contact support email technical problem',
    content: 'The Help Centre provides answers about learning, family accounts, tutors, safety, and plans. General enquiries can be sent to hello@idilewa.com. Technical support can be reached at support@idilewa.com. Do not email passwords, access codes, or sensitive child information.',
  },
  {
    title: 'Guardian consent',
    label: 'Consent',
    url: '/consent',
    keywords: 'consent parent guardian child code verification safety',
    content: 'The consent page demonstrates guardian approval and local verification-code flows. It does not replace legal identity verification, background checks, or a completed production safeguarding process.',
  },
  {
    title: 'Parent and learner sign-in',
    label: 'Sign In',
    url: '/login',
    keywords: 'login sign in signup password reset email account authentication',
    content: 'Parent and learner authentication uses the family sign-in screens. Account confirmation and password recovery follow the email instructions on those screens. Never share passwords or verification codes with support.',
  },
  {
    title: 'Oral genre guide',
    label: 'Oral Genres',
    url: '/oral_genre',
    keywords: 'genre oral context attribution speaker permission',
    content: 'The oral genre guide links cultural forms with attribution, speaker context, and consent. The surrounding pages provide educational introductions, not authoritative rulings on every community tradition.',
  },
  {
    title: 'Owe story and reflection',
    label: 'Òwe Story and Reflection',
    url: '/owe_story',
    keywords: 'Owe story Dami okra seed reflection classroom',
    content: 'The Òwe classroom story about Dami and the okra seed is an educational example, explicitly not presented as a traditional folktale. Reflection pages invite personal responses; those responses remain on the current device.',
  },
  {
    title: 'Òwe contribution',
    label: 'Contribute an Òwe',
    url: '/owe_add',
    keywords: 'owe add contribution proverb consent attribution account private device storage',
    content: 'The Òwe contribution form asks learners to provide a meaning or context and confirm they have permission to share the material. Signed-in submissions are private to the account and are not published automatically; guest submissions stay on the current device. Avoid including personal or identifying details.',
  },
  {
    title: 'Òwe reflection',
    label: 'Òwe Reflection',
    url: '/owe_reflection',
    keywords: 'owe reflection child response device privacy story',
    content: 'The Òwe reflection activity invites a learner to choose a feeling, share a thought, and choose a helpful action. Responses stay on the current device and may be visible to others using that device.',
  },
  {
    title: 'Student and teacher connections',
    label: 'Connections',
    url: '/connect_students',
    keywords: 'connect students teachers guardian sample assignments',
    content: 'Student and teacher connection pages demonstrate sample assignments and learner links. Educator access requires invitation and guardian verification; sample content is not a real booking or an open connection to a tutor.',
  },
  {
    title: 'Connect with Teachers',
    label: 'Connect with Teachers',
    url: '/connect_teachers',
    keywords: 'teacher tutor educator directory guardian consent sample profile',
    content: 'Connect with Teachers displays example educator profiles. No teacher connection or request can be made from this preview. Any future child–educator introduction requires guardian approval and the required safeguarding checks; the directory is not a booking service.',
  },
]);

export const supportFaqKnowledge = Object.freeze(faqEntries.map(([title, content, category]) => {
  const searchText = `${title} ${content}`.toLowerCase();
  if (title === 'Which languages does the Language Academy cover?') {
    return { title, content, url: '/?view=academy', label: 'Language Academy', keywords: '' };
  }
  if (category === 2 && /voice|pronunciation|microphone/.test(searchText)) {
    return { title, content, url: '/voice_lessons', label: 'Voice Lessons', keywords: '' };
  }
  if (category === 3 && /creative|draw|stor/.test(searchText)) {
    return { title, content, url: '/creative-studio', label: 'Creative Studio', keywords: '' };
  }
  if (category === 6 && /task/.test(searchText)) {
    return { title, content, url: '/family-tasks', label: 'Family Tasks', keywords: '' };
  }
  if (category === 7 && /plan|price|paid|free|billing/.test(searchText)) {
    return { title, content, url: '/pricing', label: 'Pricing', keywords: '' };
  }
  if (category === 7 && /password|reset/.test(searchText)) {
    return { title, content, url: '/login', label: 'Sign In', keywords: '' };
  }

  const sources = {
    1: ['/about', 'About Ìdíléwa'],
    2: ['/?view=academy', 'Language Academy'],
    3: ['/code', 'Code and Creativity'],
    4: ['/heritage-library', 'Heritage Library'],
    5: ['/tutor', 'Tutorship'],
    6: ['/parents', 'For Families'],
    7: ['/faq', 'Help Centre'],
  };
  const [url, label] = sources[category] || sources[7];
  return { title, content, url, label, keywords: '' };
}));
