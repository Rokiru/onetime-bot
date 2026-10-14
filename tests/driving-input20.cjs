function create(base){return function(s,P){
 const x=s.car.getPosition().x,v=s.car.getLinearVelocity().x,sector=s.sectors.find(o=>!o.done&&x>o.from-9&&x<o.to+1);
 if(sector&&s.groundCount>0&&!s.nextStop()?.elapsed)return v>2.65?[false,true]:v<2?[true,false]:[false,false];
 return base(s,P);
};}
const base=require('./driving-input18.cjs'),driver=create(base);driver.browserSource='('+create.toString()+')('+base.browserSource+')';module.exports=driver;
