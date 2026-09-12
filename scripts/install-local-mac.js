// A repeatable local install with a stable signing identity. Ad hoc signatures
// change their designated requirement on every rebuild, invalidating TCC grants.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

function run(command, args) {
  execFileSync(command, args, { stdio: 'inherit', cwd: path.join(__dirname, '..') });
}

function main() {
  if (process.platform !== 'darwin') throw new Error('This installer is for macOS.');
  const root = path.join(__dirname, '..');
  const configPath = path.join(os.homedir(), 'Library', 'Application Support', 'cue', 'local-signing.json');
  const config = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf8')) : {};
  const identities = execFileSync('security', ['find-identity', '-v', '-p', 'codesigning'], { encoding: 'utf8' });
  const available = [...identities.matchAll(/\b([A-F0-9]{40}) "([^"]+)"/g)]
    .filter((match) => /^(Apple Development:|Developer ID Application:)/.test(match[2]));
  const identity = process.env.CUE_SIGN_IDENTITY || config.identity || (available.length === 1 ? available[0][1] : null);
  if (!identity || !available.some((match) => match[1] === identity)) {
    throw new Error('A stable Apple signing identity is required. Set CUE_SIGN_IDENTITY to a valid certificate fingerprint from security find-identity -v -p codesigning. This installer never falls back to ad hoc signing.');
  }

  const arch = process.arch;
  if (!['arm64', 'x64'].includes(arch)) throw new Error('Unsupported Mac architecture: ' + arch);
  const bundle = path.join(root, 'dist', arch === 'arm64' ? 'mac-arm64' : 'mac', 'cue.app');
  if (process.argv.includes('--resources-only')) {
    // Reuse only verified, identical production dependencies on low-disk machines.
    const installed = '/Applications/cue.app';
    run('codesign', ['--verify', '--deep', '--strict', installed]);
    const appResources = 'Contents/Resources/app';
    const oldPackage = JSON.parse(fs.readFileSync(path.join(installed, appResources, 'package.json')));
    const nextPackage = JSON.parse(fs.readFileSync(path.join(root, 'package.json')));
    if (JSON.stringify(oldPackage.dependencies) !== JSON.stringify(nextPackage.dependencies)) throw new Error('Dependencies changed; run a full install.');
    if (fs.existsSync(bundle)) fs.rmSync(bundle, { recursive: true });
    fs.mkdirSync(path.dirname(bundle), { recursive: true });
    run('/bin/cp', ['-cR', installed, bundle]);
    for (const name of ['main.js', 'preload.js', 'package.json', 'src', 'renderer']) {
      const dest = path.join(bundle, appResources, name);
      fs.rmSync(dest, { recursive: true, force: true });
      fs.cpSync(path.join(root, name), dest, { recursive: true });
    }
    run('codesign', ['--force', '--sign', identity, '--entitlements', path.join(root, 'build-resources', 'entitlements.mac.plist'), bundle]);
  } else {
    run('npm', ['run', 'pack', '--', '--mac', '--' + arch]);
    const runtime = path.join(root, '.cache', 'whisper-runtime', 'darwin-' + arch);
    if (!fs.existsSync(path.join(runtime, 'whisper-server'))) throw new Error('Prepare the local Whisper runtime first.');
    run('ditto', [runtime, path.join(bundle, 'Contents', 'Resources', 'whisper-runtime')]);
    run('codesign', ['--force', '--deep', '--sign', identity, '--entitlements', path.join(root, 'build-resources', 'entitlements.mac.plist'), bundle]);
  }
  run('codesign', ['--verify', '--deep', '--strict', bundle]);
  // Test against the previous install's identity, not its changing content hash.
  // A certificate change that breaks continuity must be handled explicitly.
  if (config.requirement) run('codesign', ['--verify', '--strict', '-R=' + config.requirement, bundle]);
  const details = spawnSync('codesign', ['-d', '-r-', bundle], { encoding: 'utf8' });
  if (details.status !== 0) throw new Error('Could not inspect the new signature.');
  const requirement = (details.stderr + details.stdout).match(/designated => (.+)/)?.[1];
  if (!requirement || /\bcdhash\b/.test(requirement)) throw new Error('The signature does not have a stable designated requirement.');

  const installed = '/Applications/cue.app';
  const nextInstall = '/Applications/.cue-install-next.app';
  if (fs.existsSync(nextInstall)) fs.rmSync(nextInstall, { recursive: true });
  run('/bin/cp', ['-cR', bundle, nextInstall]);
  run('codesign', ['--verify', '--deep', '--strict', nextInstall]);
  if (fs.existsSync(installed)) {
    run('codesign', ['--verify', '--deep', '--strict', installed]);
    const backup = path.join(root, '.cache', 'cue-before-install.app');
    // APFS clones preserve a rollback copy without duplicating Electron's large
    // framework on disk. This path contains only this installer's prior backup.
    if (fs.existsSync(backup)) fs.rmSync(backup, { recursive: true });
    run('/bin/cp', ['-cR', installed, backup]);
  }
  const stopped = spawnSync('pkill', ['-TERM', '-f', '^/Applications/cue.app/Contents/MacOS/cue$']);
  if (![0, 1].includes(stopped.status)) throw new Error('Could not stop the previous Cue process.');
  if (fs.existsSync(installed)) fs.rmSync(installed, { recursive: true });
  fs.renameSync(nextInstall, installed);
  run('codesign', ['--verify', '--deep', '--strict', installed]);
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify({ identity, requirement }, null, 2) + '\n', { mode: 0o600 });
  run('open', [installed]);
  console.log('Installed Cue with a stable signing identity. Existing grants should survive future installs using this command. The first switch from ad hoc signing needs one macOS permission refresh.');
}

try { main(); } catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
