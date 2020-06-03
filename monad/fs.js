let fs = require('fs').promises,
    path = require('path');

let Monad = require('./monad'),
    {Async} = require('./instances'),
    State = require('./state'),
    __ = require('./__'),
    _r = __.r;

let sh = {};

sh.read = file => 
    wd => fs.readFile(path.join(wd, file), 'utf-8')
        .then(d => [d, wd]);

sh.write = (file, data) => 
    wd => fs.writeFile(path.join(wd, file), data)
        .then(r => [r, wd]);

sh.append = (file, data) => 
    wd => fs.appendFile(path.join(wd, file), data)
        .then(r => [r, wd]);

sh.cd = (dir) => 
    wd => Async.return([null, path.join(wd, dir)]);

sh.ls = (dir = '') => 
    wd => fs.readdir(path.join(wd, dir))
        .then(ls => [ls, wd]);

sh.run = st => wd => st(wd || process.cwd());


let Sh = Monad({
    ..._r.pluck('fmap', 'unit', 'join')(State.T(Async)), 
    '... -> M a': {
        read:   sh.read,
        write:  sh.write,
        cd:     sh.cd,
        ls:     sh.ls
    },
    'M a -> ... -> b': {
        run: sh.run,
        eval: st => __(sh.run(st), Async.fmap(([r, s]) => r)), 
        exec: st => __(sh.run(st), Async.fmap(([r, s]) => s)) 
    }
});


State.json = Monad.extends(State.T(Async), {
    '... -> M a': (() => {
        let read = () => n => 
            fs.readFile(n).then(JSON.parse).then(s => [s, s]);
        let reads = f => n => 
            read(n).then(([s, _]) => [f(s), s]);
        let write = s => n => 
            fs.writeFile(n, JSON.parse(s));
        let writes = g => n => 
            read(n).then(([r, s]) => write(g(s))(n));
        return {
            read, reads, write, writes
        };
    })()
});

module.exports = Sh;
