function sha256(str, salt) {
  // We transform the string into an arraybuffer.
  var buffer = new TextEncoder("utf-8").encode(str);
  return crypto.subtle.digest("SHA-256", buffer).then(function (hash) {
    var return_hex = hex(hash)
    var ret = return_hex.slice(32, 64);
    return ret
  });
}

function hex(buffer) {
  var hexCodes = [];
  var view = new DataView(buffer);
  for (var i = 0; i < view.byteLength; i += 4) {
    // Using getUint32 reduces the number of iterations needed (we process 4 bytes each time)
    var value = view.getUint32(i)
    // toString(16) will give the hex representation of the number without padding
    var stringValue = value.toString(16)
    // We use concatenation and slice for padding
    var padding = '00000000'
    var paddedValue = (padding + stringValue).slice(-padding.length)
    hexCodes.push(paddedValue);
  }

  // Join all the hex strings into one
  return hexCodes.join("");
}

// call this function with the input as the string + nonce, along with a callback function
// returns a 64 byte string truncated to 32 bytes
function sha256_wrapper(input, cb){
  sha256(input).then(function(digest) {
    cb(digest);
  });
}

export default sha256_wrapper;
