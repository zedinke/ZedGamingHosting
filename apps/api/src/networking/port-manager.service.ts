import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@zed-hosting/db';
import { Protocol, PortType, PortAllocationRequestDto, PortStatistics } from '@zed-hosting/shared-types';
import { InsufficientResourcesError } from '@zed-hosting/shared-types';
import { GameType } from '@zed-hosting/shared-types';

/**
 * Game-specific port requirements
 */
const DEFAULT_PORT_RULE = { count: 2, types: [PortType.GAME, PortType.QUERY] };

const GAME_PORT_REQUIREMENTS: Partial<Record<GameType, { count: number; types: PortType[] }>> = {
  ARK: { count: 2, types: [PortType.GAME, PortType.QUERY] },
  ARK_SURVIVAL_ASCENDED: { count: 2, types: [PortType.GAME, PortType.QUERY] },
  RUST: { count: 3, types: [PortType.GAME, PortType.RCON, PortType.APP] },
  MINECRAFT: { count: 1, types: [PortType.GAME] },
  CS2: { count: 2, types: [PortType.GAME, PortType.TV] },
  PALWORLD: { count: 2, types: [PortType.GAME, PortType.QUERY] },
  ATLAS: { count: 2, types: [PortType.GAME, PortType.QUERY] },
  SATISFACTORY: { count: 2, types: [PortType.GAME, PortType.QUERY] },
  THE_FOREST: { count: 2, types: [PortType.GAME, PortType.QUERY] },
  SONS_OF_THE_FOREST: { count: 2, types: [PortType.GAME, PortType.QUERY] },
  SEVEN_DAYS_TO_DIE: { count: 2, types: [PortType.GAME, PortType.QUERY] },
  VALHEIM: { count: 2, types: [PortType.GAME, PortType.QUERY] },
  PROJECT_ZOMBOID: { count: 2, types: [PortType.GAME, PortType.QUERY] },
  FACTORIO: { count: 1, types: [PortType.GAME] },
  TERRARIA: { count: 1, types: [PortType.GAME] },
  UNTURNED: { count: 2, types: [PortType.GAME, PortType.RCON] },
  STARBOUND: { count: 2, types: [PortType.GAME, PortType.QUERY] },
  ECO: { count: 2, types: [PortType.GAME, PortType.QUERY] },
  BAROTRAUMA: { count: 2, types: [PortType.GAME, PortType.QUERY] },
  GARRYS_MOD: { count: 2, types: [PortType.GAME, PortType.QUERY] },
  DAYZ: { count: 2, types: [PortType.GAME, PortType.QUERY] },
  ARMA3: { count: 2, types: [PortType.GAME, PortType.QUERY] },
  V_RISING: { count: 2, types: [PortType.GAME, PortType.QUERY] },
  ENSHROUDED: { count: 2, types: [PortType.GAME, PortType.QUERY] },
  MORDHAU: { count: 2, types: [PortType.GAME, PortType.QUERY] },
  INSURGENCY_SANDSTORM: { count: 2, types: [PortType.GAME, PortType.QUERY] },
  STATIONEERS: { count: 2, types: [PortType.GAME, PortType.QUERY] },
  SCUM: { count: 2, types: [PortType.GAME, PortType.QUERY] },
  CONAN_EXILES: { count: 2, types: [PortType.GAME, PortType.QUERY] },
  RAINBOW_SIX_SIEGE: { count: 2, types: [PortType.GAME, PortType.QUERY] },
  HELL_LET_LOOSE: { count: 2, types: [PortType.GAME, PortType.QUERY] },
  FOXHOLE: { count: 2, types: [PortType.GAME, PortType.QUERY] },
  READY_OR_NOT: { count: 2, types: [PortType.GAME, PortType.QUERY] },
  DEEP_ROCK_GALACTIC: { count: 2, types: [PortType.GAME, PortType.QUERY] },
  SPACE_ENGINEERS: { count: 2, types: [PortType.GAME, PortType.QUERY] },
  STARDEW_VALLEY: { count: 1, types: [PortType.GAME] },
};

/**
 * Port Manager Service - handles contiguous port block allocation
 * Uses contiguous port allocation algorithm to prevent conflicts
 */
@Injectable()
export class PortManagerService {
  private readonly logger = new Logger(PortManagerService.name);
  private readonly portRangeStart: number;
  private readonly portRangeEnd: number;

  constructor(private readonly prisma: PrismaService) {
    this.portRangeStart = parseInt(process.env.PORT_RANGE_START || '20000');
    this.portRangeEnd = parseInt(process.env.PORT_RANGE_END || '30000');

    if (this.portRangeStart >= this.portRangeEnd) {
      throw new Error('Invalid port range configuration: PORT_RANGE_START must be less than PORT_RANGE_END');
    }
  }

  /**
   * Allocates a contiguous block of ports for a server
   * Uses atomic database transaction to prevent race conditions
   */
  async allocatePortBlock(request: PortAllocationRequestDto) {
    // Get game-specific port requirements
    const gameRequirements = GAME_PORT_REQUIREMENTS[request.gameType] || DEFAULT_PORT_RULE;

    const neededPorts = gameRequirements.count;

    // Use database transaction for atomic allocation
    return await this.prisma.$transaction(
      async (tx: any) => {
        // 1. Find contiguous port block
        const startPort = await this.findContiguousPortBlock(
          request.nodeId,
          neededPorts,
          request.protocol,
          tx
        );

        if (!startPort) {
          throw new InsufficientResourcesError(
            `No available contiguous port block of size ${neededPorts} on node ${request.nodeId}`
          );
        }

        // 2. Create allocations atomically
        const allocations = [];

        for (let i = 0; i < neededPorts; i++) {
          const port = startPort + i;
          const portType = gameRequirements.types[i] || PortType.GAME;

          // Determine protocol for this port
          let portProtocol: Protocol =
            request.protocol === Protocol.BOTH
              ? portType === PortType.RCON
                ? Protocol.TCP
                : Protocol.UDP
              : request.protocol;

          const allocation = await tx.networkAllocation.create({
            data: {
              nodeId: request.nodeId,
              port,
              protocol: portProtocol,
              type: portType,
              serverUuid: request.serverUuid || null,
            },
          });

          allocations.push(allocation);
        }

        this.logger.log(
          `Allocated ${allocations.length} ports for server ${request.serverUuid}: ${allocations.map((a) => `${a.port}/${a.protocol}`).join(', ')}`
        );

        return allocations;
      },
      {
        isolationLevel: 'Serializable', // Highest isolation level
        timeout: 10000, // 10 second timeout
      }
    );
  }

  /**
   * Finds a contiguous block of available ports
   * Scans the port range and finds the first available contiguous block
   */
  private async findContiguousPortBlock(
    nodeId: string,
    neededPorts: number,
    protocol: Protocol,
    tx: any
  ): Promise<number | null> {
    // Get all existing allocations for this node
    const existingAllocations = await tx.networkAllocation.findMany({
      where: {
        nodeId,
        OR:
          protocol === Protocol.BOTH
            ? [{ protocol: Protocol.UDP }, { protocol: Protocol.TCP }]
            : [{ protocol }],
      },
      select: { port: true },
      orderBy: { port: 'asc' },
    });

    const usedPorts = new Set(existingAllocations.map((a: { port: number }) => a.port));

    // Iterate through port range
    for (let candidatePort = this.portRangeStart; candidatePort <= this.portRangeEnd - neededPorts + 1; candidatePort++) {
      // Check if we can fit neededPorts starting from candidatePort
      let canAllocate = true;
      const portsToCheck: number[] = [];

      for (let offset = 0; offset < neededPorts; offset++) {
        const portToCheck = candidatePort + offset;

        // Check if port is in range
        if (portToCheck > this.portRangeEnd) {
          canAllocate = false;
          break;
        }

        // Check if port is already allocated
        if (usedPorts.has(portToCheck)) {
          canAllocate = false;
          break;
        }

        portsToCheck.push(portToCheck);
      }

      // If we found a contiguous block, return the start port
      if (canAllocate) {
        return candidatePort;
      }
    }

    // No contiguous block found
    return null;
  }

  /**
   * Deallocates ports for a server
   */
  async deallocatePorts(serverUuid: string): Promise<void> {
    const allocations = await this.prisma.networkAllocation.findMany({
      where: { serverUuid },
    });

    if (allocations.length === 0) {
      this.logger.warn(`No ports to deallocate for server ${serverUuid}`);
      return;
    }

    await this.prisma.networkAllocation.deleteMany({
      where: { serverUuid },
    });

    this.logger.log(`Deallocated ${allocations.length} ports for server ${serverUuid}`);
  }

  /**
   * Gets port statistics for a node
   */
  async getPortStatistics(nodeId: string): Promise<PortStatistics> {
    const allocations = await this.prisma.networkAllocation.findMany({
      where: { nodeId },
    });

    const totalPorts = this.portRangeEnd - this.portRangeStart + 1;
    const usedPorts = allocations.length;
    const availablePorts = totalPorts - usedPorts;
    const utilizationPercent = (usedPorts / totalPorts) * 100;

    // Find largest contiguous free block
    const largestFreeBlock = await this.findLargestContiguousFreeBlock(nodeId);

    // Port usage by type
    const usageByType: Record<PortType, number> = {
      [PortType.GAME]: 0,
      [PortType.RCON]: 0,
      [PortType.QUERY]: 0,
      [PortType.APP]: 0,
      [PortType.TV]: 0,
    };

    for (const alloc of allocations) {
      usageByType[alloc.type] = (usageByType[alloc.type] || 0) + 1;
    }

    return {
      nodeId,
      totalPorts,
      usedPorts,
      availablePorts,
      utilizationPercent,
      largestFreeBlock,
      usageByType,
      allocations: allocations.map((a: any) => ({
        port: a.port,
        protocol: a.protocol as Protocol,
        type: a.type as PortType,
        serverUuid: a.serverUuid || undefined,
      })),
    };
  }

  /**
   * Finds the largest contiguous free block on a node
   */
  private async findLargestContiguousFreeBlock(nodeId: string): Promise<number> {
    const allocations = await this.prisma.networkAllocation.findMany({
      where: { nodeId },
      select: { port: true },
      orderBy: { port: 'asc' },
    });

    const usedPorts = new Set(allocations.map((a: any) => a.port));
    let largestBlock = 0;
    let currentBlock = 0;

    for (let port = this.portRangeStart; port <= this.portRangeEnd; port++) {
      if (usedPorts.has(port)) {
        largestBlock = Math.max(largestBlock, currentBlock);
        currentBlock = 0;
      } else {
        currentBlock++;
      }
    }

    return Math.max(largestBlock, currentBlock);
  }

  /**
   * Validates port availability
   */
  async validatePortAvailability(nodeId: string, port: number, protocol: Protocol): Promise<boolean> {
    const existing = await this.prisma.networkAllocation.findFirst({
      where: {
        nodeId,
        port,
        protocol: protocol as any,
      },
    });

    if (existing) {
      return false;
    }

    // Check if port is in valid range
    if (port < this.portRangeStart || port > this.portRangeEnd) {
      return false;
    }

    return true;
  }
}

