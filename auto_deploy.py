#!/usr/bin/env python3
"""
Automatic deployment script for ZedHosting
"""
import os
import sys
import subprocess
import time

try:
    import paramiko
    from scp import SCPClient
except ImportError:
    print("Installing required packages...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "paramiko", "scp"])
    import paramiko
    from scp import SCPClient

SERVER_IP = "116.203.226.140"
USERNAME = "root"
PASSWORD = "bdnXbNMmbe7q7TK7aVWu"

def get_ssh_key_path():
    """Get SSH key path"""
    home = os.path.expanduser("~")
    return os.path.join(home, ".ssh", "zedhosting_server")

def get_public_key():
    """Read public key"""
    pub_key_path = get_ssh_key_path() + ".pub"
    if not os.path.exists(pub_key_path):
        raise FileNotFoundError(f"Public key not found: {pub_key_path}")
    with open(pub_key_path, 'r') as f:
        return f.read().strip()

def setup_ssh_key():
    """Setup SSH key on remote server"""
    print("=== Setting up SSH key on server ===")
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print(f"Connecting to {USERNAME}@{SERVER_IP}...")
        ssh.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=10)
        
        pub_key = get_public_key()
        
        # Setup .ssh directory
        print("Creating .ssh directory...")
        stdin, stdout, stderr = ssh.exec_command(
            "mkdir -p ~/.ssh && chmod 700 ~/.ssh"
        )
        stdout.channel.recv_exit_status()
        
        # Check if key already exists
        stdin, stdout, stderr = ssh.exec_command(
            f"grep -q '{pub_key[:50]}' ~/.ssh/authorized_keys 2>/dev/null && echo 'EXISTS' || echo 'NEW'"
        )
        result = stdout.read().decode().strip()
        
        if result == "EXISTS":
            print("SSH key already exists on server")
        else:
            # Add key to authorized_keys
            print("Adding public key to authorized_keys...")
            stdin, stdout, stderr = ssh.exec_command(
                f"echo '{pub_key}' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
            )
            exit_status = stdout.channel.recv_exit_status()
            if exit_status == 0:
                print("✓ SSH key added successfully")
            else:
                error = stderr.read().decode()
                print(f"✗ Failed to add key: {error}")
                return False
        
        ssh.close()
        return True
        
    except Exception as e:
        print(f"✗ Failed to setup SSH key: {e}")
        return False

def test_ssh_key():
    """Test SSH key authentication"""
    print("\n=== Testing SSH key authentication ===")
    key_path = get_ssh_key_path()
    
    if not os.path.exists(key_path):
        print(f"✗ Private key not found: {key_path}")
        return False
    
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        
        private_key = paramiko.Ed25519Key.from_private_key_file(key_path)
        ssh.connect(SERVER_IP, username=USERNAME, pkey=private_key, timeout=10)
        
        stdin, stdout, stderr = ssh.exec_command("echo 'SSH key authentication successful'")
        output = stdout.read().decode()
        ssh.close()
        
        print(f"✓ {output.strip()}")
        return True
        
    except Exception as e:
        print(f"✗ SSH key authentication failed: {e}")
        return False

def run_remote_command(command, use_key=True):
    """Run command on remote server"""
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        if use_key:
            key_path = get_ssh_key_path()
            private_key = paramiko.Ed25519Key.from_private_key_file(key_path)
            ssh.connect(SERVER_IP, username=USERNAME, pkey=private_key, timeout=30)
        else:
            ssh.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=30)
        
        stdin, stdout, stderr = ssh.exec_command(command)
        exit_status = stdout.channel.recv_exit_status()
        output = stdout.read().decode()
        error = stderr.read().decode()
        
        ssh.close()
        return exit_status == 0, output, error
        
    except Exception as e:
        return False, "", str(e)

def copy_file_to_server(local_path, remote_path, use_key=True):
    """Copy file to server using SCP"""
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        if use_key:
            key_path = get_ssh_key_path()
            private_key = paramiko.Ed25519Key.from_private_key_file(key_path)
            ssh.connect(SERVER_IP, username=USERNAME, pkey=private_key, timeout=30)
        else:
            ssh.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=30)
        
        with SCPClient(ssh.get_transport()) as scp:
            scp.put(local_path, remote_path)
        
        ssh.close()
        return True
        
    except Exception as e:
        print(f"✗ Failed to copy {local_path}: {e}")
        return False

def copy_directory_to_server(local_path, remote_path, use_key=True):
    """Copy directory to server"""
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        if use_key:
            key_path = get_ssh_key_path()
            private_key = paramiko.Ed25519Key.from_private_key_file(key_path)
            ssh.connect(SERVER_IP, username=USERNAME, pkey=private_key, timeout=30)
        else:
            ssh.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=30)
        
        with SCPClient(ssh.get_transport()) as scp:
            scp.put(local_path, remote_path, recursive=True)
        
        ssh.close()
        return True
        
    except Exception as e:
        print(f"✗ Failed to copy directory {local_path}: {e}")
        return False

def main():
    print("=== ZedHosting Automatic Deployment ===\n")
    
    # Step 1: Setup SSH key
    if not setup_ssh_key():
        print("\nFailed to setup SSH key. Continuing with password authentication...")
        use_key = False
    else:
        # Step 2: Test SSH key
        if test_ssh_key():
            use_key = True
            print("\nUsing SSH key authentication")
        else:
            use_key = False
            print("\nFalling back to password authentication")
    
    # Step 3: Run server setup script
    print("\n=== [1/5] Running server setup script ===")
    print("Copying server_setup.sh to server...")
    
    if copy_file_to_server("server_setup.sh", "/tmp/server_setup.sh", use_key):
        print("✓ File copied")
        print("Running setup script...")
        success, output, error = run_remote_command(
            "chmod +x /tmp/server_setup.sh && bash /tmp/server_setup.sh",
            use_key
        )
        
        if success:
            print(output)
            print("✓ Server setup completed")
        else:
            print(f"✗ Setup failed: {error}")
            if output:
                print(output)
            return
    else:
        print("✗ Failed to copy setup script")
        return
    
    # Step 4: Copy project files
    print("\n=== [2/5] Copying project files ===")
    
    files_to_copy = [
        ("docker-compose.yml", "/opt/zedhosting/docker-compose.yml"),
        ("package.json", "/opt/zedhosting/package.json"),
        ("nx.json", "/opt/zedhosting/nx.json"),
        ("tsconfig.base.json", "/opt/zedhosting/tsconfig.base.json"),
    ]
    
    dirs_to_copy = [
        ("apps", "/opt/zedhosting/apps"),
        ("libs", "/opt/zedhosting/libs"),
    ]
    
    print("Copying files...")
    for local, remote in files_to_copy:
        if os.path.exists(local):
            print(f"  Copying {local}...")
            if copy_file_to_server(local, remote, use_key):
                print(f"    ✓ {local}")
            else:
                print(f"    ✗ {local}")
    
    print("Copying directories...")
    for local, remote in dirs_to_copy:
        if os.path.exists(local):
            print(f"  Copying {local}/...")
            if copy_directory_to_server(local, remote, use_key):
                print(f"    ✓ {local}/")
            else:
                print(f"    ✗ {local}/")
    
    # Step 5: Start Docker containers
    print("\n=== [3/5] Starting Docker containers ===")
    success, output, error = run_remote_command(
        "cd /opt/zedhosting && docker compose up -d --build",
        use_key
    )
    
    if success:
        print(output)
        print("✓ Docker containers starting...")
    else:
        print(f"✗ Failed to start containers: {error}")
        if output:
            print(output)
        return
    
    # Step 6: Wait for containers
    print("\n=== [4/5] Waiting for containers to start ===")
    print("Waiting 30 seconds...")
    time.sleep(30)
    
    # Step 7: Run database migration
    print("\n=== [5/5] Running database migration ===")
    success, output, error = run_remote_command(
        "cd /opt/zedhosting && docker compose exec -T api npx prisma migrate deploy",
        use_key
    )
    
    if success:
        print(output)
        print("✓ Database migration completed")
    else:
        print(f"⚠ Migration may have failed: {error}")
        if output:
            print(output)
    
    # Final status
    print("\n=== Deployment Summary ===")
    print(f"Server: {SERVER_IP}")
    print(f"API URL: http://{SERVER_IP}:3000")
    print("\nTo check status:")
    print(f"  ssh {'-i ~/.ssh/zedhosting_server ' if use_key else ''}{USERNAME}@{SERVER_IP} 'cd /opt/zedhosting && docker compose ps'")
    print("\nTo view logs:")
    print(f"  ssh {'-i ~/.ssh/zedhosting_server ' if use_key else ''}{USERNAME}@{SERVER_IP} 'cd /opt/zedhosting && docker compose logs -f api'")

if __name__ == "__main__":
    main()


