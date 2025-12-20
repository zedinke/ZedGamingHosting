import { getServerTranslations, Locale, useLocale } from '@i18n/translations';
import Link from 'next/link';
import { Gamepad2, Cpu, HardDrive, Users, Zap, Shield } from 'lucide-react';

const games = [
  {
    id: 'minecraft',
    name: 'Minecraft',
    slug: 'minecraft',
    icon: '⛏️',
    color: 'from-green-500 to-emerald-600',
    description: 'A világ legnépszerűbb sandbox játéka. Építs, fedezz fel és túlélj egyedül vagy barátaiddal!',
    features: [
      'Vanilla és Modded szerverek',
      'Forge, Fabric, Paper támogatás',
      'Automatikus mentések',
      'Plugin management',
      'Egyedi világok',
      'Whitelist és engedélyek',
    ],
    specs: {
      minRam: '2 GB',
      recommended: '4-8 GB',
      maxPlayers: '100+',
      storage: '5-20 GB',
    },
    versions: ['1.20.x', '1.19.x', '1.18.x', '1.16.x', '1.12.x'],
  },
  {
    id: 'rust',
    name: 'Rust',
    slug: 'rust',
    icon: '🔫',
    color: 'from-orange-500 to-red-600',
    description: 'Túlélj, építs és harcolj egy brutális PvP világban. Alapoktól a bázisépítésig minden a te kezedben van.',
    features: [
      'Teljes szerver kontroll',
      'Oxide/uMod plugin támogatás',
      'Automatikus frissítések',
      'Wipe ütemezés',
      'RCON hozzáférés',
      'Admin tools',
    ],
    specs: {
      minRam: '6 GB',
      recommended: '8-16 GB',
      maxPlayers: '200+',
      storage: '10-30 GB',
    },
    versions: ['Latest Stable', 'Staging Branch'],
  },
  {
    id: 'cs2',
    name: 'Counter-Strike 2',
    slug: 'cs2',
    icon: '🎯',
    color: 'from-blue-500 to-indigo-600',
    description: 'A legendás FPS forradalmi új verziója. Versenyezz profi szinten vagy játssz casual módban.',
    features: [
      'Competitive és Casual módok',
      'SourceMod plugin támogatás',
      'Automatikus map frissítés',
      'Workshop támogatás',
      'Anti-cheat integráció',
      'Stat tracking',
    ],
    specs: {
      minRam: '4 GB',
      recommended: '8 GB',
      maxPlayers: '64',
      storage: '30-40 GB',
    },
    versions: ['Latest'],
  },
  {
    id: 'palworld',
    name: 'Palworld',
    slug: 'palworld',
    icon: '🐾',
    color: 'from-purple-500 to-pink-600',
    description: 'Gyűjts, neveld és használd a Pal-okat túlélésre és építésre ebben az egyedi survival játékban.',
    features: [
      'Dedikált szerver',
      'PvP és PvE módok',
      'Automatikus mentések',
      'Játékos limit beállítás',
      'Szerver konfiguráció',
      'Mod támogatás (hamarosan)',
    ],
    specs: {
      minRam: '8 GB',
      recommended: '16 GB',
      maxPlayers: '32',
      storage: '15-25 GB',
    },
    versions: ['Latest Early Access'],
  },
  {
    id: 'ark',
    name: 'ARK: Survival Evolved',
    slug: 'ark',
    icon: '🦖',
    color: 'from-teal-500 to-cyan-600',
    description: 'Túlélés dinoszauruszok között. Szelídíts meg őket, építs bázist és uralkodj a szigeten!',
    features: [
      'Összes térkép támogatása',
      'Cluster szerverek',
      'Mod támogatás',
      'Automatikus frissítések',
      'RCON admin panel',
      'Statisztikák és logok',
    ],
    specs: {
      minRam: '8 GB',
      recommended: '12-16 GB',
      maxPlayers: '100+',
      storage: '40-80 GB',
    },
    versions: ['Latest', 'ASA (Ascended)'],
  },
  {
    id: 'valheim',
    name: 'Valheim',
    slug: 'valheim',
    icon: '⚔️',
    color: 'from-slate-500 to-zinc-600',
    description: 'Viking túlélés mitikus világban. Fedezd fel, építs és harcolj barátaiddal!',
    features: [
      'Dedikált szerver',
      'Világ perzisztencia',
      'Automatikus mentések',
      'Mod támogatás',
      'Játékos jogosultságok',
      'Szerver jelszó védelem',
    ],
    specs: {
      minRam: '4 GB',
      recommended: '8 GB',
      maxPlayers: '10',
      storage: '5-10 GB',
    },
    versions: ['Latest Stable', 'Public Test'],
  },
];

export default function GamesPage({ params }: { params: { locale: Locale } }) {
  const locale = params.locale ?? useLocale();
  const t = getServerTranslations(locale);

  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="relative py-20 px-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="container mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-block px-4 py-2 bg-primary-500/10 border border-primary-500/20 rounded-full text-primary-400 text-sm font-medium mb-6">
              <Gamepad2 className="w-4 h-4 inline mr-2" />
              Támogatott Játékok
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold mb-6 text-white">
              Válassz <span className="bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">Kedvenc Játékod</span>
            </h1>
            <p className="text-xl text-gray-400 mb-8">
              Professzionális game server hosting a legnépszerűbb játékokhoz. Instant deploy, maximális teljesítmény, 24/7 support.
            </p>
          </div>
        </div>
      </section>

      {/* Games Grid */}
      <section className="py-16 px-6 bg-gray-950">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {games.map((game) => (
              <div
                key={game.id}
                className="group relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-700/50 hover:border-gray-600 transition-all overflow-hidden"
              >
                {/* Gradient Accent */}
                <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                
                {/* Content */}
                <div className="relative p-8">
                  {/* Icon & Name */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${game.color} flex items-center justify-center text-3xl shadow-lg`}>
                      {game.icon}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">{game.name}</h2>
                      <p className="text-sm text-gray-400">{game.versions.join(', ')}</p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-400 mb-6 leading-relaxed">
                    {game.description}
                  </p>

                  {/* Specs */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                        <Cpu className="w-3 h-3" />
                        RAM
                      </div>
                      <div className="text-white font-semibold text-sm">
                        {game.specs.recommended}
                      </div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                        <Users className="w-3 h-3" />
                        Játékosok
                      </div>
                      <div className="text-white font-semibold text-sm">
                        {game.specs.maxPlayers}
                      </div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                        <HardDrive className="w-3 h-3" />
                        Tárhely
                      </div>
                      <div className="text-white font-semibold text-sm">
                        {game.specs.storage}
                      </div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                        <Zap className="w-3 h-3" />
                        Min. RAM
                      </div>
                      <div className="text-white font-semibold text-sm">
                        {game.specs.minRam}
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary-400" />
                      Funkciók
                    </h3>
                    <ul className="space-y-2">
                      {game.features.slice(0, 4).map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-gray-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA */}
                  <Link
                    href={`/${locale}/plans?game=${game.slug.toUpperCase()}`}
                    className={`block w-full text-center px-6 py-3 bg-gradient-to-r ${game.color} text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105`}
                  >
                    Csomagok Megtekintése →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-primary-900/20 to-fuchsia-900/20">
        <div className="container text-center max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-4 text-white">
            Nem találod a játékod?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Lépj kapcsolatba velünk és segítünk egyedi megoldást találni!
          </p>
          <Link
            href={`/${locale}/dashboard/support`}
            className="inline-block px-10 py-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-bold text-lg rounded-lg shadow-xl hover:shadow-primary-500/50 transition-all transform hover:scale-105"
          >
            Kapcsolatfelvétel
          </Link>
        </div>
      </section>
    </main>
  );
}
