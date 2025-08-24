'use client';

import { useEffect } from 'react';

/**
 * Browser Extension Hydration Fix
 * Prevents hydration mismatches caused by browser extensions
 * that modify the DOM after server-side rendering
 */
export default function BrowserExtensionFix() {
  useEffect(() => {
    // Remove browser extension attributes that cause hydration issues
    const extensionAttributes = [
      'cz-shortcut-listen',
      'data-new-gr-c-s-check-loaded',
      'data-gr-ext-installed',
      'data-lt-installed',
      'spellcheck'
    ];

    extensionAttributes.forEach((attr) => {
      if (document.body.hasAttribute(attr)) {
        document.body.removeAttribute(attr);
      }
    });

    // Also clean up any extension-injected elements
    const extensionElements = document.querySelectorAll(
      '[class*="extension"], [id*="extension"], [data-extension]'
    );
    extensionElements.forEach((element) => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });
  }, []);

  return null; // This component doesn't render anything
}
