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

let csvRow = 
    row => row.join('\t\t,') + '\n';

let csv = 
    rows => csvRow(fields) + rows.map(r => csvRow(
        fields.map(f => r[f].replace('\t', ''))
    ));


let get = 
    
    (req, res) => {

        mariadb.createConnection(auth)
            .then(c => c.query("SELECT * FROM inscriptions")
                .then(rows => req.path === '/crews' 
                    ? res.send(JSON.stringify(rows))
                    : res.end(csv(rows))
                )
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
