import styles from './page.module.css';

export default function Index() {
  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>
          Professional <span className="text-gradient">Game Server</span> Hosting
        </h1>
        <p className={styles.heroSubtitle}>
          Enterprise-grade performance for your gaming community.
          Deploy servers in seconds with our automated cloud platform.
        </p>
        <button className={styles.ctaButton}>Get Started for Free</button>
      </section>

      <section className={styles.featuresSection}>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <h3 className={styles.featureTitle}>Instant Deployment</h3>
            <p className={styles.featureDesc}>
              Our "Brain" and "Muscle" architecture ensures your server provisioning is handled instantly across our global node network.
            </p>
          </div>

          <div className={styles.featureCard}>
            <h3 className={styles.featureTitle}>High Performance</h3>
            <p className={styles.featureDesc}>
              Powered by NVMe SSDs and high-frequency CPUs. Designed specifically for tick-rate sensitive competitive gaming.
            </p>
          </div>

          <div className={styles.featureCard}>
            <h3 className={styles.featureTitle}>DDoS Protection</h3>
            <p className={styles.featureDesc}>
              Advanced mitigation strategies keep your community safe from attacks, ensuring 99.9% uptime.
            </p>
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
        © {new Date().getFullYear()} ZedGamingHosting. All rights reserved.
      </footer>
    </main>
  );
}
