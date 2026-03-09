import React from 'react';
import { useTranslation } from 'react-i18next';
import { Hammer, LucideWrench } from 'lucide-react';

const MaintenanceMode = () => {
    const { t } = useTranslation();
    
    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-page)',
            color: 'var(--text-main)',
            textAlign: 'center',
            padding: '2rem'
        }}>
            <div style={{
                width: '80px',
                height: '80px',
                background: 'var(--primary-subtle)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
                marginBottom: '2rem'
            }}>
                <Hammer size={40} />
            </div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '1rem' }}>
                {t('common.maintenance_title', 'Under Maintenance')}
            </h1>
            <p style={{ maxWidth: '500px', color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: '1.6' }}>
                {t('common.maintenance_desc', 'We are currently performing some scheduled maintenance. We will be back shortly with even better features.')}
            </p>
            <div style={{ marginTop: '3rem', opacity: 0.5 }}>
                <LucideWrench size={24} />
            </div>
        </div>
    );
};

export default MaintenanceMode;
