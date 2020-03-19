let nodemailer = require('nodemailer'),
    fs = require('fs'),
    path = require('path'),
    log = x => {console.log(x); return x};

let recipients = [
    'opeltre@gmail.com',
    'charlesarrighi3@gmail.com',
    'swann.scd@gmail.com',
    'journe.victor@gmail.com'
];

let acinfo = 'alumniscupinfo@gmail.com';

let [mailCoupe, mailTour] = ['Coupe', 'Tour']
    .map(str => path.join(__dirname, '../comm/inscription'+ str + '.txt'))
    .map(str => fs.readFileSync(str, 'utf8'));

let rib = 
    path.join(__dirname, '../comm/ibanAlumniSailing.pdf');

let transport = {
    host: 'ssl0.ovh.net',
    port: 465,
    auth: {
        user: process.env.MAIL,
        pass: process.env.MAIL_PWD
    }
};

let transporter = nodemailer
    .createTransport(transport)

transporter
    .verify()
    .then(log,log);

let subscribe = 
    address => {
        transporter
            .sendMail({
                to: recipients.join(','),
                from: 'alumniscupinfo@gmail.com',
                replyTo: address,
                subject: "Alumni's Cup: pêche au mail",
                text: "Ca mord!\n" + address + " veut être tenu.e au courant!"
            })
            .then(log);
    }


let signup = 

    data => {
        console.log(data)

        data.tarif = 
            data.tours === "1+2"
                ? (data.srh === 'oui' ? "400€" : "1250€")
                : (data.srh === 'oui' ? "275€" : "700€");
        
        let substitute = 
            (...fields) => str => fields.reduce(
                (s, f)=> s.replace(`*${f}*`, data[f]), 
                str
            );

        let text = 
            substitute('prenom', 'tarif', 'tours')(
                data.tours === "1+2" ? mailCoupe : mailTour 
            );

        let message = { 
            to: data.email, 
            from: process.env.MAIL,
            replyTo: acinfo,
            subject: "Inscription Alumni's Cup",
            text 
        }   
        
        if (data.tours === "1+2") 
            message.attachments = 
                [{ 
                    filename: "ibanAlumniSailing.pdf",
                    path: rib
                }];

        transporter
            .sendMail(message)
            .then(log);

    }



module.exports = {subscribe, signup};
