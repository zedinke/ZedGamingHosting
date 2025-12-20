export type Locale = 'en' | 'hu';

type TranslationCatalog = Record<Locale, Record<string, string>>;

const catalog: TranslationCatalog = {
  en: {
    // Auth
    'auth.login.title': 'Sign In',
    'auth.login.email': 'Email address',
    'auth.login.password': 'Password',
    'auth.login.forgotPassword': 'Forgot password?',
    'auth.login.signIn': 'Sign in',
    'auth.login.noAccount': "Don’t have an account?",
    'auth.login.signUp': 'Sign up',
    'auth.forgotPassword.title': 'Forgot password',
    'auth.forgotPassword.email': 'Email address',
    'auth.forgotPassword.sendReset': 'Send reset link',
    'auth.forgotPassword.backToLogin': 'Back to login',
    'auth.resetPassword.title': 'Reset password',
    'auth.resetPassword.password': 'New password',
    'auth.resetPassword.confirmPassword': 'Confirm password',
    'auth.resetPassword.reset': 'Reset password',
    'auth.resetPassword.backToLogin': 'Back to login',

    // Landing hero
    'hero.title': 'Powerful game hosting',
    'hero.titleHighlight': 'for gamers & communities',
    'hero.subtitle': 'Blazing fast servers, DDoS protection, instant deployments, and 24/7 support.',
    'hero.ctaButton': 'View plans',
    'hero.learnMore': 'Learn more',

    // CTA block
    'cta.title': 'Ready to launch your server?',
    'cta.subtitle': 'Pick a plan, deploy in minutes, and start playing.',
    'cta.button': 'Choose a plan',

    // Games
    'games.title': 'Supported games',
    'games.subtitle': 'Popular titles with tuned configs and one-click installers.',
    'games.viewPlans': 'View plans',
    // Game names
    'games.name.MINECRAFT': 'Minecraft',
    'games.name.RUST': 'Rust',
    'games.name.CS2': 'Counter-Strike 2',
    'games.name.PALWORLD': 'Palworld',
    'games.name.ARK': 'ARK: Survival Evolved',
    'games.name.ATLAS': 'Atlas',
    // Game descriptions
    'games.description.MINECRAFT': 'Build, explore, and survive in endless worlds',
    'games.description.RUST': 'Survive the harsh wilderness and other players',
    'games.description.CS2': 'Tactical 5v5 competitive gameplay',
    'games.description.PALWORLD': 'Catch, battle, and survive with Pals',
    'games.description.ARK': 'Tame dinosaurs and survive prehistoric worlds',
    'games.description.ATLAS': 'Sail the seas and build your pirate empire',

    // Plans
    'plans.featured.title': 'Popular plans',
    'plans.featured.subtitle': 'Hand-picked plans for the most requested games.',
    'plans.popular': 'Popular',
    'plans.selectPlan': 'Select plan',
    'plans.viewAll': 'View all plans',
    'plans.loading': 'Loading plans…',
    'plans.perMonth': 'HUF/month',
    'plans.setupFee': '+ {fee} HUF setup fee',

    // Features
    'features.title': 'Why host with us?',
    'features.subtitle': 'Performance, reliability, and tools to manage your community smoothly.',
    'features.instantDeploy.title': 'Instant deploy',
    'features.instantDeploy.description': 'Spin up servers in under a minute with optimized presets.',
    'features.ddosProtection.title': 'DDoS protection',
    'features.ddosProtection.description': 'Enterprise-grade mitigation to keep your players connected.',
    'features.highPerformance.title': 'High performance',
    'features.highPerformance.description': 'NVMe storage, fast CPUs, and low-latency networking.',
    'features.autoBackups.title': 'Automatic backups',
    'features.autoBackups.description': 'Point-in-time backups so you never lose progress.',
    'features.oneClick.title': 'One-click installs',
    'features.oneClick.description': 'Deploy mods and updates with a single click.',
    'features.support247.title': '24/7 support',
    'features.support247.description': 'Real humans ready to help at any time.',

    // Footer
    'footer.description': 'Premium game server hosting with instant deploys, DDoS protection, and expert support.',
    'footer.products': 'Products',
    'footer.gameServers': 'Game servers',
    'footer.support': 'Support',
    'footer.documentation': 'Documentation',
    'footer.helpCenter': 'Help center',
    'footer.status': 'Status',
    'footer.company': 'Company',
    'footer.about': 'About',
    'footer.contact': 'Contact',
    'footer.terms': 'Terms',
    'footer.copyright': '© {year} ZedGaming. All rights reserved.',

    // Dashboard basics
    'dashboard.title': 'Dashboard',
    // Units
    'units.ramGb': '{gb} GB RAM',
    'units.ramMb': '{mb} MB RAM',
    'units.cpuCore': '{count} CPU core',
    'units.cpuCores': '{count} CPU cores',
    'units.diskGb': '{gb} GB NVMe SSD',
    'units.maxSlots': '{count} max slots',
  },
  hu: {
    // Auth
    'auth.login.title': 'Bejelentkezés',
    'auth.login.email': 'E-mail cím',
    'auth.login.password': 'Jelszó',
    'auth.login.forgotPassword': 'Elfelejtett jelszó?',
    'auth.login.signIn': 'Bejelentkezés',
    'auth.login.noAccount': 'Nincs még fiókod?',
    'auth.login.signUp': 'Regisztráció',
    'auth.forgotPassword.title': 'Elfelejtett jelszó',
    'auth.forgotPassword.email': 'E-mail cím',
    'auth.forgotPassword.sendReset': 'Visszaállító link küldése',
    'auth.forgotPassword.backToLogin': 'Vissza a bejelentkezéshez',
    'auth.resetPassword.title': 'Jelszó visszaállítása',
    'auth.resetPassword.password': 'Új jelszó',
    'auth.resetPassword.confirmPassword': 'Jelszó megerősítése',
    'auth.resetPassword.reset': 'Jelszó visszaállítása',
    'auth.resetPassword.backToLogin': 'Vissza a bejelentkezéshez',

    // Landing hero
    'hero.title': 'Erőteljes játékszerver hosting',
    'hero.titleHighlight': 'játékosoknak és közösségeknek',
    'hero.subtitle': 'Villámgyors szerverek, DDoS védelem, azonnali telepítés és 0-24 támogatás.',
    'hero.ctaButton': 'Csomagok megtekintése',
    'hero.learnMore': 'Tudj meg többet',

    // CTA block
    'cta.title': 'Készen állsz a szerverindításra?',
    'cta.subtitle': 'Válassz csomagot, telepíts percek alatt és indulhat a játék.',
    'cta.button': 'Csomag választása',

    // Games
    'games.title': 'Támogatott játékok',
    'games.subtitle': 'Népszerű játékok finomhangolt beállításokkal és egykattintásos telepítőkkel.',
    'games.viewPlans': 'Csomagok megtekintése',
    // Game names
    'games.name.MINECRAFT': 'Minecraft',
    'games.name.RUST': 'Rust',
    'games.name.CS2': 'Counter-Strike 2',
    'games.name.PALWORLD': 'Palworld',
    'games.name.ARK': 'ARK: Survival Evolved',
    'games.name.ATLAS': 'Atlas',
    // Game descriptions
    'games.description.MINECRAFT': 'Építs, fedezz fel és éld túl a végtelen világokat',
    'games.description.RUST': 'Éld túl a zord vadont és a többi játékost',
    'games.description.CS2': 'Taktikus 5v5 versenyszerű játékmenet',
    'games.description.PALWORLD': 'Fogj be, harcolj és éld túl a Palokkal',
    'games.description.ARK': 'Szelídíts dinoszauruszokat és éld túl az őskori világokat',
    'games.description.ATLAS': 'Hajózd be a tengereket és építs kalózbirodalmat',

    // Plans
    'plans.featured.title': 'Népszerű csomagok',
    'plans.featured.subtitle': 'Leggyakrabban kért játékokhoz ajánlott csomagok.',
    'plans.popular': 'Kedvenc',
    'plans.selectPlan': 'Csomag kiválasztása',
    'plans.viewAll': 'Összes csomag',
    'plans.loading': 'Csomagok betöltése…',
    'plans.perMonth': 'Ft/hó',
    'plans.setupFee': '+ {fee} Ft telepítési díj',

    // Features
    'features.title': 'Miért minket válassz?',
    'features.subtitle': 'Teljesítmény, megbízhatóság és eszközök a közösséged kezeléséhez.',
    'features.instantDeploy.title': 'Azonnali telepítés',
    'features.instantDeploy.description': 'Optimalizált presetek, percek alatti indulás.',
    'features.ddosProtection.title': 'DDoS védelem',
    'features.ddosProtection.description': 'Vállalati szintű védelem a megszakításmentes játékért.',
    'features.highPerformance.title': 'Magas teljesítmény',
    'features.highPerformance.description': 'NVMe tárhely, gyors CPU-k, alacsony késleltetés.',
    'features.autoBackups.title': 'Automatikus mentések',
    'features.autoBackups.description': 'Időpont szerinti mentések, hogy semmi ne vesszen el.',
    'features.oneClick.title': 'Egykattintásos telepítések',
    'features.oneClick.description': 'Modok és frissítések telepítése egy kattintással.',
    'features.support247.title': '0-24 támogatás',
    'features.support247.description': 'Valódi szakértők, bármikor elérhetőek.',

    // Footer
    'footer.description': 'Prémium játékszerver hosting azonnali telepítéssel, DDoS védelemmel és szakértői támogatással.',
    'footer.products': 'Termékek',
    'footer.gameServers': 'Játékszerverek',
    'footer.support': 'Támogatás',
    'footer.documentation': 'Dokumentáció',
    'footer.helpCenter': 'Segítségnyújtás',
    'footer.status': 'Állapot',
    'footer.company': 'Cég',
    'footer.about': 'Rólunk',
    'footer.contact': 'Kapcsolat',
    'footer.terms': 'Felhasználási feltételek',
    'footer.copyright': '© {year} ZedGaming. Minden jog fenntartva.',

    // Dashboard basics
    'dashboard.title': 'Irányítópult',
    // Units
    'units.ramGb': '{gb} GB RAM',
    'units.ramMb': '{mb} MB RAM',
    'units.cpuCore': '{count} CPU mag',
    'units.cpuCores': '{count} CPU mag',
    'units.diskGb': '{gb} GB NVMe SSD',
    'units.maxSlots': '{count} max férőhely',
  },
};

function humanizeKey(key: string): string {
  return key
    .split('.')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).replace(/([a-z])([A-Z])/g, '$1 $2'))
    .join(' ');
}

function interpolate(template: string, params?: Record<string, unknown>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, p1) => {
    const value = params[p1];
    return value !== undefined && value !== null ? String(value) : match;
  });
}

function resolveLocale(explicit?: Locale): Locale {
  if (explicit === 'hu' || explicit === 'en') return explicit;
  if (typeof window !== 'undefined') {
    const first = window.location.pathname.split('/').filter(Boolean)[0];
    if (first === 'hu' || first === 'en') return first as Locale;
  }
  return 'hu';
}

function buildTranslator(locale: Locale, namespace?: string) {
  return (key: string, defaultValue?: string | Record<string, unknown>): string => {
    const params = typeof defaultValue === 'object' && defaultValue !== null ? defaultValue : undefined;
    const defaultString = typeof defaultValue === 'string' ? defaultValue : undefined;
    const fullKey = namespace ? `${namespace}.${key}` : key;

    const value = catalog[locale]?.[fullKey] || catalog.en[fullKey];
    const fallback = defaultString || humanizeKey(fullKey);

    return interpolate(value || fallback, params);
  };
}

export function useTranslations(namespace?: string, explicitLocale?: Locale) {
  const locale = resolveLocale(explicitLocale);
  return buildTranslator(locale, namespace);
}

export function useLocale(): Locale {
  return resolveLocale();
}

export function getServerTranslations(locale: Locale, namespace?: string) {
  return buildTranslator(locale, namespace);
}
