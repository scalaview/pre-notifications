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
    title: "List Notification",
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
        window.Storage.bit[k]= {isActivated: true, before: 0.00, last: 0.00 }
      }
      window.Storage.bit[k]['before'] = window.Storage.bit[k].last
      window.Storage.bit[k]['last'] = v.ticker.last
      window.Storage.bit[k]['vol'] = v.ticker.vol
    })

    var items = []
    for (var k in window.Storage.bit) {
      var v = window.Storage.bit[k]
      if(v.isActivated){
        var data = yield loadData("yunbi"+k);
        var result = calculator(data)
        items.push(buildItem(k, v.last, v.before, result.buy, result.sell, result.total))
      }
    }
    options.items = items
    console.log(options);
    chrome.notifications.create("id", options, function(){});
  }).catch(onerror);
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
  }, 10000);
}
