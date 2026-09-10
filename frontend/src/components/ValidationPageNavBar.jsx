import React from 'react';
import { useNavigate } from 'react-router-dom';
import verifitorLogo from '../assets/verifitor_logo.png';
import { useAccessibility } from './AccessibilityContext';
import AccessibilityModal from './AccessibilityModal';
import HelpGuideModal from './HelpGuideModal';
import { Settings, HelpCircle } from 'lucide-react';

const ValidationNavbar = () => {
  const navigate = useNavigate();
  const { setSettingsModalOpen, openHelpGuide, simpleMode } = useAccessibility();

  return (
    <>
      <nav className="bg-[#3d5a73] shadow-md w-full sticky top-0 z-[90]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo Section */}
            <div 
              onClick={() => navigate('/')} 
              className="bg-white p-1.5 rounded-xl flex items-center justify-center cursor-pointer shadow-sm hover:opacity-95 transition-opacity"
            >
              <img 
                src={verifitorLogo} 
                alt="VerifiTOR Logo" 
                className="h-9 w-auto object-contain px-1" 
              />
            </div>

            {/* Right Side - Portal Label & Accessibility Controls */}
            <div className="flex items-center gap-3">
              <span className="hidden lg:block text-white/90 text-xs font-bold tracking-wider uppercase bg-white/10 px-3 py-1 rounded-full border border-white/15">
                Official Verification Portal
              </span>

              {/* Help & Guide Button */}
              <button
                type="button"
                onClick={openHelpGuide}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition-all shadow-inner cursor-pointer"
                title="View Verification Guide"
              >
                <HelpCircle size={15} />
                <span className="hidden sm:inline">Guide</span>
              </button>

              {/* Accessibility / Simple Mode Gear Button */}
              <button
                type="button"
                onClick={() => setSettingsModalOpen(true)}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center border border-white/15 transition-all shadow-inner relative group cursor-pointer"
                title="Display & Readability Settings"
                aria-label="Open Display Settings"
              >
                <Settings size={15} className={`transition-transform duration-300 group-hover:rotate-45 ${simpleMode ? 'text-cyan-300' : ''}`} />
                {simpleMode && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full ring-2 ring-[#3d5a73]"></span>
                )}
              </button>
            </div>

          </div>
        </div>
      </nav>

      <AccessibilityModal />
      <HelpGuideModal />
    </>
  );
};

export default ValidationNavbar;