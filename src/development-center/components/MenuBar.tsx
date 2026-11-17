import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Globe, Lightbulb, Sparkles } from 'lucide-react';

interface MenuBarProps {
  projectTitle: string;
  onChangeTitle: (title: string) => void;
  language: string;
  onChangeLanguage: (lang: string) => void;
  turboMode: boolean;
  onToggleTurboMode: () => void;
  onNewProject: () => void;
  onSaveProject: () => void;
  onLoadProject: (file: File) => void;
  onRestoreSprite: () => void;
  canRestoreSprite: boolean;
  onOpenTutorials: () => void;
  onOpenProjectPage: () => void;
  onOpenAuthModal: (mode: 'join' | 'signin') => void;
  signedInUser: string | null;
  onSignOut: () => void;
}

const LANGUAGES = [
  'English',
  'Español',
  'Français',
  'Deutsch',
  'Italiano',
  'Português',
  '日本語',
  '한국어',
  '简体中文',
];

export const MenuBar: React.FC<MenuBarProps> = ({
  projectTitle,
  onChangeTitle,
  language,
  onChangeLanguage,
  turboMode,
  onToggleTurboMode,
  onNewProject,
  onSaveProject,
  onLoadProject,
  onRestoreSprite,
  canRestoreSprite,
  onOpenTutorials,
  onOpenProjectPage,
  onOpenAuthModal,
  signedInUser,
  onSignOut,
}) => {
  const [openMenu, setOpenMenu] = useState<'language' | 'file' | 'edit' | 'user' | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      ref={menuRef}
      className="scratch-menu-bar h-12 bg-[#14532D] text-white flex items-center justify-between px-3 select-none relative z-40 shrink-0 border-b border-[#0E3F21]"
    >
      {/* Left Navigation Group */}
      <div className="scratch-menu-primary flex items-center gap-1 min-w-0">
        {/* Idilewa Brand Mark & Wordmark matching idilewa.com */}
        <a
          href="#editor"
          onClick={(e) => {
            e.preventDefault();
            onOpenProjectPage();
          }}
          className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-black/15 transition-colors shrink-0 mr-1.5"
          title="Idilewa"
        >
          <span className="w-7 h-7 rounded-lg bg-[#E6F3E8] flex items-center justify-center shadow-2xs shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M12 20V11M12 11L7.5 6.5M12 11L16.5 6.5" stroke="#15803D" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="7.5" cy="5.5" r="2.2" fill="#16A34A" />
              <circle cx="16.5" cy="5.5" r="2.2" fill="#16A34A" />
              <circle cx="12" cy="4.2" r="2.2" fill="#14532D" />
            </svg>
          </span>
          <span className="font-extrabold text-[19px] tracking-tight text-white leading-none">
            Idilewa
          </span>
        </a>

        {/* Language Selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenMenu(openMenu === 'language' ? null : 'language')}
            className={`h-9 px-2.5 rounded flex items-center gap-1 text-[13px] font-bold transition-colors whitespace-nowrap shrink-0 ${
              openMenu === 'language' ? 'bg-black/20' : 'hover:bg-black/15'
            }`}
            aria-label="Language selector"
          >
            <Globe className="w-4 h-4" />
            <ChevronDown className="w-3.5 h-3.5 opacity-90" />
          </button>
          {openMenu === 'language' && (
            <div className="absolute left-0 top-full mt-1 w-44 bg-white text-[#1F3A2B] rounded-lg shadow-xl border border-[#CFE2D3] py-1.5 z-50 max-h-72 overflow-y-auto scratch-scroll">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => {
                    onChangeLanguage(lang);
                    setOpenMenu(null);
                  }}
                  className="w-full text-left px-3.5 py-2 text-[13px] font-medium hover:bg-[#16A34A] hover:text-white flex items-center justify-between transition-colors"
                >
                  <span>{lang}</span>
                  {language === lang && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* File Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenMenu(openMenu === 'file' ? null : 'file')}
            className={`h-9 px-3 rounded flex items-center gap-1 text-[13px] font-bold transition-colors whitespace-nowrap shrink-0 ${
              openMenu === 'file' ? 'bg-black/20' : 'hover:bg-black/15'
            }`}
          >
            <span>File</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-90" />
          </button>
          {openMenu === 'file' && (
            <div className="absolute left-0 top-full mt-1 w-56 bg-white text-[#1F3A2B] rounded-lg shadow-xl border border-[#CFE2D3] py-1.5 z-50">
              <button
                type="button"
                onClick={() => {
                  onNewProject();
                  setOpenMenu(null);
                }}
                className="w-full text-left px-4 py-2 text-[13px] font-medium hover:bg-[#16A34A] hover:text-white transition-colors"
              >
                New
              </button>
              <div className="my-1 border-t border-[#E6EFE8]" />
              <button
                type="button"
                onClick={() => {
                  fileInputRef.current?.click();
                  setOpenMenu(null);
                }}
                className="w-full text-left px-4 py-2 text-[13px] font-medium hover:bg-[#16A34A] hover:text-white transition-colors"
              >
                Load from your computer
              </button>
              <button
                type="button"
                onClick={() => {
                  onSaveProject();
                  setOpenMenu(null);
                }}
                className="w-full text-left px-4 py-2 text-[13px] font-medium hover:bg-[#16A34A] hover:text-white transition-colors"
              >
                Save to your computer
              </button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.sb3"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onLoadProject(file);
              e.target.value = '';
            }}
          />
        </div>

        {/* Edit Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenMenu(openMenu === 'edit' ? null : 'edit')}
            className={`h-9 px-3 rounded flex items-center gap-1 text-[13px] font-bold transition-colors whitespace-nowrap shrink-0 ${
              openMenu === 'edit' ? 'bg-black/20' : 'hover:bg-black/15'
            }`}
          >
            <span>Edit</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-90" />
          </button>
          {openMenu === 'edit' && (
            <div className="absolute left-0 top-full mt-1 w-56 bg-white text-[#1F3A2B] rounded-lg shadow-xl border border-[#CFE2D3] py-1.5 z-50">
              <button
                type="button"
                disabled={!canRestoreSprite}
                onClick={() => {
                  onRestoreSprite();
                  setOpenMenu(null);
                }}
                className={`w-full text-left px-4 py-2 text-[13px] font-medium transition-colors ${
                  canRestoreSprite
                    ? 'hover:bg-[#16A34A] hover:text-white'
                    : 'opacity-45 cursor-not-allowed'
                }`}
              >
                Restore Sprite
              </button>
              <div className="my-1 border-t border-[#E6EFE8]" />
              <button
                type="button"
                onClick={() => {
                  onToggleTurboMode();
                  setOpenMenu(null);
                }}
                className="w-full text-left px-4 py-2 text-[13px] font-medium hover:bg-[#16A34A] hover:text-white flex items-center justify-between transition-colors"
              >
                <span>{turboMode ? 'Turn off Turbo Mode' : 'Turn on Turbo Mode'}</span>
                {turboMode && <Check className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
        </div>

        {/* Tutorials Button */}
        <button
          type="button"
          onClick={onOpenTutorials}
          className="h-9 px-3 rounded flex items-center gap-1.5 text-[13px] font-bold hover:bg-black/15 transition-colors whitespace-nowrap shrink-0"
        >
          <Lightbulb className="w-4 h-4 fill-white/25" />
          <span>Tutorials</span>
        </button>

        {/* Project Title Input */}
        <div className="ml-2 hidden sm:flex items-center">
          <input
            type="text"
            value={projectTitle}
            onChange={(e) => onChangeTitle(e.target.value)}
            aria-label="Project title"
            className="h-8 w-44 lg:w-52 px-2.5 rounded border border-white/25 bg-white/15 text-white placeholder-white/70 text-[13px] font-bold focus:outline-none focus:bg-white focus:text-[#1F3A2B] focus:border-white transition-colors"
          />
        </div>

        {/* Turbo Mode Active Indicator (only when turned on by user) */}
        {turboMode && (
          <div className="ml-2 hidden md:flex items-center gap-1 px-2 py-1 rounded bg-[#16A34A] text-white text-[11px] font-bold whitespace-nowrap shrink-0">
            <Sparkles className="w-3 h-3" />
            <span>Turbo Mode</span>
          </div>
        )}
      </div>

      {/* Right Account & Project Page Controls */}
      <div className="scratch-menu-account flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onOpenProjectPage}
          className="h-8 px-3.5 rounded-full bg-[#16A34A] hover:bg-[#15803D] text-white text-[12px] font-bold transition-colors whitespace-nowrap shrink-0 shadow-xs"
        >
          See Project Page
        </button>

        {signedInUser ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenMenu(openMenu === 'user' ? null : 'user')}
              className="h-9 px-3 rounded flex items-center gap-1.5 text-[13px] font-bold hover:bg-black/15 transition-colors whitespace-nowrap shrink-0"
            >
              <span className="w-6 h-6 rounded bg-[#16A34A] text-white flex items-center justify-center text-xs font-extrabold uppercase">
                {signedInUser.slice(0, 1)}
              </span>
              <span>{signedInUser}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {openMenu === 'user' && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white text-[#1F3A2B] rounded-lg shadow-xl border border-[#CFE2D3] py-1.5 z-50">
                <button
                  type="button"
                  onClick={() => {
                    onOpenProjectPage();
                    setOpenMenu(null);
                  }}
                  className="w-full text-left px-4 py-2 text-[13px] font-medium hover:bg-[#16A34A] hover:text-white"
                >
                  My Stuff
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSignOut();
                    setOpenMenu(null);
                  }}
                  className="w-full text-left px-4 py-2 text-[13px] font-medium hover:bg-[#16A34A] hover:text-white"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onOpenAuthModal('join')}
              className="h-9 px-3 rounded text-[13px] font-bold hover:bg-black/15 transition-colors whitespace-nowrap shrink-0"
            >
              Join Idilewa
            </button>
            <button
              type="button"
              onClick={() => onOpenAuthModal('signin')}
              className="h-9 px-3 rounded text-[13px] font-bold hover:bg-black/15 transition-colors whitespace-nowrap shrink-0"
            >
              Sign in
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
