import { useEffect } from 'react';
import { useSettingsStore } from '@/store/settingsStore';

/**
 * Component to manage document title and meta tags based on system settings
 * This component doesn't render anything, it just updates the document head
 */
const DocumentHead: React.FC = () => {
    const { settings } = useSettingsStore();

    useEffect(() => {
        if (!settings) return;

        // Update document title
        if (settings.meta_title || settings.site_name) {
            document.title = settings.meta_title || settings.site_name || 'RitoMovie';
        }

        // Update meta description
        if (settings.meta_description) {
            let metaDesc = document.querySelector('meta[name="description"]');
            if (!metaDesc) {
                metaDesc = document.createElement('meta');
                metaDesc.setAttribute('name', 'description');
                document.head.appendChild(metaDesc);
            }
            metaDesc.setAttribute('content', settings.meta_description);
        }

        // Update meta keywords
        if (settings.meta_keywords) {
            let metaKeywords = document.querySelector('meta[name="keywords"]');
            if (!metaKeywords) {
                metaKeywords = document.createElement('meta');
                metaKeywords.setAttribute('name', 'keywords');
                document.head.appendChild(metaKeywords);
            }
            metaKeywords.setAttribute('content', settings.meta_keywords);
        }

        // Update favicon if set
        if (settings.site_logo) {
            let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
            if (!favicon) {
                favicon = document.createElement('link');
                favicon.setAttribute('rel', 'icon');
                document.head.appendChild(favicon);
            }
            favicon.href = String(settings.site_logo || '');
        }
    }, [settings]);

    return null;
};

export default DocumentHead;
