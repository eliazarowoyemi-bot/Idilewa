import { faqCategories as categories, faqEntries as entries } from './faqKnowledge.js';

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
