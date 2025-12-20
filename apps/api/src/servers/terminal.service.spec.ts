import { Test, TestingModule } from '@nestjs/testing';
import { TerminalService } from './terminal.service';
import { PrismaService } from '@zed-hosting/db';

describe('TerminalService', () => {
  let service: TerminalService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TerminalService,
        {
          provide: PrismaService,
          useValue: {
            gameServer: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<TerminalService>(TerminalService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSession', () => {
    it('should create a new terminal session', () => {
      const result = service.createSession('test-server-id', 'test-user-id');
      
      expect(result).toHaveProperty('sessionId');
      expect(result.serverId).toBe('test-server-id');
      expect(result.userId).toBe('test-user-id');
      expect(result.createdAt).toBeDefined();
    });

    it('should return unique session IDs for multiple calls', () => {
      const session1 = service.createSession('server-1', 'user-1');
      const session2 = service.createSession('server-2', 'user-2');

      expect(session1.sessionId).not.toBe(session2.sessionId);
    });
  });

  describe('sanitizeCommand', () => {
    it('should allow safe commands', () => {
      const cmd = 'ls -la /home/gameserver';
      expect(() => service['sanitizeCommand'](cmd)).not.toThrow();
    });

    it('should block commands with pipe operators', () => {
      const cmd = 'ls | grep .txt';
      expect(() => service['sanitizeCommand'](cmd)).toThrow('Dangerous');
    });

    it('should block commands with shell operators', () => {
      const cmd = 'ls && rm -rf /';
      expect(() => service['sanitizeCommand'](cmd)).toThrow('Dangerous');
    });

    it('should block rm -rf commands', () => {
      const cmd = 'rm -rf /tmp/data';
      expect(() => service['sanitizeCommand'](cmd)).toThrow('Dangerous');
    });

    it('should block dd commands', () => {
      const cmd = 'dd if=/dev/zero of=/dev/sda';
      expect(() => service['sanitizeCommand'](cmd)).toThrow('Dangerous');
    });

    it('should block command substitution', () => {
      const cmd = 'echo $(whoami)';
      expect(() => service['sanitizeCommand'](cmd)).toThrow('Dangerous');
    });

    it('should block backtick substitution', () => {
      const cmd = 'echo `whoami`';
      expect(() => service['sanitizeCommand'](cmd)).toThrow('Dangerous');
    });
  });

  describe('closeSession', () => {
    it('should close a session', () => {
      const session = service.createSession('server-1', 'user-1');
      const result = service.closeSession(session.sessionId);

      expect(result).toBe(true);
    });

    it('should return false for non-existent session', () => {
      const result = service.closeSession('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('getActiveSessions', () => {
    it('should return all active sessions', () => {
      service.createSession('server-1', 'user-1');
      service.createSession('server-2', 'user-2');

      const sessions = service.getActiveSessions();
      expect(sessions).toHaveLength(2);
    });

    it('should not include closed sessions', () => {
      const session1 = service.createSession('server-1', 'user-1');
      const session2 = service.createSession('server-2', 'user-2');

      service.closeSession(session1.sessionId);

      const sessions = service.getActiveSessions();
      expect(sessions).toHaveLength(1);
      expect(sessions[0].sessionId).toBe(session2.sessionId);
    });
  });

  describe('getCwd', () => {
    it('should return home directory as default', () => {
      const cwd = service['getCwd']('test-server-id');
      expect(cwd).toBeDefined();
    });
  });
});
