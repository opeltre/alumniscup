(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.__ = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
let __ = require('./src/__'),
    record = require('./src/record'),
    nd = require('./src/nd_array'),
    getset = require('./src/getset'),
    alg = require('./src/alg/index'),
    top = require('./src/top/index');

module.exports = Object.assign(__, {
    record: record.new,
    r: record,
    nd,
    getset,
    alg, 
    top
});

},{"./src/__":2,"./src/alg/index":6,"./src/getset":8,"./src/nd_array":9,"./src/record":10,"./src/top/index":13}],2:[function(require,module,exports){
/*** __ ***/

//------ monad: composition and chains ------

let __ = 
    (f, ...fs) =>  __.pipe(
        typeof f !== 'function' ? () => f : f,
        ...fs
    )

__.return = 
    x => () => x;

__.pipe = 
    (f=__.id, ...fs) => fs.length
        ? (...xs) =>  __.pipe(...fs)(f(...xs))
        : (...xs) => f(...xs);

__.do = 
    (f=__.id, ...fs) => fs.length
        ? __.pipe(__.do(f), __.do(...fs))
        : x => {f(x); return x} 


//------ pull-back and push-forward ------

__.pull = 
    (...gs) => f => __.pipe(...gs, f);

__.push = 
    (...fs) => f => __.pipe(f, ...fs);


//------ argument application -------

__.$ = 
    (...xs) => f => f(...xs);

__.xargs =
    f => xs => f(...xs);

__.bindl = 
    x => f => (...xs) => f(x, ...xs);

__.bindr = 
    y => f => (...xs) => f(...xs, y);


//------ logic ------

__.null = 
    () => {};

__.id =
    x => x;

__.not = 
    b => !b;

__.if = 
    (f, g, h) => 

        (...xs) => f(...xs) ? g(...xs) : h(...xs);


//------- arrays -------------

__.range =
    n => [...Array(n).keys()];

__.linspace = 
    (t0, t1, n=20) => __.range(n)
        .map(t => t0 + t * (t1 - t0) / (n - 1));

__.concat = 
    (as, bs) => [...as, ...bs];
     
__.map = 
    (...fs) => 
        arr => Array.isArray(arr)
            ? arr.map(__.pipe(...fs))
            : __.pipe(...fs)(arr);

__.map2 = 
    (...fs) => 
        (as, bs) => as.map((ai, i) => __.pipe(...fs)(ai, bs[i], i));

__.apply = 
    fs => (...xs) => __.map(__.$(...xs))(fs);

__.filter = 
    f => arr => arr.filter(f);

__.reduce = 
    (f, acc) => arr => arr.reduce(f, acc);


//--------- z z z -----------------

__.sleep = 
    ms => new Promise(then => setTimeout(then, ms));

__.log = 
    x => {console.log(x); return x};

__.logs = 
    str => 
        x => {__.log(str || 'logs:'); return  __.log(x)};


//------ node exports ------

if (typeof module !== 'undefined')
    module.exports = __;

},{}],3:[function(require,module,exports){
let __ = require('../__'),
    Tensor = require('./tensor');

//------ complex casting ------

let C =
    (x, y) => typeof x === 'number'
        ? ({ Re: x, Im: y || 0 })
        : x

//------ complex field ------

C.i = C(0,1);

let Re = z => typeof z === 'number' ? z : z.Re,
    Im = z => typeof z === 'number' ? 0 : z.Im;

let add = 
    (a, b) => C(
        Re(a) + Re(b),
        Im(a) + Im(b)
    );

let mult = 
    (a, b) => C(
        Re(a) * Re(b) - Im(a) * Im(b),
        Re(a) * Im(b) + Im(a) * Re(b)
    );

let bar     = z => C(Re(z), -Im(z)),
    abs2    = z => Re(z)**2 + Im(z)**2,
    abs     = z => Math.sqrt(abs2(z)),
    inv     = z => mult(C(1 / abs2(z)), bar(z)),
    zero    = _ => C(0),
    unit    = _ => C(1);

Object.assign(C, 
    { add, mult, inv, zero, unit },
    { Im, Re, bar, abs }
);


//------ complex ND-arrays ------

let _C = Tensor(C);


//------ polar coordinates, exp and log  ------

let sign = t => Math.sign(t) || 1;

let phase = 
    z => Re(z) === 0 
        ? Math.sign(Im(z)) * (Math.PI / 2)
        : Math.atan(Im(z) / Re(z)) -
                (Re(z) > 0 ? 0 : sign(Im(z)) * Math.PI);

let expi = 
    t => C(Math.cos(t), Math.sin(t));

_C.exp = 
    _C.map( 
        z => mult(
            C(Math.exp(Re(z))), 
            expi(Im(z))
        )
    );

_C.log = 
    _C.map(
        z => C(Math.log(abs(z)), phase(z))
    );

_C.phase    = _C.map(phase);
_C.expi     = _C.map(expi);
_C.i        = C.i;

module.exports = _C;

},{"../__":2,"./tensor":7}],4:[function(require,module,exports){
let __ = require('../__'),
    Tensor = require('./tensor');

//------ real ND-arrays ------

let _R = Tensor();


//------ exp_ and _log ------

let exp_ = x => Math.exp(-x),
    _log = x => - Math.log(x);

_R.exp_ = _R.map(exp_);
_R._log = _R.map(_log);

_R.free = 
    __.pipe(
        _R.exp_,
        _R.int,
        _log
    );

_R.eff = 
    (is, js) => __.pipe(
        _R.exp_,
        _R.project(is, js),
        _R._log
    );


//------ numerically stable free energy ? ------ 

_R.max = _R.reduce(Math.max);
_R.min = _R.reduce(Math.min);

_R.freeE =
    H => {
        let m = _R.min(H),
            H_m = _R.map(h => h - m)(H);
        return m + _log(_R.int(_R.exp_(H_m)));
    };

_R.gibbs =
    H => {
        let F = _R.freeE(H),
            H_F = _R.map(h => h - F)(H)

        return _R.exp_(H_F);
    }; 

_R.effE = 
    (is, js) => 
        H => {
            let min = _R.fold(Math.min)(is, js),
                ext = _R.extend(is, js, _R.shape(H)),
                sum = _R.project(is, js);
            let m = min(H),
                H_m = _R.subt(H, ext(m)),
                eff_m = _R._log(sum(_R.exp_(H_m)));
            return _R.add2(eff_m, m);
        };

module.exports = _R;

},{"../__":2,"./tensor":7}],5:[function(require,module,exports){
/*  The Fast Fourier Transform `divide and conquer' scheme 
 *  is canonically adapted for computing Fourier transforms 
 *  on a product set. 
 *  
 *  Example
 *  -------
 *  Compare the product set {1...N1} x {1...N2} with {1...N1*N2}. 
 *  Letting:
 *      - x = x1    + N1*x2
 *      - y ⁼ N2*y1 + y2 
 *  And denoting phases by:
 *      - phi   = 2 pi x*y / N1*N2
 *      - phi1  = 2 pi x1*y1 / N1
 *      - phi2  = 2 pi x2*y2 / N2
 *  One does get `phi = phi1 + phi2' in R mod (2 pi).
 *  
 *  Conclusion
 *  ----------
 *  FFT should be implemented here.
 *  It consists of computing N1 FFTs of size N2, 
 *  before computing N2 FFTs of size N1. 
 *  Note recursion. 
 */

let __ = require('../__'),
    _R = require('./R'),
    _C = require('./C');

//------ (slow) Fourier transform ------

let Fourier = 

    u => {

        let dims = _C.shape(u),
            e_i = _F.waves(dims),
            norm = Math.sqrt(_C.size(u));

        let Fu = 
            k => _C.scale(1 / norm)(_C.inner(e_i(k), u))

        return _C.compute(dims)(Fu);

    };

let _F = 
    u => Array.isArray(u)
        ? Fourier(_C(u))
        : u;

_F.bar = 
    __.pipe(_C.reverse, _F);


//------ spectral domain [ 0, 2 pi [ ------

_F.circle = 
    N => __.range(N).map(
        n => 2 * n * Math.PI / N
    );

_F.compute = 
    Ns => _C.compute(Ns.map(_F.circle));


//------ plane waves Fourier basis ------

_F.waves = 
    Ns => k => _F.compute(Ns)(
        x => _C.expi(_R.inner(k, x))
    );


//====== Fast Fourier Transform ======

//------ FT along first slice ------

let F0 = 
    
    u => { 

        let dims = _C.shape(u),
            [N, ...Ns] = dims,
            [i, ...is] = __.range(dims.length);

        let vec = k => [k, ...Ns.map(_ => 0)]
            e_i = k => _F.waves([N, ...Ns])(vec(k));

        let sum = _C.project([i, ...is], is),
            scale = _C.scale(1 / Math.sqrt(N));

        return __.range(N).map(
            k => scale(sum(_C.mult(e_i(k), u)))
        );

    };

_F.slice = 
    u => _C.shape(u).length ? F0(u) : u;


//------ FFT ------

let fft = 
    u => _C.shape(u).length
        ? _F.slice(u.map(v => fft(v)))  
        : u;

_F.fft = 
    __.pipe(_C, fft);

_F.ifft = 
    __.pipe(_C.reverse, _F.fft);


module.exports = _F

},{"../__":2,"./C":3,"./R":4}],6:[function(require,module,exports){
let R = require('./R'),
    C = require('./C'),
    tensor = require('./tensor'),
    fourier = require('./fourier');

module.exports = {R, C, tensor, fourier}; 

},{"./C":3,"./R":4,"./fourier":5,"./tensor":7}],7:[function(require,module,exports){
let __ = require('../__'),
    ND = require('../nd_array'),
    {cell} = require('../top/id');
    
let record = require('../record');

module.exports = Tensor;

function Tensor(K={}) {
//  Create the ND-algebra type instance of tensors over the field K.

    //====== inherit from ND type instance ======
    let nd = ND();
    //------ cast scalars to K ------
    let toK = typeof K === 'function' 
            ? K
            : __.id;
    let _K = nd.mapN(toK);
    record.assign(nd)(_K);


    //====== K-tensors ======

    //------ field methods ------
    let add     = K.add     || ((a, b) => a + b),
        mult    = K.mult    || ((a, b) => a * b),
        inv     = K.inv     || (a => 1 / a),
        zero    = K.zero    || (_ => toK(0)),
        unit    = K.unit    || (_ => toK(1)),
        abs     = K.abs     || Math.abs;


    //------ linear structure ------

    _K.add2 = 
        _K.map2(add);

    _K.add = 
        (...as) => as.reduce(_K.add2);

    _K.scale = 
        z => _K.map(a => mult(toK(z), a));

    _K.minus = 
        _K.scale(-1);

    _K.subt = 
        (a, b) => _K.add(a, _K.minus(b));

    _K.span = 
        (ks, as) => _K.add(
            ...as.map((ai, i) => _K.scale(ks[i])(ai))
        );

    _K.zero = 
        (Ns) => _K.compute(Ns)(zero);


    //------ ring structure ------

    _K.mult =
        _K.map2(mult);

    _K.unit = 
        (Ns) => _K.compute(Ns)(unit);


    //------ multiplicative group ------

    _K.inv = 
        _K.map(inv);

    _K.div = 
        (a, b) => _K.mult(a, _K.inv(b));

    //------ complex / quaternionic operations ------

    if (K.bar) 
        _K.bar = _K.map(K.bar);

    if (K.Re) 
        _K.Re = _K.map(K.Re);

    if (K.Im)
        _K.Im = _K.map(K.Im);


    //------ integration and inner product ------

    _K.int = _K.reduce(_K.add);

    _K.mean = 
        u => mult(_K.int(u), toK(1 / _K.size(u)));

    _K.inner = 
        K.bar
            ? __.pipe(
                (a, b) => _K.mult(_K.bar(a), b),
                _K.int
            )
            : __.pipe(_K.mult, _K.int);

    _K.abs = 
        _K.map(abs);

    _K.norm = 
        a => Math.sqrt((K.Re || __.id)(
            _K.inner(a, a)
        ));



    //------ adjoint extension and projection ------

    let extend = 
        ([i, ...is], [j, ...js], [E, ...Es]) => 
            q => typeof i === 'undefined' 
                ? q 
                : (i === j 
                    ? q.map(_K.extend(is, js, Es))
                    : (Array.isArray(E) ? E : __.range(E)).map(
                        _ => _K.extend(is, [j, ...js], Es)(q)
                    )
                );

    let project = 
        ([i, ...is], [j, ...js]) => 
            q => typeof(i) === 'undefined'
                ? q
                : ( i === j 
                    ? __.map(_K.project(is, js))(q)
                    : _K.project(is, [j, ...js])(q.reduce(_K.add2))
                );

    let indices = js => 
        Array.isArray(js) 
            ? js
            : js.split('.').filter(j => j !== '');

    _K.project = 
        (a, b) => project(...[a, b].map(indices));

    _K.extend = 
        (a, b, Es) => extend(...[a, b].map(indices), Es);

    return _K;

}



Tensor.functor = function (E, K) {
//  Return the two-sided functor K^E:
//      E : I -> [num] describes the possible states of each coordinate. 

    let _K = Tensor(K); 

    //------ compute, shapes given by E ------
    let compute = _K.compute,
        Es = is => cell(is).map(E);

    _K.compute = 
        is => compute(Es(is));

    //------ functorial maps ------
    _K.func = 
        (is, js) => _K.project(is, js);

    _K.cofunc = 
        (is, js) => _K.extend(is, js, Es(is));

    return _K;

}

},{"../__":2,"../nd_array":9,"../record":10,"../top/id":12}],8:[function(require,module,exports){
let __ = require('./__'),
    _r = require('./record');

/*------ Chainable getter-setters ------

    This module assigns convenience accessor methods to an object `my`,
    keeping references to an internal state object `attrs`. 
    
    getset : a -> {s} -> {?s -> St({s}, s | a)}

        where a.method  : ?s -> St({s}, s | a) 
                        : [get] _ -> St({s}, s)   
                        : [set] s -> St({s}, a)   
*/

let getset =  
    (my, attrs, types={}) => {

        let records = types.records || [],
            arrays = types.arrays || [],
            apply = types.apply || [];

        _r.forEach(
            (_, n) => {my[n] = getset.method(my, n, attrs)}
        )(attrs);

        records.forEach(n => {my[n] = getset.recordMethod(my, n, attrs)});

        arrays.forEach(n => {my[n] = getset.arrayMethod(my, n, attrs)});

        apply.forEach(n => {my[n] = getset.applyMethod(my, n, attrs)});
        
        return my;
    }

//------ attrs[name] : s ------
getset.method = (my, name, attrs) => {
    return function (x) {
        if (!arguments.length)
            return attrs[name];
        attrs[name] = x;
        return my;
    };
}

//------ attrs[name] : s = {s'} ------
getset.recordMethod = (my, name, attrs) => {
    return function (x, y) {
        if (!arguments.length) 
            return attrs[name];
        else if (typeof x === 'string' && arguments.length === 1)
            return attrs[name][x];
        else if (typeof x === 'string' && arguments.length === 2)
            attrs[name][x] = y;
        else 
            attrs[name] = x;
        return my;
    }
};

//------ attrs[name] : s = [s'] ------
getset.arrayMethod = function (my, name, attrs) {
    return function (x, y) {
        if (typeof x === 'undefined')
            return attrs[name];
        if (Array.isArray(x))
            attrs[name] = x;
        else if (x === '...')
            attrs[name] = [...attrs[name], x, ...y];
        else if (typeof x === 'number') 
            attrs[name][i] = y
        return my;
    }
}

//------ attrs[name] : s = attrs ?-> s' ------
getset.applyMethod = function (my, name, attrs) {
    return function (x) {
        if (!arguments.length) 
            return attrs[name];
        attrs[name] = __(x)(attrs);
        return my;
    }
};

module.exports = getset;


},{"./__":2,"./record":10}],9:[function(require,module,exports){
let __ = require('./__');

function ND() {
//  Create an instance of the ND-array type class. 

    let my = {};

    //------ nd-array properties ------

    my.shape = 
        q => Array.isArray(q)
            ? [q.length, ...my.shape(q[0])]
            : [];
    
    my.size = 
        u => my.shape(u).reduce((n, m) => n * m, 1);

    //------ nd-array transformation ------

    my.map = f => 
        p => Array.isArray(p)
            ? p.map(my.map(f))
            : f(p);

    my.map2 = f => 
        (p, q) => Array.isArray(p)
            ? p.map((_, i) => my.map2(f)(p[i], q[i]))
            : f(p, q);

    my.mapN = f => 
        (...ps) => Array.isArray(ps[0])
            ? ps[0].map(
                (_, i) => my.mapN(f)(...ps.map(p => p[i]))
            )
            : f(...ps);

    my.reduce = f => 
        p => Array.isArray(p)
            ? p.reduce(
                (pi, pj) => f(
                    my.reduce(f)(pi), 
                    my.reduce(f)(pj)
                )
            )
            : p;

    let fold = (f) => ([i, ...is], [j, ...js]) => 
            q => typeof(i) === 'undefined'
                ? q
                : i === j 
                    ? __.map(fold(f)(is, js))(q)
                    : fold(f)(is, [j, ...js])(
                        q.reduce(my.map2(f))
                    )

    my.fold = (f, x0) => (is, js) => Array.isArray(is) && Array.isArray(js)
        ? fold(f, x0)(is, js)
        : fold(f, x0)(is.split('.'), js.split('.'));

    //------ initialise from callable ------

    let compute = ([E, ...Es]) => 
        f => typeof(E) === 'undefined'
            ? f()
            : E.map(
                x => compute(Es)((...xs) => f(...[x, ...xs]))
            );

    let states = 
        E => Array.isArray(E) ? E : __.range(E)

    my.compute = 
        Es => compute(Es.map(states))

    //------ access values ------
    
    my.get = ([k, ...ks]) =>
        p => Array.isArray(p) 
            ? my.get(ks)(p[k])
            : p;

    //------ compose with: x => - x -----

    let minus = 
        (N, i) => (N - i) % N 

    my.reverse = 
        p => Array.isArray(p) 
            ? p.map(
                (_, i) => p[minus(p.length, i)].map(my.reverse)
            )
            : p;

    return my;
}

module.exports = ND; 

},{"./__":2}],10:[function(require,module,exports){
let __ = require('./__');

let _r = Record();
    _r.new = Record;

module.exports = _r;

/*------ Records ------

Note: operations could be made chainable:

    let f = _r()
        .map((v, k) => f(v, k))
        .set(k1, v1)
        .set(k2, v2)

    let r1 = f(r0);

This would be a nice balance for the necessity 
to pass the record at the end 

>> Monads
*/

function Record () {

    let my = {};

    //------ record properties ------

    //.keys : {a} -> [str] 
    my.keys = 
        r => Object.keys(r);

    //.isEmpty : {a} -> bool
    my.isEmpty =
        r => my.keys(r).length === 0;
    
    //.null : [str] -> {null} 
    my.null = 
        ks => my.fromPairs(ks.map(k => [null, k]));


    //------ record access ------
    
    //.get : str -> {a} -> a
    my.get = 
        k => r => r[k];

    //.pluck : ...[str] -> {a} -> {a}
    my.pluck = 
        (...ks) => 
            r => my.fromPairs(
                ks.map(k => [r[k], k])
            );

    //.without : ...[str] -> {a} -> {a}
    my.without = 
        (...ks) => __.pipe(
            ...ks.map(k => my.filter((rj, j) => j !== k))
        );


    //------ record update ------

    //.set : str -> a -> {a} -> {a}
    my.set = 
        (k, v) => r => my.write(k, v)(my.assign(r)({}));
    
    //.update : {a} -> {a} -> {a}
    my.update = 
        (...rs) => r => my.assign(r, ...rs)({});

    //.write : str -> a -> St({a}, {a})
    my.write = 
        (k, v) => r => {r[k] = v; return r}; 

    //.assign : str -> a -> St({a}, {a})
    my.assign = 
        (...rs) => r => Object.assign(r, ...rs);


    //------ sequential updates ------

    //         : {a -> b} -> {a} -> {b} 
    my.stream = 
        rf => typeof rf === 'function'
            ? r => rf(r)
            : r => my.map(f => __(f)(r))(rf);

    let stream = 
        rf => typeof rf === 'function'
            ? r => my.update(rf(r))(r)
            : r => my.update(
                my.map(v => __(v)(r))(rf)
            )(r);

    //.streamline : ...[{a -> a}] -> {a} -> {a}  
    my.streamline = 
        (...rfs) => __.pipe(...rfs.map(stream));

    
    //------ record iteration ------

    //.forEach : (a -> _) -> {a} -> Iter(a)
    my.forEach = 
        f => 
            r => my.keys(r).forEach(
                k => f(r[k], k)
            );
    
    //.reduce : ((a -> b), b) -> {a} -> b
    my.reduce = 
        (f, r) => q => 
            my.keys(q).reduce(
                (a, k) => f(a, q[k], k),
                typeof r !== 'undefined' ? r : {}
            );


    //------ record transformation ------
    
    //.apply : {a -> b} -> a -> {b} 
    my.apply = 
        r_f => 
            (...xs) => my.map(__.$(...xs))(r_f);

    //.map : (a -> b) -> {a} -> {b} 
    my.map = 
        (...fs) => q => 
            my.reduce(
                (r, qk, k) => __.do(_ => r[k] = __.pipe(...fs)(qk, k))(r),
                {}
            )(q);

    //.map2 : (a -> b -> c) -> {a} -> {b} -> {c}
    my.map2 = 
        f => 
            (r, q) => my.map(
                (rk, k) => f(rk, q[k], k)
            )(r);

    //.filter : (a -> bool) -> {a} -> {a} 
    my.filter = 
        f => r => {
            let sub = {};
            my.forEach((v, k) => f(v, k) && (sub[k] = v))(r);
            return sub;
        };


    //------ store function values ------
    
    //.compute : (a -> b, a -> str) -> a -> {b}
    my.compute = 
        (f=__.id, g=__.id) => __.pipe(
            __.map((...xs) => [f(...xs), g(...xs)]),
            my.fromPairs 
        );
 

    //------ key-value pairs ------

    //.toPairs : {a} -> [(a, str)]
    my.toPairs = 
        r => {
            let pairs = [];
            my.forEach(
                (rk, k) => pairs.push([rk, k])
            )(r);
            return pairs;
        };

    //.sortBy : (a -> a -> Bool, Bool) -> {a} -> [(a, str)] 
    my.sortBy = (ord, rev) => r => {
        let sorts = (x, y) => x < y ? -1 : (x > y ? 1 : 0),
            sign = m => o => m ? - o : o,
            order;
        // sortBy('!field') 
        if (typeof ord === 'string' && ord[0] === '!' 
            && typeof rev === 'undefined')
            return my.sortBy(ord.slice(1), true)(r);
        // sortBy('field')
        if (typeof ord === 'string') 
            order = ([xi, i], [yj, j]) => sign(rev)(sorts(xi[ord], yj[ord]));
        // sortBy(boolf) 
        else if (typeof ord === 'function')
            order = ([xi, i], [yj, j]) => sign(rev)(ord(xi, yj) ? -1 : 1)
        // sortBy()
        else
            order = ([xi, i], [yj, j]) => sign(ord)(sorts(i, j))
        return my.toPairs(r)
            .sort(order);
    }
    
    //.fromPairs : [(a, str)] -> {a} 
    my.fromPairs = 
        pairs => {
            let r = {};
            (pairs || []).forEach(
                ([rk, k]) => r[k] = rk
            );
            return r;
        };

    return my;
}

},{"./__":2}],11:[function(require,module,exports){
let __ = require('../__'),
    Nerve = require('./nerve'),
    set = require('./set'),
    record = require('../record'),
    {chain, cell} = require('./id');

//------ extend a functor `G: X -> Ab' to `NX' ------
/*
    instance G : (X => Ab) 
    where
        G.func :    (a > b) -> G a -> G b
        G.zero :    a -> G a 
        G.add :     G a -> G a -> G a
        G.scale :   num -> G a -> G a

    ------ natural transformations ------

    complex :   (X => Ab)   =>  (NX => Ab)*
                (X => Ab)*  =>  (NX => Ab)
                (X =<> Ab)  =>  (NX =<> Ab)
*/


module.exports = function (G, X) {

    let N = Nerve(X),
        NG = baseSpace(G, N); 

    if (G. func) 
        NG = cochainComplex(G, N, NG);

    if (G.cofunc)
        NG = chainComplex(G, N, NG);

    return NG;
}


//------ (X => Ab) -> (NX => Ab)* ------

function baseSpace (G, N) {

    let NG = record.new();

    let compute = NG.compute;

    NG.compute = 
        k => f => compute(
            f, 
            a => chain.id(a)
        )(N(k));

    NG.zero = 
        k => NG.compute(k)(
            a => G.zero(chain.cell(a))
        );

    NG.add2 = 
        NG.map2(G.add2);
    
    NG.add = 
        (...us) => us.reduce(NG.add2);

    NG.span = 
        (ks, as) => NG.add(
            ...as.map((ai, i) => NG.scale(ks[i])(ai))
        );

    NG.subt = 
        (u, v) => NG.add(u, NG.scale(-1)(v));

    NG.mult = 
        (...us) => us.reduce(NG.map2(
            (ua, va, a) => G.mult(ua, va)
        ));

    NG.scale = 
        s => NG.map(G.scale(s));

    NG.int = 
        NG.reduce((x, y) => x + y, 0);

    NG.inner =
       (u, v) => NG.int(NG.map2(G.inner)(u, v));

    NG.norm = 
        u => Math.sqrt(NG.inner(u, u));

    NG.get = 
        (u, a) => u[chain.id(a)];

    NG.set = 
        (u, a, ua) => { 
            u[chain.id(a)] = ua; 
            return u;
        };

    return NG;
}


//------ (X => Ab) -> Ch* ------

function cochainComplex (G, N, NG) {

    if (!NG) 
        NG = baseSpace(G, N);

    NG.cofunc = 
        (a, b) => G.func(chain.cell(b), chain.cell(a));


    NG.diff = 
        k => 
            u => __.range(k + 2)
                .map(j => NG.coface(j, k)(u))
                .reduce(NG.add2);

    NG.coface = 
        (j, k) => 
            u => NG.map(__.pipe(
                (_, a) => chain(a),
                a => [a, N.face(j)(a)],
                ([a, b]) => NG.cofunc(a, b)(u[chain.id(b)]),
                va => G.scale((-1)**j)(va)
            ))(NG.zero(k + 1));

    return NG;
}


//------ (X => Ab)* -> Ch ------

function chainComplex (G, N, NG) {

    if (!NG) 
        NG = baseSpace(G, N);

    NG.func = 
        (a, b) => G.cofunc(chain.cell(b), chain.cell(a));

    NG.face = 
        (j, k) => 
            u => NG.map(__.pipe(
                (_, b) => N.cofaces(j)(chain(b))
                    .map(a => NG.func(a, b)(u[chain.id(a)]))
                    .reduce(G.add2, G.zero(b)),
                vb => G.scale((-1)**j)(vb)
            ))(NG.zero(k - 1));

    NG.codiff = 
        k => 
            u => __.range(k + 1)
                .map(j => NG.face(j, k)(u))
                .reduce(NG.add2);

    //------ combinatorics ------

    let iprod = 
        a0 => u => as => u([a0, ...as]); 

    let zeta = 
        k => u => k === 0
            ? __.pipe(
                chain, 
                ([a]) => N
                    .cone(a)
                    .map(b => G.cofunc(a, b)(u([b])))
                    .reduce(G.add2) 
            )
            : __.pipe(
                chain,
                ([a0, a1, ...as]) => N
                    .intercone(a0, a1)
                    .map(b0 => zeta(k-1)(iprod(b0)(u))([a1, ...as]))
                    .reduce(G.add2)
            );

    NG.zeta = 
        k => u => NG.compute(k)(
            zeta(k)(as => u[chain.id(as)] || G.zero(as[as.length - 1]))
        );
    
    let last = 
        as => as[as.length - 1];

    let nu = 
        (a0, k) => v => k === 0
            ? ([]) => N
                .cone(a0)
                .map(b => G.cofunc(a0, b)(
                    G.scale(N.mu(a0, b))(v([b]))
                ))
                .reduce(G.add2)
            : (as) => N
                .intercone(a0, as[0])
                .map(b0 => G.cofunc(last(as), set.cap(b0, last(as)))(
                    G.scale(N.mu(a0, b0))(
                        v([a0, ...as].map(aj => set.cap(b0, aj)))
                    )
                ))
                .reduce(G.add2);

    NG.mu = 
        k => v => NG.compute(k)(
            __.pipe(
                chain, 
                as => as.reduce(
                    (u, aj, j) => nu(aj, k - j)(u),
                    bs => v[chain.id(bs)] || G.zero(bs[bs.length - 1]) 
                )([])
            )
        );

    return NG;

}

},{"../__":2,"../record":10,"./id":12,"./nerve":14,"./set":15}],12:[function(require,module,exports){
let __ = require('../__');

//------ cell ------

//       : str -> [I] 
let cell = 
    is => Array.isArray(is) 
        ? is 
        : is.split('.').filter(s => s!== '');

//      : [I] -> str
cell.id =  
    is => Array.isArray(is) 
        ? is.join('.') 
        : is;


//------ chain ------

//        : str -> [[I]]
let chain = 
    as => Array.isArray(as) 
        ? as 
        : as.split(' > ').map(cell);

//       : [[I]] -> str
chain.id =
    as => Array.isArray(as) 
        ? as.map(cell.id).join(' > ') 
        : as;

//         : [[I]] -> [I] 
chain.cell = 
    __.pipe(chain, ch => ch[ch.length - 1]);


//-------
module.exports = {cell, chain};

},{"../__":2}],13:[function(require,module,exports){
let set = require('./set'),
    nerve = require('./nerve'),
    complex = require('./complex'),
    id = require('./id');

module.exports = {set, nerve, complex, id};

},{"./complex":11,"./id":12,"./nerve":14,"./set":15}],14:[function(require,module,exports){
let __ = require('../__'),
    S = require('./set'),
    id = require('./id');

let {cell, chain} = id;


//------ Nerve type class ------ 

function Nerve (X) { 

    let N = 
        k => Ns[k] || [];
    
    let N0 = X.map(a => [a]),
        Ns = chains([N0]);

    N.face = 
        k => 
            as => [...as.slice(0, k), ...as.slice(k + 1)];

    N.cofaces = 
        k => 
            as => N(as.length)
                .filter(bs => S.eq(N.face(k)(bs), as));


    N.cone = 
        a => [a, ...X.filter(b => S.sup(a, b))]

    N.cocone = 
        b => [b, ...X.filter(a => S.sup(a, b))]

    N.intercone = 
        (a, c) => X.filter(b => S.geq(a, b) && !S.geq(c, b));

    N.interval = 
        (a, c) => X.filter(b => S.sup(a, b) && S.sup(b, c));

    N.mu = 
        (a, c) => S.eq(a, c)
            ? 1
            : [a, ...N.interval(a, c)]
                .map(b => - N.mu(a, b))
                .reduce((x, y) => x + y);


    return N;
}



//------ Nerve with cones & intervals in memory ------

Nerve.record = function (X) {

    let N = Nerve(X),
        _r = __.record();

    let cones = _r.compute(N.cone, cell.id)(X),
        cocones = _r.compute(N.cocone, cell.id)(X),
        intervals = _r.compute(__.xargs(N.interval), chain.id)(N(1)),
        intercones = _r.compute(__.xargs(N.intercone), chain.id)(N(1));
        
    let mu = _r.compute(__.xargs(N.mu), chain.id)
        ([...X.map(a => [a, a]), ...N(1)]);
    let c = _r.compute(
        b => cocones[cell.id(b)]
            .reduce((cb, a) => cb + mu[chain.id([a, b])], 0),
        cell.id
    )(X);

    N.cone = a => cones[cell.id(a)];
    N.cocone = b => cocones[cell.id(b)];
    N.interval = (a, c) => intervals[chain.id([a, c])];
    N.intercone = (a, c) => intercones[chain.id([a, c])];

    N.mu = (a, c) => mu[chain.id([a, c])];

    N.c = a => c[cell.id(a)];

    N.cofaces =  
        k => 
            bs => {
                let n = bs.length; 
                if ((k < 0) || (k > n)) {
                    return [];
                }
                else if (n === 0) {
                    return X.map(a => [a])
                } 
                else if (k === 0) {
                    return N.cocone(bs[0]).slice(1)
                        .map(a => [a, ...bs]);
                }
                else if (k === n) {
                    return N.cone(bs[n - 1]).slice(1)
                        .map(c => [...bs, c]);
                }
                else {
                    return N.interval(bs[k - 1], bs[k])
                        .map(b => [...bs.slice(0, k), b, ...bs.slice(k)]);
                }
            }

    return N;

}


module.exports = 
    __.pipe(
        __.map(cell),
        Nerve.record
    );


//-------- compute the nerve -------

function chains (N) {

    return N[N.length - 1].length 
        ? chains([
            ...N, 
            N[N.length - 1]
                .map(
                    as => N[0]
                        .filter(([b]) => S.sup(as[as.length - 1], b))
                        .map(([b]) => [...as, b])
                )
                .reduce((xs, ys) => [...xs, ...ys])
        ])
        : N.slice(0, N.length - 1);
};

},{"../__":2,"./id":12,"./set":15}],15:[function(require,module,exports){
let __ = require('../__');


//------ cast to set: filter and order ------

let S =
    ([i, ...is], ord) => typeof i !== 'undefined' 
        ? S.cup(S(is), [i], ord) 
        : [];


//------ equality ------

let arrEq = 
    ([i, ...is], [j, ...js]) => S.eq(i, j)
        ? (is.length || js.length ? arrEq(is, js) : true)
        : false;

S.eq = 
    (a, b) => Array.isArray(a) && Array.isArray(b)
        ? arrEq(a, b)
        : a === b;


//------ membership ------

S.in = 
    (i, [j, ...js]) => typeof j !== 'undefined'
        ? (S.eq(i, j) ? true : S.in(i, js))
        : false;


//------ boolean algebra ------

S.cap = 
    (a, b) => a.filter(i => S.in(i, b));

S.cup = 
    (a, b, ord) => [...a, ...b.filter(j => !S.in(j, a))]
        .sort(ord);

S.diff = 
    (a, b) => a.filter(i => !S.in(i, b));


//------ order relations --------

S.leq = 
    (a, b) => S.eq(a, S.cap(a,b));

S.geq = 
    (a, b) => S.eq(S.cap(a,b), b);

S.sub = 
    (a, b) => S.leq(a, b) && !S.eq(a, b);

S.sup = 
    (a, b) => S.geq(a, b) && !S.eq(a, b);


//------ cap-closure ------

S.closure = 
    op => as => as.length
        ? [ 
            ...as,
            ...S.closure(op)(S(
                __.logs('closure:')(
                as
                    .map(
                        (a, i) => as.slice(i+1)
                            .map(b => op(a, b))
                            .filter(c => ! S.in(c, as))
                    )
                    .reduce((xs, ys) => [...xs, ...ys])
                )
            ))
        ]
        : [];

S.capClosure = S.closure(S.cap);

module.exports = S;

},{"../__":2}]},{},[1])(1)
});
