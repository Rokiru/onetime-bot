'use strict';
// Public controls only. Adds final parking and deliberate speed classes to the existing driver.
function create(base){return function(s,P,path='detour',tier='gold'){
 if(s.edition===25){if(s.ridge.waiting)s.ridgeContinue();return requireTrial(s,P);}
 let c=base(s,P,path);if(!s.logistics29||s.edition===23)return c;
 const x=s.car.getPosition().x,v=s.car.getLinearVelocity().x,target=s.route.length+6,remaining=target-x;
 if(!s.nextStop()&&remaining<14){if(x>=target-.4)return [false,true];const speed=Math.max(.4,Math.min(2.2,remaining*.45));return v>speed+.12?[false,true]:v>speed-.12?[false,false]:[.35,false];}
 const cap=tier==='bronze'?2.5:tier==='silver'?3.5:Infinity;
 const gap=P.gaps[s.roadId];if(c[0]&&v>cap&&!(gap&&x>gap.from-18&&x<gap.to+5))c=[false,v>cap+.2];return c;
};}
const base=require('./driving-input26.cjs'),trial=require('./driving-input25.cjs');let requireTrial=trial;const input=create(base);input.browserSource='(function(){const requireTrial='+trial.browserSource+';return ('+create.toString()+')('+base.browserSource+');})()';module.exports=input;
