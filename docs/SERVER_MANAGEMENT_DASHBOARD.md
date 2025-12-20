# Server Management Dashboard Integration Guide

## Overview

The Server Management Dashboard is the main interface for administrators to manage game servers. The dashboard includes the new Terminal Console feature for remote server interaction.

## File Structure

```
apps/
├── api/                           # NestJS API Backend
│   └── src/servers/
│       ├── servers.module.ts      # Main module (exports Terminal, File services)
│       ├── servers.service.ts     # Server CRUD operations
│       ├── servers.controller.ts  # Server REST endpoints
│       ├── terminal.service.ts    # NEW: Terminal/SSH execution
│       ├── terminal.controller.ts # NEW: Terminal REST endpoints
│       ├── server-file.service.ts # File management service
│       └── server-file.controller.ts # File management endpoints
│
└── web/                           # Next.js Frontend
    └── src/
        ├── components/
        │   ├── ServerTerminal.tsx      # NEW: xterm.js terminal UI
        │   ├── ServerFileManager.tsx   # TODO: File browser component
        │   ├── ServerStats.tsx         # Server metrics dashboard
        │   └── ServerActions.tsx       # Quick action buttons
        ├── pages/
        │   └── dashboard/
        │       ├── servers/
        │       │   ├── index.tsx       # Servers list page
        │       │   └── [uuid].tsx      # Server detail page (integrate components)
        │       └── ...
        └── hooks/
            └── useTerminal.ts          # TODO: Hook for terminal state management
```

## Integration Steps

### 1. Backend Setup (Already Implemented)

The terminal service is already integrated into the ServersModule:

```typescript
// apps/api/src/servers/servers.module.ts
import { TerminalService } from './terminal.service';
import { TerminalController } from './terminal.controller';

@Module({
  imports: [PrismaModule, WebSocketModule],
  providers: [ServersService, TerminalService, ServerFileService],
  controllers: [ServersController, TerminalController, ServerFileController],
  exports: [ServersService, TerminalService],
})
export class ServersModule {}
```

### 2. Frontend Integration

#### Step 1: Create Server Management Page
Create or update the server detail page that will display all server management components:

```typescript
// apps/web/src/pages/dashboard/servers/[uuid].tsx
import { useState } from 'react';
import ServerTerminal from '@/components/ServerTerminal';
import ServerFileManager from '@/components/ServerFileManager';
import ServerStats from '@/components/ServerStats';
import ServerActions from '@/components/ServerActions';

export default function ServerDetailPage() {
  const { uuid } = useRouter().query;
  const [activeTab, setActiveTab] = useState<'terminal' | 'files' | 'stats'>('terminal');

  if (!uuid) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <ServerActions serverId={uuid as string} />
      
      <div className="flex gap-4">
        <button
          onClick={() => setActiveTab('terminal')}
          className={`px-4 py-2 rounded ${activeTab === 'terminal' ? 'bg-blue-500' : 'bg-gray-700'}`}
        >
          Terminal
        </button>
        <button
          onClick={() => setActiveTab('files')}
          className={`px-4 py-2 rounded ${activeTab === 'files' ? 'bg-blue-500' : 'bg-gray-700'}`}
        >
          Files
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2 rounded ${activeTab === 'stats' ? 'bg-blue-500' : 'bg-gray-700'}`}
        >
          Stats
        </button>
      </div>

      {activeTab === 'terminal' && <ServerTerminal serverId={uuid as string} />}
      {activeTab === 'files' && <ServerFileManager serverId={uuid as string} />}
      {activeTab === 'stats' && <ServerStats serverId={uuid as string} />}
    </div>
  );
}
```

#### Step 2: Using ServerTerminal Component

The ServerTerminal component is ready to use:

```typescript
import ServerTerminal from '@/components/ServerTerminal';

<ServerTerminal 
  serverId="your-server-uuid"
  onClose={() => console.log('Terminal closed')}
/>
```

#### Step 3: Create Custom Hooks (Optional)

Create a hook for managing terminal state across your application:

```typescript
// apps/web/src/hooks/useTerminal.ts
import { useState, useCallback } from 'react';

interface TerminalSession {
  sessionId: string;
  serverId: string;
  createdAt: string;
}

export function useTerminal(serverId: string) {
  const [session, setSession] = useState<TerminalSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSession = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/servers/${serverId}/terminal/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      setSession(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [serverId]);

  const executeCommand = useCallback(async (command: string) => {
    if (!session) throw new Error('No active session');
    
    const response = await fetch(
      `/api/servers/${serverId}/terminal/${session.sessionId}/execute`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      }
    );
    return response.json();
  }, [serverId, session]);

  return {
    session,
    loading,
    error,
    createSession,
    executeCommand,
  };
}
```

## API Integration

### Authentication

All terminal endpoints require JWT authentication:

```typescript
const headers = {
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json',
};
```

### Example: Execute Command

```typescript
async function executeCommand(serverId: string, sessionId: string, command: string) {
  const response = await fetch(
    `/api/servers/${serverId}/terminal/${sessionId}/execute`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ command }),
    }
  );
  
  if (!response.ok) {
    throw new Error(`Command failed: ${response.statusText}`);
  }
  
  return response.json();
}
```

## Component Styling

The ServerTerminal component uses Tailwind CSS and can be customized:

```typescript
<ServerTerminal
  serverId={serverId}
  className="h-96 rounded-lg border border-gray-700"
  theme="dark"
/>
```

## WebSocket Integration (Future)

For real-time streaming of long-running commands, implement WebSocket support:

```typescript
// Socket.io integration (using existing websocket infrastructure)
const socket = useSocket();

socket.on('terminal:output', (data) => {
  console.log('Output:', data.output);
});

socket.emit('terminal:execute', {
  serverId,
  sessionId,
  command: 'docker logs -f api',
});
```

## Error Handling

Handle common error scenarios:

```typescript
try {
  await executeCommand(serverId, sessionId, command);
} catch (error) {
  if (error.message.includes('Dangerous pattern')) {
    showError('Command contains dangerous patterns');
  } else if (error.message.includes('Session not found')) {
    setSession(null);
    await createSession();
  } else {
    showError(error.message);
  }
}
```

## Performance Tips

1. **Reuse Sessions**: Don't create a new session for each command
2. **Limit Output**: Use pagination for large command outputs
3. **Debounce Input**: Debounce file search/navigation inputs
4. **Lazy Load**: Load terminal component only when tab is active

## Security Considerations

1. **Input Validation**: Commands are sanitized server-side
2. **Rate Limiting**: Consider implementing rate limits for command execution
3. **Audit Logging**: Log all executed commands for security audit
4. **Permissions**: Only servers team or superadmin can access terminals

## Testing

### Unit Tests

```typescript
// apps/api/src/servers/terminal.service.spec.ts
describe('TerminalService', () => {
  let service: TerminalService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [TerminalService, PrismaService],
    }).compile();
    service = module.get(TerminalService);
  });

  it('should create a session', async () => {
    const session = await service.createSession({
      serverId: 'test-id',
      userId: 'user-id',
      sshKey: '/path/to/key',
    });
    expect(session.sessionId).toBeDefined();
  });
});
```

### Integration Tests

Test the API endpoints:

```bash
# Create session
curl -X POST http://localhost:3000/servers/test-server/terminal/session \
  -H "Authorization: Bearer $TOKEN"

# Execute command
curl -X POST http://localhost:3000/servers/test-server/terminal/{sessionId}/execute \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"command":"echo hello"}'
```

## Deployment Checklist

- [ ] API builds successfully: `npx nx build api`
- [ ] Web builds successfully: `npm run build:web`
- [ ] SSH keys are configured in database for servers
- [ ] Docker containers have necessary SSH packages
- [ ] Network connectivity is available to servers
- [ ] Rate limiting is configured (if needed)
- [ ] Audit logging is enabled
- [ ] Documentation is updated

## Troubleshooting

### Terminal Commands Not Working

1. Check API logs for SSH errors: `docker logs zed-api --tail 100`
2. Verify SSH keys are correct: `ls -la ~/.ssh/`
3. Test SSH manually from API container
4. Check firewall rules for port 22

### Session Timeouts

- Increase timeout in TerminalService (currently 30 seconds)
- Check network latency
- Verify server connectivity

### Large Output Issues

- Use `head`/`tail` to limit output
- Stream output via WebSocket (future enhancement)
- Use pagination for file listings

## Related Files

- [Terminal Service Documentation](./TERMINAL_SERVICE.md)
- [Server Module](../apps/api/src/servers/servers.module.ts)
- [ServerTerminal Component](../apps/web/src/components/ServerTerminal.tsx)
- [API Authentication](../docs/AUTH.md)
