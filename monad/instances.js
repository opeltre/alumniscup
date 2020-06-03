let __ = require('./__'),
    _r = __.r,
    Monad = require('./monad');


//====== Unit ======

let Id = Monad({
    fmap:   f => x => f(x),
    unit:   x => x,
    join:   x => x
});


//====== Async ====== 

let Async = Monad({ 
    fmap:   f => p => p.then(f), 
    unit:   a => Promise.resolve(a), 
    join:   pp => pp 
})


//====== Reader ======

let Reader = Monad({
    fmap:   f => r => __(r, f),
    unit:   a => () => a,
    join:   rr => s => rr(s)(s)
});
//--- Reader M --- 

//    .T : M -> Reader . M 
Reader.T = M => Monad.compose(Reader, M);

//    .natl : M ->  M (Reader a) -> Reader (M a)
Reader.natl = M =>  mr => 
    s => M.bind(mr, r => M.return(r(s)));


//====== State ======

let State = Monad({
    fmap:   f => st => __(st, ([a, s]) => [f(a), s]), 
    unit:   a => s => [a, s],
    join:   stst => __(stst, ([st, s]) => st(s))
}); 
//--- s -> M (-, s) --- 

//   .T : M -> [s -> M (-, s)]
State.T = M => Monad({
    fmap:   f => st => __(st, M.do(([a, _]) => M.return([f(a), _]))),
    unit:   a => s => M.return([a, s]),
    join:   stst => __(stst, M.do(([st, s]) => st(s))),
    lift:   ma => s => M.bind(ma, a => M.return([a, s]))
}); 


//===== List ====== 

let List = Monad({
    fmap:   f => as => as.map(f), 
    unit:   a => [a],
    join:   ll => ll.reduce((l1, l2) => l1.concat(l2), [])
});
//--- M [ ] ---

//  .T : M -> M [ ] 
List.T = M => Monad.compose(M, List);

//  .natr : M -> [M a] -> M [a] 
List.natr = M => lm => lm.reduce(
    (ml, ma, i) => M.bind(ma, 
        a => M.fmap(l => {l[i] = a; return l})(ml)
    ),
    M.return([])
);


//====== Record ===== 

let Record = Monad({
    fmap:   _r.map,
    unit:   a => ({'.': a}),
    join:   rr => {
        let r = {};
        _r.forEach((ri, i) => _r.forEach((xj, j) => {
            r[i + (j === '.' ? '' : '/' + j)] = xj;
        }));
        return r;
    }
}); 
//--- M { } ---

//    .T : M -> M { } 
Record.T = M => Monad.compose(M, Record);

//    .natr : M -> {M a} -> M {a} 
Record.natr = M => rm => _r.reduce(
    (mr, ma, k) => M.bind(ma, 
        a => M.fmap(r => _r.write(k, a)(r))(mr),
        M.return({})
    )
)(rm);


//====== Either ====== 

let Either = Monad({
    fmap:   f => ([b, a]) => b ? [true, f(a)] : [false, a], 
    unit:   a => [true, a],
    join:   ([b, e]) => b 
        ? e[0] ? [true, e[1]] : [false, e[1]]
        : [false, e],
});
//--- M Either ---

//    .T : M -> M . Either 
Either.T = M => Monad.compose(M, T);

//    .natr : M -> Either (M a) -> M (Either a)
Either.natr = M => ([b, ma]) => b 
    ? M.bind(ma, a => [true, a])
    : M.return([false, ma]);


//====== Writer ====== 

let Writer = Monad({
    fmap:   f => ([a, t]) => [f(a), t],
    unit:   a => [a, []],
    join:   ([[a, s], t]) => [a, t.concat(s)]
});
//--- M Writer ---

//    .T : M -> M . Writer
Writer.T = M => Monad.compose(M, Writer);

//    .natr : M -> [M a, [b]] -> M [a, [b]]  
Writer.natr = M => ([ma, t]) => M.bind(ma, 
    a => M.return([a, t])
);


//====== Except ====== 

let Except = Monad.extends(Either, {
    fmap: {
        try : ea => (f, fail=__.id) => {

            if (ea[0] === false) {
                return [false, fail(ea[1])];
            }
            try {
                let eb = Either.bind(ea, a => [true, f(a)]);
                return eb;
            }
            catch (err) {
                return [false, fail(err)];
            }
        }
    }
});

//--- M Except ---

Except.T = Monad.extends(Either, {
    try : mea => (f, fail=__.id) => 
        M.do(ea => Except.try(ea)(f, fail))(mea)
});
    


//====== Exports ====== 

module.exports = {
    Id,
    Async,
    Reader,
    State,
    List,
    Record,
    Either,
    Except
}; 
