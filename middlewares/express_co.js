const co = require('co');
//const Promise = require('bluebird');

function isGeneratorFunction(fn) {
    // If the current engine supports Symbol and @@toStringTag
    if (Symbol && Symbol.toStringTag) {
        return (isGeneratorFunction = fn => fn[Symbol.toStringTag] === 'GeneratorFunction')(fn)
    }

    // Using instanceof statement for detecting
    const genFn = (function* () { }).constructor

    return (isGeneratorFunction = fn => fn instanceof genFn)(fn)
}


module.exports = function wrap(gen) {
   
  var fn = co.wrap(gen);

  if (gen.length === 4) {
    return function(err, req, res, next) {
      var isParam = !(err instanceof Error);
      var callNextRoute = next;
      if (isParam) {
        callNextRoute = res;
      }
      return fn(err, req, res, next).catch(callNextRoute);
    }
  }

  return function(req, res, next) {
    return fn(req, res, next).catch(next);
  };
};