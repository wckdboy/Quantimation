import {validateEpisode} from './model.js';

// Authored vector layouts and local pose keys; intentionally awkward, never random.
const ink = '#181e23';
const skin = '#a5bd61', shade = '#667f50', rim = '#d9cb79';
const p = (path, fill, extra={}) => ({type:'path',path,fill,stroke:ink,strokeWidth:4,...extra});
const e = (x,y,rx,ry,fill,extra={}) => ({type:'ellipse',x,y,rx,ry,fill,stroke:ink,strokeWidth:3,...extra});
const l = (x,y,x2,y2,stroke=ink,strokeWidth=3) => ({type:'line',x,y,x2,y2,stroke,strokeWidth});
const r = (x,y,width,height,fill,extra={}) => ({type:'rect',x,y,width,height,fill,stroke:ink,strokeWidth:3,...extra});
const poly = (points,fill,extra={}) => ({type:'polygon',points,fill,stroke:ink,strokeWidth:3,...extra});
const g = (id,pivotX,pivotY,children,extra={}) => ({type:'group',id,pivotX,pivotY,children,...extra});
const txt = (x,y,text,fontSize,fill) => ({type:'text',x,y,text,fontSize,fill});
const star = (x,y,size=5) => poly(Array.from({length:10},(_,i)=>{
  const a=i*Math.PI/5, q=i%2?size*.3:size;
  return [x+Math.cos(a)*q,y+Math.sin(a)*q];
}),ink,{strokeWidth:1});

// These are replacement drawings, not stretched copies of one smiling mouth.
// Every lip, tooth and tongue belongs to the same drawing and jaw hinge.
function mouthDrawing(name){
  const tooth='#e7d7a8', gum='#8b5347', cavity='#292127';
  const drawings={
    closed:[
      p('M357 303 Q406 325 459 319 L538 298 L532 318 Q468 347 392 338 L364 327 Z',skin,{strokeWidth:3.5}),
      p('M362 306 Q395 326 428 319 L455 329 L487 317 L535 303','transparent',{strokeWidth:4.5}),
      p('M492 315 L498 327 L508 310 Z',tooth,{strokeWidth:2}),
      p('M395 332 L414 337 M459 337 L478 331','transparent',{stroke:shade,strokeWidth:2}),
      p('M352 303 L357 296 L364 299','transparent',{strokeWidth:2.5})
    ],
    open:[
      p('M359 301 Q409 322 539 298 L529 344 Q477 391 410 370 L378 344 L363 326 Z',skin,{strokeWidth:4}),
      p('M363 305 Q411 330 535 301 L522 335 Q473 375 414 357 L380 336 Z',cavity,{strokeWidth:3}),
      p('M382 315 L391 335 L402 321 L399 317 Z',tooth,{strokeWidth:2}),
      p('M410 323 L411 334 L424 333 L426 325 Z',tooth,{strokeWidth:2}),
      p('M502 310 L512 333 L524 305 Z',tooth,{strokeWidth:2}),
      p('M429 355 Q445 341 459 349 Q476 337 490 348 L479 360 Q452 371 429 355 Z','#ae6660',{strokeWidth:2}),
      p('M456 349 L453 359','transparent',{stroke:gum,strokeWidth:2}),
      p('M407 366 L411 352 L422 371 Z',tooth,{strokeWidth:2}),
      p('M425 374 Q460 386 493 362','transparent',{stroke:shade,strokeWidth:2.5})
    ],
    wide:[
      p('M349 296 Q398 325 462 311 L548 291 L533 346 Q468 388 395 354 L360 331 Z',skin,{strokeWidth:4}),
      p('M354 300 Q401 330 461 317 L543 295 L526 338 Q468 370 402 344 L365 325 Z',cavity,{strokeWidth:3}),
      p('M374 313 L383 331 L395 320 L394 317 Z',tooth,{strokeWidth:2}),
      p('M412 324 L414 340 L430 337 L431 323 Z',tooth,{strokeWidth:2}),
      p('M470 315 L472 327 L484 324 L486 311 Z',tooth,{strokeWidth:2}),
      p('M513 302 L522 326 L532 298 Z',tooth,{strokeWidth:2}),
      p('M414 345 Q425 332 440 340 Q454 328 470 341 L476 353 Q444 367 414 345 Z','#ad605a',{strokeWidth:2}),
      p('M441 340 L438 352','transparent',{stroke:gum,strokeWidth:2}),
      p('M393 354 L399 340 L410 361 Z',tooth,{strokeWidth:2}),
      p('M344 295 L350 287 L361 290 M539 290 L547 283','transparent',{strokeWidth:2.5})
    ],
    round:[
      p('M361 305 Q416 331 490 308 Q506 287 533 291 L553 306 L550 332 L534 350 Q477 375 403 347 L370 331 Z',skin,{strokeWidth:4}),
      p('M509 302 Q531 295 546 309 L543 330 Q526 345 509 331 L499 317 Z',cavity,{strokeWidth:3}),
      p('M511 330 Q522 319 539 328 L534 337 L519 337 Z','#a95d56',{strokeWidth:1.5}),
      p('M493 307 Q501 294 510 296 M498 340 Q517 354 534 345','transparent',{stroke:shade,strokeWidth:3}),
      p('M382 334 Q419 351 458 351','transparent',{stroke:shade,strokeWidth:2.5}),
      p('M366 306 L358 301 L354 308','transparent',{strokeWidth:2.5})
    ],
    teeth:[
      p('M356 300 Q416 321 539 296 L534 324 Q466 357 385 339 L363 324 Z',skin,{strokeWidth:4}),
      p('M362 305 Q421 326 535 300 L528 321 Q459 349 377 329 Z',tooth,{strokeWidth:3}),
      p('M414 321 L416 338 L431 338 L431 323 Z','#bfa461',{strokeWidth:1.5}),
      p('M367 315 L398 327 L428 321 L454 334 L487 319 L532 311','transparent',{strokeWidth:2.5}),
      p('M388 315 L385 330 M410 321 L407 338 M438 323 L438 341 M462 320 L467 334 M488 313 L493 326 M513 306 L516 319','transparent',{strokeWidth:2}),
      p('M390 342 L413 347 M470 344 L491 335','transparent',{stroke:shade,strokeWidth:2.5}),
      p('M349 299 L354 290 L364 293 M537 296 L543 288','transparent',{strokeWidth:2.5})
    ],
    smirk:[
      p('M357 303 Q415 330 541 291 L529 318 Q468 356 390 340 L364 327 Z',skin,{strokeWidth:4}),
      p('M365 307 Q415 333 537 296 L520 325 Q460 346 398 327 Z',cavity,{strokeWidth:3}),
      p('M386 317 L391 332 L400 322 Z',tooth,{strokeWidth:2}),
      p('M502 307 L511 329 L522 302 Z',tooth,{strokeWidth:2}),
      p('M455 336 Q467 326 482 331 L480 339 Z','#a35b56',{strokeWidth:1.5}),
      p('M394 340 Q421 350 450 346','transparent',{stroke:shade,strokeWidth:2.5}),
      p('M349 301 L356 295 L364 298 M535 292 L542 283 L549 287','transparent',{strokeWidth:2.5})
    ],
    snarl:[
      p('M352 300 L379 297 Q432 319 488 292 L538 288 L542 329 Q484 381 403 352 L365 331 Z',skin,{strokeWidth:4}),
      p('M357 304 L379 303 Q433 325 488 298 L534 294 L532 325 Q468 365 403 343 L369 326 Z',cavity,{strokeWidth:3}),
      p('M376 307 L385 335 L398 315 Z',tooth,{strokeWidth:2}),
      p('M410 320 L413 332 L429 333 L431 321 Z',tooth,{strokeWidth:2}),
      p('M478 304 L489 331 L499 298 Z',tooth,{strokeWidth:2}),
      p('M513 297 L522 322 L532 292 Z',tooth,{strokeWidth:2}),
      p('M421 348 Q442 337 458 346 L473 354 Q451 365 421 348 Z','#a65a53',{strokeWidth:2}),
      p('M398 350 L406 333 L418 355 Z',tooth,{strokeWidth:2}),
      p('M487 349 L493 330 L501 342 Z',tooth,{strokeWidth:2}),
      p('M342 299 L352 287 L367 289 M350 309 L344 318 M530 285 L540 276 L548 280','transparent',{strokeWidth:3})
    ]
  };
  return drawings[name];
}

function face(profile=false){
  return g('head',333,357,[
    // Unequal horns and the long, bony skull do most of the silhouette work.
    p('M290 188 Q272 166 260 140 L234 105 L249 109 L252 89 Q287 110 311 165 Z','#d0be8b'),
    p('M356 176 Q373 143 388 106 L409 74 L401 116 L412 115 Q393 162 387 192 Z','#c6ad7c'),
    l(271,141,284,137,'#786e56',2),l(382,132,399,137,'#786e56',2),
    p(profile
      ?'M287 184 L326 164 Q372 159 398 203 L421 256 L517 257 L548 276 L552 301 L518 321 L419 337 Q371 355 325 322 L292 291 L279 235 Z'
      :'M287 184 L326 164 Q376 159 408 205 L423 250 L516 257 L548 276 L552 301 L516 320 L421 338 Q369 356 325 321 L292 291 L279 235 Z',skin,{strokeWidth:5}),
    p('M287 197 L265 210 L245 198 L251 230 L235 239 L269 270 L292 263 Z',shade),
    p('M293 270 Q303 310 338 324 L373 338 L352 346 L319 326 L289 301 Z',shade,{strokeWidth:0}),
    p('M315 195 Q334 182 354 189 M292 211 L297 251 M322 318 L339 327','transparent',{stroke:rim,strokeWidth:3}),
    ...(profile?[]:[g('eye_far',419,236,[e(419,236,23,30,'#ddd7ad'),g('pupil_far',426,246,[star(426,246,4)])],{role:'eye'}),
      p('M396 219 Q418 208 443 224 L441 241 L396 237 Z',shade,{id:'lid_far',pivotX:419,pivotY:222,strokeWidth:2}),
      p('M396 215 L420 209 L446 217','transparent',{id:'brow_far',pivotX:419,pivotY:217,strokeWidth:4})]),
    // Heavy lids leave a small white opening, instead of a friendly round stare.
    p('M325 219 Q360 199 389 222 L391 255 Q366 286 337 269 Z','#71834e',{strokeWidth:0}),
    g('eye_near',358,236,[e(358,236,31,35,'#e8dfb7'),g('pupil_near',367,249,[star(367,249,5)])],{role:'eye'}),
    p('M327 216 Q353 200 390 220 L389 242 Q355 234 327 231 Z',skin,{id:'lid_near',pivotX:357,pivotY:217,strokeWidth:2.5}),
    p('M324 214 L345 205 L371 213 L394 210','transparent',{id:'brow_near',pivotX:358,pivotY:214,strokeWidth:5}),
    p('M328 266 Q343 282 361 278 L381 267 M332 278 L349 287 L365 282','transparent',{stroke:'#566b45',strokeWidth:2.5}),
    g('cheek',336,294,[p('M320 283 L329 291 L347 287 M319 294 L332 300 L341 297 M307 282 L312 291','transparent',{stroke:'#526a43',strokeWidth:2})]),
    p('M329 200 L342 195 L352 199 M377 199 L390 203','transparent',{stroke:shade,strokeWidth:2}),
    // The nose is long and slightly bent. A warm rim faces the burning street.
    p('M398 257 Q445 264 480 259 L517 266 L541 282 L527 295 L424 293 L405 282',skin,{strokeWidth:3}),
    p('M420 260 L480 263 L518 271 L533 280','transparent',{stroke:rim,strokeWidth:3}),
    e(520,278,5,3,ink,{strokeWidth:0}),e(503,274,4,2.5,ink,{strokeWidth:0}),
    g('jaw',369,321,[g('mouth',377,307,mouthDrawing('closed'),{role:'mouth',variants:['closed','open','wide','round','teeth','smirk','snarl'].map(name=>({name,children:mouthDrawing(name)}))})]),
    p('M359 301 L351 312 M532 295 L543 288 M310 284 L317 294','transparent',{strokeWidth:2.5}),
    e(308,257,3,5,'#546e46',{strokeWidth:0}),e(318,304,3,3,'#546e46',{strokeWidth:0}),
    l(337,329,332,338,'#4d6642',2),l(343,332,340,343,'#4d6642',2)
  ]);
}

function dragon(profile=false){
  const asset = {
    id:profile?'scorch_profile':'scorch', name:'Sir Scorch',kind:'creature',width:720,height:900,
    description:'DRAFT original antihero. Lanky bent-neck dragon with an angular underbite, tiny star pupils under unequal heavy eyelids, scuffed plum coat, dirty shirt and a crooked tie. Seven authored crooked mouth replacements; keyed pupils, cheeks, jaw, head, wings, tail, shoulder, elbow, wrist and finger. '+(profile?'Authored one-eyed profile.':'Authored three-quarter face.'),
    voice:{id:'am_puck',speed:1.06},
    shapes:[
      g('tail',387,672,[
        p('M385 640 Q474 634 489 697 Q493 756 551 752 Q598 749 611 697 L629 660 Q645 739 596 783 Q519 828 466 765 L418 696 Z',shade,{strokeWidth:5}),
        p('M425 667 Q474 676 477 727 Q494 798 563 778','transparent',{stroke:skin,strokeWidth:5}),
        poly([[610,702],[610,657],[650,624],[639,672],[657,675],[631,708]],'#a2ad61'),
        poly([[472,700],[481,677],[492,707],[507,717],[499,737]],'#c1b46c',{strokeWidth:2})
      ]),
      g('wing_far',328,443,[
        p('M328 443 Q243 374 184 240 L159 171 L135 291 Q113 345 72 336 L110 410 Q163 389 177 465 Q214 420 253 490 Z','#694452',{strokeWidth:5}),
        p('M325 440 L159 171 L177 465 M159 173 L110 410 M159 177 L250 489','transparent',{stroke:'#302630',strokeWidth:5}),
        p('M153 210 L144 284 L123 328','transparent',{stroke:'#a96566',strokeWidth:3}),
        p('M171 382 L184 373 L190 397 L181 405 Z','#283b3d',{strokeWidth:2})
      ]),
      g('wing_near',413,461,[
        p('M413 461 Q488 365 576 223 L594 182 L614 294 Q635 349 680 342 L648 421 Q597 399 583 478 Q532 443 500 516 Z','#975a58',{strokeWidth:5}),
        p('M415 462 L594 182 L583 478 M593 185 L648 421 M591 185 L501 515','transparent',{stroke:'#3c2d37',strokeWidth:5}),
        p('M602 226 L613 295 Q635 351 671 350','transparent',{stroke:'#c68269',strokeWidth:3}),
        p('M579 393 L592 375 L600 402 L589 412 Z','#263c3d',{strokeWidth:2}),
        p('M618 408 L626 391 L635 404','transparent',{stroke:'#cd9275',strokeWidth:2})
      ]),
      g('leg_far',393,668,[
        p('M374 650 L409 657 L446 753 L423 838 L455 852 L473 872 L412 877 L396 866 L413 758 L375 706 Z',shade,{strokeWidth:5}),
        p('M415 846 L431 850 L426 872 L450 872 L455 861 L469 871','transparent',{stroke:'#c7c083',strokeWidth:3})
      ]),
      g('leg_near',320,674,[
        p('M298 653 L337 672 L319 766 L291 851 L322 858 L340 877 L267 881 L252 869 L279 760 Z',skin,{strokeWidth:5}),
        p('M279 763 L300 767 L274 852 L258 868',shade,{strokeWidth:0}),
        p('M268 863 L281 863 L279 879 M300 863 L308 876 M316 862 L328 876','transparent',{stroke:'#ddd09b',strokeWidth:3})
      ]),
      // A long neck over a narrow slumped torso replaces the round mascot body.
      p('M309 345 L365 324 Q383 360 366 408 L394 447 L414 530 L395 683 L312 691 L290 551 L299 453 L323 406 Z',skin,{strokeWidth:5}),
      p('M310 350 L328 346 L341 405 L324 457 L316 537 L322 665 L309 672 L293 548 L302 450 L320 404 Z',shade,{strokeWidth:0}),
      p('M347 366 Q361 382 350 408 L374 450 L377 565 L358 642 L334 580 L329 463 L342 416 Z','#c5b875',{strokeWidth:2}),
      l(341,397,355,400,'#8c8f55',2),l(334,422,357,427,'#8c8f55',2),l(334,448,372,453,'#8c8f55',2),
      g('coat',348,486,[
        p('M294 443 L327 432 L333 508 L319 589 L334 664 L315 721 L303 701 L290 719 L277 672 L285 552 L272 489 Z','#45323e',{strokeWidth:4}),
        p('M369 433 L399 447 L431 524 L406 615 L426 697 L403 686 L401 716 L377 696 L368 599 L381 524 Z','#3a303c',{strokeWidth:4}),
        p('M294 443 L327 432 L318 483 L326 501 L307 539 L299 472 Z','#765052',{strokeWidth:2}),
        p('M371 436 L398 450 L385 487 L398 500 L376 543 L383 478 Z','#68464e',{strokeWidth:2}),
        p('M288 620 L302 615 L311 635 L294 642 Z','#725757',{strokeWidth:2}),
        l(289,625,309,629,'#b09677',2),l(295,619,298,639,'#b09677',2),
        l(394,650,407,663,'#98736a',2),l(396,660,407,651,'#98736a',2),
        e(381,564,3,4,'#bc9464',{strokeWidth:1})
      ]),
      // The off hand hangs in a pocket. Its asymmetry supports the silhouette.
      g('hand_far',292,498,[
        p('M283 478 Q244 521 255 578 L285 605 L302 579 L279 563 L300 503 Z','#493742',{strokeWidth:4}),
        p('M277 564 L294 569 L306 591 L296 609 L283 604 L289 592 L278 585 Z',shade,{strokeWidth:3}),
        l(291,580,297,593,'#364c38',2)
      ]),
      // Hierarchical shoulder -> elbow -> wrist -> finger, each with a real pivot.
      g('shoulder',398,466,[
        p('M389 447 Q417 444 430 478 L457 541 L439 559 L410 526 L382 479 Z','#45323e',{strokeWidth:4}),
        p('M412 464 L421 480 L445 538','transparent',{stroke:'#806064',strokeWidth:3}),
        g('forearm',447,544,[
          p('M436 535 L454 534 L493 509 L511 520 L474 563 Q454 579 438 560 Z',skin,{strokeWidth:4}),
          p('M445 558 L463 560 L500 524','transparent',{stroke:shade,strokeWidth:4}),
          g('wrist',503,516,[
            p('M492 507 L508 489 L533 480 L549 486 L546 499 L525 500 L531 517 L519 532 L500 532 Z',skin,{strokeWidth:3}),
            p('M526 501 L547 509 L545 518 L528 518 L542 525 L537 535 L516 529','transparent',{strokeWidth:3}),
            g('index_finger',519,495,[p('M515 488 L526 478 L562 468 L570 474 L565 482 L534 491 L523 503 Z',skin,{strokeWidth:3}),l(548,475,551,484,shade,2)]),
            p('M503 515 L513 510 L520 516 L512 525','transparent',{strokeWidth:2})
          ])
        ])
      ]),
      g('tie',350,460,[p('M335 455 L351 449 L364 462 L350 479 L362 539 L346 557 L334 541 L341 479 Z','#b16b48',{strokeWidth:3}),l(337,522,358,514,'#673d36',3),l(340,543,360,533,'#673d36',3)]),
      face(profile)
    ]
  };
  const planted = new Set(['tail','leg_far','leg_near']);
  asset.shapes = [
    ...asset.shapes.filter(shape=>planted.has(shape.id)),
    g('torso',350,680,asset.shapes.filter(shape=>!planted.has(shape.id)))
  ];
  return asset;
}

function windows(points,color='#b69b64'){
  return points.map(([x,y,w=18,h=34])=>({type:'group',children:[
    p(`M${x} ${y} L${x+w} ${y-w*.12} L${x+w+1} ${y+h-w*.12} L${x-2} ${y+h+2} Z`,color,{strokeWidth:2}),
    p(`M${x} ${y} L${x+4} ${y+3} L${x+3} ${y+h-1} L${x-2} ${y+h+2} Z`,'#353b39',{strokeWidth:0}),
    p(`M${x+3} ${y+h*.57} L${x+w} ${y+h*.57-w*.12}`,'transparent',{stroke:'#74674e',strokeWidth:Math.max(1,w*.055)})
  ]}));
}
function street(burned=false){
  const s=[r(-160,-160,1600,1040,'#203a3d',{strokeWidth:0}),
    p('M0 0 L1280 0 L1280 308 Q827 259 463 397 L0 360 Z','#29494a',{strokeWidth:0}),
    e(998,139,68,70,'#c8b77f',{stroke:'#476264',strokeWidth:3}),
    p('M955 111 Q1003 91 1056 120 Q1018 132 968 130 Z','#6b8071',{strokeWidth:0}),
    p('M889 167 Q996 154 1121 183 L1099 193 L916 184 Z','#355557',{strokeWidth:0}),
    p('M258 172 Q350 146 448 171 L494 183 Q398 177 305 191 Z','#355456',{strokeWidth:0}),
    p('M535 254 Q628 229 737 241 L788 256 Q681 249 591 267 Z','#3b5b59',{strokeWidth:0})];
  for(let i=0;i<11;i++){
    const x=330+i*75,y=290+(i%4)*19;
    s.push(p(`M${x} 458 L${x} ${y} L${x+20} ${y-30} L${x+30} ${y-11} L${x+35} ${y-44} L${x+59} ${y+4} L${x+64} 458 Z`,'#345357',{stroke:'#2a4549',strokeWidth:2}));
    if(i%2===0)s.push(...windows([[x+20,y+39,8,12],[x+40,y+56,7,11]],'#738276'));
  }
  // Near buildings converge towards the small, crooked street at the horizon.
  s.push(p('M0 493 L605 413 L760 414 L1280 537 L1280 720 L0 720 Z','#405357',{strokeWidth:0}),
    p('M548 430 L713 424 L1197 720 L191 720 Z',burned?'#4c4e48':'#62645a',{strokeWidth:0}),
    p('M548 430 L536 444 L238 720 L190 720 Z','#243c42',{strokeWidth:0}),
    p('M714 425 L727 426 L1224 720 L1192 720 Z','#859077',{strokeWidth:0}),
    p('M600 480 L621 471 L655 473 L638 485 M528 536 L548 518 L594 522 L574 540 M434 631 L479 593 L548 600 L510 640 M757 555 L782 567 L838 570 M687 463 L705 470 L732 473','transparent',{stroke:'#8a8b70',strokeWidth:2}),
    p('M539 442 L552 429 L713 424 L736 439 L711 442 L559 447 Z','#818577',{strokeWidth:0}),
    p('M242 677 L280 647 L333 653 L302 686 Z','#6d7061',{strokeWidth:0}),
    p('M889 625 L928 646 L1034 659 L1001 639 Z','#747260',{strokeWidth:0}));
  // Curb seams grow towards the lens; the road now carries the same perspective.
  for(const t of [.15,.29,.45,.63,.81]){
    const y=425+295*t,x=714+483*t;
    s.push(l(x,y,x+7+22*t,y+2,'#2a3c3d',1.5+1.5*t));
    const lx=548-358*t,ly=430+290*t;
    s.push(l(lx,ly,lx+5+29*t,ly-3,'#798273',1.5+1.5*t));
  }
  if(!burned){
    // Left facade: broad foreground, narrow side plane, uneasy overhang.
    s.push(p('M-55 163 L237 129 L295 194 L283 577 L-65 667 Z','#655c5c',{strokeWidth:5}),
      p('M237 129 L332 214 L337 533 L283 577 L295 194 Z','#3a424a',{strokeWidth:4}),
      p('M-71 171 L97 50 L254 116 L314 196 L224 163 Z','#24383d',{strokeWidth:5}),
      p('M8 155 L100 78 L210 132','transparent',{stroke:'#52655f',strokeWidth:3}),
      p('M-26 301 L277 270 L274 286 L-29 321 Z','#343841',{strokeWidth:3}),
      p('M-8 173 L216 152 L239 169 L-10 195 Z','#91806b',{strokeWidth:0,opacity:.45}),
      p('M246 204 L286 202 L276 550 L256 551 Z','#47474b',{strokeWidth:0,opacity:.55}),
      p('M15 176 L39 598 M169 151 L201 583 M-20 467 L282 408','transparent',{stroke:'#35363d',strokeWidth:9}),
      ...windows([[57,201,36,57],[132,190,34,59],[65,342,40,68],[148,329,34,65]],'#c0a476'),
      p('M75 627 L69 507 Q98 468 135 501 L148 609 Z','#202f36',{strokeWidth:4}),
      p('M70 244 L93 239 M147 211 L148 244 M79 367 L101 365','transparent',{stroke:'#695b51',strokeWidth:4}),
      p('M224 317 L213 333 L227 348 L217 366 M27 519 L18 533 L28 545 M249 445 L233 451','transparent',{stroke:'#46454a',strokeWidth:2}),
      p('M370 280 L472 244 L515 292 L507 462 L374 512 Z','#71644e',{strokeWidth:4}),
      p('M350 289 L434 203 L486 242 L525 295 L465 279 Z','#34464a',{strokeWidth:4}),
      p('M375 265 L365 215 L389 212 L399 240 Z','#605c53',{strokeWidth:3}),
      p('M369 270 L435 220 L484 257 M394 276 L438 240 L465 263','transparent',{stroke:'#536363',strokeWidth:2}),
      ...windows([[398,312,25,43],[447,296,22,40],[409,392,24,45]],'#cfb777'),
      p('M467 279 L489 477 M379 383 L503 348','transparent',{stroke:'#4b4941',strokeWidth:6}),
      // Right side has different scale and rhythm, not another repeated house row.
      p('M1091 175 L1294 104 L1336 652 L1058 559 Z','#65544e',{strokeWidth:5}),
      p('M1045 218 L1091 175 L1058 559 L1015 516 Z','#3b4245',{strokeWidth:4}),
      p('M1034 221 L1147 77 L1290 88 L1320 143 L1122 168 Z','#2f343b',{strokeWidth:5}),
      p('M1123 171 L1105 565 M1231 135 L1252 614 M1081 365 L1302 391','transparent',{stroke:'#3d3538',strokeWidth:8}),
      p('M1126 179 L1295 144 L1299 165 L1124 197 Z','#9a7857',{strokeWidth:0,opacity:.5}),
      p('M1141 526 L1160 533 L1151 548 L1170 558 M1274 431 L1287 444 L1277 469','transparent',{stroke:'#413c3b',strokeWidth:2}),
      ...windows([[1133,239,33,65],[1210,217,40,75],[1127,411,31,68],[1218,438,40,83]],'#b49058'),
      p('M780 319 L848 297 L883 335 L880 451 L769 433 Z','#6b6a58',{strokeWidth:4}),
      p('M765 324 L812 268 L850 293 L892 339 Z','#36424a',{strokeWidth:4}),
      ...windows([[797,345,15,26],[835,352,16,28]],'#c2ac71'));
  }else{
    s.push(p('M-55 163 L31 151 L20 288 L67 275 L78 418 L113 386 L142 541 L274 499 L280 577 L-65 667 Z','#3c4243',{strokeWidth:5}),
      p('M-24 303 L83 284 L87 314 L-30 340 Z','#232e33',{strokeWidth:4}),
      p('M1094 179 L1152 151 L1140 293 L1180 263 L1201 378 L1244 363 L1296 512 L1336 652 L1058 559 L1081 454 L1110 478 Z','#3b3e3e',{strokeWidth:5}),
      p('M1077 432 L1128 442 L1144 491 L1098 488 Z','#825e48',{strokeWidth:3}));
    for(const [x,y,w] of [[105,606,165],[376,510,152],[813,451,110],[1109,574,200]]){
      s.push(p(`M${x-w/2} ${y} L${x-w*.4} ${y-69} L${x-w*.25} ${y-36} L${x-10} ${y-106} L${x+20} ${y-34} L${x+w*.3} ${y-73} L${x+w*.55} ${y+8} Z`,'#474544',{strokeWidth:4}),
        p(`M${x-w/2} ${y} L${x+5} ${y-27} L${x+w/2} ${y+7} L${x} ${y+22} Z`,'#6d5948',{strokeWidth:3}),
        l(x-w*.3,y-70,x+w*.4,y+2,'#222c30',11),l(x-w*.25,y+10,x+w*.3,y-72,'#283034',8));
    }
    for(let i=0;i<9;i++){const x=320+i*91,y=550+(i%3)*49;s.push(poly([[x,y],[x+18,y-10],[x+40,y+2],[x+25,y+12]],i%2?'#76624c':'#3b4140',{strokeWidth:2}));}
    s.push(p('M57 631 L130 596 L205 613 L243 653 L152 669 Z','#ae693f',{strokeWidth:0,opacity:.18}),
      p('M1009 587 L1088 548 L1172 593 L1210 637 L1118 625 Z','#b57543',{strokeWidth:0,opacity:.2}));
  }
  return {id:burned?'ruins':'city',name:burned?'The punchline, in ruins':'Crooked Bell Street',kind:'environment',width:1280,height:720,
    description:'DRAFT layout: diagonal street in controlled petrol shadows, ochre window light, overlapping crooked architecture and distant silhouettes. Empty streets, no visible casualties.',shapes:s};
}

const tower={id:'clocktower',name:'The municipal clock tower',kind:'prop',width:240,height:520,
  description:'Crooked stone tower, a rigid prop with a grounded base pivot for the collapse.',shapes:[
    p('M64 124 L179 105 L195 509 L35 513 Z','#96805e',{strokeWidth:5}),
    p('M164 111 L202 142 L218 499 L195 509 L179 105 Z','#554d43',{strokeWidth:4}),
    p('M36 135 L118 27 L183 85 L213 142 L158 118 Z','#3f383e',{strokeWidth:5}),
    p('M107 45 L119 7 L132 34','transparent',{stroke:'#252d32',strokeWidth:5}),
    e(120,193,42,45,'#c5b788',{strokeWidth:4}),l(120,193,113,164),l(120,193,148,207),
    p('M82 142 L165 128 M59 284 L186 274 M48 400 L190 396','transparent',{stroke:'#c5a46c',strokeWidth:5}),
    ...windows([[77,309,22,46],[132,303,22,48]],'#d8b871'),
    p('M86 513 L84 448 Q109 413 137 445 L144 512 Z','#28343a',{strokeWidth:4}),
    p('M167 227 L156 246 L171 260 L159 275 M65 347 L77 363 L69 381','transparent',{stroke:'#5d5147',strokeWidth:3}),
    l(62,469,78,471,'#675945',3),l(152,376,170,374,'#675945',3)
  ]};
const foreground={id:'foreground',name:'Near street silhouette',kind:'prop',width:1280,height:720,
  description:'A dark foreground gutter and hanging tavern sign frame the street without covering the dragon face.',shapes:[
    p('M-20 -20 L50 -20 L69 346 L40 575 L85 720 L-20 740 Z','#16292e',{strokeWidth:0}),
    p('M0 705 L174 677 L222 704 L384 725 L-20 740 Z','#1a2b30',{strokeWidth:0}),
    p('M1185 642 L1231 616 L1241 654 L1300 636 L1300 740 L1157 740 Z','#1b2b30',{strokeWidth:0}),
    l(46,113,156,128,'#192a30',9),l(117,127,118,161,'#192a30',3),
    p('M82 156 L164 166 L161 231 L82 217 Z','#29363a',{stroke:'#132328',strokeWidth:4}),
    p('M105 184 L119 174 L129 189 L142 183 L137 206 L109 202 Z','#7e795e',{strokeWidth:0})
  ]};
const spectator={id:'spectator',name:'The unpaid audience',kind:'character',width:160,height:190,
  description:'An exhausted original town clerk in a crooked nightcap. Crossed arms, heavy lids and a small disgusted stare; ducks and shuts the window before the fire. A silent reaction, not a casualty.',shapes:[
    p('M12 12 L145 5 L151 173 L5 181 Z','#242d33',{stroke:'#252a2f',strokeWidth:5}),
    g('resident',80,144,[
      p('M38 148 L43 107 L70 95 L109 106 L125 148 Z','#b9ab86',{strokeWidth:3}),
      p('M42 115 L76 132 L112 111 L121 128 L81 153 L39 135 Z','#8d9390',{strokeWidth:3}),
      p('M59 132 L87 125 L99 134 L75 143 Z','#a29a8c',{strokeWidth:2}),
      g('resident_head',83,105,[
        p('M49 43 L105 37 L117 62 L114 96 L99 117 L62 109 L44 86 Z','#a2a28c',{strokeWidth:3}),
        p('M47 68 L36 66 L38 81 L49 87 M112 65 L126 60 L121 80 L113 85','#8b9583',{strokeWidth:2}),
        e(66,73,15,18,'#dcd4b1',{role:'eye',pivotX:66,pivotY:73,strokeWidth:2}),
        e(100,70,13,16,'#dcd4b1',{role:'eye',pivotX:100,pivotY:70,strokeWidth:2}),
        e(73,79,2,3,ink,{strokeWidth:0}),e(106,75,2,3,ink,{strokeWidth:0}),
        g('resident_lids',84,64,[p('M50 60 L80 65 L80 76 L51 72 Z','#8c9780',{strokeWidth:2}),p('M87 63 L113 54 L113 68 L87 72 Z','#8c9780',{strokeWidth:2})]),
        p('M83 75 L77 91 L91 93','transparent',{strokeWidth:2}),
        p('M68 102 Q85 94 103 100','transparent',{strokeWidth:3}),
        p('M44 46 L54 26 L83 7 L113 29 L127 36 L103 40 L91 26 L84 46 Z','#496264',{strokeWidth:3}),
        p('M44 45 L108 36 L111 48 L47 56 Z','#779088',{strokeWidth:2}),
        e(128,37,7,8,'#a5af98',{strokeWidth:2})
      ])
    ]),
    g('shutter',80,90,[p('M21 19 L139 13 L143 156 L18 164 Z','#59615a',{strokeWidth:3}),l(25,41,134,30,'#333e3d',4),l(23,82,138,73,'#333e3d',4),l(21,126,141,113,'#333e3d',4),l(39,30,119,147,'#333e3d',6)]),
    p('M6 151 L152 143 L158 170 L0 181 Z','#8f8065',{strokeWidth:4}),
    l(13,158,143,151,'#b5a382',3)
  ]};
const fire={id:'fire',name:'Ragged fire tongues',kind:'effect',width:220,height:290,description:'Three keyed flame tongues rise from a fixed ground contact. No whole-flame floating.',shapes:[
  g('flame_outer',110,282,[p('M22 281 Q-2 215 47 166 L40 213 Q89 172 78 105 L104 127 L134 29 Q126 114 169 146 L184 120 Q206 184 177 216 L206 202 Q221 246 194 282 Z','#c64c31',{stroke:'#582f30',strokeWidth:3})]),
  g('flame_inner',110,282,[p('M44 281 Q36 232 86 193 L91 146 Q119 171 127 115 Q144 205 173 211 Q193 247 166 284 Z','#f5923d',{strokeWidth:0})]),
  g('flame_core',110,282,[p('M79 281 Q66 247 110 216 L121 184 Q116 242 148 252 L145 283 Z','#ffdc7e',{strokeWidth:0})])
]};
const smoke={id:'smoke',name:'Wind-sheared smoke',kind:'effect',width:350,height:400,description:'Flat graphic smoke curls drift sideways with staggered keyed growth.',shapes:[
  p('M137 396 Q189 321 123 269 Q88 237 140 207 Q189 172 138 141 Q98 110 133 81 Q173 29 230 67 Q297 33 320 88 Q345 141 272 159 Q324 212 265 242 Q233 268 245 305 L200 398 Z','#283438',{stroke:'#203034',strokeWidth:2}),
  p('M132 84 Q169 52 204 81 Q213 120 164 121 M252 173 Q299 196 270 225 M144 258 Q190 243 204 281','transparent',{stroke:'#52605a',strokeWidth:3})
]};
const breath={id:'breath',name:'The fire-away punchline',kind:'effect',width:600,height:200,description:'Directional flame with a fixed mouth origin at local 4,100; nested tongues have independently keyed scale.',shapes:[
  g('jet_outer',4,100,[p('M4 100 Q84 86 115 58 L149 66 L192 28 L204 59 Q255 17 291 41 L278 73 L336 58 L392 21 L383 70 L454 44 L476 76 L560 70 L526 104 L594 132 L521 145 L493 180 L444 149 L404 174 L350 142 L321 163 L275 132 L237 150 L180 121 L127 134 Q74 108 4 100 Z','#d15435',{stroke:'#723c34',strokeWidth:3})]),
  g('jet_inner',4,100,[p('M4 100 L117 85 L154 91 L205 62 L196 91 L270 82 L322 63 L309 102 L399 81 L384 116 L491 119 L412 139 L354 124 L312 137 L256 114 L220 127 L158 110 Q78 106 4 100 Z','#ffad4b',{strokeWidth:0}),p('M4 100 Q105 89 230 100 L281 109 L210 117 L139 109 Z','#ffe7a1',{strokeWidth:0})])
]};
const dust={id:'dust',name:'Collapse dust',kind:'effect',width:420,height:230,description:'A brief expanding impact cloud with a sharply timed settle.',shapes:[
  p('M9 216 Q-10 167 56 152 Q22 102 89 93 Q121 39 168 84 Q191 17 247 66 Q314 36 330 112 Q390 98 386 164 Q426 165 409 216 Z','#9c8a70',{stroke:'#514c43',strokeWidth:3}),
  p('M40 185 Q67 149 109 174 M145 164 Q183 134 211 164 M263 180 Q298 142 344 176','transparent',{stroke:'#c1ad87',strokeWidth:3}),
  poly([[77,101],[92,59],[117,78],[109,112]],'#7c674e'),poly([[305,78],[324,39],[345,70],[332,92]],'#a08b66')
]};

const track=(target,keyframes)=>({target,keyframes});
const rot=(target,keys)=>track(target,keys.map(([t,rotation,easing])=>({t,rotation,easing:easing||'smooth'})));
const prop=(id,assetId,x,y,scale=1,extra={})=>({id,assetId,x,y,scale,motion:'still',keyframes:[],tracks:[],...extra});
const actor=(id,profile=false,extra={})=>prop(id,profile?'scorch_profile':'scorch',470,672,.68,extra);
const front=()=>prop('foreground','foreground',640,720);
const bell=(extra={})=>prop('tower','clocktower',932,571,.86,extra);
const audience=(duck=false)=>prop('audience','spectator',193,430,.75,{tracks:[
  track('shutter',duck?[{t:0,opacity:0},{t:5.42,opacity:0},{t:5.49,opacity:1}]:[{t:0,opacity:0}]),
  track('resident',duck?[{t:0,y:0,opacity:1},{t:5.16,y:0,opacity:1},{t:5.4,y:58,opacity:.5},{t:5.48,y:58,opacity:0}]:[{t:0,y:0}]),
  rot('resident_head',duck?[[0,4],[4.98,4],[5.16,-8],[5.3,-3]]:[[0,0],[5.85,0],[6.05,7],[6.2,4],[6.45,4],[6.65,-3],[6.9,4],[7.2,3]]),
  track('resident_lids',duck?[{t:0,y:4},{t:4.98,y:4},{t:5.16,y:-8}]:[{t:0,y:0},{t:5.85,y:0},{t:6.1,y:4}])
]});

function flameTracks(end,offset=0){
  const keys=[];
  for(let t=0;t<=end+.01;t+=.28){
    const n=keys.length+offset;
    keys.push({t:Math.min(end,Number(t.toFixed(2))),scaleX:1+Math.sin(n*1.9)*.055,scaleY:.93+Math.sin(n*1.3)*.12,rotation:Math.sin(n*.9)*3,easing:'linear'});
  }
  return [track('flame_outer',keys),track('flame_inner',keys.map((k)=>({...k,scaleX:2-k.scaleX,scaleY:2-k.scaleY}))),track('flame_core',keys.map(k=>({...k,rotation:-k.rotation})))];
}
function destruction(duration,on=0){
  const spots=[[137,608,.8],[391,510,.5],[799,454,.42],[1090,570,.75],[1205,637,.6]];
  const fires=spots.map(([x,y,scale],i)=>{
    const start=on?on+i*.13:0;
    return prop('fire_'+i,'fire',x,y,scale,{tracks:flameTracks(duration,i),keyframes:on?[{t:0,opacity:0},{t:start,opacity:0,scale:scale*.2},{t:start+.2,opacity:1,scale},{t:start+.5,scale:scale*1.15},{t:start+.85,scale}]:[]});
  });
  const clouds=spots.map(([x,y,scale],i)=>{
    const start=on?on+.3+i*.13:0;
    return prop('smoke_'+i,'smoke',x+12,y-90*scale,scale*.9,{keyframes:[{t:0,opacity:on?0:.8},{t:start,opacity:on?0:.8},{t:Math.min(duration,start+.7),opacity:.8},{t:duration,x:x+70,y:y-160*scale,scale:scale*1.05}]});
  });
  return [...clouds,...fires];
}

const introTracks=[
  track('mouth',[{t:0,variant:'closed'},{t:.55,variant:'auto'},{t:4.05,variant:'closed'},{t:4.22,variant:'snarl'},{t:4.45,variant:'auto'},{t:5.8,variant:'smirk'}]),
  track('pupil_near',[{t:0,x:0},{t:3.9,x:0},{t:4.2,x:-3},{t:5.8,x:-3},{t:6.05,x:-9},{t:6.4,x:-7}]),
  track('cheek',[{t:0,y:0},{t:4.1,y:0},{t:4.3,y:-3},{t:4.55,y:-1},{t:5.8,y:-1},{t:6,y:-3}]),
  rot('torso',[[0,0],[4.15,0],[4.45,1.5],[4.7,1],[5.9,1],[6.2,0],[6.5,-1],[6.9,0]]),
  rot('head',[[0,5],[.45,5],[.7,-3],[.9,-1],[2.3,-1],[2.55,3],[3.6,3],[3.86,0],[4.2,0],[4.42,-9],[4.56,-6],[5.85,-6],[6.08,1],[6.25,0],[8.2,0]]),
  rot('shoulder',[[0,8],[1.2,8],[1.45,-9],[1.6,-6],[3.7,-6],[4.15,4],[4.45,-18],[4.58,-14],[5.8,-14],[6.1,8],[6.35,6],[8.2,6]]),
  rot('forearm',[[0,12],[1.22,12],[1.48,-24],[1.65,-18],[3.6,-18],[4.15,8],[4.45,-32],[4.58,-25],[5.8,-25],[6.15,14],[6.35,10]]),
  rot('wrist',[[0,0],[1.35,0],[1.55,-18],[1.7,-12],[3.6,-12],[4.2,7],[4.48,-20],[4.65,-14],[5.9,-14],[6.25,0]]),
  rot('index_finger',[[0,15],[1.35,15],[1.56,-5],[1.72,0],[3.7,0],[4.27,10],[4.48,-9],[4.6,-3],[6,-3],[6.3,15]]),
  rot('wing_near',[[0,7],[.7,4],[3.9,4],[4.3,11],[4.55,2],[4.8,4],[6.2,4],[6.55,-11],[6.85,-6],[8.2,-6]]),
  rot('wing_far',[[0,-9],[.7,-6],[6.3,-6],[6.6,8],[6.95,4],[8.2,4]]),
  rot('tail',[[0,-3],[1.5,0],[4.2,0],[4.5,-7],[5,-3],[6.5,3],[7.3,0],[8.2,0]]),
  rot('tie',[[0,1],[1.6,1],[4.45,-8],[4.7,5],[5,0],[6.55,8],[6.8,-3],[7.1,0]]),
  track('lid_near',[{t:0,y:0},{t:3.95,y:0},{t:4.25,y:7},{t:4.5,y:4},{t:5.9,y:4},{t:6.2,y:0}]),
  rot('brow_near',[[0,0],[4.1,0],[4.4,-8],[4.6,-5],[5.9,-5],[6.2,0]]),
  rot('jaw',[[0,0],[3.9,0],[4.15,-2],[4.45,1],[5.9,1],[6.2,0]])
];
const breathTracks=[
  track('mouth',[{t:0,variant:'closed'},{t:.25,variant:'auto'},{t:2.95,variant:'smirk'},{t:3.25,variant:'auto'},{t:4.98,variant:'smirk'},{t:5.12,variant:'snarl'},{t:5.36,variant:'teeth'},{t:5.74,variant:'round'},{t:7.82,variant:'teeth'},{t:8.12,variant:'smirk'}]),
  track('pupil_near',[{t:0,x:0},{t:3,x:0},{t:3.25,x:5},{t:5.15,x:5},{t:5.5,x:2},{t:5.78,x:5},{t:7.8,x:5},{t:8.15,x:0}]),
  track('cheek',[{t:0,y:0},{t:5,y:0},{t:5.36,y:-5},{t:5.75,y:-2},{t:7.8,y:-2},{t:8.1,y:0}]),
  rot('torso',[[0,0],[5,0],[5.4,-4],[5.6,-5],[5.76,0],[7.72,0],[7.94,1.5],[8.2,0]]),
  rot('head',[[0,0],[.35,-4],[.5,-2],[2.9,-2],[3.2,-7],[3.4,-4],[5,-4],[5.25,-10],[5.55,-13],[5.76,0],[6,0],[7.72,0],[7.9,3],[8.15,0],[10.3,0]]),
  rot('shoulder',[[0,3],[.5,-10],[.7,-7],[2.95,-7],[3.2,-25],[3.42,-20],[4.95,-20],[5.35,17],[5.7,20],[5.85,3],[6.05,6],[7.7,6],[8,11],[8.3,8]]),
  rot('forearm',[[0,8],[.45,-13],[.7,-9],[3,-9],[3.25,-35],[3.45,-28],[5,-28],[5.55,27],[5.83,10],[6,13],[7.7,13],[8.2,6]]),
  rot('wrist',[[0,0],[3.05,0],[3.28,-15],[3.5,-9],[5,-9],[5.5,18],[5.8,0],[8.2,0]]),
  rot('index_finger',[[0,14],[3.05,14],[3.3,-6],[3.5,0],[5,0],[5.4,20],[5.8,12]]),
  rot('wing_near',[[0,4],[5,4],[5.4,17],[5.6,20],[5.82,-26],[6.05,-18],[7.65,-18],[7.9,-6],[8.2,-3],[8.6,4]]),
  rot('wing_far',[[0,-5],[5,-5],[5.45,-18],[5.65,-22],[5.85,21],[6.06,15],[7.65,15],[8.1,1],[8.5,-5]]),
  rot('tail',[[0,0],[5,0],[5.5,10],[5.75,-12],[6.1,-7],[7.7,-7],[8.1,4],[8.5,0]]),
  rot('tie',[[0,0],[5.25,0],[5.6,13],[5.87,-18],[6.1,-10],[7.7,-10],[8.1,7],[8.4,0]]),
  rot('jaw',[[0,0],[5,0],[5.3,-3],[5.6,-3],[5.74,0],[7.82,0],[7.95,-2],[8.15,0]]),
  track('lid_near',[{t:0,y:0},{t:5,y:0},{t:5.5,y:9},{t:5.8,y:5},{t:7.75,y:5},{t:8.05,y:0}]),
  rot('brow_near',[[0,0],[3,-3],[3.5,-3],[5,0],[5.5,12],[5.8,9],[7.7,9],[8.2,0]])
];
const collapseTracks=[
  track('mouth',[{t:0,variant:'closed'},{t:.35,variant:'auto'},{t:3.18,variant:'smirk'},{t:3.75,variant:'auto'},{t:5.75,variant:'smirk'},{t:6.75,variant:'round'},{t:7.5,variant:'snarl'},{t:7.8,variant:'smirk'}]),
  track('pupil_near',[{t:0,x:0},{t:3.5,x:0},{t:3.75,x:3},{t:6.6,x:3},{t:6.8,x:7,y:-3},{t:7.35,x:7,y:-3},{t:7.6,x:-4,y:0},{t:7.9,x:-2}]),
  track('cheek',[{t:0,y:0},{t:6.6,y:0},{t:6.85,y:3},{t:7.4,y:3},{t:7.65,y:-4},{t:8,y:-2}]),
  rot('torso',[[0,0],[3.45,0],[3.75,2],[3.95,1],[5.8,1],[6.15,-1.5],[6.35,0],[7.5,0],[7.8,-1],[8.1,0]]),
  rot('head',[[0,-3],[.4,-3],[.65,2],[2.7,2],[3,-2],[3.5,-2],[3.75,-8],[3.95,-5],[5.7,-5],[6.1,3],[6.3,0],[6.65,0],[6.85,8],[7.05,5],[7.4,5],[7.65,-4],[7.85,-2],[10.1,-2],[10.45,0],[11.5,0]]),
  rot('shoulder',[[0,6],[.7,-8],[.9,-5],[2.8,-5],[3.45,5],[3.72,-27],[3.9,-21],[5.8,-21],[6.15,5],[6.35,3],[7.4,3],[7.65,-12],[7.85,-7],[9.3,-7],[9.6,7],[9.85,4]]),
  rot('forearm',[[0,14],[.7,-27],[.95,-20],[2.8,-20],[3.4,8],[3.75,-33],[3.95,-26],[5.8,-26],[6.15,16],[6.35,10],[7.4,10],[7.7,-35],[7.9,-29],[9.3,-29],[9.7,13],[9.9,8]]),
  rot('wrist',[[0,0],[.7,-9],[1,-5],[3.4,5],[3.75,-18],[4,-12],[5.8,-12],[6.3,0],[7.5,0],[7.75,-29],[8,-22],[9.3,-22],[9.8,0]]),
  rot('index_finger',[[0,14],[.7,5],[3.45,5],[3.75,-6],[4,-2],[5.8,-2],[6.3,17],[7.5,17],[7.75,32],[8,25],[9.4,25],[9.8,14]]),
  rot('wing_near',[[0,4],[.65,-2],[1,1],[3.45,1],[3.75,-7],[4,-4],[6,-4],[6.2,-10],[6.4,-4],[7.5,-4],[7.8,-12],[8,-7],[9.5,-7],[9.9,4]]),
  rot('wing_far',[[0,-5],[.65,1],[1,-3],[3.5,-3],[3.75,6],[4,3],[6,3],[6.2,10],[6.4,5],[7.5,5],[7.85,11],[8,7],[9.5,7],[10,-5]]),
  rot('tail',[[0,0],[3.5,0],[3.8,-7],[4.2,-3],[6,-3],[6.25,7],[6.5,2],[8,2],[9,-2],[10,0]]),
  rot('tie',[[0,0],[3.6,0],[3.8,-10],[4.1,5],[4.4,0],[6.15,0],[6.35,8],[6.6,-4],[6.9,0]]),
  track('lid_near',[{t:0,y:0},{t:6.6,y:0},{t:6.82,y:-12},{t:7.05,y:-8},{t:7.45,y:-8},{t:7.7,y:6},{t:8,y:4}]),
  track('lid_far',[{t:0,y:0},{t:6.6,y:0},{t:6.82,y:-8},{t:7.05,y:-5},{t:7.45,y:-5},{t:7.7,y:4}]),
  rot('brow_near',[[0,0],[6.6,0],[6.82,-13],[7.05,-8],[7.45,-8],[7.7,6],[8,3]]),
  rot('jaw',[[0,0],[6.6,0],[6.85,5],[7.1,3],[7.45,3],[7.7,-3],[8,-1]])
];

export function dragonEpisode(){
  return validateEpisode({
    version:1,title:'DRAFT — Sir Scorch: A Burning Talent',genre:'Adult fantasy comedy / animation draft',
    logline:'A bitter dragon works three terrible jokes into a municipal demolition. Authored animation draft; voice performance remains provisional.',
    style:'Deliberately awkward adult cartoon. Controlled squiggly hand-drawn ink, angular asymmetrical shapes, tiny star pupils and heavy lids. Petrol night shadows, dusty ochre light and hot vermilion fire. Original designs; keyed acting with anticipation, action and settle.',
    assets:[dragon(),dragon(true),street(),street(true),tower,foreground,spectator,fire,smoke,breath,dust],
    scenes:[
      {
        id:'arrival',name:'01 / A city with no problems',duration:8.2,environment:'city',background:'#203a3d',
        description:'DRAFT. Begin already in the street, with planted feet. Medium setup, hard cut to the narrowed eyes for the threat. The hand points and settles; wings open after the punchline. No looping camera drift.',
        camera:{zoom:1.06,x:640,y:360},
        shots:[{at:0,label:'Crooked Bell Street',camera:{zoom:1.06,x:640,y:360}},{at:.48,label:'The setup',camera:{zoom:1.5,x:520,y:335}},{at:4.2,label:'A deliberately bad threat',camera:{zoom:2.08,x:517,y:273}},{at:5.95,label:'The unpaid audience',camera:{zoom:2.5,x:275,y:350}}],
        sounds:[{id:'wing_anticipation',type:'whoosh',at:6.48,duration:.5,gain:.15}],
        instances:[bell(),audience(),actor('scorch1',false,{tracks:introTracks}),front()],
        dialogue:[{id:'dragon_1',speaker:'scorch',text:'What do you call a city with absolutely no problems?',at:.55,duration:3.5},{id:'dragon_2',speaker:'scorch',text:'Give me a minute.',at:4.45,duration:1.35}]
      },
      {
        id:'question',name:'02 / Fire away',duration:10.3,environment:'city',background:'#203a3d',
        description:'DRAFT. Authored profile to the target tower. A sharp hand gesture, then inhale, compressed wings and a held anticipation. Unfurl into a connected jet; flames ignite from the impact outward. Camera holds each composition.',
        camera:{zoom:1.06,x:640,y:360},
        shots:[{at:0,label:'The burning question',camera:{zoom:1.45,x:485,y:335}},{at:3.1,label:'Fire away: reveal the target',camera:{zoom:1.06,x:640,y:360}},{at:5.55,label:'Anticipation and release',camera:{zoom:1.12,x:649,y:353,rotation:-2}}],
        sounds:[{id:'breath_inhale',type:'whoosh',at:5.2,duration:.5,gain:.19},{id:'window_shut',type:'impact',at:5.49,duration:.18,gain:.1},{id:'breath_release',type:'fire',at:5.78,duration:2.1,gain:.42},{id:'city_ignition',type:'crackle',at:7.9,duration:1.8,gain:.12}],
        instances:[bell(),audience(true),...destruction(10.3,6.05),actor('scorch2',true,{x:423,tracks:breathTracks}),
          // Tip begins inside the open jaw at local (537,319), with torso held still.
          prop('jet','breath',839.36,376.92,1,{keyframes:[{t:0,opacity:0},{t:5.74,opacity:0},{t:5.8,opacity:1},{t:7.68,opacity:1},{t:7.82,opacity:0}],tracks:[
            track('jet_outer',[{t:0,scaleX:.2,scaleY:.3},{t:5.74,scaleX:.2,scaleY:.3},{t:5.86,scaleX:1,scaleY:1.15},{t:6.05,scaleX:.96,scaleY:1},{t:6.35,scaleX:1.05,scaleY:.92},{t:6.6,scaleX:.97,scaleY:1.08},{t:6.85,scaleX:1.04,scaleY:.93},{t:7.1,scaleX:.99,scaleY:1.07},{t:7.4,scaleX:1.03,scaleY:.94},{t:7.7,scaleX:.94,scaleY:1.02}]),
            track('jet_inner',[{t:0,scaleX:.2,scaleY:.4},{t:5.74,scaleX:.2,scaleY:.4},{t:5.86,scaleX:1,scaleY:.95},{t:6.2,scaleX:.91,scaleY:1.1},{t:6.55,scaleX:1.05,scaleY:.9},{t:6.9,scaleX:.96,scaleY:1.1},{t:7.25,scaleX:1.05,scaleY:.92},{t:7.7,scaleX:.96,scaleY:1}])
          ]}),front()],
        dialogue:[{id:'dragon_3',speaker:'scorch_profile',text:'I told the mayor I had a burning question.',at:.25,duration:2.7},{id:'dragon_4',speaker:'scorch_profile',text:'He said, fire away!',at:3.25,duration:1.73}]
      },
      {
        id:'castle',name:'03 / Bringing the house down',duration:11.5,environment:'ruins',background:'#203a3d',
        description:'DRAFT. Smoldering ruins give the last joke context. Cut wide when the tower falls. A fast glance at the damage briefly breaks the pose; he recovers his awful smirk, then a final wide holds the ruined stage. Feet remain planted throughout.',
        camera:{zoom:1.08,x:640,y:360},
        shots:[{at:0,label:'A completely undeserved hero shot',camera:{zoom:1.45,x:520,y:330}},{at:3.55,label:'Bring the house down',camera:{zoom:1.08,x:640,y:360}},{at:6.65,label:'One flicker of doubt',camera:{zoom:2.08,x:515,y:273}},{at:9.6,label:'The actual review',camera:{zoom:1.08,x:640,y:360}}],
        sounds:[{id:'tower_crack',type:'rumble',at:5.05,duration:1.05,gain:.2},{id:'tower_impact',type:'impact',at:6.13,duration:.85,gain:.48},{id:'final_embers',type:'crackle',at:9.6,duration:1.9,gain:.1}],
        instances:[bell({keyframes:[{t:0,rotation:-3},{t:4.8,rotation:-3},{t:5.05,rotation:3},{t:5.22,rotation:1},{t:5.75,rotation:47,x:948},{t:6.13,rotation:89,x:1000,y:609},{t:6.25,rotation:84,y:599},{t:6.44,rotation:88,y:609}]}),
          ...destruction(11.5),
          prop('impact','dust',1030,635,.8,{keyframes:[{t:0,opacity:0},{t:6.08,opacity:0,scale:.25},{t:6.2,opacity:.94,scale:1.1},{t:6.45,scale:1.3,y:627},{t:7.3,opacity:.7,scale:1.4,y:602},{t:8.1,opacity:0,y:583}]}),
          actor('scorch3',false,{tracks:collapseTracks}),front()],
        dialogue:[{id:'dragon_5',speaker:'scorch',text:'Why did the castle hire me as a comedian?',at:.35,duration:2.83},{id:'dragon_6',speaker:'scorch',text:'Because I bring the house down!',at:3.75,duration:2}]
      }
    ]
  });
}
