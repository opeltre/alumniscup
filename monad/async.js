let Monad = require('./monad'); 

let Async = Monad({
    fmap:   f => p => p.then(f), 
    unit:   a => Promise.resolve(a), 
    join:   pp => pp 
});

module.exports = Async;
