// hoodie.checkConnection() & hoodie.isConnected()
// =================================================


var reject = require('../utils/promise/reject');
var resolve = require('../utils/promise/resolve');

//
/**
 * Description
 * @method hoodieConnection
 * @param {} hoodie
 * @return
 */
function hoodieConnection(hoodie) {

  // state
  var online = true;
  var checkConnectionInterval = 30000;
  var checkConnectionRequest = null;
  var checkConnectionTimeout = null;

  // Check Connection
  // ------------------

  // the `checkConnection` method is used, well, to check if
  // the hoodie backend is reachable at `baseUrl` or not.
  // Check Connection is automatically called on startup
  // and then each 30 seconds. If it fails, it
  //
  // - sets `online = false`
  // - triggers `offline` event
  // - sets `checkConnectionInterval = 3000`
  //
  // when connection can be reestablished, it
  //
  // - sets `online = true`
  // - triggers `online` event
  // - sets `checkConnectionInterval = 30000`
  //
  /**
   * Description
   * @method checkConnection
   * @return checkConnectionRequest
   */
  hoodie.checkConnection = function checkConnection() {
    var req = checkConnectionRequest;

    if (req && req.state() === 'pending') {
      return req;
    }

    global.clearTimeout(checkConnectionTimeout);

    checkConnectionRequest = hoodie.request('GET', '/').then(
      handleCheckConnectionSuccess,
      handleCheckConnectionError
    );

    return checkConnectionRequest;
  };


  // isConnected
  // -------------

  //
  /**
   * Description
   * @method isConnected
   * @return online
   */
  hoodie.isConnected = function isConnected() {
    return online;
  };


  //
  //
  //
  /**
   * Description
   * @method handleCheckConnectionSuccess
   * @return CallExpression
   */
  function handleCheckConnectionSuccess() {
    checkConnectionInterval = 30000;

    checkConnectionTimeout = global.setTimeout(hoodie.checkConnection, checkConnectionInterval);

    if (!hoodie.isConnected()) {
      hoodie.trigger('reconnected');
      online = true;
    }

    return resolve();
  }


  //
  //
  //
  /**
   * Description
   * @method handleCheckConnectionError
   * @return CallExpression
   */
  function handleCheckConnectionError() {
    checkConnectionInterval = 3000;

    checkConnectionTimeout = global.setTimeout(hoodie.checkConnection, checkConnectionInterval);

    if (hoodie.isConnected()) {
      hoodie.trigger('disconnected');
      online = false;
    }

    return reject();
  }
}

module.exports = hoodieConnection;

