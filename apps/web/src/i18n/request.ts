import { routing } from './routing';

export const getMessages = async (locale?: string) => {
  let finalLocale = locale;

  if (!finalLocale || !routing.locales.includes(finalLocale as any)) {
    finalLocale = routing.defaultLocale;
  }

  try {
    return (await import(`../locales/${finalLocale}/common.json`)).default;
  } catch {
    return (await import(`../locales/${routing.defaultLocale}/common.json`)).default;
  }
};


