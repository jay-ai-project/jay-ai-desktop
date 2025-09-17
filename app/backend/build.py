
import subprocess
import sys
import os

def main():
    # This script is run from the 'backend' directory via 'cd backend' in package.json
    
    pyinstaller_command = [
        sys.executable,
        '-m',
        'PyInstaller',
        '--name',
        'backend_server',
        '--onefile',
        '--noconsole',
        '--paths',
        'src',
        os.path.join('src', 'server.py')
    ]

    print(f"Running PyInstaller command: {' '.join(pyinstaller_command)}")

    # Run PyInstaller from the current directory ('backend')
    subprocess.run(pyinstaller_command, check=True)

if __name__ == "__main__":
    main()
