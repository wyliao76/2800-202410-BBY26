const form = document.getElementById('form-login')
form.addEventListener('submit', (e) => {
    e.preventDefault()
    const formData = new FormData(form)
    const data = {}
    formData.forEach((value, key) => {
        data[key] = value
    })

    return axios('/login', {
        method: 'post',
        headers: {
            'Content-Type': 'application/json',
        },
        data: data,
    })
        .then(() => {
            return window.location.href = '/'
        })
        .catch((err) => {
            // console.log(err); 
            // const message = err.response.data.msg.details[0].message
            // const key = err.response.data.msg.details[0].context.key
            // displayErrorMessage(message, key)
        })
})

// Display error message below the corresponding form field
function displayErrorMessage(message, key) {
    document.querySelectorAll('.invalid-feedback').forEach((elem) => {
        elem.innerHTML = "";
    })
    document.querySelectorAll('.login-input').forEach((elem) => {
        elem.value = "";
        elem.classList.remove('is-invalid');
    })

    const elem = document.querySelector(`input[name=${key}]`);
    const messageElem = document.getElementById(`${key}-feedback`);
    messageElem.innerHTML = `<p>${message}</p>`;
    elem.classList.add('is-invalid');
}
