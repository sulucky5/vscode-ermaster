import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const pkgPath = path.join(rootDir, 'package.json');

function run(cmd, args, { capture = false, allowFail = false } = {}) {
  const isWin = process.platform === 'win32';
  const result = spawnSync(cmd, args, {
    cwd: rootDir,
    stdio: capture ? 'pipe' : 'inherit',
    encoding: capture ? 'utf8' : undefined,
    shell: isWin
  });
  if (result.status !== 0 && !allowFail) {
    process.exit(result.status ?? 1);
  }
  return result;
}

const versionArg = process.argv[2] || 'patch'; // 'patch' | 'minor' | 'major' | '1.0.2'
const beforePkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

if (versionArg === beforePkg.version) {
  console.log(`\n📦 현재 버전 유지: v${beforePkg.version}`);
} else {
  console.log(`\n📦 버전 업데이트 (${beforePkg.version} -> ${versionArg})...`);
  run('npm', ['version', versionArg, '--no-git-tag-version']);
}

const afterPkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const tagName = `v${afterPkg.version}`;

// Check if tag already exists
const existingTag = run('git', ['rev-parse', '-q', '--verify', `refs/tags/${tagName}`], {
  capture: true,
  allowFail: true
});
if (existingTag.status === 0) {
  console.error(`\n❌ 태그 '${tagName}'가 이미 존재합니다. 다른 버전을 지정해 주세요.`);
  process.exit(1);
}

// Stage package.json & package-lock.json and commit if changed
run('git', ['add', 'package.json', 'package-lock.json']);
const diffCheck = run('git', ['diff', '--cached', '--quiet'], { allowFail: true });
if (diffCheck.status !== 0) {
  console.log(`\n📝 릴리즈 커밋 생성: Release ${tagName}`);
  run('git', ['commit', '-m', `Release ${tagName}`]);
}

// Create tag and push commit + tag to trigger GitHub Actions OIDC publish
console.log(`\n🏷️  태그 생성 및 푸시: ${tagName}`);
run('git', ['tag', tagName]);
run('git', ['push', 'origin', 'HEAD']);
run('git', ['push', 'origin', tagName]);

console.log(`\n✅ ${tagName} 푸시 완료! GitHub Actions에서 자동 배포가 시작됩니다:`);
console.log('   https://github.com/sulucky5/vscode-ermaster/actions');
