// A test driver uses the same public transmission controls available to a player.
// Legacy routes keep their established driving strategy.
function createDriver18(base) {
 return function drivingInput18(s,P) {
  if(s.id>=46&&s.groundCount>0&&s.shiftCooldown<=0){
   const x=s.car.getPosition().x,v=s.car.getLinearVelocity();
   const grade=(P.height(x+4,s.id)-P.height(x,s.id))/4;
   const rocks=(s.route.rocks||[]).some(r=>x>r.x-9&&x<r.x+13);
   const surface=P.surfaceAt(x,s.id).type;
   const low=rocks||grade>.18||surface==='mud';
   if(Math.abs(v.x)<3.4&&low!==s.lowGear)s.setLowGear(low);
  }
  return base(s,P);
 };
}
const base=require('./driving-input17.cjs'),driver=createDriver18(base);
driver.browserSource='('+createDriver18.toString()+')('+base.toString()+')';
module.exports=driver;
