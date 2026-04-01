import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CorporateThemeContext = createContext();

export const CorporateThemeProvider = ({ children }) => {
    const [corporateColor, setCorporateColor] = useState(() => {
        try {
            const raw = localStorage.getItem("empresaData");
            if (raw) {
                const data = JSON.parse(raw);
                return data.colorCorporativo || "#6D28D9";
            }
        } catch (err) {
            console.error("Error cargando color corporativo:", err);
        }
        return "#6D28D9";
    });

    const updateCSSVariables = useCallback((color) => {
        if (typeof document === 'undefined') return;

        const root = document.documentElement;
        root.style.setProperty('--brand-primary', color);

        // Generar variantes (esto es simplificado, en un caso real usarías una librería de color)
        // Por ahora, usemos el color tal cual o con opacidad vía CSS
        root.style.setProperty('--brand-primary-rgb', hexToRgb(color));
    }, []);

    useEffect(() => {
        updateCSSVariables(corporateColor);

        const handleUpdate = (e) => {
            if (e.detail?.colorCorporativo) {
                setCorporateColor(e.detail.colorCorporativo);
                updateCSSVariables(e.detail.colorCorporativo);
            }
        };

        window.addEventListener('empresaDataUpdated', handleUpdate);
        return () => window.removeEventListener('empresaDataUpdated', handleUpdate);
    }, [corporateColor, updateCSSVariables]);

    return (
        <CorporateThemeContext.Provider value={{ corporateColor }}>
            {children}
        </CorporateThemeContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCorporateTheme = () => useContext(CorporateThemeContext);

// Utility to convert hex to rgb for opacity support
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ?
        `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` :
        null;
}
