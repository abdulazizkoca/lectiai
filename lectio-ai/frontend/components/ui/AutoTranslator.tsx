"use client";
import React, { useEffect } from "react";
import { dict_ru } from "@/lib/dictionaries";

// Create reverse dictionary for ru -> uz
const dict_uz: Record<string, string> = {};
Object.entries(dict_ru).forEach(([uz, ru]) => {
  dict_uz[ru] = uz;
});

export function AutoTranslator({ lang }: { lang: "uz" | "ru" }) {
  useEffect(() => {
    let isTranslating = false;

    const translateText = (text: string, targetLang: "uz" | "ru") => {
      // We do a simple exact match or replace all instances
      // To handle whitespace, we trim, translate, and put back in
      const trimmed = text.trim();
      if (!trimmed) return text;

      if (targetLang === "ru" && dict_ru[trimmed]) {
        return text.replace(trimmed, dict_ru[trimmed]);
      } else if (targetLang === "uz" && dict_uz[trimmed]) {
        return text.replace(trimmed, dict_uz[trimmed]);
      }
      
      // If no exact match, try to replace known phrases inside the text
      let translated = text;
      const currentDict = targetLang === "ru" ? dict_ru : dict_uz;
      
      // Sort keys by length descending to replace longest phrases first
      const keys = Object.keys(currentDict).sort((a, b) => b.length - a.length);
      for (const key of keys) {
        if (translated.includes(key)) {
          translated = translated.split(key).join(currentDict[key]);
        }
      }
      return translated;
    };

    const translateNode = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        if (!node.nodeValue?.trim()) return;
        const newText = translateText(node.nodeValue, lang);
        if (newText !== node.nodeValue) {
          isTranslating = true;
          node.nodeValue = newText;
          isTranslating = false;
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        
        // Skip script and style tags
        if (el.tagName === "SCRIPT" || el.tagName === "STYLE" || el.tagName === "NOSCRIPT") return;

        // Translate placeholders
        if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
          const placeholder = el.getAttribute("placeholder");
          if (placeholder) {
            const newPlaceholder = translateText(placeholder, lang);
            if (newPlaceholder !== placeholder) {
              isTranslating = true;
              el.setAttribute("placeholder", newPlaceholder);
              isTranslating = false;
            }
          }
          
          // Also translate values of type="button" or "submit"
          if (el.tagName === "INPUT" && (el.getAttribute("type") === "button" || el.getAttribute("type") === "submit")) {
            const val = (el as HTMLInputElement).value;
            if (val) {
              const newVal = translateText(val, lang);
              if (newVal !== val) {
                isTranslating = true;
                (el as HTMLInputElement).value = newVal;
                isTranslating = false;
              }
            }
          }
        }
        
        node.childNodes.forEach(translateNode);
      }
    };

    // Initial translation pass
    translateNode(document.body);

    // Observe future DOM changes (e.g. React rendering new components or Toasts)
    const observer = new MutationObserver((mutations) => {
      if (isTranslating) return; // Prevent infinite loops triggered by our own changes
      
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            translateNode(node);
          });
        } else if (mutation.type === "characterData") {
          translateNode(mutation.target);
        } else if (mutation.type === "attributes" && mutation.attributeName === "placeholder") {
          translateNode(mutation.target);
        }
      });
    });

    observer.observe(document.body, { 
      childList: true, 
      subtree: true, 
      characterData: true,
      attributes: true,
      attributeFilter: ["placeholder", "value"]
    });

    return () => observer.disconnect();
  }, [lang]);

  return null;
}
