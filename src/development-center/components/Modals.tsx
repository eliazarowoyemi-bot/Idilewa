import React, { useState } from 'react';
import { ArrowLeft, Flag, Octagon, Search, Volume2, X } from 'lucide-react';
import {
  BACKDROP_LIBRARY,
  EXTENSIONS_CATALOG,
  SOUND_LIBRARY_ITEMS,
  SPRITE_LIBRARY,
  TUTORIALS_CATALOG,
  createSound,
} from '../data/assets';
import {
  ActiveModal,
  BackdropAsset,
  CostumeAsset,
  LibrarySpriteTemplate,
  PenStroke,
  SoundAsset,
  SpriteData,
  StageMonitor,
  TutorialItem,
} from '../types/scratch';
import { playSoundAsset } from '../utils/audio';
import { StageArea } from './StageArea';

interface ModalsProps {
  activeModal: ActiveModal;
  onClose: () => void;
  onAddSprite: (tpl: LibrarySpriteTemplate) => void;
  onAddCostume: (costume: CostumeAsset) => void;
  onAddBackdrop: (backdrop: BackdropAsset) => void;
  onAddSound: (sound: SoundAsset) => void;
  enabledExtensions: Array<'pen' | 'music'>;
  onEnableExtension: (extId: 'pen' | 'music') => void;
  onSelectTutorial: (tut: TutorialItem) => void;
  onSignIn: (username: string) => void;
  // Project Page state
  projectTitle: string;
  signedInUser: string | null;
  activeBackdrop: BackdropAsset;
  sprites: SpriteData[];
  penStrokes: PenStroke[];
  monitors: StageMonitor[];
  isRunning: boolean;
  onGreenFlag: () => void;
  onStopAll: () => void;
  onSpriteClick: (id: string) => void;
  onMoveSprite: (id: string, x: number, y: number) => void;
}

export const Modals: React.FC<ModalsProps> = ({
  activeModal,
  onClose,
  onAddSprite,
  onAddCostume,
  onAddBackdrop,
  onAddSound,
  enabledExtensions,
  onEnableExtension,
  onSelectTutorial,
  onSignIn,
  projectTitle,
  signedInUser,
  activeBackdrop,
  sprites,
  penStrokes,
  monitors,
  isRunning,
  onGreenFlag,
  onStopAll,
  onSpriteClick,
  onMoveSprite,
}) => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [instructions, setInstructions] = useState('Click the green flag to run the project!');
  const [credits, setCredits] = useState('Built in the Scratch Project Editor.');
  const [loved, setLoved] = useState(false);
  const [starred, setStarred] = useState(false);

  if (!activeModal) return null;

  // Full-Screen Library Modal Header Helper
  const renderLibraryHeader = (title: string) => (
    <div className="h-14 bg-[#14532D] text-white px-5 flex items-center justify-between shrink-0">
      <button
        type="button"
        onClick={onClose}
        className="flex items-center gap-2 text-[14px] font-bold hover:bg-black/15 px-3 py-1.5 rounded-lg transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back</span>
      </button>
      <h2 className="text-[17px] font-extrabold">{title}</h2>
      <div className="w-20" />
    </div>
  );

  // 1. Sprite / Costume Library
  if (activeModal === 'sprite-library' || activeModal === 'costume-library') {
    const cats = ['All', 'Animals', 'Fantasy', 'Music', 'Sports', 'Food'];
    const filtered = SPRITE_LIBRARY.filter(
      (s) =>
        (category === 'All' || s.category === category) &&
        s.name.toLowerCase().includes(search.toLowerCase())
    );
    return (
      <div className="fixed inset-0 bg-[#E8F3EB] z-50 flex flex-col">
        {renderLibraryHeader(activeModal === 'sprite-library' ? 'Choose a Sprite' : 'Choose a Costume')}
        <div className="px-6 py-4 bg-white border-b border-[#CFE2D3] flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#6B8273] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="h-9 pl-9 pr-4 w-56 rounded-full border border-[#CFE2D3] text-[13px] focus:outline-none focus:border-[#16A34A]"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {cats.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-colors ${
                  category === c
                    ? 'bg-[#16A34A] text-white'
                    : 'bg-[#E8F3EB] text-[#1F3A2B] hover:bg-[#D7E8DA]'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scratch-scroll p-6 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4 content-start">
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (activeModal === 'sprite-library') {
                  onAddSprite(item);
                } else {
                  onAddCostume({
                    ...item.costumes[0],
                    id: `costume-${Date.now()}`,
                  });
                }
                onClose();
              }}
              className="bg-white rounded-xl border border-[#CFE2D3] hover:border-[#16A34A] hover:shadow-md p-4 flex flex-col items-center gap-2 transition-all"
            >
              <div
                className="w-20 h-20 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                dangerouslySetInnerHTML={{ __html: item.costumes[0].svg }}
              />
              <span className="text-[13px] font-bold text-[#1F3A2B]">{item.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 2. Backdrop Library
  if (activeModal === 'backdrop-library') {
    const cats = ['All', 'Outdoors', 'Space', 'Underwater', 'Music', 'Patterns'];
    const filtered = BACKDROP_LIBRARY.filter(
      (b) =>
        (category === 'All' || b.category === category) &&
        b.name.toLowerCase().includes(search.toLowerCase())
    );
    return (
      <div className="fixed inset-0 bg-[#E8F3EB] z-50 flex flex-col">
        {renderLibraryHeader('Choose a Backdrop')}
        <div className="px-6 py-4 bg-white border-b border-[#CFE2D3] flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#6B8273] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="h-9 pl-9 pr-4 w-56 rounded-full border border-[#CFE2D3] text-[13px] focus:outline-none focus:border-[#16A34A]"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {cats.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-colors ${
                  category === c
                    ? 'bg-[#16A34A] text-white'
                    : 'bg-[#E8F3EB] text-[#1F3A2B] hover:bg-[#D7E8DA]'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scratch-scroll p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 content-start">
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onAddBackdrop({ ...item, id: `bd-${Date.now()}-${item.id}` });
                onClose();
              }}
              className="bg-white rounded-xl border border-[#CFE2D3] hover:border-[#16A34A] hover:shadow-md overflow-hidden flex flex-col transition-all"
            >
              <div
                className="w-full aspect-[4/3] [&>svg]:w-full [&>svg]:h-full"
                dangerouslySetInnerHTML={{ __html: item.svg }}
              />
              <div className="py-2.5 text-[13px] font-bold text-[#1F3A2B]">{item.name}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 3. Sound Library
  if (activeModal === 'sound-library') {
    const filtered = SOUND_LIBRARY_ITEMS.filter((s) =>
      s.name.toLowerCase().includes(search.toLowerCase())
    );
    return (
      <div className="fixed inset-0 bg-[#E8F3EB] z-50 flex flex-col">
        {renderLibraryHeader('Choose a Sound')}
        <div className="px-6 py-4 bg-white border-b border-[#CFE2D3] flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#6B8273] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="h-9 pl-9 pr-4 w-56 rounded-full border border-[#CFE2D3] text-[13px] focus:outline-none focus:border-[#16A34A]"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scratch-scroll p-6 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4 content-start">
          {filtered.map((item) => {
            const tempSound = createSound(`preview-${item.name}`, item.name, item.preset, item.duration);
            return (
              <div
                key={item.name}
                onMouseEnter={() => playSoundAsset(tempSound)}
                onClick={() => {
                  onAddSound(createSound(`snd-${Date.now()}`, item.name, item.preset, item.duration));
                  onClose();
                }}
                className="bg-white rounded-xl border border-[#CFE2D3] hover:border-[#16A34A] hover:shadow-md p-5 flex flex-col items-center gap-3 cursor-pointer transition-all"
              >
                <div className="w-14 h-14 rounded-full bg-[#16A34A]/15 text-[#15803D] flex items-center justify-center">
                  <Volume2 className="w-7 h-7" />
                </div>
                <span className="text-[13px] font-bold text-[#1F3A2B]">{item.name}</span>
                <span className="text-[11px] text-[#6B8273]">{item.category}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 4. Extensions Library
  if (activeModal === 'extension-library') {
    return (
      <div className="fixed inset-0 bg-[#E8F3EB] z-50 flex flex-col">
        {renderLibraryHeader('Choose an Extension')}
        <div className="flex-1 overflow-y-auto scratch-scroll p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 content-start max-w-6xl mx-auto w-full">
          {EXTENSIONS_CATALOG.map((ext) => {
            const isAdded = ext.id === 'pen' || ext.id === 'music' ? enabledExtensions.includes(ext.id) : false;
            return (
              <button
                key={ext.id}
                type="button"
                onClick={() => {
                  if (ext.id === 'pen' || ext.id === 'music') {
                    onEnableExtension(ext.id);
                    onClose();
                  }
                }}
                className="bg-white rounded-xl border border-[#CFE2D3] hover:border-[#16A34A] hover:shadow-md overflow-hidden flex flex-col text-left transition-all"
              >
                <div
                  style={{ backgroundColor: ext.accentColor }}
                  className="h-32 w-full flex items-center justify-center text-white text-2xl font-extrabold relative"
                >
                  <span>{ext.name}</span>
                  {isAdded && (
                    <span className="absolute top-2 right-2 bg-white text-[#15803D] text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                      Added
                    </span>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between gap-2">
                  <div>
                    <div className="text-[15px] font-extrabold text-[#1F3A2B]">{ext.name}</div>
                    <p className="text-[12px] text-[#52665A] mt-1">{ext.description}</p>
                  </div>
                  {ext.requires && (
                    <div className="text-[11px] font-bold text-[#6B8273] pt-2 border-t border-[#E6EFE8]">
                      Requires: {ext.requires}
                    </div>
                  )}
                  {!ext.functional && (
                    <div className="text-[11px] font-semibold text-[#6B8273]">
                      Hardware / Cloud connector preview
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // 5. Tutorials Library
  if (activeModal === 'tutorials-library') {
    const cats = ['All', 'Animation', 'Music', 'Games', 'Stories'];
    const filtered = TUTORIALS_CATALOG.filter(
      (t) => category === 'All' || t.category === category
    );
    return (
      <div className="fixed inset-0 bg-[#E8F3EB] z-50 flex flex-col">
        {renderLibraryHeader('Tutorials')}
        <div className="px-6 py-4 bg-white border-b border-[#CFE2D3] flex flex-wrap items-center gap-2">
          {cats.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`px-4 py-1.5 rounded-full text-[12px] font-bold transition-colors ${
                category === c ? 'bg-[#16A34A] text-white' : 'bg-[#E8F3EB] text-[#1F3A2B] hover:bg-[#D7E8DA]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto scratch-scroll p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 content-start max-w-6xl mx-auto w-full">
          {filtered.map((tut) => (
            <button
              key={tut.id}
              type="button"
              onClick={() => {
                onSelectTutorial(tut);
                onClose();
              }}
              className="bg-white rounded-xl border border-[#CFE2D3] hover:border-[#16A34A] hover:shadow-md overflow-hidden flex flex-col text-left transition-all"
            >
              <div
                style={{ backgroundColor: tut.accentColor }}
                className="h-36 w-full flex items-center justify-center text-white text-xl font-extrabold px-4 text-center"
              >
                {tut.title}
              </div>
              <div className="p-4">
                <div className="text-[15px] font-extrabold text-[#1F3A2B]">{tut.title}</div>
                <p className="text-[12px] text-[#52665A] mt-1">{tut.summary}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 6. Sign In / Join Idilewa Modal
  if (activeModal === 'signin' || activeModal === 'join') {
    const isJoin = activeModal === 'join';
    return (
      <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 p-4">
        <div className="w-full max-w-sm bg-white rounded-xl overflow-hidden shadow-2xl border border-[#CFE2D3]">
          <div className="h-12 bg-[#14532D] text-white px-5 flex items-center justify-between font-extrabold text-[15px]">
            <span>{isJoin ? 'Join Idilewa' : 'Sign in to Idilewa'}</span>
            <button type="button" onClick={onClose} className="hover:opacity-80">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (usernameInput.trim()) {
                onSignIn(usernameInput.trim());
                onClose();
              }
            }}
            className="p-5 space-y-4"
          >
            <div>
              <label className="block text-[12px] font-bold text-[#1F3A2B] mb-1">Username</label>
              <input
                type="text"
                required
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Learner"
                className="w-full h-10 px-3 rounded-lg border border-[#CFE2D3] text-[13px] focus:outline-none focus:border-[#16A34A]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-[#1F3A2B] mb-1">Password</label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                className="w-full h-10 px-3 rounded-lg border border-[#CFE2D3] text-[13px] focus:outline-none focus:border-[#16A34A]"
              />
            </div>
            <button
              type="submit"
              className="w-full h-10 rounded-lg bg-[#14532D] hover:bg-[#0E3F21] text-white font-bold text-[14px] transition-colors"
            >
              {isJoin ? 'Create Account' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 7. Project Page View ("See Project Page" / "See Inside")
  if (activeModal === 'project-page') {
    return (
      <div className="fixed inset-0 bg-[#F4F8F4] z-50 flex flex-col overflow-y-auto">
        <div className="h-12 bg-[#14532D] text-white px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <span className="font-black text-lg tracking-tight">Idilewa</span>
            <span className="text-sm font-bold opacity-90">{projectTitle}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-[#16A34A] hover:bg-[#15803D] text-white text-[13px] font-bold"
          >
            See Inside
          </button>
        </div>

        <div className="max-w-5xl w-full mx-auto p-6 space-y-6">
          <div className="bg-white rounded-xl border border-[#CFE2D3] p-6 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-extrabold text-[#1F3A2B]">{projectTitle}</h1>
                <p className="text-[13px] text-[#52665A]">by {signedInUser || 'Idilewa Creator'}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onGreenFlag}
                  className="px-4 py-2 rounded-lg bg-[#4CBF56] hover:bg-[#3EA848] text-white text-[13px] font-bold flex items-center gap-1.5"
                >
                  <Flag className="w-4 h-4 fill-white" /> Start
                </button>
                <button
                  type="button"
                  onClick={onStopAll}
                  className="px-4 py-2 rounded-lg bg-[#EC5959] hover:bg-[#D94646] text-white text-[13px] font-bold flex items-center gap-1.5"
                >
                  <Octagon className="w-4 h-4 fill-white" /> Stop
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-full bg-[#14532D] hover:bg-[#0E3F21] text-white text-[13px] font-bold"
                >
                  See Inside
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[480px_1fr] gap-6 items-start">
              <div className="flex flex-col items-start">
                <StageArea
                  backdrop={activeBackdrop}
                  sprites={sprites}
                  selectedSpriteId={sprites[0]?.id || null}
                  penStrokes={penStrokes}
                  monitors={monitors}
                  stageSize="default"
                  isRunning={isRunning}
                  onChangeStageSize={() => {}}
                  onGreenFlag={onGreenFlag}
                  onStopAll={onStopAll}
                  onSelectSprite={() => {}}
                  onMoveSprite={onMoveSprite}
                  onSpriteClick={onSpriteClick}
                />
                <div className="mt-3 flex items-center gap-4 text-[13px] font-bold">
                  <button
                    type="button"
                    onClick={() => setLoved((l) => !l)}
                    className={`px-3 py-1.5 rounded-lg border ${
                      loved ? 'bg-[#FF6680]/15 border-[#FF6680] text-[#FF6680]' : 'border-[#CFE2D3] text-[#1F3A2B]'
                    }`}
                  >
                    ♥ {loved ? 1 : 0}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStarred((s) => !s)}
                    className={`px-3 py-1.5 rounded-lg border ${
                      starred ? 'bg-[#FFBF00]/15 border-[#FFBF00] text-[#CC9900]' : 'border-[#CFE2D3] text-[#1F3A2B]'
                    }`}
                  >
                    ★ {starred ? 1 : 0}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-[#FAFBF9] border border-[#E6EFE8] rounded-lg p-4">
                  <label className="block text-[13px] font-extrabold text-[#1F3A2B] mb-1.5">Instructions</label>
                  <textarea
                    rows={4}
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="w-full p-2.5 rounded border border-[#CFE2D3] bg-white text-[13px] text-[#1F3A2B] focus:outline-none focus:border-[#16A34A]"
                  />
                </div>
                <div className="bg-[#FAFBF9] border border-[#E6EFE8] rounded-lg p-4">
                  <label className="block text-[13px] font-extrabold text-[#1F3A2B] mb-1.5">Notes and Credits</label>
                  <textarea
                    rows={4}
                    value={credits}
                    onChange={(e) => setCredits(e.target.value)}
                    className="w-full p-2.5 rounded border border-[#CFE2D3] bg-white text-[13px] text-[#1F3A2B] focus:outline-none focus:border-[#16A34A]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
