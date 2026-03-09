import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import i18n from '../i18n';

const ConfigContext = createContext();

export const useConfig = () => useContext(ConfigContext);

export const ConfigProvider = ({ children }) => {
    const [config, setConfig] = useState({
        site_name: 'Ecommerce Store',
        currency: 'SAR',
        maintenance_mode: false,
        allow_registrations: true
    });
    const [loading, setLoading] = useState(true);

    const refreshConfig = async () => {
        try {
            const res = await api.get('/public-config');
            const newConfig = res.data;
            setConfig(newConfig);

            // Update i18n currency dynamically
            if (newConfig.currency) {
                const currencySymbols = {
                    'USD': '$',
                    'SAR': 'ر.س',
                    'EUR': '€'
                };
                const symbol = currencySymbols[newConfig.currency] || newConfig.currency;
                
                // Set the symbol in i18n resources
                i18n.addResource('en', 'translation', 'common.currency', symbol);
                i18n.addResource('ar', 'translation', 'common.currency', symbol);
                
                // Add to config object for easy access
                newConfig.currencySymbol = symbol;
                
                console.log(`Config: Updated currency to ${symbol}`);
                // Refresh language to propagate changes (sometimes needed for dynamic resources)
                await i18n.changeLanguage(i18n.language);
            }
            
            if (newConfig.site_name) {
                document.title = newConfig.site_name;
            }
        } catch (error) {
            console.error('Failed to fetch public config:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshConfig();
    }, []);

    const [referral, setReferral] = useState(null);

    return (
        <ConfigContext.Provider value={{ config, loading, refreshConfig, referral, setReferral }}>
            {children}
        </ConfigContext.Provider>
    );
};
