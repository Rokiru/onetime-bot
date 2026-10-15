'use strict';
(function(root){
 const chapters=[
  {id:0,title:'Первый свет',short:'МАСТЕРСКАЯ',headline:['ВЕРНУТЬ','СВЕТ.'],flag:'workshopPowered',purpose:'Запустить мастерскую',benefit:'Ремонт и заправка у мастерской. Выездная бригада после брода.',action:'Довезти генератор с исправностью ≥60%.',setup:'trail'},
  {id:3,title:'Вода после шторма',short:'НАСОСНАЯ',headline:['ВЕРНУТЬ','ВОДУ.'],flag:'villageWater',purpose:'Вернуть воду в дома',benefit:'Насос установлен, шкаф подключён. В посёлке работает колонка.',action:'Открыть пост, установить насос ≥70%, довезти шкаф.',setup:'trail'},
  {id:4,title:'Своих не бросаем',short:'МЕХАНИК',headline:['СПАСТИ','СВОИХ.'],flag:'villageRescue',purpose:'Вытащить фургон механика',benefit:'Три использования лебёдки вместо двух в следующих новых рейсах.',action:'Прицепить, вытянуть, остановить обе машины и отцепить у базы.',setup:'trail'},
  {id:1,title:'Крепёж для моста',short:'КРЕПЁЖ',headline:['СОБРАТЬ','МОСТ.'],purpose:'Доставить крепёж из карьера',benefit:'Монтажная бригада получает крепёж для опор моста.',action:'Выбрать обычный или срочный договор. Довезти ящики.',setup:'standard'},
  {id:5,title:'Проверка опор',short:'ОПОРЫ',headline:['ПРОВЕРИТЬ','ОПОРЫ.'],purpose:'Довезти датчики целыми',benefit:'Опоры моста проверены. На карте посёлка отмечен работающий мост.',action:'Сохранить весь груз. Перед уступами снизить скорость.',setup:'trail'},
  {id:6,title:'Успеть до смены',short:'МОНТАЖ',headline:['ЗАКРЫТЬ','СМЕНУ.'],purpose:'Поднять соединители к монтажникам',benefit:'Монтажники получают соединители для верхней опоры.',action:'Доставить груз в срок, беречь тягу на подъёме.',setup:'standard'},
  {id:2,title:'Связь с посёлком',short:'СВЯЗЬ',headline:['ВЕРНУТЬ','СВЯЗЬ.'],purpose:'Развезти фонари и аккумуляторы',benefit:'Линия связи отмечена работающей на карте посёлка.',action:'Выполнить разгрузки по пути и доехать до базы.',setup:'trail'},
  {id:7,title:'Дежурный медпункт',short:'МЕДПУНКТ',headline:['ПОМОЧЬ','МЕДИКАМ.'],purpose:'Обеспечить резервное питание',benefit:'Медпункт получает резервное питание. Его окна загораются на карте.',action:'Сохранить все ящики на мокрой дороге.',setup:'trail'},
  {id:8,title:'Рассвет на станции',short:'СТАНЦИЯ 17',headline:['ВСТРЕТИТЬ','РАССВЕТ.'],purpose:'Закончить восстановление станции',benefit:'Завершена первая история Лисьего Брода. Впереди остальные регионы.',action:'Успеть доставить обмотку генератора на станцию.',setup:'standard'}
 ];
 function complete(c,save){return c.flag?save[c.flag]===true:(save.stats?.[c.id]?.wins||0)>0;}
 function state(save){const rows=chapters.map(c=>({...c,done:complete(c,save)}));return {rows,done:rows.filter(c=>c.done).length,next:rows.find(c=>!c.done)||null};}
 function preparation(id,route){const chapter=chapters.find(c=>c.id===id);return {setup:route.kind==='eco'?'economy':chapter?.setup||(['careful','service'].includes(route.kind)||route.cargo==='logs'?'trail':'standard'),upgrade:route.kind==='eco'?0:id===1||id===6?0:1};}
 const api={chapters,state,preparation};if(typeof module==='object')module.exports=api;else root.Restoration24=api;
})(typeof globalThis!=='undefined'?globalThis:this);
