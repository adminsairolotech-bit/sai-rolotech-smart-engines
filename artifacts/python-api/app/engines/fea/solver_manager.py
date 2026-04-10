"""
solver_manager.py — Cross-Platform FEA Solver Detection & Management
SAI Rolotech Smart Engines v2.3.0

Supports:
- CalculiX (open-source, free)
- Abaqus (commercial, licensed)
- WSL CalculiX (Windows Subsystem for Linux)

Author: SAI Rolotech Engineering
"""

import os
import shutil
import subprocess
import platform
from typing import Tuple, Optional, List, Dict
from dataclasses import dataclass


@dataclass
class SolverInfo:
    """Information about a detected FEA solver"""
    name: str
    binary: str
    available: bool
    version: str
    install_instructions: str
    platform: str


def get_platform() -> str:
    """Get current platform"""
    return platform.system().lower()  # 'windows', 'linux', 'darwin'


def find_in_path(binary: str) -> Optional[str]:
    """Find binary in system PATH"""
    return shutil.which(binary)


def find_in_common_paths(binary: str, platform_type: str) -> Optional[str]:
    """Search common installation paths for solver"""
    common_paths: List[str] = []

    if platform_type == 'windows':
        # Windows paths
        program_files = os.environ.get('ProgramFiles', 'C:\\Program Files')
        program_files_x86 = os.environ.get('ProgramFiles(x86)', 'C:\\Program Files (x86)')

        common_paths = [
            os.path.join(program_files, 'CalculiX', 'ccx', 'bin', 'ccx.exe'),
            os.path.join(program_files, 'CalculiX', 'ccx.exe'),
            os.path.join(program_files_x86, 'CalculiX', 'ccx.exe'),
            os.path.join(program_files, 'SIMULIA', 'Abaqus', 'Current', 'exec', 'abaqus.bat'),
            os.path.join(program_files, 'Dassault Systemes', 'SIMULIA', 'Abaqus', 'exec', 'abaqus.bat'),
            'C:\\CalculiX\\ccx.exe',
            'C:\\ccx\\bin\\ccx.exe',
        ]
    elif platform_type == 'linux':
        common_paths = [
            '/usr/bin/ccx',
            '/usr/local/bin/ccx',
            '/opt/calculix/ccx',
            '/opt/calculix/ccx215/ccx',
            '/opt/calculix/ccx216/ccx',
            '/usr/bin/abaqus',
            '/opt/SIMULIA/EstProducts/2021/linux_a64/code/bin/SMAExternal/abaqus',
        ]
    elif platform_type == 'darwin':
        common_paths = [
            '/usr/local/bin/ccx',
            '/opt/homebrew/bin/ccx',
            '/Applications/Abaqus/CODEMAKE/SIMULIA_EstProducts2021-linux_a64/code/bin/SMAExternal/abaqus',
        ]

    for path in common_paths:
        if os.path.isfile(path) and os.access(path, os.X_OK):
            return path
        elif path.endswith('.exe') and os.path.isfile(path):
            return path

    return None


def check_wsl_solver(binary: str) -> Optional[Tuple[str, str]]:
    """
    Check if solver is available in WSL (Windows Subsystem for Linux)
    Returns (wsl_path, version) or None
    """
    try:
        # Check if WSL is available
        result = subprocess.run(
            ['wsl', '--list', '--quiet'],
            capture_output=True, text=True, timeout=5
        )
        if result.returncode != 0:
            return None

        distros = result.stdout.strip().split('\n')
        if not distros:
            return None

        # Try to find ccx in WSL
        for distro in distros:
            if not distro.strip():
                continue
            try:
                # Check if ccx exists in WSL
                check_cmd = f'wsl -d {distro} which ccx 2>/dev/null'
                check_result = subprocess.run(
                    check_cmd,
                    shell=True,
                    capture_output=True,
                    text=True,
                    timeout=10
                )
                if check_result.returncode == 0 and check_result.stdout.strip():
                    wsl_path = check_result.stdout.strip()
                    # Get version
                    ver_cmd = f'wsl -d {distro} {wsl_path} -v 2>&1 | head -1'
                    ver_result = subprocess.run(
                        ver_cmd,
                        shell=True,
                        capture_output=True,
                        text=True,
                        timeout=10
                    )
                    version = ver_result.stdout.strip() or ver_result.stderr.strip() or "WSL CalculiX"
                    return (f'wsl -d {distro} {wsl_path}', version)
            except Exception:
                continue

    except Exception:
        pass

    return None


def get_calculix_install_instructions(platform_type: str) -> str:
    """Get installation instructions for CalculiX on current platform"""
    instructions = {
        'windows': """
CalculiX Installation on Windows:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Option 1: WSL (Recommended)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Enable WSL in Windows:
   - Open PowerShell as Admin
   - Run: wsl --install
   - Restart computer

2. Install Ubuntu in WSL:
   - Open Microsoft Store
   - Search "Ubuntu 22.04 LTS"
   - Install and setup

3. Install CalculiX in WSL:
   - Open Ubuntu terminal
   - Run: sudo apt update
   - Run: sudo apt install calculix-ccx

4. Verify installation:
   - Run: ccx -v

Option 2: Native Windows (Advanced)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Download CalculiX from:
   https://www.calculix.de/

2. Or use pre-built binaries:
   - Download ccx.exe from GitHub releases
   - Place in C:\\CalculiX\\bin\\
   - Add to PATH

3. Install required DLLs:
   - Download SPoolES library
   - Place in same folder as ccx.exe

Docker Option:
━━━━━━━━━━━━━━
1. Install Docker Desktop for Windows
2. Run: docker pull victors77/calculix
3. Use: docker run -v /c/project:/work victors77/calculix ccx job
""",
        'linux': """
CalculiX Installation on Linux (Ubuntu/Debian):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

sudo apt update
sudo apt install calculix-ccx

Verify: ccx -v

For GUI (cgx):
sudo apt install calculix-cgx
""",
        'darwin': """
CalculiX Installation on macOS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Option 1: Homebrew (Recommended)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
brew install calculix-ccx

Option 2: Docker
━━━━━━━━━━━━━━━━
docker pull victors77/calculix
docker run -v $(pwd):/work victors77/calculix ccx job
"""
    }
    return instructions.get(platform_type, instructions['windows'])


def detect_calculix() -> SolverInfo:
    """
    Detect CalculiX solver on current system
    Works on Windows, Linux, macOS, and WSL
    """
    plat = get_platform()

    # Try PATH first
    binary = find_in_path('ccx')
    if binary:
        version = get_solver_version('ccx', binary)
        return SolverInfo(
            name='CalculiX',
            binary=binary,
            available=True,
            version=version,
            install_instructions='',
            platform=plat
        )

    # Try common paths
    binary = find_in_common_paths('ccx', plat)
    if binary:
        version = get_solver_version('ccx', binary)
        return SolverInfo(
            name='CalculiX',
            binary=binary,
            available=True,
            version=version,
            install_instructions='',
            platform=plat
        )

    # Try WSL on Windows
    if plat == 'windows':
        wsl_result = check_wsl_solver('ccx')
        if wsl_result:
            wsl_path, version = wsl_result
            return SolverInfo(
                name='CalculiX (WSL)',
                binary=wsl_path,
                available=True,
                version=version,
                install_instructions='Install via WSL Ubuntu',
                platform='windows_wsl'
            )

    # Not found
    return SolverInfo(
        name='CalculiX',
        binary='ccx',
        available=False,
        version='',
        install_instructions=get_calculix_install_instructions(plat),
        platform=plat
    )


def detect_abaqus() -> SolverInfo:
    """Detect Abaqus solver"""
    plat = get_platform()

    # Try PATH
    binary = find_in_path('abaqus')
    if binary:
        return SolverInfo(
            name='Abaqus',
            binary=binary,
            available=True,
            version='Commercial License',
            install_instructions='',
            platform=plat
        )

    # Try common paths
    binary = find_in_common_paths('abaqus', plat)
    if binary:
        return SolverInfo(
            name='Abaqus',
            binary=binary,
            available=True,
            version='Commercial License',
            install_instructions='',
            platform=plat
        )

    return SolverInfo(
        name='Abaqus',
        binary='abaqus',
        available=False,
        version='',
        install_instructions='Abaqus requires commercial license. Install from SIMULIA.',
        platform=plat
    )


def get_solver_version(name: str, binary: str) -> str:
    """Get solver version"""
    try:
        if get_platform() == 'windows' and not binary.startswith('wsl'):
            result = subprocess.run(
                [binary, '-v'],
                capture_output=True,
                text=True,
                timeout=5
            )
        else:
            result = subprocess.run(
                binary.split() if ' ' in binary else [binary, '-v'],
                capture_output=True,
                text=True,
                timeout=5
            )

        output = (result.stdout + result.stderr).strip()
        # Extract version number
        for line in output.split('\n')[:3]:
            if any(c.isdigit() for c in line):
                return line.strip()[:60]
        return output[:60] if output else 'Unknown version'
    except Exception as e:
        return f'Version check failed: {str(e)[:30]}'


def detect_all_solvers() -> Dict[str, SolverInfo]:
    """Detect all available FEA solvers"""
    return {
        'calculix': detect_calculix(),
        'abaqus': detect_abaqus(),
    }


def run_solver(binary: str, job_name: str, input_file: str,
               working_dir: str, timeout: int = 300) -> Dict:
    """
    Run FEA solver with given parameters

    Args:
        binary: Path to solver binary
        job_name: Job name (without extension)
        input_file: Input deck file path
        working_dir: Working directory
        timeout: Timeout in seconds

    Returns:
        Dict with solver results
    """
    plat = get_platform()

    try:
        # Change to working directory
        original_dir = os.getcwd()
        os.chdir(working_dir)

        # Build command based on solver
        if 'abaqus' in binary.lower():
            cmd = ['abaqus', 'job=' + job_name, 'input=' + input_file, 'int']
        else:
            # CalculiX
            if plat == 'windows' and binary.startswith('wsl'):
                # WSL command
                cmd = binary.split() + [job_name]
            else:
                cmd = [binary, job_name]

        # Run solver
        start_time = time.time()
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout
        )
        elapsed = time.time() - start_time

        # Restore directory
        os.chdir(original_dir)

        return {
            'success': result.returncode == 0,
            'return_code': result.returncode,
            'elapsed_time_s': round(elapsed, 2),
            'stdout': result.stdout,
            'stderr': result.stderr,
            'output_files': list_output_files(working_dir, job_name)
        }

    except subprocess.TimeoutExpired:
        return {
            'success': False,
            'return_code': -1,
            'elapsed_time_s': timeout,
            'stdout': '',
            'stderr': f'Solver timeout after {timeout} seconds',
            'output_files': []
        }
    except Exception as e:
        return {
            'success': False,
            'return_code': -1,
            'elapsed_time_s': 0,
            'stdout': '',
            'stderr': str(e),
            'output_files': []
        }
    finally:
        try:
            os.chdir(original_dir)
        except Exception:
            pass


def list_output_files(directory: str, job_name: str) -> List[str]:
    """List output files generated by solver"""
    extensions = ['.dat', '.frd', '.sta', '.msg', '.odb', '.csv', '.vtu']
    files = []

    for ext in extensions:
        filepath = os.path.join(directory, job_name + ext)
        if os.path.isfile(filepath):
            size = os.path.getsize(filepath)
            files.append({
                'name': job_name + ext,
                'path': filepath,
                'size_bytes': size,
                'size_kb': round(size / 1024, 2)
            })

    return files


# Auto-detect on import
SOLVER_STATUS = detect_all_solvers()
CALCULIX_AVAILABLE = SOLVER_STATUS['calculix'].available
ABAQUS_AVAILABLE = SOLVER_STATUS['abaqus'].available


if __name__ == '__main__':
    print("=" * 70)
    print("SAI ROLOTECH - FEA SOLVER DETECTION")
    print("=" * 70)
    print(f"\nPlatform: {get_platform()}")
    print(f"CalculiX: {'✅ Available' if CALCULIX_AVAILABLE else '❌ Not Found'}")
    print(f"Abaqus: {'✅ Available' if ABAQUS_AVAILABLE else '❌ Not Found'}")
    print()

    if not CALCULIX_AVAILABLE:
        print("\n" + SOLVER_STATUS['calculix'].install_instructions)

    print("\n" + "=" * 70)
