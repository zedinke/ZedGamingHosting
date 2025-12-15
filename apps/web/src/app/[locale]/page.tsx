import { useTranslations } from 'next-intl';
import { Button, Card } from '@zed-hosting/ui-kit';

export default function Index() {
  const t = useTranslations();

  return (
    <main className="flex min-h-screen flex-col">
      <section className="flex flex-col items-center justify-center text-center py-20 px-6 bg-gradient-to-b from-black/40 to-black/70">
        <h1 className="text-5xl md:text-6xl font-extrabold mb-4 bg-gradient-to-br from-primary-300 to-primary-500 bg-clip-text text-transparent">
          {t('hero.title')} <span className="bg-gradient-to-br from-fuchsia-300 to-rose-400 bg-clip-text text-transparent">{t('hero.titleHighlight')}</span> {t('hero.titleSuffix')}
        </h1>
        <p className="text-lg md:text-xl text-text-secondary mb-8 max-w-2xl">
          {t('hero.subtitle')}
        </p>
        <Button size="lg" variant="primary">{t('hero.ctaButton')}</Button>
      </section>

      <section className="py-16 px-6 bg-background-surface">
        <div className="container grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-2 text-text-primary">{t('features.instantDeployment.title')}</h3>
            <p className="text-text-secondary">{t('features.instantDeployment.description')}</p>
          </Card>
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-2 text-text-primary">{t('features.highPerformance.title')}</h3>
            <p className="text-text-secondary">{t('features.highPerformance.description')}</p>
          </Card>
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-2 text-text-primary">{t('features.ddosProtection.title')}</h3>
            <p className="text-text-secondary">{t('features.ddosProtection.description')}</p>
          </Card>
        </div>
      </section>

      <footer className="text-center py-8 text-text-muted">
        {t('footer.copyright', { year: new Date().getFullYear() })}
      </footer>
    </main>
  );
}

