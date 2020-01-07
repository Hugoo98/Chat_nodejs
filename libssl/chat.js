const socketio = require("socket.io");
const mongoose = require("mongoose");
const events = require("events");
const _ = require("lodash");
const eventEmitter = new events.EventEmitter();

//Ajout de modèles DB
require("../mvc/models/user.js");
require("../mvc/models/chat.js");
require("../mvc/models/room.js");

//En utilisant les modeles de schema mongoose
const userModel = mongoose.model("User");
const chatModel = mongoose.model("Chat");
const roomModel = mongoose.model("Room");


//le temps réel commence à partir de cette étape 
module.exports.sockets = function(http) {
  io = socketio.listen(http);

 //définir l'itinéraire de chat 
  const ioChat = io.of("/chat");
  const userStack = {};
  let oldChats, sendUserStack, setRoom;
  const userSocket = {};
  
 //socket.io commence 
  ioChat.on("connection", function(socket) {
    console.log("socketio est connecté.");

    //Obtenir le nom d'utilisateur 
    socket.on("set-user-data", function(username) {
      console.log(username + "  connecté");

      //variable de stockage
      socket.username = username;
      userSocket[socket.username] = socket.id;

      socket.broadcast.emit("broadcast", {
        description: username + " connecté"
      });

     //obtenir la liste de tous les utilisateurs
      eventEmitter.emit("get-all-users");

      //Envoi de la liste de tous les utilisateurs et vérifier (en lignes ou hors ligne)
      sendUserStack = function() {
        for (i in userSocket) {
          for (j in userStack) {
            if (j == i) {
              userStack[j] = "Online";
            }
          }
        }
         //Faire apparaitre msg de connexion .
        ioChat.emit("onlineStack", userStack);
      }; 
    });

    //Réglage de room de discussion.
    socket.on("set-room", function(room) {
      //quitter room de discussion.
      socket.leave(socket.room);
      //obtenir les données de room de discussion
      eventEmitter.emit("get-room-data", room);

      //mettre en place room et rejoindre
      setRoom = function(roomId) {
        socket.room = roomId;
        console.log("roomId : " + socket.room);
        socket.join(socket.room);
        ioChat.to(userSocket[socket.username]).emit("set-room", socket.room);
      };
    });

    //émet un événement pour lire old-chats-init la database.
    socket.on("old-chats-init", function(data) {
      eventEmitter.emit("read-chat", data);
    });

     //émet un événement pour lire les anciens chats de la database.
    socket.on("old-chats", function(data) {
      eventEmitter.emit("read-chat", data);
    });

    //Envoyer old chats au client.
    oldChats = function(result, username, room) {
      ioChat.to(userSocket[username]).emit("old-chats", {
        result: result,
        room: room
      });
    };

    //Afficher les messages de saisie
    socket.on("typing", function() {
      socket
        .to(socket.room)
        .broadcast.emit("typing", socket.username + " : est en train d'écrire...");
    });

    //pour afficher les chats
    socket.on("chat-msg", function(data) {

     //émet un événement pour enregistrer le chat dans la database.
      eventEmitter.emit("save-chat", {
        msgFrom: socket.username,
        msgTo: data.msgTo,
        msg: data.msg,
        room: socket.room,
        date: data.date
      });
      //emettre l'evenement pour envoyer des chats msg à tous les clients.
      ioChat.to(socket.room).emit("chat-msg", {
        msgFrom: socket.username,
        msg: data.msg,
        date: data.date
      });
    });

    //faire apparaître un msg de déconnexion.
    socket.on("disconnect", function() {
      console.log(socket.username + "  déconnecté");
      socket.broadcast.emit("broadcast", {
        description: socket.username + " déconnecté"
      });

      console.log("chat déconnecté.");

      _.unset(userSocket, socket.username);
      userStack[socket.username] = "Offline";

      ioChat.emit("onlineStack", userStack);
    }); 
  }); 

  //Remarque :les opérations de database sont conservées en dehors du code socket.io.
  //Enregistrer les chats dans la database.
  eventEmitter.on("save-chat", function(data) {
    // var today = Date.now();

    var newChat = new chatModel({
      msgFrom: data.msgFrom,
      msgTo: data.msgTo,
      msg: data.msg,
      room: data.room,
      createdOn: data.date
    });

    newChat.save(function(err, result) {
      if (err) {
        console.log("Erreur : " + err);
      } else if (result == undefined || result == null || result == "") {
        console.log("Chat n'est pas enregistré.");
      } else {
        console.log("Chat enregistré.");
        
      }
    });
  }); 

 //Lire les chats from database.
  eventEmitter.on("read-chat", function(data) {
    chatModel
      .find({})
      .where("room")
      .equals(data.room)
      .sort("-createdOn")
      .skip(data.msgCount)
      .lean()
      .limit(5)
      .exec(function(err, result) {
        if (err) {
          console.log("Erreur : " + err);
        } else {
          //émet un événement au client pour afficher les chats.
          oldChats(result, data.username, data.room);
        }
      });
  });  //fin de lecture de la database

// création d'une liste de tous les utilisateurs.
  eventEmitter.on("get-all-users", function() {
    userModel
      .find({})
      .select("username")
      .exec(function(err, result) {
        if (err) {
          console.log("Erreur : " + err);
        } else {
          
          for (var i = 0; i < result.length; i++) {
            userStack[result[i].username] = "Offline";
          }
          
          sendUserStack();
        }
      });
  }); 

  //lister l'évenement get-room-data.
  eventEmitter.on("get-room-data", function(room) {
    roomModel.find(
      {
        $or: [
          {
            name1: room.name1
          },
          {
            name1: room.name2
          },
          {
            name2: room.name1
          },
          {
            name2: room.name2
          }
        ]
      },
      function(err, result) {
        if (err) {
          console.log("Erreur : " + err);
        } else {
          if (result == "" || result == undefined || result == null) {
            var today = Date.now();

            newRoom = new roomModel({
              name1: room.name1,
              name2: room.name2,
              lastActive: today,
              createdOn: today
            });

            newRoom.save(function(err, newResult) {
              if (err) {
                console.log("Erreur : " + err);
              } else if (
                newResult == "" ||
                newResult == undefined ||
                newResult == null
              ) {
                console.log(" Une erreur s'est produite lors de la création de room.");
              } else {
                setRoom(newResult._id); //appel à la fonction set room
              }
            }); 
          } else {
            var jresult = JSON.parse(JSON.stringify(result));
            setRoom(jresult[0]._id);//appel à la fonction set room
          }
        } 
      }
    );
  }); 
  

   //vérifier les noms d'utilisateurs et les @mail unique lors de l'inscription
  //socket namespace pour signup.
  const ioSignup = io.of("/signup");

  let checkUname, checkEmail;

  ioSignup.on("connexion", function(socket) {
    console.log("signup connecté.");

    //vérifier le nom d'utilisateur unique.
    socket.on("checkUname", function(uname) {
      eventEmitter.emit("findUsername", uname); 
    }); 

    //émettre un événement pour vérifier le nom d'utilisateur.
    checkUname = function(data) {
      ioSignup.to(socket.id).emit("checkUname", data);//(1 ou 0 ).
    }; 

     //Vérifier @mail unique.
    socket.on("checkEmail", function(email) {
      eventEmitter.emit("findEmail", email); //événement pour effectuer une opération de database.
    }); 

    //émettre un evenement pour vérifier  @mail .
    checkEmail = function(data) {
      ioSignup.to(socket.id).emit("checkEmail", data); //0 ou 1
    }; 

    //Déconnexion
    socket.on("déconnexion", function() {
      console.log("signup deconnecté.");
    });
  }); 

  //Remarque :les opérations de database sont conservées en dehors du code socket.io.
  //evenement pour trouver et verifier le nom d'utilisateur
  eventEmitter.on("findUsername", function(uname) {
    userModel.find(
      {
        username: uname
      },
      function(err, result) {
        if (err) {
          console.log("Erreur : " + err);
        } else {
          
          if (result == "") {
            checkUname(1); //1 si l'utilisateur est introuvable.
          } else {
            checkUname(0); //0 si l'utilisateur est trouvé
          }
        }
      }
    );
  }); 

 // Evenement pour trouver et vérifier @mail.
  eventEmitter.on("findEmail", function(email) {
    userModel.find(
      {
        email: email
      },
      function(err, result) {
        if (err) {
          console.log("Erreur : " + err);
        } else {
          
          if (result == "") {
            checkEmail(1); //1 si @mail est introuvable.
          } else {
            checkEmail(0); //0 si @mail est trouvée
          }
        }
      }
    );
  });
  return io;
};
