let __ = require('./__'),
    _r = __.r;

/*====== Monadic Expressions ======

    Stateful monadic instances emulated by 
        
        M(s, s') = M s -> M s' 
    
        M(s)    = M () -> M s

*///===
    
module.exports = M => {

    let monad = ma => monad.map(
        typeof ma === 'undefined'
            ? m => (m || M.return(null))
            : () => ma
    );

    monad.map = st => {

        let my = ma => st(ma); 
        my.push = g => monad.map(__(st, g));
        my.pull = f => monad.map(__(f, st));

        //--- Monad --- 
        my.fmap     = f =>  my.push(M.fmap(f));
        my.bind     = mf => my.push(mb => M.bind(mb, mf));
        my.join     = () => my.push(M.join);
        my.return   = a =>  my.bind(() => M.return(a));

        //--| ... -> M a |-- 
        _r.forEach((mf, k) => {
            my[k] = (...xs) => my.bind(() => mf(...xs));
        })(M['... -> M a'] || {});

        //--| ... -> M a -> M b |--
        _r.forEach((f, k) => {
            my[k] = (...xs) => my.push(f(...xs));
        })(M['... -> M a -> M b'] || {});

        //--| M a -> ... -> b |--
        _r.forEach((F, k) => {
            my[k] = (...xs) => F(my())(...xs)
        })(M['M a -> ... -> b'] || {});

        return my;
    };

    return monad;
}

