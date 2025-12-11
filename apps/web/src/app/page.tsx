import { useTranslations } from 'next-intl';
import styles from './page.module.css';

export default function Index() {
  const t = useTranslations();

  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>
          {t('hero.title')} <span className="text-gradient">{t('hero.titleHighlight')}</span> {t('hero.titleSuffix')}
        </h1>
        <p className={styles.heroSubtitle}>
          {t('hero.subtitle')}
        </p>
        <button className={styles.ctaButton}>{t('hero.ctaButton')}</button>
      </section>

      <section className={styles.featuresSection}>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <h3 className={styles.featureTitle}>{t('features.instantDeployment.title')}</h3>
            <p className={styles.featureDesc}>
              {t('features.instantDeployment.description')}
            </p>
          </div>

          <div className={styles.featureCard}>
            <h3 className={styles.featureTitle}>{t('features.highPerformance.title')}</h3>
            <p className={styles.featureDesc}>
              {t('features.highPerformance.description')}
            </p>
          </div>

          <div className={styles.featureCard}>
            <h3 className={styles.featureTitle}>{t('features.ddosProtection.title')}</h3>
            <p className={styles.featureDesc}>
              {t('features.ddosProtection.description')}
            </p>
          </div>
        </div>
      </section>

      <footer style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
        {t('footer.copyright', { year: new Date().getFullYear() })}
      </footer>
    </main>
  );
}
