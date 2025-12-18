import { GameType } from './server.dto';
import { PortType, Protocol } from '../networking/port-allocation.dto';

export interface GamePreset {
  image: string;
  defaultResources: { cpuLimit: number; ramLimit: number; diskLimit: number };
  env?: Record<string, string>;
  ports?: Array<{ type: PortType; protocol: Protocol }>;
  requiresClusterVolume?: boolean; // e.g., ARK/ATLAS clusters
}

// Cost-effective defaults (cores, MB, GB)
const base = {
  small: { cpuLimit: 1, ramLimit: 1024, diskLimit: 10 },
  medium: { cpuLimit: 2, ramLimit: 4096, diskLimit: 20 },
  large: { cpuLimit: 3, ramLimit: 8192, diskLimit: 40 },
};

export const GAME_PRESETS: Record<GameType, GamePreset> = {
  [GameType.MINECRAFT]: {
    image: 'itzg/minecraft-server:latest',
    defaultResources: base.small,
    env: { EULA: 'TRUE' },
  },
  [GameType.RUST]: {
    image: 'didstopia/rust-server:latest',
    defaultResources: base.medium,
  },
  [GameType.ARK]: {
    image: 'thmhoag/arkserver:latest',
    defaultResources: base.large,
    requiresClusterVolume: true,
  },
  [GameType.ARK_SURVIVAL_ASCENDED]: {
    image: 'thmhoag/arkserver:latest',
    defaultResources: base.large,
    requiresClusterVolume: true,
  },
  [GameType.CS2]: {
    image: 'cm2network/cs2:latest',
    defaultResources: base.medium,
  },
  [GameType.PALWORLD]: {
    image: 'thijsvanloef/palworld-server:latest',
    defaultResources: base.large,
  },
  [GameType.ATLAS]: {
    image: 'thmhoag/arkserver:latest',
    defaultResources: base.large,
    requiresClusterVolume: true,
  },
  [GameType.SATISFACTORY]: {
    image: 'wolveix/satisfactory-server:latest',
    defaultResources: base.large,
  },
  [GameType.THE_FOREST]: {
    image: 'quaternious/theforestserver:latest',
    defaultResources: base.medium,
  },
  [GameType.SONS_OF_THE_FOREST]: {
    image: 'valkyrienyanko/sonsoftheforest-dedicated:latest',
    defaultResources: base.medium,
  },
  [GameType.SEVEN_DAYS_TO_DIE]: {
    image: 'didstopia/7dtd-server:latest',
    defaultResources: base.medium,
  },
  [GameType.VALHEIM]: {
    image: 'lloesche/valheim-server:latest',
    defaultResources: base.medium,
  },
  [GameType.PROJECT_ZOMBOID]: {
    image: 'tetraproject/project-zomboid:latest',
    defaultResources: base.medium,
  },
  [GameType.FACTORIO]: {
    image: 'factoriotools/factorio:latest',
    defaultResources: base.small,
  },
  [GameType.TERRARIA]: {
    image: 'ryansheehan/terraria:latest',
    defaultResources: base.small,
  },
  [GameType.UNTURNED]: {
    image: 'gameservermanagers/gameserver:unturned',
    defaultResources: base.medium,
  },
  [GameType.STARBOUND]: {
    image: 'linuxserver/starbound:latest',
    defaultResources: base.small,
  },
  [GameType.ECO]: {
    image: 'strangeloopgames/eco-game-server:latest',
    defaultResources: base.medium,
  },
  [GameType.BAROTRAUMA]: {
    image: 'quay.io/pterodactyl/ghcr.io-azuriom-barotrauma:latest',
    defaultResources: base.medium,
  },
  [GameType.GARRYS_MOD]: {
    image: 'cm2network/garrysmod:latest',
    defaultResources: base.medium,
  },
  [GameType.DAYZ]: {
    image: 'linoge/dayzserver:latest',
    defaultResources: base.large,
  },
  [GameType.ARMA3]: {
    image: 'epinter/arma3server:latest',
    defaultResources: base.large,
  },
  [GameType.V_RISING]: {
    image: 'lloesche/vrising-server:latest',
    defaultResources: base.medium,
  },
  [GameType.ENSHROUDED]: {
    image: 'itzg/enhanced-environment:latest',
    defaultResources: base.large,
  },
  [GameType.MORDHAU]: {
    image: 'cm2network/mordhau:latest',
    defaultResources: base.medium,
  },
  [GameType.INSURGENCY_SANDSTORM]: {
    image: 'cm2network/insurgencysandstorm:latest',
    defaultResources: base.medium,
  },
  [GameType.STATIONEERS]: {
    image: 'gdata1/stationeers-server:latest',
    defaultResources: base.medium,
  },
  [GameType.SCUM]: {
    image: 'ogscum/scum-server:latest',
    defaultResources: base.medium,
  },
  [GameType.CONAN_EXILES]: {
    image: 'leonvscn/conan-exiles:latest',
    defaultResources: base.medium,
  },
  [GameType.RAINBOW_SIX_SIEGE]: {
    image: 'ghcr.io/containrrr/rainbowsix:latest',
    defaultResources: base.medium,
  },
  [GameType.HELL_LET_LOOSE]: {
    image: 'cm2network/hell_let_loose:latest',
    defaultResources: base.medium,
  },
  [GameType.FOXHOLE]: {
    image: 'foxholegame/foxhole-server:latest',
    defaultResources: base.medium,
  },
  [GameType.READY_OR_NOT]: {
    image: 'runnerb/ready-or-not-dedicated:latest',
    defaultResources: base.medium,
  },
  [GameType.DEEP_ROCK_GALACTIC]: {
    image: 'lloesche/drg-server:latest',
    defaultResources: base.medium,
  },
  [GameType.SPACE_ENGINEERS]: {
    image: 'mmmaxwwwell/space-engineers-server:latest',
    defaultResources: base.large,
  },
  [GameType.STARDEW_VALLEY]: {
    image: 'ghcr.io/nicholasgriffintn/stardew-server:latest',
    defaultResources: base.small,
  },
};

export function getGamePreset(type: GameType): GamePreset | undefined {
  return GAME_PRESETS[type];
}
