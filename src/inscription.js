let query = 
    str => document.querySelector(str);

let mailreg = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/


let send = 
    () => {
        let formData = new FormData(query('form')),
            data = Object.fromEntries(formData);
        ajax(data)
            .post('/inscription')
            .then(res => res === 'ok' 
                ? thankYou(data.email)
                : error()
            );
    };

let thankYou = 
    email => { 
        let span = document.createElement('h4');
        span.innerHTML = 
            `Merci! Ta demande d'inscription a bien été prise en compte, `
        +   `un message a été envoyé à: ${email} <br><br>`
        +   `<strong>N.B: Pense à vérifier tes courriers indésirables!</strong>` ;
        query('form button').replaceWith(span);
        return 0;
    };

let error = 
    () => alert('Oups! Quelque chose ne va pas. '
        + 'Corrige le formulaire ou écris-nous à alumniscupinfo@gmail.com');


let bindForm = 
    () => { 
        let form = query('form'); 
        let onSubmit = e => {
            e.preventDefault();
            send();
        };
        form.addEventListener('submit', onSubmit);
    };

window.addEventListener("load", bindForm);

