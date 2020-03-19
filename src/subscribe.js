let query = 
    str => document.querySelector(str);

let mailreg = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/

let subscribe = 
    () => {
        let email = query('#rsvp input').value; 
        if (mailreg.test(email))
            ajax({email})
                .post('/subscribe')
                .then(thankYou);
    };

let thankYou = 
    res => { 
        let span = document.createElement('span');
        span.innerHTML = 'Merci!';
        query('#subscribe').replaceWith(span);
        return 0;
    };

