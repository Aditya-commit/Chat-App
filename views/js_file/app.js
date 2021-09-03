// BUG : WHEN WE ARE ON THE PRIVATE CHAT ROOM THEN THE NOTIFICATION IS NOT GOING TO ANY OTHER PARTICIPANT WHO ARE IN THE GROUP CHAT

const socket = io('http://localhost:8000/');

// THIS WILL CONTAIN ALL ACTIVE USERS
let users_array = [];

const users_list = document.getElementById('users_list')

window.onload = function(){
	const my_name = sessionStorage.getItem('username');
	
	if(my_name == null || my_name == undefined){
		window.location.href='http://localhost:8000';
	}
	else{
		
		document.getElementById('admin_name').innerText = my_name;

		socket.emit('connection_succesfull' , my_name);
	}
}

let message_list = document.getElementById('message');

// WHEN NEW CONNECTION ARE MADE TELL THEM ABOUT YOUR CONNECTION FROM THE SERVER
socket.on('new_connection' , (new_user , new_connection_id)=>{
	users_array.unshift(new_user);

	const div_el = document.createElement('DIV');

	div_el.setAttribute('class', 'new_user');

	// ADDING THE NEW CONNECTION TO THE TOP OF THE USER LIST
	let new_user_html = '';
	div_el.innerHTML = `<div class='new_users'><img class='participant_image' src='./participant.png' alt='Participant' /><li class='active_users'><a href='/chat-app/${new_user}'>${new_user}</a></li></div>`;

	users_list.insertBefore(div_el , users_list.childNodes[0]);

	socket.emit('my_connection' , sessionStorage.getItem('username'),new_connection_id);
});

const removeAlert = (data) => {
	if(document.getElementsByClassName('alert') != null || document.getElementsByClassName('alert') != undefined){
		document.getElementsByClassName('alert')[(document.getElementsByClassName('alert').length-1)].remove();
	}
	/*
		data = request sender
		username = request reciever
	*/
	socket.emit('request_rejected', data , sessionStorage.getItem('username'));
}

const acceptRequest = (data) => {
	// EMMITING AN EVENT TO THE USER
	// SENDING THE NAME OF THE REQUESTED USER AND THE USER ACCEPTED THE DATA BACK TO THE SERVER

	// username = who the reciever is(the use himself)
	// data= THE REQUEST SENDER
	socket.emit('accept' , data ,sessionStorage.getItem('username') ,'nothing', 'initial requeset accept');
	for(let i=0 ; i<document.getElementsByClassName('alert').length ; i++){
		document.getElementsByClassName('alert')[i].remove();
	}

	sessionStorage.setItem('request' , data);

	window.location.href=`/chat-app/${data}`;
}

socket.on('private_chat' , data=>{

	const div_el = document.createElement('DIV');
	
	div_el.setAttribute('class', 'alert');

	div_el.innerHTML = `<div><p id='alert_para'><span class='name'>${data}</span> requested you for a private chat</p><button class='accept' onclick=acceptRequest("${data}")>Accept</button><button id='alert_cross' onclick=removeAlert("${data}")>Decline</button></div>`;

	document.getElementsByTagName('body')[0].appendChild(div_el);
});

socket.on('previous_connection', data=>{
	users_array.push(data);
	users_list.innerHTML += `<div class='new_users'><img class='participant_image' src='./participant.png' alt='Participant' /><li class='active_users'><a href='/chat-app/${data}'>${data}</a></li></div>`
});

socket.on('message_pass' , (message , sender_name)=>{
	let date_object = new Date();

	if(date_object.getMinutes() >= 10){
		message_list.innerHTML += `<div class='reciever_container'><div class='new_message'><li class='reciever'>${message}</li><div class='child_container'><p class='sender_name'>${sender_name}</p><p class='recieved_time'>${date_object.getHours()}:${date_object.getMinutes()}</p></div></div></div>`
	}
	else{
		message_list.innerHTML += `<div class='reciever_container'><div class='new_message'><li class='reciever'>${message}</li><div class='child_container'><p class='sender_name'>${sender_name}</p><p class='recieved_time'>${date_object.getHours()}:0${date_object.getMinutes()}</p></div></div></div>`
	}

	// message_list.scrollTop = document.getElementsByClassName('reciever_container')[(document.getElementsByClassName('reciever_container').length-1)].offsetHeight + offsetTop
});

socket.on('leaving' , data=>{
	// REMOVE THE ELEMENT FROM THE ACTIVE USERS ARRAY
	users_array.splice(users_array.indexOf(data) , 1);

	document.querySelectorAll('.new_users').forEach((value , index)=>{
		if(value.textContent == data){
			document.getElementsByClassName('new_users')[index].remove();
		}
	});
});

// THIS FUNCTION WILL GRAB WHICH USER IS TYPING
socket.on('user_typing' , data=>{
	if(document.getElementsByClassName('typing')[0] == undefined){
		for(let i=0 ; i<document.querySelectorAll('.new_users').length ; i++){
			if(document.querySelectorAll('.new_users')[i].textContent == data){
				const p = document.createElement('P');
				p.setAttribute('class' , 'typing');
				p.innerText = 'typing...';
				document.querySelectorAll('.new_users')[i].appendChild(p);
				break;
			}
			else{
				continue;
			}
		}
		setTimeout(()=>{
			document.getElementsByClassName('typing')[0].remove();
		},3000);
	}
});

// THIS FUNCTION WILL SEND THE NOTIFICATION TO ALL THE PARTICIPANT IF THE USER IS TYPING
const typing = () => {
	socket.emit('typingIndication' , 'typing');
}


// SENDING THE TYPING IDICATION TO ALL THE PARTICIPANT IF THE USER IS TYPING
const text_typing = document.getElementById('message_div')
text_typing.addEventListener('input' , typing)

const sendClick = () => {
	let value = document.getElementById('message_div').textContent;

	if(value != ''){

		document.getElementById('message_div').textContent = '';

		const date_object = new Date();

		if(date_object.getMinutes() >= 10){

			message_list.innerHTML += `<div class='sender_container'><li class='sender'>${value}</li><p class='send_time'>${date_object.getHours()}:${date_object.getMinutes()}</p></div>`
		}
		else{
			message_list.innerHTML += `<div class='sender_container'><li class='sender'>${value}</li><p class='send_time'>${date_object.getHours()}:0${date_object.getMinutes()}</p></div>`
		}
		socket.emit('message' , value , sessionStorage.getItem('username'));

	}
}

let btn = document.getElementById('send_btn');
btn.addEventListener('click' , sendClick);