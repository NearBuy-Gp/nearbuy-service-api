/* Minimal structured logger for the seeder — phase headers, steps, warnings. */

let currentPhase = 0;

export const log = {
  phase(title: string): void {
    currentPhase += 1;
    console.log(`\n━━━ Phase ${currentPhase}: ${title} ━━━`);
  },
  step(msg: string): void {
    console.log(`   • ${msg}`);
  },
  info(msg: string): void {
    console.log(`ℹ️  ${msg}`);
  },
  ok(msg: string): void {
    console.log(`✅ ${msg}`);
  },
  warn(msg: string): void {
    console.warn(`⚠️  ${msg}`);
  },
  error(msg: string): void {
    console.error(`❌ ${msg}`);
  },
  progress(done: number, total: number, label: string): void {
    if (done === total || done % 25 === 0) {
      console.log(`   … ${done}/${total} ${label}`);
    }
  },
};
