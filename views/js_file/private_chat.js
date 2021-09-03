// GRAB THE USERNAME
const username= sessionStorage.getItem('username');

// GRAB THE URL
const url = window.location.pathname;

// GET THE LAST PARAM OF THE URL
const user = url.split('/')[(url.split('/').length - 1)];

const socket = io('http://localhost:8000');

// THIS WILL HOLD ALL THE USER WHICH ARE CURRENTLY CONNECTED TO THE SERVER WHETHER AFTER OR BEFORE OUR CONNECTION
let user_array = [];

const message = document.getElementById('message');

const users_list = document.getElementById('users_list');

window.onload= function(){
	document.getElementById('admin_name').innerText = username;
	socket.emit('connection_succesfull' , username);
}


// IF WE ARE HERE BECAUSE WE ACCEPTED THE REQUEST OF OTHER PARTICIPANT
if(sessionStorage.getItem('request') != undefined || sessionStorage.getItem('request') != null){
	if(sessionStorage.getItem('request') != user){
		// SINCE WE ARE STORING THE INFORMATION OF THE SENDER WHO REQUESTED US TO HAVE A PRIVATE CHAT THEN THIS MEANS THAT THE USER WAS PREVIOUSLY THE RECIEVER OF ANYONE ELSE REQUEST BUT NOW HE IS THE SENDER OF THE REQUEST
		/*
			user = REQUEST SENDER NAME
			username = REQUEST RECIEVER NAME
		*/
		socket.emit('private' , user , username);
		socket.emit('request_reciever_private_chat_left' , sessionStorage.getItem('request') , username);
	}
	
	else{
		console.log('In the else condition to join the room');
		// THAT MEANS WE ARE HERE BECAUSE WE HAVE ACCEPTED THE REQUEST OF THE SENDER
		/*
			user = NAME OF THE REQUEST SENDER
			username = NAME OF THE REQUEST RECIEVER
		*/
		socket.emit('join_room' , user , username);
	}
}
else{

	/*
		user = NAME OF THE REQUEST ACCEPTOR
		username = NAME OF THE REQUEST SENDER
	*/

	// IF WE ARE HERE NOT BECAUSE WE ACCEPTED THE REQUEST OF ANY OTHER PARTICIPANT AND THIS IS OUR INITIAL LOAD OF THIS URL

	if(sessionStorage.getItem('request_acceptor_name') == null || sessionStorage.getItem('request_acceptor_name') == undefined){

		// THIS MEANS THAT WE ARE SENDING THE REQUEST TO THE USER FOR THE VERY FIRST TIME

		// THIS FUNCTION WILL SEND THE NOTIFICATION TO THE SELECTED USER FOR A PRIVATE CHAT WITH YOU
		socket.emit('private' , user , username);
	}
	else{
		// THIS MEANS BEFORE THIS REQUEST WE WERE ALREADY CONNECTED TO ANY OF THE PARTICIPANT FOR A PRIVATE CHAT AS A SENDER
		socket.emit('sender_private_chat_left' , username , sessionStorage.getItem('request_acceptor_name') , `${username} has left the chat`);
		socket.emit('private' , user, username);
	}
}

// THIS FUNCTION WILL REMOVE THE ALERTS(REQUEST);
const removeAlert = (data)=> {
	if(document.getElementsByClassName('alert') != null || document.getElementsByClassName('alert') != undefined){
		document.getElementsByClassName('alert')[(document.getElementsByClassName('alert').length-1)].remove();
	}
	/*
		data = request sender
		username = request reciever
	*/
	socket.emit('request_rejected' , data , username);
}

const acceptRequest = (data) => {

	// THIS WILL CONFIRM THAT THE USER IS A REQUEST RECIEVER
	if(sessionStorage.getItem('request') != undefined || sessionStorage.getItem('request') != null){
		socket.emit('accept' ,user , username , data , 'request reciever has left');
	}

	else{
		// THIS WILL CONFIRM THAT THE USER IS A REQUEST SENDER
		// BUT NOW WE ARE ACCEPTING A REQUEST FROM ANOTHER SENDER WHICH WILL CONVERT IT TO  A RECIEVER
		if(sessionStorage.getItem('request_acceptor_name') != null || sessionStorage.getItem('request_acceptor_name') != undefined){
			socket.emit('accept' , username , user , data , 'request sender has left')
			sessionStorage.removeItem('request_acceptor_name');		
		}
	}

	// REMOVE ALL THE NOTIFICATIONS
	for(let i=0 ; i<document.getElementsByClassName('alert').length ; i++){
		document.getElementsByClassName('alert')[i].remove();
	}

	sessionStorage.setItem('request' , data);

	window.location.href = `/chat-app/${data}`;
}

// THIS FUNCTION WILL RECIEVE THE NOTIFICATION IS ANYONE HAS REQUESTED FOR A PRIVATE CHAT WITH YOU
socket.on('private_chat' , data=>{
	
	const div_el = document.createElement('DIV');
	div_el.setAttribute('class', 'alert');

	div_el.innerHTML = `<div><p id='alert_para'><span class='name'>${data}</span> requested you for a private chat</p><button class='accept' onclick=acceptRequest("${data}")>Accept</button><button id='alert_cross' onclick='removeAlert('${data}')'>Decline</button></div>`;

	document.getElementsByTagName('body')[0].appendChild(div_el);
});

socket.on('request_accepted' , response=>{

	// IF THE USER HAS ACCEPTED THE REQUEST STORE THE NAME OF THE PARTICIPANT IN THE SESSION
	sessionStorage.setItem('request_acceptor_name' , user);

	// JOIN THE SENDER TO A UNIQUE ROOM
	/*
		username = NAME OF THE REQUEST SENDER
		user = NAME OF THE REQUEST RECIEVER
	*/
	socket.emit('join_room' , username , user);

	const div_el = document.createElement('DIV');
	div_el.setAttribute('class' , 'accept_notification');

	div_el.innerHTML = `<p>${response}</p>`;

	document.getElementsByTagName('body')[0].appendChild(div_el);

	setTimeout(()=>{
		if(document.getElementsByClassName('accept_notification')[0] != undefined || document.getElementsByClassName('accept_notification')[0] != null){
			document.getElementsByClassName('accept_notification')[0].remove();
		}
	},3000)
});

socket.on('request_rejected_notification' , message=>{
	const div_el = document.createElement('DIV');
	div_el.setAttribute('class' , 'req_reject');

	div_el.innerHTML = `<p class='req_reject_message'>${message}</p>`;

	document.getElementsByTagName('body')[0].appendChild(div_el);

	setTimeout(()=>{
		if(document.getElementsByClassName('req_reject')[0] != null || document.getElementsByClassName('req_reject')[0] != undefined){
			document.getElementsByClassName('req_reject')[0].remove();
		}
	},3000);
})

socket.on('recieve_private_message' , private_message=>{
	const date_object = new Date();

	const div_el = document.createElement('DIV');
	div_el.setAttribute('class', 'reciever_container');

	if(date_object.getMinutes() >= 10){
		div_el.innerHTML = `<div class='new_message'><li class='reciever'>${private_message}</li><div class='child_container'><p class='recieved_time'>${date_object.getHours()}:${date_object.getMinutes()}</p></div></div>`;
	}
	else{
		div_el.innerHTML = `<div class='new_message'><li class='reciever'>${private_message}</li><div class='child_container'><p class='recieved_time'>${date_object.getHours()}:0${date_object.getMinutes()}</p></div></div>`;
	}

	message.appendChild(div_el);
});

socket.on('sender_private_chat_left_notification' , message=>{
	console.log(message);
	const div_el = document.createElement('DIV');

	div_el.setAttribute('class' , 'disconnect');

	div_el.innerHTML = `<p class='disconnect_message'>${message}</p>`

	document.getElementsByTagName('body')[0].appendChild(div_el);

	sessionStorage.removeItem('request');

	setTimeout(()=>{
		if(document.getElementsByClassName('disconnect')[0] != undefined || document.getElementsByClassName('disconnect') != null){
			document.getElementsByClassName('disconnect')[0].remove();
		}
	},3000);
});

socket.on('request_reciever_private_chat_left_notification' , message=>{
	const div_el = document.createElement('DIV');

	div_el.setAttribute('class' , 'disconnect');

	div_el.innerHTML = `<p class='disconnect_message'>${message}</p>`;

	document.getElementsByTagName('body')[0].appendChild(div_el);

	sessionStorage.removeItem('request_acceptor_name');

	setTimeout(()=>{
		if(document.getElementsByClassName('disconnect')[0] != undefined || document.getElementsByClassName('disconnect') != null){
			document.getElementsByClassName('disconnect')[0].remove();
		}
	},3000);
});

socket.on('request_left' , data=>{
	console.log(data);
	const div_el = document.createElement('DIV');

	div_el.setAttribute('class' , 'disconnect');

	div_el.innerHTML = `<p class='disconnect_message'>${data}</p>`;

	document.getElementsByTagName('body')[0].appendChild(div_el);

	sessionStorage.removeItem('request');

	setTimeout(()=>{
		if(document.getElementsByClassName('disconnect')[0] != undefined || documents.getElementsByClassName('disconnect')[0] != null){
			document.getElementsByClassName('disconnect')[0].remove();
		}
	},3000);
})

socket.on('previous_connection' ,data=>{
	user_array.push(data);

	const div_el = document.createElement('DIV');

	if(data == user){
		div_el.setAttribute('id' , 'personal');

		div_el.innerHTML = `<img src='/participant.png' class='participant_image' alt='Participant' /><li class='active_users'><a href='/chat-app/${data}'>${data}</a></li>`;

		users_list.appendChild(div_el);
	}
	else{
		div_el.setAttribute('class' , 'new_users');
		div_el.innerHTML = `<img src='/participant.png' class='participant_image' alt='Participant' /><li class='active_users'><a href='/chat-app/${data}'>${data}</a></li>`;
		users_list.appendChild(div_el);
	}
});

// WHEN NEW CONNECTION ARE MADE TELL THEM ABOUT YOUR CONNECTION FROM THE SERVER
socket.on('new_connection' , (new_user , new_connection_id)=>{
	user_array.unshift(new_user);

	if(new_user == user){
		const div_el = document.createElement('div');

		div_el.setAttribute('id' , 'personal');

		div_el.innerHTML = `<img class='participant_image' src='/participant.png' alt='Participant' /><li class='active_users'><a href='/chat-app/${new_user}'>${new_user}</a></li>`;

		users_list.insertBefore(div_el , users_list.childNodes[0]);
	}

	else{
		const div_el = document.createElement('DIV');

		div_el.setAttribute('class' , 'new_users');
		
		div_el.innerHTML = `<img class='participant_image' src='/participant.png' alt='Participant' /><li class='active_users'><a href='/chat-app/${new_user}'>${new_user}</a></li>`;

		users_list.insertBefore(div_el , users_list.childNodes[0]);
	}

	socket.emit('my_connection' , username,new_connection_id);
});

socket.on('leaving' , data=>{
	// REMOVE THE ELEMENT FROM THE ACTIVE USERS ARRAY
	user_array.splice(user_array.indexOf(data) , 1);

	let found = false;

	document.querySelectorAll('.new_users').forEach((item , index)=>{
		if(item.textContent == data){
			document.getElementsByClassName('new_users')[index].remove();
			found = true;
		}
	});

	if(!found){
		document.getElementById('personal').remove();
	}
});

const sendClick = () => {

	if(sessionStorage.getItem('request_acceptor_name') == user){

		const value = document.getElementById('message_div').textContent;

		if(value != ''){

			document.getElementById('message_div').textContent = '';

			const date_object = new Date();

			const div_el = document.createElement('DIV');
			div_el.setAttribute('class','sender_container');

			if(date_object.getMinutes() >= 10){

				div_el.innerHTML = `<li class='sender'>${value}</li><p class='send_time'>${date_object.getHours()}:${date_object.getMinutes()}</p>`;

				message.appendChild(div_el);
			}
			else{
				div_el.innerHTML = `<li class='sender'>${value}</li><p class='send_time'>${date_object.getHours()}:0${date_object.getMinutes()}</p>`

				message.appendChild(div_el);
			}

			// user = NAME OF THE REQUEST RECIEVER SINCE WE ARE FROM THE SIDE OF THE REQUEST SENDER
			socket.emit('private_message' , value , username , user);

		}
	}
	else{
		if(sessionStorage.getItem('request') == user){
			const value = document.getElementById('message_div').textContent;

			if(value != ''){

				document.getElementById('message_div').textContent = '';

				const date_object = new Date();

				const div_el = document.createElement('DIV');
				div_el.setAttribute('class','sender_container');

				if(date_object.getMinutes() >= 10){

					div_el.innerHTML = `<li class='sender'>${value}</li><p class='send_time'>${date_object.getHours()}:${date_object.getMinutes()}</p>`;

					message.appendChild(div_el);
				}
				else{
					div_el.innerHTML = `<li class='sender'>${value}</li><p class='send_time'>${date_object.getHours()}:0${date_object.getMinutes()}</p>`

					message.appendChild(div_el);
				}

				// IS THE REQUEST SENDER NAME SINCE WE ARE SENDING THE MESSAGE FROM THE REQUEST ACCEPTOR SIDE
				socket.emit('private_message' , value , user , username);

			} 
		}
	}
}

document.getElementById('send_btn').addEventListener('click' , sendClick);