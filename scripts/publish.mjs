import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const envPath = path.join(rootDir, '.env.publish');
const pkgPath = path.join(rootDir, 'package.json');

function loadEnvFile(filePath) {
  const vars = {};
  if (!fs.existsSync(filePath)) return vars;
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) continue;
    const key = line.slice(0, eqIdx).trim();
    let val = line.slice(eqIdx + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (key) vars[key] = val;
  }
  return vars;
}

function run(cmd, args, extraEnv = {}) {
  const isWin = process.platform === 'win32';
  const result = spawnSync(cmd, args, {
    cwd: rootDir,
    stdio: 'inherit',
    shell: isWin,
    env: { ...process.env, ...extraEnv }
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const args = process.argv.slice(2);
const target = args[0] || 'ovsx'; // 'ovsx' | 'vscode' | 'all'
const versionArg = args[1]; // optional: 'patch' | 'minor' | 'major' | '1.0.0'

if (!['ovsx', 'vscode', 'all'].includes(target)) {
  console.error(`Unknown publish target: ${target}. Use 'ovsx', 'vscode', or 'all'.`);
  process.exit(1);
}

const fileEnv = loadEnvFile(envPath);
const ovsxPat = (process.env.OVSX_PAT || fileEnv.OVSX_PAT || '').trim();
const vscePat = (process.env.VSCE_PAT || fileEnv.VSCE_PAT || '').trim();

if ((target === 'ovsx' || target === 'all') && !ovsxPat) {
  console.error('❌ OVSX_PAT가 비어 있습니다. .env.publish 파일에 Open VSX 토큰을 입력해 주세요.');
  process.exit(1);
}
if ((target === 'vscode' || target === 'all') && !vscePat) {
  console.error('❌ VSCE_PAT가 비어 있습니다. .env.publish 파일에 VS Code Marketplace 토큰을 입력해 주세요.');
  process.exit(1);
}

// 1. Optional version bump (skip if already at the requested version)
const currentPkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
if (versionArg) {
  if (versionArg === currentPkg.version) {
    console.log(`\n📦 현재 버전과 동일하므로 유지합니다: ${versionArg}`);
  } else {
    console.log(`\n📦 버전 변경: ${currentPkg.version} -> ${versionArg}`);
    run('npm', ['version', versionArg, '--no-git-tag-version']);
  }
}

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const vsixFile = `${pkg.name}-${pkg.version}.vsix`;
const vsixPath = path.join(rootDir, vsixFile);

// 2. Build & Package VSIX once
console.log(`\n🔨 빌드 및 VSIX 패키징 (${vsixFile})...`);
run('npx', ['@vscode/vsce', 'package', '--no-dependencies', '--out', vsixPath]);

// 3. Publish to Open VSX
if (target === 'ovsx' || target === 'all') {
  console.log(`\n🚀 Open VSX Registry 배포 중 (${vsixFile})...`);
  run('npx', ['ovsx', 'publish', vsixPath], { OVSX_PAT: ovsxPat });
}

// 4. Publish to VS Code Marketplace
if (target === 'vscode' || target === 'all') {
  console.log(`\n🚀 VS Code Marketplace 배포 중 (${vsixFile})...`);
  run('npx', ['@vscode/vsce', 'publish', '--packagePath', vsixPath], { VSCE_PAT: vscePat });
}

console.log(`\n✅ 배포 완료: ${vsixFile}`);
