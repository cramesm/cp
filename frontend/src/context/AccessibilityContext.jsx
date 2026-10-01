import React, { createContext, useContext, useState, useEffect } from 'react';

const AccessibilityContext = createContext();

export const AccessibilityProvider = ({ children }) => {
    // 1. Simple Mode state
    const [simpleMode, setSimpleMode] = useState(() => {
        return localStorage.getItem('verifitor_simple_mode') === 'true';
    });

    // 2. Font Size state: 'normal' (100%), 'large' (115%), 'xl' (130%)
    const [fontSize, setFontSize] = useState(() => {
        return localStorage.getItem('verifitor_font_size') || 'normal';
    });

    // 3. High Contrast state
    const [highContrast, setHighContrast] = useState(() => {
        return localStorage.getItem('verifitor_high_contrast') === 'true';
    });

    // 4. Modal and Tour states
    const [settingsModalOpen, setSettingsModalOpen] = useState(false);
    const [helpModalOpen, setHelpModalOpen] = useState(false);
    const [tourActive, setTourActive] = useState(false);
    const [tourStep, setTourStep] = useState(0);

    // Sync simpleMode to DOM & localStorage
    useEffect(() => {
        localStorage.setItem('verifitor_simple_mode', String(simpleMode));
        if (simpleMode) {
            document.documentElement.classList.add('simple-mode');
        } else {
            document.documentElement.classList.remove('simple-mode');
        }
    }, [simpleMode]);

    // Sync fontSize to DOM & localStorage
    useEffect(() => {
        localStorage.setItem('verifitor_font_size', fontSize);
        document.documentElement.classList.remove('text-large', 'text-xl');
        if (fontSize === 'large') {
            document.documentElement.classList.add('text-large');
        } else if (fontSize === 'xl') {
            document.documentElement.classList.add('text-xl');
        }
    }, [fontSize]);

    // Sync highContrast to DOM & localStorage
    useEffect(() => {
        localStorage.setItem('verifitor_high_contrast', String(highContrast));
        if (highContrast) {
            document.documentElement.classList.add('high-contrast');
        } else {
            document.documentElement.classList.remove('high-contrast');
        }
    }, [highContrast]);

    const toggleSimpleMode = () => {
        setSimpleMode(prev => !prev);
    };

    const toggleHighContrast = () => {
        setHighContrast(prev => !prev);
    };

    const startTour = () => {
        setSettingsModalOpen(false);
        setTourStep(0);
        setTourActive(true);
    };

    const closeTour = () => {
        setTourActive(false);
        setTourStep(0);
    };

    const openHelpGuide = () => {
        setSettingsModalOpen(false);
        setHelpModalOpen(true);
    };

    return (
        <AccessibilityContext.Provider
            value={{
                simpleMode,
                setSimpleMode,
                toggleSimpleMode,
                fontSize,
                setFontSize,
                highContrast,
                setHighContrast,
                toggleHighContrast,
                settingsModalOpen,
                setSettingsModalOpen,
                helpModalOpen,
                setHelpModalOpen,
                openHelpGuide,
                tourActive,
                setTourActive,
                tourStep,
                setTourStep,
                startTour,
                closeTour
            }}
        >
            {children}
        </AccessibilityContext.Provider>
    );
};

export const useAccessibility = () => {
    const context = useContext(AccessibilityContext);
    if (!context) {
        throw new Error('useAccessibility must be used within an AccessibilityProvider');
    }
    return context;
};

export default AccessibilityContext;
