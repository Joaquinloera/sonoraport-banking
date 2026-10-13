import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const home=readFileSync(new URL('./index.html',import.meta.url),'utf8');
const js=readFileSync(new URL('./tmm-slideshow.js',import.meta.url),'utf8');
const css=readFileSync(new URL('./tmm-slideshow.css',import.meta.url),'utf8');
test('homepage has seven accessible branded TMM + SonoraPort + BRICS image slides',()=>{
 assert.match(home,/TMM SonoraPort BRICS Financial Institution/);
 assert.equal((home.match(/data-tmm-slide(?=[\s>])/g)||[]).length,7);
 assert.equal((home.match(/data-tmm-dot(?=[\s>])/g)||[]).length,7);
 for(const image of ['port-dusk.webp','tmm-banking.webp','brics-markets.webp','port-property.webp','industrial.webp','port-daylight.webp','tmm-law.webp']){
  assert.ok(home.includes('slides/'+image),image);
 }
 for(const anchor of ['#banking','#brics','#port','#industrial','#legal','../global-banking/','../banking-matrix/'])assert.ok(home.includes(anchor),anchor);
 assert.ok(home.includes('tmm-slideshow.css'));
 assert.ok(home.includes('tmm-slideshow.js'));
 assert.ok(home.includes('data-tmm-toggle'));
 assert.ok(home.includes('aria-roledescription="carousel"'));
});
test('slideshow controls are functional and respect accessibility',()=>{
 for(const x of ['setInterval','clearInterval','touchstart','touchend','ArrowRight','ArrowLeft','prefers-reduced-motion','visibilitychange','aria-hidden','aria-current','fallbackTried'])assert.ok(js.includes(x),x);
 assert.ok(css.includes('@media(max-width:760px)'));
 assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'));
});
test('research-only website does not ask customers for a password or claim provider connectivity',()=>{
 assert.ok(!/<input[^>]*type=['"]?password/i.test(home));
 assert.ok(!/sk_live_[A-Za-z0-9]+|-----BEGIN (RSA )?PRIVATE KEY-----/.test(home+js+css));
 assert.ok(home.includes('Ownership and development permissions are subject to independent verification'));
 assert.ok(home.includes('https://sonoraport.com/overview/'));
});

test('TMM Law Firm is an existing division with law-office and protected portal infrastructure, not a proposed concept',()=>{
 assert.ok(home.includes('TMM LAW FIRM · EXISTING LEGAL OFFICE'));
 assert.ok(home.includes('Your existing TMM Law Firm website'));
 assert.ok(home.includes('Private client portal'));
 assert.ok(home.includes('Attorney-controlled operations'));
 assert.ok(home.includes('immigration and detention defense'));
 assert.ok(home.includes('wrongful-conviction review'));
 assert.ok(!home.includes('Legal-services division concept'));
 assert.ok(!home.includes('TMM LAW FIRM · DIVISION CONCEPT'));
 assert.ok(!home.includes('Concept section.'));
 assert.ok(home.includes('do not replace the recovered law portal'));
});
