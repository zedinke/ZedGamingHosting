import { getServerTranslations, Locale, useLocale } from '@i18n/translations';
import Link from 'next/link';
import { GameShowcase } from '@/components/landing/GameShowcase';
import { FeaturedPlans } from '@/components/landing/FeaturedPlans';
import { Features } from '@/components/landing/Features';
import { HeroSlideshow } from '@/components/landing/HeroSlideshow';

async function getActiveSlides() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const res = await fetch(`${apiUrl}/api/media/slides`, {
      next: { revalidate: 60 }, // Cache for 1 minute
    });
    
    if (!res.ok) {
      console.error('Failed to fetch slides:', res.status);
      return [];
    }
    
    return res.json();
  } catch (error) {
    console.error('Error fetching slides:', error);
    return [];
  }
}

export default async function Index({ params }: { params: { locale: Locale } }) {
  const locale = params.locale ?? useLocale();
  const t = getServerTranslations(locale);
  const slides = await getActiveSlides();

  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero Slideshow or Static Hero */}
      {slides.length > 0 ? (
        <HeroSlideshow slides={slides} />
      ) : (
        // Fallback Static Hero Section
        <section className="relative flex flex-col items-center justify-center text-center py-32 px-6 bg-gradient-to-b from-black/60 via-black/40 to-transparent overflow-hidden min-h-[80vh]">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20"></div>
          <div className="relative z-10 max-w-5xl">
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
              <span className="bg-gradient-to-br from-primary-400 to-primary-600 bg-clip-text text-transparent">
                {t('hero.title')}
              </span>
              <br />
              <span className="bg-gradient-to-br from-fuchsia-400 to-rose-500 bg-clip-text text-transparent">
                {t('hero.titleHighlight')}
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-text-secondary mb-10 max-w-3xl mx-auto">
              {t('hero.subtitle')}
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                href={`/${locale}/plans`}
                className="px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-primary-500/50 transition-all transform hover:scale-105"
              >
                {t('hero.ctaButton')}
              </Link>
              <Link
                href="#features"
                className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold rounded-lg border border-white/20 transition-all"
              >
                {t('hero.learnMore')}
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Game Showcase */}
      <GameShowcase />

      {/* Featured Plans */}
      <FeaturedPlans />

      {/* Features */}
      <Features />

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-primary-900/20 to-fuchsia-900/20">
        <div className="container text-center max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-4 text-text-primary">
            {t('cta.title')}
          </h2>
          <p className="text-xl text-text-secondary mb-8">
            {t('cta.subtitle')}
          </p>
          <Link
            href={`/${locale}/plans`}
            className="inline-block px-10 py-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-bold text-lg rounded-lg shadow-xl hover:shadow-primary-500/50 transition-all transform hover:scale-105"
          >
            {t('cta.button')}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-background-surface border-t border-white/10">
        <div className="container grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4 text-text-primary">ZedGaming</h3>
            <p className="text-text-muted text-sm">
              {t('footer.description')}
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-text-primary">{t('footer.products')}</h4>
            <ul className="space-y-2 text-sm text-text-muted">
              <li><Link href={`/${locale}/plans`} className="hover:text-primary-400 transition">{t('footer.gameServers')}</Link></li>
              <li><Link href={`/${locale}/plans?game=MINECRAFT`} className="hover:text-primary-400 transition">Minecraft</Link></li>
              <li><Link href={`/${locale}/plans?game=RUST`} className="hover:text-primary-400 transition">Rust</Link></li>
              <li><Link href={`/${locale}/plans?game=CS2`} className="hover:text-primary-400 transition">CS2</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-text-primary">{t('footer.support')}</h4>
            <ul className="space-y-2 text-sm text-text-muted">
              <li><Link href={`/${locale}/knowledge-base`} className="hover:text-primary-400 transition">{t('footer.documentation')}</Link></li>
              <li><Link href={`/${locale}/dashboard/support`} className="hover:text-primary-400 transition">{t('footer.helpCenter')}</Link></li>
              <li><Link href={`/${locale}/status`} className="hover:text-primary-400 transition">{t('footer.status')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-text-primary">{t('footer.company')}</h4>
            <ul className="space-y-2 text-sm text-text-muted">
              <li><Link href={`/${locale}/about`} className="hover:text-primary-400 transition">{t('footer.about')}</Link></li>
              <li><Link href={`/${locale}/contact`} className="hover:text-primary-400 transition">{t('footer.contact')}</Link></li>
              <li><Link href={`/${locale}/terms`} className="hover:text-primary-400 transition">{t('footer.terms')}</Link></li>
            </ul>
          </div>
        </div>
        <div className="container mt-8 pt-8 border-t border-white/10 text-center text-text-muted text-sm">
          {t('footer.copyright', { year: new Date().getFullYear() })}
        </div>
      </footer>
    </main>
  );
}

