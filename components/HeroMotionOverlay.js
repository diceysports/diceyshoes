'use client';

export default function HeroMotionOverlay(){
  const paths=[
    'M-80 520 C 120 300, 250 720, 470 445 S 810 230, 1030 470 S 1330 650, 1540 330',
    'M-140 390 C 80 150, 300 560, 520 320 S 850 120, 1080 350 S 1340 520, 1540 210',
    'M-120 650 C 120 430, 300 790, 560 550 S 900 330, 1120 570 S 1370 720, 1570 420',
    'M40 80 C 260 210, 270 450, 530 470 S 890 280, 1050 130 S 1320 90, 1510 310',
    'M-90 215 C 170 80, 320 360, 610 245 S 980 40, 1200 240 S 1420 420, 1600 175'
  ];
  return <div className="heroMotion" aria-hidden="true">
    <div className="heroMotionGlow heroMotionGlowA"/>
    <div className="heroMotionGlow heroMotionGlowB"/>
    <svg className="heroMotionSvg" viewBox="0 0 1440 820" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="dicey-motion-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#cbff3f" stopOpacity="0"/>
          <stop offset="28%" stopColor="#cbff3f" stopOpacity=".72"/>
          <stop offset="62%" stopColor="#3157ff" stopOpacity=".9"/>
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
        </linearGradient>
        <filter id="dicey-motion-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      {paths.map((d,i)=><path key={d} className={`heroMotionPath heroMotionPath${i+1}`} d={d}/>) }
    </svg>
    <div className="heroMotionGrain"/>
  </div>;
}
