import { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, Code2, Globe2, Sparkles } from 'lucide-react';
import { LOCAL_TEMPLATES } from '../../studio/catalog';
import { fetchTemplates } from '../../studio/storage';
import type { StarterCategory, StarterTemplate } from '../../studio/types';

const GROUPS: { category: StarterCategory; title: string; subtitle: string; color: string }[] = [
  { category: 'Translation Sandbox', title: 'Language playgrounds', subtitle: 'Try a greeting, discover a phrase, and listen together.', color: 'mint' },
  { category: 'Culture', title: 'Cultural storytelling', subtitle: 'Make room for folktales, family stories, and local wisdom.', color: 'gold' },
  { category: 'Animation', title: 'Animation', subtitle: 'Bring characters and ideas to life, one block at a time.', color: 'violet' },
  { category: 'Games', title: 'Games & patterns', subtitle: 'Play with movement, repetition, and surprising patterns.', color: 'blue' },
];

function ProjectPreview({ template, index }: { template: StarterTemplate; index: number }) {
  const person = template.default_assets_json.find((asset) => asset.kind === 'sprite');
  const isLanguage = template.category === 'Translation Sandbox';
  return (
    <div className={`project-preview preview-${index % 6}`} aria-label={`Preview of ${template.title}`}>
      <div className="preview-sun" />
      <div className="preview-orbit orbit-one" />
      <div className="preview-orbit orbit-two" />
      <div className="preview-speech">{isLanguage ? 'Báwo ni?' : 'Once upon a time…'}</div>
      <span className="preview-character" aria-hidden="true">{person?.icon ?? '🧑🏿‍🚀'}</span>
      <span className="preview-code-pill"><Code2 size={13} /> {isLanguage ? 'translate' : 'create'}</span>
      <span className="preview-sparkle"><Sparkles size={16} /></span>
    </div>
  );
}

function ProjectCard({ template, index }: { template: StarterTemplate; index: number }) {
  const editorUrl = `/coding-studio?template=${encodeURIComponent(template.id)}`;
  return (
    <article className="starter-card">
      <a href={editorUrl} className="starter-preview-link" aria-label={`See inside ${template.title}`}>
        <ProjectPreview template={template} index={index} />
      </a>
      <div className="starter-card-copy">
        <div>
          <span className="starter-tag">{template.category === 'Culture' ? 'Storytelling' : template.category}</span>
          <h3>{template.title}</h3>
          <p>{template.description}</p>
        </div>
        <a className="starter-launch" href={editorUrl}>
          See inside <ArrowRight size={16} aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}

export function StarterGallery() {
  const [templates, setTemplates] = useState<StarterTemplate[]>(LOCAL_TEMPLATES);
  const [warning, setWarning] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchTemplates()
      .then((result) => {
        if (!active) return;
        setTemplates(result.templates);
        setWarning(result.warning ?? '');
      })
      .catch((error: unknown) => {
        if (!active) return;
        setWarning(error instanceof Error ? error.message : 'Starter projects could not be loaded.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  return (
    <div className="gallery-app">
      <header className="studio-site-header">
        <a className="brand-lockup" href="/" aria-label="Idilewa home">
          <span className="brand-mark">ì</span><span>idilewa</span><span className="brand-dot">.</span>
        </a>
        <nav className="gallery-nav" aria-label="Main navigation">
          <a href="/kids">Learn</a>
          <a className="active" href="/starter-projects">Explore</a>
          <a href="/coding-studio">Create</a>
        </nav>
        <a className="header-create" href="/coding-studio"><Code2 size={17} /> Open studio</a>
      </header>

      <main>
        <section className="gallery-hero">
          <div className="gallery-hero-content">
            <div className="eyebrow"><Globe2 size={15} /> CODE · CREATE · CONNECT</div>
            <h1>Big ideas begin<br /><span>with one small block.</span></h1>
            <p>Make a character speak your language, bring a story to life, and learn by making. Pick a starter and make it yours.</p>
            <a className="button button-green" href="/coding-studio">Start creating <ArrowRight size={18} /></a>
            <div className="gallery-trust"><BookOpen size={16} /> Made for curious learners, families, and classrooms</div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="hero-art-sun" />
            <div className="hero-art-person">🧑🏿‍🎨</div>
            <span className="floating-block block-translate">translate <b>Yorùbá</b></span>
            <span className="floating-block block-move">move <b>10</b> steps</span>
            <span className="floating-note">ẹ káàbọ̀!</span>
            <div className="hero-art-ground" />
          </div>
        </section>

        <section className="starter-guide content-width">
          <div className="guide-number">01</div>
          <div><h2>Make it, remix it, make it yours.</h2><p>Choose a starter project to see how it works. Add blocks, change the words, and press the green flag to bring your creation to life.</p></div>
          <div className="guide-stats"><strong>5</strong><span>languages to explore</span></div>
        </section>

        {warning && <p className="gallery-notice" role="status">{warning}</p>}
        {loading && <p className="gallery-loading" aria-live="polite">Gathering your starter ideas…</p>}
        <div className="starter-groups content-width">
          {GROUPS.map((group) => {
            const projects = templates.filter((template) => template.category === group.category);
            if (!projects.length) return null;
            return (
              <section key={group.category} className={`starter-group group-${group.color}`}>
                <div className="starter-group-heading">
                  <div><span className="section-index">{group.category === 'Translation Sandbox' ? '01' : group.category === 'Culture' ? '02' : group.category === 'Animation' ? '03' : '04'}</span><h2>{group.title}</h2></div>
                  <p>{group.subtitle}</p>
                </div>
                <div className="starter-grid">
                  {projects.map((template, index) => <ProjectCard key={template.id} template={template} index={index} />)}
                </div>
              </section>
            );
          })}
        </div>
      </main>
      <footer className="gallery-footer">
        <a className="brand-lockup" href="/"><span className="brand-mark">ì</span><span>idilewa</span><span className="brand-dot">.</span></a>
        <p>Keep your language close. Keep your imagination closer.</p>
        <a href="/coding-studio">Make something <ArrowRight size={15} /></a>
      </footer>
    </div>
  );
}
