let __ = require('./__'),
    Monad = require('./monad');

//--- s -> (-, s) --- 

let St = {
    type:   'State',
    fmap:   f => st => __(st, ([a, s]) => [f(a), s]), 
    unit:   a => s => [a, s],
    join:   stst => __(stst, ([st, s]) => st(s)),
    '... -> M a': {
        read:   () => s => [s, s],
        reads:  f => s => [f(s), s],
        write:  s => _ => [null, s],
        writes: g => s => [null, g(s)]
    },
    'M a -> ... -> b': {
        run:    st => s => st(s),
        eval:   st => __(st, ([r, s]) => r),
        exec:   st => __(st, ([r, s]) => s)
    }
};

let State = Monad(St);
    
//--- s -> M (-, s) --- 

//   .T : M -> [s -> M (-, s)]
State.T = M => Monad({
    type:   `State.${M.type || 'M'}`,
    fmap:   f => st => __(st, M.do(([a, _]) => M.return([f(a), _]))),
    unit:   a => s => M.return([a, s]),
    join:   stst => __(stst, M.do(([st, s]) => st(s))),
    lift:   ma => s => M.bind(ma, a => M.return([a, s])),
    '... -> M a': 
        __.r.map(f => __(f, __.push(M.return)))(St['... -> M a']),
    'M a -> ... -> b': {
        run:    st => s => st(s).catch(err => console.log(err)),
        eval:   st => s => __(st, M.fmap(([r, s]) => r)),
        exec:   st => s => __(st, M.fmap(([r, s]) => s))
    }
}); 

module.exports = State; 
