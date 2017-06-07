// Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var bitMap = {
  tickers: "https://yunbi.com/api/v2/tickers.json",
  depth: "https://plugin.sosobtc.com/widgetembed/data/depth"
}

if(!window.Storage || !window.Storage.bit){
  window.Storage.bit = {}
}

options = {
    type : "list",
    iconUrl: "48.png",
    title: "Notification",
    message: "List of items in a message",
}

function init(){
  return new Promise(function(res, rej){
   $.ajax({
    type: "GET",
      url: bitMap.tickers
    }).done(function(data){
      res(data)
    }).fail(function(err){
      rej(err)
    })
  })
}

function loadData(symbol){
  return new Promise(function(res, rej){
    $.ajax({
      type: "GET",
      url: "https://plugin.sosobtc.com/widgetembed/data/depth",
      data: {
        symbol: symbol
      }
    }).done(function(data){
      res(data)
    }).fail(function(err){
      rej(err)
    })
  })

}

function calculator(data){
  var buyList = data.bids.reverse(),
      sellList = data.asks,
      buyTotal = calculateList(buyList),
      sellList = calculateList(sellList)
  return {buy: buyTotal.toFixed(2), sell: sellList.toFixed(2), total: (buyTotal - sellList).toFixed(2)}
}

function calculateList(dataList){
  var total = 0.00
  jQuery.each(dataList, function(i, e){
    var _price = e[0]
      _volume = e[1]
      total = total + _price * _volume
  })
  return total
}


function buildItem(name, last, before, buy, sell, total){
  if(last > before){
    var m = "UP"
  }else{
    var m = "DW"
  }
  return { title: name.replace('cny', "") + " " + m, message: "N: "+ last + ", A: "+ total}
}


function show() {
  co(function *(){
    // resolve multiple promises in parallel
    var bitData = yield init();
    jQuery.each(bitData, function(k, v){
      if(!window.Storage.bit[k]){
        window.Storage.bit[k]= {before: 0.00, last: 0.00 }
      }
      window.Storage.bit[k]['before'] = window.Storage.bit[k].last
      window.Storage.bit[k]['last'] = v.ticker.last
      window.Storage.bit[k]['vol'] = v.ticker.vol
    })

    var items = []
    for (var k in window.Storage.bit) {
      if(localStorage[k] && JSON.parse(localStorage[k])){
        var v = window.Storage.bit[k]
        var data = yield loadData("yunbi"+k);
        var result = calculator(data)
        console.log(k, ": ",JSON.stringify(sta(parseFloat(v.last), data.bids, data.asks).map(function(e){ return [e.index, e.vol] })))
        items.push(buildItem(k, v.last, v.before, result.buy, result.sell, result.total))
      }
    }
    options.items = items
    chrome.notifications.create("id", options, function(){});
  }).catch(onerror);
}


function sta(last, indata, outdata){
  var result = [],
    min = indata[0][0],
    max = outdata[0][0],
    frequency = last * 0.005,
    index = last
  while(index > min){
    result.unshift({
      index: index, vol: 0
    })
    index = (index - frequency)
  }
  index = last
  while(index < max){
    result.push({
      index: index, vol: 0
    })
    index = (index + frequency)
  }
  for (var i=0; i < indata.length-1; i++) {
    var _idx = indata[i][0],
        _vol = indata[i][1]
    for(var el in result){
      if(result[el].index >= _idx){
        result[el].vol = result[el].vol + _vol
        break;
      }
    }
  }

  for (var i=0; i < outdata.length-1; i++) {
    var _idx = outdata[i][0],
        _vol = outdata[i][1]
    for(var el in result){
      if(result[el].index >= _idx){
        result[el].vol = result[el].vol - _vol
        break;
      }
    }
  }

  return result
}

// Conditionally initialize the options.
if (!localStorage.isInitialized) {
  localStorage.isActivated = true;   // The display activation.
  localStorage.frequency = 1;        // The display frequency, in minutes.
  localStorage.isInitialized = true; // The option initialization.
}

// Test for notification support.
if (window.Notification) {

  // While activated, show notifications at the display frequency.
  if (JSON.parse(localStorage.isActivated)) { show(); }

  var interval = 0; // The display interval, in minutes.

  setInterval(function() {
    interval++;

    if (
      JSON.parse(localStorage.isActivated) &&
        localStorage.frequency <= interval
    ) {
      show();
      interval = 0;
    }
  }, 60000);
}
