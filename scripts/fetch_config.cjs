const https = require('https');
const url = require('url');

function fetch(u, redirects = 0) {
  if (redirects > 10) return console.error('too many redirects');
  const uobj = url.parse(u);
  const opts = { hostname: uobj.hostname, path: uobj.path + (uobj.search || ''), method: 'GET', headers: { 'User-Agent': 'node' } };
  const req = https.request(opts, res => {
    if (res.statusCode >= 300 && res.headers.location) {
      console.log('redirect ->', res.headers.location);
      fetch(res.headers.location, redirects + 1);
      return;
    }
    let b = '';
    res.on('data', c => b += c);
    res.on('end', () => {
      console.log('STATUS', res.statusCode);
      console.log(b.slice(0, 1000));
      console.log('\n--- contains Render URL:', b.includes('ecovillagetrails-3.onrender.com'));
    });
  });
  req.on('error', e => console.error('ERROR', e.message));
  req.end();
}

fetch('https://ecovillagetrails-git-main-anishde144-6222s-projects.vercel.app/js/config.js');
