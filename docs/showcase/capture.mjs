// Capture the real local UI. No app source, backend responses or screenshots are mocked.
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile, mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const origin = new URL(process.env.SHOWCASE_URL || 'http://localhost:4314');
if (!['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname)) throw new Error('Use a loopback local server; production capture is intentionally unsupported.');
const out = join(here, 'media');
await mkdir(out, { recursive: true });
const temp = await mkdtemp(join(tmpdir(), 'readme-showcase-'));
const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox']});
const context = await browser.newContext({viewport: {width: 540, height: 960}, deviceScaleFactor: 1, locale: 'en-US', timezoneId: 'UTC', colorScheme: 'dark', reducedMotion: 'reduce', recordVideo: {dir: temp, size: {width: 540, height: 960}}});
const blockedHosts = new Set();
await context.route('**/*', route => {
  const url = new URL(route.request().url());
  if (['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) return route.continue();
  blockedHosts.add(url.hostname);
  return route.abort('blockedbyclient');
});
const page = await context.newPage();
page.setDefaultTimeout(20000);
// Keep time advancing so real attempt IDs and elapsed durations remain distinct.
await page.clock.setSystemTime(new Date('2026-10-30T12:00:00Z'));
const screenshots = [];
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const consoleErrors = [];
page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
const pause = ms => page.waitForTimeout(ms);
const shot = async (name, description) => {
  await pause(700);
  await page.screenshot({path: join(out, `${name}.jpg`), type: 'jpeg', quality: 88});
  screenshots.push({file: `${name}.jpg`, description});
  await pause(1800);
};
const recordingStarted = Date.now();
let trimSeconds;
try {
  await page.goto(new URL('/', origin).href, {waitUntil: 'networkidle', timeout: 90000});
  trimSeconds = (Date.now() - recordingStarted) / 1000;
  // SCENARIO

  await page.getByRole('button',{name:'Try a sample Python lesson immediately'}).waitFor();
  await shot('01-choose-path', 'Career-path onboarding from a fresh local learner profile.');
  await page.getByRole('button',{name:'Try a sample Python lesson immediately'}).click();
  await page.getByRole('button',{name:'Understand step',exact:true}).waitFor();
  await shot('02-lesson', 'First Python lesson: original authored curriculum and guided stepper.');

  await page.getByRole('button',{name:'Experiment step',exact:true}).click();
  await page.getByRole('button',{name:/Run starter code/}).click();
  await page.getByText('Starter output',{exact:true}).waitFor({timeout:90000});
  await pause(1200);
  await page.getByRole('button',{name:'Code Lab step',exact:true}).click();
  await page.getByRole('button',{name:'Run checks',exact:true}).click();
  await page.getByText('checks failed',{exact:true}).waitFor({timeout:90000});
  await page.getByText('checks failed',{exact:true}).evaluate(el=>el.scrollIntoView({block:'start'}));
  await shot('03-failing-check', 'Actual Code Lab check rejects the incomplete shipped starter.');
  await page.getByRole('textbox',{name:'python code editor',exact:true}).fill('print("first run")\n');
  await page.getByRole('button',{name:'Run checks',exact:true}).click();
  await page.getByRole('button',{name:'Run checks again',exact:true}).waitFor({timeout:90000});
  await page.getByLabel('Code Lab check passed',{exact:true}).evaluate(el=>el.scrollIntoView({block:'center'}));
  await shot('04-passing-check', 'Corrected print statement passes the real local Python checks; no fabricated evidence.');


  await pause(1200);
  const video = page.video();
  await context.close();
  const raw = await video.path();
  const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';
  const caption = 'WEB CAPTURE | FRESH LOCAL PROFILE';
  const filter = `scale=540:-2,fps=15,drawbox=x=0:y=ih-36:w=iw:h=36:color=black@0.9:t=fill,drawtext=text='${caption}':fontcolor=white:fontsize=11:x=14:y=h-25`;
  execFileSync(ffmpeg, ['-y','-ss',String(trimSeconds),'-i',raw,'-an','-vf',filter,'-c:v','libx264','-preset','veryfast','-crf','28','-pix_fmt','yuv420p','-movflags','+faststart',join(out,'workflow.mp4')], {stdio:'pipe'});
  const duration = Number(execFileSync('ffprobe', ['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',join(out,'workflow.mp4')], {encoding:'utf8'}).trim());
  const gifSpeed = Math.max(1, duration / 16);
  execFileSync(ffmpeg, ['-y','-i',join(out,'workflow.mp4'),'-filter_complex',`[0:v]setpts=PTS/${gifSpeed},fps=4,scale=540:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96[p];[b][p]paletteuse=dither=bayer:bayer_scale=4`,'-loop','0',join(out,'preview.gif')],{stdio:'pipe'});
  const files = {};
  for (const name of [...screenshots.map(s => s.file), 'workflow.mp4','preview.gif']) {
    const content = await readFile(join(out,name));
    files[name] = {bytes: content.length, sha256: createHash('sha256').update(content).digest('hex')};
  }
  const revision = execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
  await writeFile(join(here,'capture.json'), JSON.stringify({sourceRevision:revision,capturedAt:new Date().toISOString(),browserClockStartedAt:'2026-10-30T12:00:00Z',browser:browser.version(),viewport:{width:540,height:960},origin:origin.origin,externalRequestsBlocked:true,blockedHosts:[...blockedHosts],sampleData:'Fresh local browser learner profile, original shipped curriculum. No AI mentor or backend calls; no manufactured completion or external verification evidence.',workflow:'Open fresh career-path setup; preview the first Python lesson; run starter code; fail the empty starter check; correct print output and pass the real local checks.',videoSeconds:duration,gifPlaybackSpeed:gifSpeed,pageErrors:errors,consoleErrors,screenshots,files},null,2)+'\n');
  if (errors.length) throw new Error(`UI emitted ${errors.length} page error(s); inspect capture.json before publishing.`);
  console.log(`Captured ${screenshots.length} screenshots and ${duration.toFixed(1)}s real UI video at ${revision}`);
} finally {
  await browser.close();
  await rm(temp,{recursive:true,force:true});
}
