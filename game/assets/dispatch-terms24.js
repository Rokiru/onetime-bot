'use strict';
(function(root){
 const urgent=Object.freeze({edition:24,kind:'urgent',deadline:110,bonus:180,lateFee:80});
 function valid(data,id,edition){return data&&id===1&&edition===20&&data.edition===24&&data.kind==='urgent'&&data.deadline===urgent.deadline&&data.bonus===urgent.bonus&&data.lateFee===urgent.lateFee;}
 function create(kind,id,edition){return kind==='urgent'&&id===1&&edition===20?{...urgent}:null;}
 function adjustment(s){if(!s.dispatchTerms||s.state!=='win')return 0;return s.time>s.dispatchTerms.deadline?-Math.min(s.dispatchTerms.lateFee,Math.round(s.route.reward*s.remaining()/s.route.boxes)):s.remaining()===s.route.boxes?s.dispatchTerms.bonus:0;}
 const api={urgent,valid,create,adjustment};if(typeof module==='object')module.exports=api;else root.DispatchTerms24=api;
})(typeof globalThis!=='undefined'?globalThis:this);
