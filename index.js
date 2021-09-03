const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const multer = require('multer');
const upload = multer();

const httpServer = require('http').createServer(app);

const io = require('socket.io')((httpServer) , {
	cors: {
		origin : 'http://localhost:8000'
	}
})

let disconnecting_user;

app.use(express.static('views'));

// MAPPING THE EJS TEMPLATE ENGINE TO ".html" FILE
app.engine('html' , require('ejs').renderFile);

// create application/json parser
var jsonParser = bodyParser.json();

var urlencoded = bodyParser.urlencoded({extended : true});

app.get('/' , (req , res)=>{
	res.render('index.html');
})

app.get('/not-supported' , (req, res)=>{
	res.render('not_supported.html');
});

app.get('/chat-app/new' , (req , res)=>{
	res.render('new_html.html');
});

app.get('/chat-app/:name' , (req , res)=>{
	res.render('private_chat.html');
});

app.get('/chat-app' , (req , res)=>{

	const user_agent = (req.rawHeaders[(req.rawHeaders.indexOf('User-Agent'))+1]);
	const regex = /(Chrome)|(Safari)|(Firefox)/g;

	if((user_agent.match(regex)) != null){
		res.render('app.html')
	}
	else{
		res.redirect('/not-supported');
	}
});

app.post('/login_data' , jsonParser , (req , res)=>{
	if(req.body.username != undefined){
		res.status(200).send('ok');
	}
});

io.on('connection', socket=>{

	socket.on('connection_succesfull' , data=>{
		socket.data.username = data;
		socket.broadcast.emit('new_connection' , data , socket.id);
	});

	socket.on('private' , (data,admin)=>{
		async function getSockets(){
			const sockets = await io.fetchSockets();
			sockets.every((users_socket , index)=>{
				if(users_socket.data.username == data){
					// SEND THE MESSAGE TO THE PARTICIPANT TO JOIN THE PRIVATE CHAT ROOM
					socket.to(users_socket.id).emit('private_chat' , admin);
					return false;
				}
				else{
					return true;
				}
			});
		}
		getSockets();
	});

	socket.on('typingIndication' , data=>{
		socket.broadcast.emit('user_typing' , socket.data.username);
	});

	socket.on('private_message' , (message , request_sender_name , request_reciever_name)=>{
		
		socket.in(`${request_sender_name}_${request_reciever_name}`).emit('recieve_private_message' , message);
	});


	socket.on('join_room' , (request_sender_name , request_reciever_name)=>{
		socket.join(`${request_sender_name}_${request_reciever_name}` , socket.id);
	});

	socket.on('sender_private_chat_left' , (request_sender_name , request_reciever_name , message)=>{

		socket.leave(`${request_sender_name}_${request_reciever_name}` , socket.id);
		
		async function getSockets(){
			const sockets = await io.fetchSockets();
			sockets.every((value,index)=>{
				if(value.data.username == request_reciever_name){
					socket.to(sockets[index].id).emit('sender_private_chat_left_notification' , message);
					value.leave(`${request_sender_name}_${request_reciever_name}` , value.id);
					return false;
				}
				else{
					return true;
				}
			});
		}
		getSockets();
	});

	socket.on('request_reciever_private_chat_left' , (request_sender_name , request_reciever_name)=>{

		// REMOVE THE REQUEST RECIEVER FROM THE ROOM
		socket.leave(`${request_sender_name}_${request_reciever_name}` , socket.id);
	
		// REMOVE THE REQEUST SENDER NAME FROM THE ROOM
		async function getSockets(){
			const sockets = await io.fetchSockets();
			sockets.every((value)=>{
				if(value.data.username == request_sender_name){
					value.leave(`${request_sender_name}_${request_reciever_name}` , value.id);
					socket.to(value.id).emit('request_reciever_private_chat_left_notification' , `${request_reciever_name} has left the private chat`);
					return false;
				}
				else{
					return true;
				}
			});
		}
		getSockets();
	});

	socket.on('private_connection_lost' , lost_participant=>{
		async function getSockets(){
			const sockets = await io.fetchSockets();
			sockets.every((name , index)=>{
				if(name.data.username == lost_participant){
					socket.to(sockets[index].id).emit('private_connection_stopped' , lost_participant);
					return false;
				}
				else{
					return true;
				}
			});
		}
		getSockets();
	});

	socket.on('accept' , (previous_request_sender , request_reciever_name , new_request_sender , message)=>{
		
		if(message == 'request reciever has left'){
			let prev_req_sender_found = false;
			let new_req_sender_found = false;
			async function getSockets(){
				const sockets = await io.fetchSockets();
				for(let i=0 ; i<sockets.length ; i++){
					if(prev_req_sender_found == true && new_req_sender_found == true){
						break;
					}
					else{
						if(sockets[i].data.username == previous_request_sender){
							socket.leave(`${previous_request_sender}_${request_reciever_name}` , socket.id);
							sockets[i].leave(`${previous_request_sender}_${request_reciever_name}` ,  sockets[i].id);
							socket.to(sockets[i].id).emit('request_reciever_private_chat_left_notification' , `${request_reciever_name} has left the chat`);
							prev_req_sender_found = true;
						}
						else{
							if(sockets[i].data.username == new_request_sender){
								socket.to(sockets[i].id).emit('request_accepted' , `${request_reciever_name} has accepted your request`);
								new_req_sender_found = true;
							}
						}
					}
				}
			}
			getSockets();
		}
		else{
			if(message == 'request sender has left'){
				console.log('request sender has left the chat condition');
				let previous_request_reciever_name = false;
				let new_request_reciever_name = false;

				async function getSockets(){
					const sockets = await io.fetchSockets();
					for(let i=0 ; i<sockets.length ; i++){
						if(previous_request_reciever_name == true && new_request_reciever_name == true){
							break;	
						}
						else{

							if(sockets[i].data.username == request_reciever_name){
								socket.leave(`${previous_request_sender}_${request_reciever_name}` , socket.id);
								sockets[i].leave(`${previous_request_sender}_${request_reciever_name}` , sockets[i].id);
								socket.to(sockets[i].id).emit('request_left' , `${previous_request_sender} has left the private chat`);
								previous_request_reciever_name = true;

							}
							else{
								if(sockets[i].data.username == new_request_sender){
									socket.to(sockets[i].id).emit('request_accepted' , `${previous_request_sender} has accepted your request`);
									new_request_reciever_name = true;
								}
							}
						}
					}
				}
				getSockets();
			}
			else{
				if(message = 'initial requeset accept'){
					async function getSockets(){
						const sockets = await io.fetchSockets();
						sockets.every((value)=>{
							if(value.data.username == previous_request_sender){
								socket.to(value.id).emit('request_accepted' , `${request_reciever_name} has accepted your request`)
								return false;
							}
							else{
								return true;
							}
						});
					}
					getSockets();
				}
			}
		}
	});

	socket.on('request_rejected' , (req_sender_name , req_reciever_name) => {
		async function getSockets(){
			const sockets = await io.fetchSockets();
			sockets.every((value)=>{
				if(value.data.username == req_sender_name){
					socket.to(value.id).emit('request_rejected_notification' , `${req_reciever_name} has rejected your request for a private chat`);
					return false;
				}
				else{
					return true;
				}
			});
		}
		getSockets();
	})

	socket.on('my_connection' , (data, new_con_id)=>{
		socket.to(new_con_id).emit('previous_connection' , data);
	});

	socket.on('message' , (data , sender_name)=>{
		socket.broadcast.emit('message_pass' , data , sender_name);
	});

	socket.on('disconnecting' , ()=>{
		socket.broadcast.emit('leaving' , socket.data.username);
	});
});

// THIS CREATES A NEW NAMESPACE(NOW ANY USER COMING TO THIS URL WILL GET THE SERVER CONNECTION FROM THIS IO ENGINE NOT FROM THE / IO ENGINE AND WILL GET ALL THE EVENTS THAT ARE EMMITED FROM HERE AND ALL THE EVENTS THAT ARE RERGISTERED FROM THE CLIENT SIDE CAN ONLY BE REGISTERED TO THIS IO INSTANCE)
// io.of('/chat-app/new').on('connection' , socket=>{
// 	socket.emit('new_html_connection' , 'this is the new html collection');
// })

httpServer.listen(8000 , ()=>{
	console.log('Server is listening at port 8000');
});
