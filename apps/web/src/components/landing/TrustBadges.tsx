'use client';

import { Shield, Clock, Lock, Zap, Users, HeadphonesIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const trustItems = [
  {
    icon: Shield,
    title: '99.9% Uptime',
    description: 'Garantált rendelkezésre állás',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Zap,
    title: 'Instant Deploy',
    description: 'Azonnali telepítés 2 percen belül',
    color: 'from-yellow-500 to-orange-500',
  },
  {
    icon: Lock,
    title: 'DDoS Védelem',
    description: 'Enterprise szintű biztonság',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: HeadphonesIcon,
    title: '24/7 Support',
    description: 'Folyamatos ügyfélszolgálat',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: Users,
    title: '5000+ Ügyfél',
    description: 'Elégedett felhasználók',
    color: 'from-red-500 to-rose-500',
  },
  {
    icon: Clock,
    title: 'Gyors Reagálás',
    description: 'Átlag 5 perc válaszidő',
    color: 'from-indigo-500 to-blue-500',
  },
];

export function TrustBadges() {
  return (
    <section className="py-16 px-6 bg-gradient-to-br from-gray-900/50 to-gray-800/50 border-y border-white/10">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-white mb-4"
          >
            Miért Válassz Minket?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 text-lg"
          >
            Megbízható, gyors és biztonságos game hosting szolgáltatás
          </motion.p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {trustItems.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="group relative"
            >
              <div className="relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all h-full">
                {/* Gradient Background on Hover */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                
                {/* Icon */}
                <div className={`relative w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow`}>
                  <item.icon className="w-6 h-6 text-white" />
                </div>

                {/* Content */}
                <div className="relative text-center">
                  <h3 className="text-white font-bold text-sm mb-1">
                    {item.title}
                  </h3>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Hover Shine Effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats Counter Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {[
            { number: '5000+', label: 'Aktív Szerver' },
            { number: '99.9%', label: 'Uptime SLA' },
            { number: '< 5 min', label: 'Támogatás Válaszidő' },
            { number: '10+', label: 'Támogatott Játék' },
          ].map((stat, index) => (
            <div key={stat.label} className="text-center">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-primary-400 to-primary-600 bg-clip-text text-transparent mb-2"
              >
                {stat.number}
              </motion.div>
              <div className="text-gray-400 text-sm uppercase tracking-wide">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
