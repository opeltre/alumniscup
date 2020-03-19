let mariadb = require('mariadb');

let auth = {
    user: 'alumni',
    password: process.env.DB_PWD,
    database: process.env.DB,
    socketPath: '/run/mysqld/mysqld.sock'
};

let fields = [ 
    'ecole',
    'equipage',
    'prenom',
    'nom',
    'email',
    'telephone',
    'tours', 
    'srh'
];

let sqlArray = 
    arr => "(" + arr.join(", ") + ")"; 

let insert = 
    `INSERT INTO inscriptions ${sqlArray(fields)} ` 
    + `VALUES ${sqlArray(fields.map(() => "?"))}`  


let get = 
    
    (req, res) => {

        mariadb.createConnection(auth)
            .then(c => c.query("SELECT * FROM inscriptions")
                .then(rows => res.send(JSON.stringify(rows)))
                .catch(console.log)
            );
    };


let put = 

    (req, res) => { 

        let values = fields.map(k => req.body[k]);
        mariadb.createConnection(auth)
            .then(c => c.query(insert, values)
                .then(() => res.send('ok'))
                .catch(() => res.send('nok'))
            );
    };


module.exports = {put, get}; 
