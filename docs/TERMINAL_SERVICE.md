# Server Terminal Service

## Overview

The Server Terminal Service provides secure remote command execution and file management capabilities for game servers through a REST API and WebSocket interface. This feature enables administrators to interact with game servers directly from the web dashboard.

## Architecture

### Backend Components

#### TerminalService (`apps/api/src/servers/terminal.service.ts`)
- **Session Management**: Creates and tracks persistent terminal sessions per server
- **Command Execution**: Executes commands via SSH with timeout and buffer limits (30 seconds, 1MB)
- **File Operations**: Read, write, and list files on remote servers
- **Container Monitoring**: Retrieves Docker container statistics
- **Security**: Command sanitization to prevent injection attacks

#### TerminalController (`apps/api/src/servers/terminal.controller.ts`)
- **REST Endpoints**: 6 endpoints for terminal operations
- **Authentication**: Requires JWT auth and role-based access
- **Session Management**: Creates and validates terminal sessions

### Frontend Component

#### ServerTerminal (`apps/web/src/components/ServerTerminal.tsx`)
- **xterm.js Integration**: Full-featured terminal UI with dark theme
- **Command Input**: Enter-to-execute command input field
- **Real-time Output**: Displays command output with color coding
- **Toolbar**: Clear, Copy, and Close buttons
- **Responsive**: Automatically fits container with FitAddon

## API Endpoints

### Session Management
```
POST /servers/:serverId/terminal/session
Create a new terminal session for a server

Response:
{
  "sessionId": "string",
  "serverId": "string",
  "createdAt": "2025-12-20T12:00:00Z"
}
```

### Command Execution
```
POST /servers/:serverId/terminal/:sessionId/execute
Execute a command in the terminal session

Body:
{
  "command": "ls -la /home/gameserver"
}

Response:
{
  "stdout": "output...",
  "stderr": "",
  "exitCode": 0
}
```

### File Operations
```
GET /servers/:serverId/terminal/:sessionId/files?path=/home/gameserver
List files in a directory

Response:
[
  {
    "name": "serverdata",
    "path": "/home/gameserver/serverdata",
    "type": "directory",
    "size": 4096,
    "permissions": "drwxr-xr-x",
    "owner": "gameserver"
  }
]
```

### File Content
```
GET /servers/:serverId/terminal/:sessionId/read-file?path=/home/gameserver/config.json
Read file contents (max 1MB for display)

Response:
{
  "content": "{ ... }"
}
```

### Container Stats
```
GET /servers/:serverId/terminal/:sessionId/docker-stats
Get real-time container statistics

Response:
{
  "stats": [
    {
      "container": "zed-api",
      "cpu": "12.5%",
      "memory": "256.7MB / 2GB",
      "netI": "1.2MB",
      "netO": "3.4MB"
    }
  ]
}
```

### Admin Sessions
```
GET /terminal/admin/sessions
View all active terminal sessions (SUPERADMIN only)

Response:
[
  {
    "sessionId": "uuid",
    "serverId": "uuid",
    "userId": "uuid",
    "createdAt": "2025-12-20T12:00:00Z",
    "lastCommand": "docker ps"
  }
]
```

## Security Features

### Command Sanitization
Dangerous patterns are blocked to prevent injection attacks:
- Shell operators: `&`, `|`, `;`, `` ` ``, `$`, `(`, `)`
- Destructive commands: `rm -rf`, `dd if=/dev/zero`

### SSH Authentication
- Per-server SSH key configuration stored in database
- Key-based authentication (no passwords)
- 30-second command timeout to prevent hanging

### Session Validation
- Sessions validated before each command execution
- WebSocket connections authenticated with JWT tokens
- Role-based access control (servers team or superadmin)

### Buffer Limits
- 1MB display limit for large file contents
- Prevents memory exhaustion from large outputs

## Usage Examples

### Create Terminal Session
```bash
curl -X POST http://localhost:3000/servers/server-uuid/terminal/session \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### Execute Command
```bash
curl -X POST http://localhost:3000/servers/server-uuid/terminal/session-uuid/execute \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"command":"docker ps"}'
```

### List Server Files
```bash
curl http://localhost:3000/servers/server-uuid/terminal/session-uuid/files?path=/home/gameserver \
  -H "Authorization: Bearer $JWT_TOKEN"
```

## Integration

### Module Integration
The TerminalService and TerminalController are integrated into the ServersModule:

```typescript
// apps/api/src/servers/servers.module.ts
import { TerminalService } from './terminal.service';
import { TerminalController } from './terminal.controller';

@Module({
  imports: [PrismaModule, /* ... */],
  providers: [TerminalService, /* ... */],
  controllers: [TerminalController, /* ... */],
})
export class ServersModule {}
```

### Using in Components
```typescript
import ServerTerminal from './ServerTerminal';

export function ServerPage() {
  const serverId = 'your-server-id';
  
  return (
    <ServerTerminal
      serverId={serverId}
      onClose={() => console.log('Terminal closed')}
    />
  );
}
```

## Implementation Details

### SSH Command Execution
Commands are executed via Node.js child_process.exec with SSH:
```typescript
const command = `ssh -i ${keyPath} -p ${port} ${username}@${host} "${sanitizedCommand}"`;
const { stdout, stderr } = await promisify(exec)(command, { timeout: 30000 });
```

### File Operations
- List: Uses `ls -lah` with JSON parsing
- Read: Uses `cat` with base64 encoding for binary safety
- Write: Uses heredoc syntax with escape sequences

### Docker Stats Parsing
Stats are retrieved using:
```bash
docker stats --no-stream --format "json"
```

## Performance Considerations

- **Command Timeout**: 30 seconds per command (configurable)
- **Buffer Limit**: 1MB output display limit
- **Session Pooling**: Keep-alive connections for multiple commands
- **Concurrent Sessions**: Limited by server resources

## Future Enhancements

- [ ] WebSocket real-time streaming for long-running commands
- [ ] Terminal session recording and playback
- [ ] File upload via terminal UI
- [ ] Command history and search
- [ ] Terminal session sharing
- [ ] Automatic reconnection on network failure

## Troubleshooting

### Commands Timing Out
- Increase the timeout value in TerminalService
- Check server connectivity and SSH key permissions

### SSH Key Errors
- Verify SSH key path is correct in server configuration
- Check key permissions: `chmod 600 ~/.ssh/key`
- Test SSH manually: `ssh -i ~/.ssh/key user@host`

### Large File Display Issues
- Files over 1MB are truncated for display
- Use `head`/`tail` commands for partial viewing
- Download large files via separate file manager

## Related Documentation

- [Server Management](./SERVERS.md)
- [Authentication & Authorization](./AUTH.md)
- [Deployment Guide](../DEPLOYMENT_GUIDE.md)
