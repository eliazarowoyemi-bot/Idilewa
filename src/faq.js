const categories = [
  'All',
  'Getting started',
  'Language Academy',
  'Coding & Creativity',
  'Heritage',
  'Tutors',
  'Parents & Safety',
  'Plans & Support',
];

const entries = [
  ['What is Ìdíléwa?', 'Ìdíléwa brings African language learning, cultural storytelling, coding, and creative activities into one learning space.', 1],
  ['Who is Ìdíléwa for?', 'Children, parents, families, and adult learners can explore African languages, culture, and technology. Activities are designed for different ages and abilities.', 1],
  ['How do I get started?', 'Explore the academy, choose a language or activity, and create an account when you are ready to save your learning progress.', 1],
  ['Do I need prior knowledge of an African language?', 'No. The language activities welcome beginners as well as learners who already know some words and expressions.', 1],
  ['Which languages does the Language Academy cover?', 'The academy includes Yorùbá, Igbo, Hausa, Kiswahili, and Nigerian Pidgin learning experiences.', 2],
  ['Are lessons suitable for different ages?', 'Learning activities are designed to support children and learners at different stages. Families should choose content appropriate to each child.', 2],
  ['Can I practise pronunciation?', 'Voice Lessons and listening activities support pronunciation practice. Microphone-based features depend on your browser permissions and device.', 2],
  ['Can I see English translations with lessons?', 'Many learning activities include English explanations or translations alongside the language content.', 2],
  ['How are learning levels organised?', 'Language activities are grouped by learning level so learners can build knowledge step by step.', 2],
  ['Can my child learn coding in Yorùbá?', 'Ìdíléwa connects language and technology through beginner-friendly bilingual coding and computational-thinking activities.', 3],
  ['What coding activities are available?', 'The Code experience includes logic challenges, problem-solving, and beginner-friendly coding activities.', 3],
  ['Do coding games have different difficulty levels?', 'Some games offer selectable difficulty settings. Available choices depend on the activity.', 3],
  ['Can children create drawings and stories?', 'Creative Studio lets learners explore drawing, storytelling, and digital creativity.', 3],
  ['Can I save creative projects?', 'Creative Studio offers project-saving controls. Available storage and return-to-project behavior may vary by device and browser.', 3],
  ['What is the Heritage Library?', 'The Heritage Library brings together cultural stories, Oríkì, traditions, riddles, and other heritage learning resources.', 4],
  ['What is Oríkì?', 'Oríkì is a Yorùbá tradition of praise poetry and descriptive expressions that celebrate people, families, communities, places, and heritage.', 4],
  ['Are heritage stories translated into English?', 'Many stories include English translations or explanations to help learners understand their meaning and cultural context.', 4],
  ['How can I suggest a cultural correction?', 'Contact the Idilewa team with the page and passage in question. Please include a source or context when available.', 4],
  ['Can learners take heritage quizzes?', 'Some heritage activities include quizzes and reflection prompts to help learners revisit what they have read.', 4],
  ['Does Ìdíléwa offer online tutors?', 'The tutor pages show example educator profiles while the booking service is being finished. Contact support to ask about current availability.', 5],
  ['How do I book a tutor?', 'Online tutor booking is not currently enabled. Please contact support if you would like to ask about future tutoring availability.', 5],
  ['Can I message a tutor?', 'Live tutor messaging is not currently enabled. Do not share personal or child contact information through these pages.', 5],
  ['Can tutors help with subjects beyond languages?', 'The tutor pages may describe language and other learning subjects, but displayed tutor profiles are examples rather than confirmed availability.', 5],
  ['What happens if I need to cancel a lesson?', 'Online lesson booking and cancellation are not currently available in the app.', 5],
  ['Can parents follow a child’s progress?', 'Parents can use the family portal to review learning progress for children linked through the guardian approval flow.', 6],
  ['Can parents create family tasks?', 'Yes. A linked parent can assign tasks in Family Tasks. Learners can submit work, and points are added only after parent approval.', 6],
  ['Will children have separate learning profiles?', 'Each learner account has its own profile and saved learning activity. A parent can view linked learner progress after the required approval.', 6],
  ['How does Ìdíléwa handle personal information?', 'Review the Privacy Policy for details about account information and data handling. Never send passwords, access codes, or sensitive child information by email.', 6],
  ['Can parents choose learning content?', 'Parents can guide a child toward age-appropriate language, coding, and heritage activities that fit the family’s learning goals.', 6],
  ['Is Ìdíléwa free to use?', 'Some learning experiences are available at no cost. Check the Pricing page for the current plan details.', 7],
  ['What is included in a paid plan?', 'Current plan information is shown on the Pricing page. Features and availability may change as the product develops.', 7],
  ['Can I change my plan?', 'Plan changes depend on the options currently shown on the Pricing page. If you have a billing question, contact support.', 7],
  ['How do I reset my password?', 'Choose “Forgot password?” on the sign-in page and follow the email instructions. Use the same email address as your account.', 7],
  ['Can I use Ìdíléwa on a phone or tablet?', 'Yes. The website is designed to work on phones, tablets, and desktop screens.', 7],
  ['How do I report a technical problem?', 'Email support@idilewa.com with a short description of the issue, the affected page, and your browser or device. Do not include passwords or sensitive personal information.', 7],
  ['How can I contact Ìdíléwa?', 'For general enquiries, email hello@idilewa.com. For technical help, email support@idilewa.com.', 7],
];

const ui = {
  en: {
    title: 'How can we help you?',
    intro: 'Answers about learning, creating, and growing with Ìdíléwa.',
    heading: 'Frequently asked questions',
    caption: 'Find the answer you need, without the fuss.',
    search: 'Search questions…',
    help: 'Still need a little help?',
    helpText: 'Our team can help you find your way.',
    contact: 'Contact support',
    empty: 'No matching questions. Try a different search.',
    fallback: '',
    categories,
  },
  yo: {
    title: 'Báwo la ṣe lè ràn ọ́ lọ́wọ́?',
    intro: 'Ìrànlọ́wọ́ fún ẹ̀kọ́, àṣà àti ìmọ̀ ẹ̀rọ ní Ìdíléwa.',
    heading: 'Àwọn ìbéèrè tí a sábà máa ń béèrè',
    caption: 'Wá ìdáhùn sí àwọn ìbéèrè rẹ.',
    search: 'Wá ìbéèrè…',
    help: 'Ṣé o nílò ìrànlọ́wọ́ sí i?',
    helpText: 'Kàn sí ẹgbẹ́ ìrànlọ́wọ́ wa.',
    contact: 'Kàn sí wa',
    empty: 'A kò rí ìbéèrè tó bá ìwádìí rẹ mu.',
    fallback: 'Ìdáhùn Gẹ̀ẹ́sì ni a ń fi hàn; a ṣì ń ṣàyẹ̀wò ìtumọ̀ rẹ.',
    categories: ['Gbogbo', 'Ìbẹ̀rẹ̀', 'Ilé Ẹ̀kọ́ Èdè', 'Kóòdù àti Ìṣẹ̀dá', 'Àṣà àti Ìtàn', 'Olùkọ́', 'Òbí àti Ààbò', 'Ètò àti Ìrànlọ́wọ́'],
  },
  ig: {
    title: 'Kedu ka anyị ga-esi nyere gị aka?',
    intro: 'Nweta enyemaka maka mmụta na ihe omume Ìdíléwa.',
    heading: 'Ajụjụ a na-ajụkarị',
    caption: 'Chọta azịza ndị ị chọrọ.',
    search: 'Chọọ ajụjụ…',
    help: 'Ị chọrọ enyemaka ọzọ?',
    helpText: 'Kpọtụrụ ndị ọrụ enyemaka anyị.',
    contact: 'Kpọtụrụ anyị',
    empty: 'Enweghị ajụjụ dabara na ọchụchọ gị.',
    fallback: 'A na-egosi azịza Bekee ka a na-enyocha ntụgharị asụsụ.',
    categories: ['Niile', 'Ịmalite', 'Ụlọ Akwụkwọ Asụsụ', 'Koodu na Ihe Okike', 'Omenala', 'Ndị Nkuzi', 'Nne na Nna na Nchekwa', 'Atụmatụ na Enyemaka'],
  },
  ha: {
    title: 'Ta yaya za mu taimaka?',
    intro: 'Nemo taimako game da koyon harsuna da ayyukan Ìdíléwa.',
    heading: 'Tambayoyin da ake yawan yi',
    caption: 'Nemo amsoshin tambayoyinku.',
    search: 'Nemo tambaya…',
    help: 'Kana buƙatar ƙarin taimako?',
    helpText: 'Tuntuɓi ƙungiyar tallafinmu.',
    contact: 'Tuntuɓe mu',
    empty: 'Ba a sami tambayar da ta dace ba.',
    fallback: 'Ana nuna amsar Turanci yayin da ake duba fassarar.',
    categories: ['Duka', 'Farawa', 'Makarantar Harsuna', 'Lamba da Ƙirƙira', 'Al’adu', 'Malamai', 'Iyaye da Tsaro', 'Tsare-tsare da Taimako'],
  },
  sw: {
    title: 'Tunawezaje kukusaidia?',
    intro: 'Pata msaada kuhusu kujifunza na shughuli za Ìdíléwa.',
    heading: 'Maswali yanayoulizwa mara kwa mara',
    caption: 'Pata majibu unayohitaji kwa urahisi.',
    search: 'Tafuta swali…',
    help: 'Unahitaji msaada zaidi?',
    helpText: 'Wasiliana na timu yetu ya usaidizi.',
    contact: 'Wasiliana nasi',
    empty: 'Hakuna maswali yanayolingana na utafutaji wako.',
    fallback: 'Jibu la Kiingereza linaonyeshwa wakati tafsiri inapokaguliwa.',
    categories: ['Yote', 'Kuanza', 'Chuo cha Lugha', 'Programu na Ubunifu', 'Urithi', 'Wakufunzi', 'Wazazi na Usalama', 'Mipango na Usaidizi'],
  },
};

const elements = {
  title: document.getElementById('faqTitle'),
  intro: document.getElementById('faqIntro'),
  heading: document.getElementById('faqHeading'),
  caption: document.getElementById('faqCaption'),
  search: document.getElementById('faqSearch'),
  categories: document.getElementById('faqCategories'),
  questions: document.getElementById('faqQuestions'),
  supportTitle: document.getElementById('faqSupportTitle'),
  supportText: document.getElementById('faqSupportText'),
  supportLink: document.getElementById('faqSupportLink'),
  language: document.getElementById('faqLanguage'),
};

let selectedCategory = 0;
let searchTerm = '';
const expandedQuestions = new Set();

function render() {
  const language = elements.language.value;
  const copy = ui[language] || ui.en;
  document.documentElement.lang = language;
  elements.title.textContent = copy.title;
  elements.intro.textContent = copy.intro;
  elements.heading.textContent = copy.heading;
  elements.caption.textContent = copy.caption;
  elements.search.placeholder = copy.search;
  elements.search.setAttribute('aria-label', copy.search);
  elements.supportTitle.textContent = copy.help;
  elements.supportText.textContent = copy.helpText;
  elements.supportLink.textContent = copy.contact;
  elements.categories.replaceChildren();

  copy.categories.forEach((label, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'faq-category';
    button.textContent = label;
    button.setAttribute('aria-pressed', String(selectedCategory === index));
    button.addEventListener('click', () => {
      selectedCategory = index;
      render();
    });
    elements.categories.append(button);
  });

  elements.questions.replaceChildren();
  const normalizedSearch = searchTerm.toLocaleLowerCase();
  const matches = entries.filter(([question, answer, category]) => {
    const categoryName = `${categories[category]} ${copy.categories[category]}`;
    return (selectedCategory === 0 || category === selectedCategory)
      && (!normalizedSearch || `${question} ${answer} ${categoryName}`.toLocaleLowerCase().includes(normalizedSearch));
  });

  if (!matches.length) {
    const empty = document.createElement('p');
    empty.className = 'faq-empty';
    empty.textContent = copy.empty;
    elements.questions.append(empty);
    return;
  }

  matches.forEach(([question, answer]) => {
    const article = document.createElement('article');
    article.className = 'faq-item';
    const id = `faq-answer-${entries.findIndex((entry) => entry[0] === question)}`;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'faq-question';
    button.setAttribute('aria-expanded', String(expandedQuestions.has(id)));
    button.setAttribute('aria-controls', id);
    const label = document.createElement('span');
    label.textContent = question;
    const plus = document.createElement('span');
    plus.className = 'faq-plus';
    plus.setAttribute('aria-hidden', 'true');
    plus.textContent = expandedQuestions.has(id) ? '−' : '+';
    button.append(label, plus);

    const answerPanel = document.createElement('div');
    answerPanel.id = id;
    answerPanel.className = 'faq-answer';
    answerPanel.hidden = !expandedQuestions.has(id);
    const paragraph = document.createElement('p');
    paragraph.textContent = answer;
    answerPanel.append(paragraph);
    if (language !== 'en') {
      const fallback = document.createElement('p');
      fallback.className = 'faq-fallback';
      fallback.textContent = copy.fallback;
      answerPanel.append(fallback);
    }

    button.addEventListener('click', () => {
      if (expandedQuestions.has(id)) expandedQuestions.delete(id);
      else expandedQuestions.add(id);
      button.setAttribute('aria-expanded', String(expandedQuestions.has(id)));
      answerPanel.hidden = !expandedQuestions.has(id);
      plus.textContent = expandedQuestions.has(id) ? '−' : '+';
    });
    article.append(button, answerPanel);
    elements.questions.append(article);
  });
}

elements.search.addEventListener('input', () => {
  searchTerm = elements.search.value.trim();
  render();
});
elements.language.addEventListener('change', render);
document.getElementById('faqYear').textContent = String(new Date().getFullYear());
render();
