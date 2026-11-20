import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';

const base=path.join(path.dirname(fileURLToPath(import.meta.url)),'dist');
const fonts=['barlow-condensed-latin-600-normal','barlow-condensed-latin-700-normal','barlow-condensed-latin-800-normal','barlow-latin-400-normal','barlow-latin-400-italic','barlow-latin-500-normal','barlow-latin-600-normal','barlow-latin-700-normal'].map(f=>`fonts/${f}.woff2`).concat('fonts/OFL.txt');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8'};
export function createServer(){return http.createServer(async(req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'});res.end();return;}
  let pathname;
  try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);res.end('Invalid URL');return;}
  const allowed=new Set(['index.html','story.html','shift.css','shift-app.mjs','shift-engine.mjs','shift-content.mjs','shift-floor.mjs','shift-art.mjs','styles.css','game.css','v4.css','v4-app.mjs','v4-engine.mjs','v4-game.mjs','v4-world.mjs','v4-ui.mjs','game.mjs','favicon.svg',...fonts]);
  const name=pathname==='/'?'index.html':pathname.slice(1);
  if(!allowed.has(name)){res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found');return;}
  try{
    const body=await readFile(path.join(base,name));
    res.writeHead(200,{'Content-Type':mime[path.extname(name)],'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Content-Length':body.length});
    res.end(req.method==='HEAD'?undefined:body);
  }catch{res.writeHead(500);res.end('Could not load the page.');}
});}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const requestedPort=Number(process.env.PORT??4186);
  if(!Number.isInteger(requestedPort)||requestedPort<0||requestedPort>65535){
    console.error('PORT must be a whole number between 0 and 65535.');
    process.exit(1);
  }
  let port=requestedPort;
  let attempts=0;
  const server=createServer();
  server.on('error',e=>{
    if(e.code==='EADDRINUSE'&&port>0&&port<65535&&attempts<20){
      attempts++;
      port++;
      server.listen(port,'127.0.0.1');
      return;
    }
    console.error(e.code==='EADDRINUSE'?'No free local port was found. Close an earlier website window and try again.':e.message);
    process.exitCode=1;
  });
  server.on('listening',()=>{
    const url=`http://127.0.0.1:${server.address().port}`;
    console.log(`The Next Shift\nLocal: ${url}\nKeep this window open while presenting. Press Ctrl+C to stop.`);
    if(process.argv.includes('--open')){
      const p=spawn('explorer.exe',[url],{stdio:'ignore',windowsHide:true});
      p.on('error',()=>console.log(`Open ${url} in your browser.`));
    }
  });
  server.listen(port,'127.0.0.1');
}
