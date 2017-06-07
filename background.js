// Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var bitMap = {
  tickers: "https://yunbi.com/api/v2/tickers.json",
  depth: "https://plugin.sosobtc.com/widgetembed/data/depth"
}


function init(){
  $.ajax({
      type: "GET",
      url: bitMap.tickers
    }).done(function(data){
      res(data)
    }).fail(function(err){
      rej(err)
    })
}

function loadData(){
  return new Promise(function(res, rej){
    $.ajax({
      type: "GET", // post,get
      url: "https://plugin.sosobtc.com/widgetembed/data/depth?symbol=yunbidgdcny"
    }).done(function(data){
      res(data)
    }).fail(function(err){
      rej(err)
    })
  })

}

function calculator(){
  if(jQuery){
    loadData().then(function(data){
      console.log(data)
        var buyList = data.bids.reverse(),
            sellList = data.asks,
            buyTotal = calculateList(buyList),
            sellList = calculateList(sellList)
        new Notification("ok", {
          icon: '48.png',
          body: '<h1>good<h1>'
        });
    })
  }else{
    console.log("jQuery not found")
  }
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


function show() {
  calculator()
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
