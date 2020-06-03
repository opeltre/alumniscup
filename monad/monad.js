let __ = require('./__'),
    _r = __.r;

let expr = require('./expression'); 

module.exports = Monad;


//====== Type Class ====== 

function Monad (monad) {

    let M = {};

    M.type = monad.type || 'M';

    _r.assign(monad)(M); 
    M.unit
        ? M.return = M.unit
        : M.unit = M.return;
    M.join
        ? M.bind = (ma, mf) => M.join(M.fmap(mf)(ma))
        : M.join = mma => M.bind(mma, M.return);

    M.do = act => ma => M.bind(ma, a => {
        let m_ = expr(M)(M.unit(a)),
            mb = act(a, m_);
        return typeof mb == 'undefined' ? m_.value : mb;
    });

    return _r.assign(M)(expr(M));
};


/*====== Extension ====== 
    
    Return a monad with additional methods 
    of type M a -> b for any b. 

*///===

Monad.extends = (M, methods) => {
    M = Monad(M); 
    let N = __(
        expr(M), 
        na => _r.forEach(
            (fk, k) => na[k] = __.bindl(na)(fk)
        )(methods)
    );
    return _r.assign(M, methods)(N);
};
    

/*====== Composition ====== 

    The composed functor M.N has a monad structure
    given a natural transformation from N.M to M.N: 

        nat : N (M a) -> M (N a)

*///=== 

Monad.compose = (M, N, nat) => {
    nat = nat || M.natl || N.natr;
    return Monad({
        fmap:   __(N.fmap, M.fmap),
        unit:   __(N.unit, M.unit),
        join:   M.do(nat, N.join),
        lift:   M.return
    });
};
