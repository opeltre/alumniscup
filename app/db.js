let Sh = require('../monad/fs'),
    db = 'db/equipages.json';

let get = (req, res) => {
    Sh().read(db)
        .eval()
            .then(data => res.send(data))
            .catch(console.error);
};

let put = (req, res) => {
    Sh().read(db)
        .fmap(JSON.parse)
        .fmap(rows => [...rows, req.body])
        .fmap(JSON.stringify)
        .bind(r => Sh().write(db, r)())
        .run()
            .then(() => {
                console.log('=== signed up ===');
                console.log(req.body);
                res.send('ok');
            })
            .catch(err => {
                console.log('=== trying to sign up ===')
                console.log(req.body);
                console.log(err);
                res.send('nok');
            });
};

module.exports = {get, put};
