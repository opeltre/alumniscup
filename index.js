let express = require('express'),
    bodyParser = require('body-parser'),
    fs = require('fs'),
    path = require('path');

let mailer = require('./app/mailer'),
    crews = require('./app/db');


let app = express(); 
app.use(bodyParser.json());

let sendFile = name => 
    (req, res) => res.sendFile(path.join(__dirname, name));


//--- index ---

app.get('/', sendFile('html/index.html'));


//--- inscription ---

app.get('/inscription', sendFile('html/inscription.html'));

app.post('/inscription', (req, res) => {
    crews.put(req, res);
    mailer.signup(req.body);
});

app.get('/crews', crews.get);

app.get('/equipages/csv', crews.get);

app.get('/equipages', sendFile('html/equipages.html'));


//--- subscribe ---

let subscribe = 
    (req, res) => {
        mailer.subscribe(req.body.email);
        res.send('ok!');
    }

app.post('/subscribe', subscribe);


//--- static service ---

staticDirs = ['img', 'style', 'html', 'fonts', 'src'];

staticDirs.forEach(
    dir => app.use('/'+ dir, express.static(dir))
);


//--- 

app.listen(8080);
