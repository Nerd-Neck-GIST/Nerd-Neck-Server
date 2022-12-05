var usernameInput = document.querySelector('#username');
var username;

function createDynamicURL()
{
    username = usernameInput.value;
    console.log(username)

    if(username == ''){
        // ignore if username is empty
        return;
    }

    //Forming the variable to return

    return username;
}

function RedirectURL()
{
    window.location= createDynamicURL();
}