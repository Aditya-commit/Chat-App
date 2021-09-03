const handleLogin = () => {
	let value = document.getElementById('username_input').value;

	if(value == ''){
		alert('Can\'t login empty username');
	}
	else{
		const xhr = new XMLHttpRequest();

		xhr.open('POST' , '/login_data' , true);
		xhr.setRequestHeader('Content-Type' , 'application/json');
		xhr.onload = function(response){
			if(this.responseText == 'ok'){
				sessionStorage.setItem('username', value);
				window.location.href='http://localhost:8000/chat-app'
			}
		}
		xhr.send(JSON.stringify({'username' : value}));
	}

	document.getElementById('username_input').value = '';

}

document.getElementById('login_btn').addEventListener('click' , handleLogin);