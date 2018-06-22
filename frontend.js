"use strict";

const $ = require('jquery');
const Web3 = require('web3');

window.addEventListener('load', async () => {
  window.web3 = new Web3(web3.currentProvider);
  $("#api").html(web3.version);
  // noinspection JSUnresolvedFunction
  $("#node").html(await web3.eth.getNodeInfo());
  $("#account").html((await web3.eth.getAccounts())[0]);
  $("#ethereum").html(web3.eth.getBalance((await web3.eth.getAccounts())[0]));
  $("#network").html(await web3.eth.net.getNetworkType());
  $("#peer-count").html(await web3.eth.net.getPeerCount());
  $("#gas-price").html(await web3.eth.getGasPrice());
  $("#block-number").html(await web3.eth.getBlockNumber());

  $('#button').click(async () => {
    const baseUrl = location.protocol + "//" + location.hostname;
    console.log(web3.eth.accounts);
    const address = (await web3.eth.getAccounts())[0];
    // noinspection JSUnresolvedFunction
    web3.eth.personal.sign(`Sign into ${baseUrl}`, address).then((signed) => {
      console.log('Signed!  Result is: ', signed);
      // noinspection JSUnusedLocalSymbols
      $.ajax({
        method: 'POST',
        contentType: 'application/json',
        url: baseUrl + ":" + location.port + '/sign-in',
        data: JSON.stringify({
          account: address,
          signed: signed,
        }),
        success: function (data, textStatus, jqXHR) {
          console.log('Signed in.');
        },
        error: function (jqXHR, textStatus, errorThrown) {
          console.log('Failed to sign in.');
        }
      });
    });
  });
});
