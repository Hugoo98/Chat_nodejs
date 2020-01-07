$ (function(){

  var socket = io('/chat');

  var username = $('#user').val();//var nom d'utilisateur 
  var noChat = 0; //Verifier (O si tous les chats historiques sont pas chargés , 1 si sont chargés).
  var msgCount = 0; //compter le nombre de messages affichés
  var oldInitDone = 0; //0 si old-chats-init n'est pas exécuté, 1 si exécuté
  var roomId;//pour verifier les room
  var toUser;
  $('#chatForm').show(); //montrer la form du chat.

  //transmission de données lors de la connexion .
  socket.on('connect',function(){
    socket.emit('set-user-data',username);
  });



  //Recevoire la pile en ligne.
  socket.on('onlineStack',function(stack){
    $('#list').empty();
    var totalOnline = 0;
    for (var user in stack){
      //Afficher le bouton utilisateur .
      if(user == username){
        var txt1 = $('<button id="userBtn" class="btn btn-success "> </button>').text(user).css({"font-size":"18px"});
      }
      else{
        var txt1 = $('<button id="userBtn" class="w3-btn w3-white w3-border w3-border-red w3-padding-small">').text(user).css({"font-size":"18px"});
      }
      //afficher le statut en ligne (On - Off).
      if(stack[user] == "Online"){
        var txt2 = $('<span class="badge"></span>').text(stack[user]).css({"float":"right","color":"#008000"});
        totalOnline++;
      }
      else{
        var txt2 = $('<span class="badge"></span>').text(stack[user]).css({"float":"right","color":"#FF0000"});
      }
      //Lister tous les utilisateurs.
      $('#list').append($('<li>').append(txt1,txt2));
      $('#totalOnline').text(totalOnline);
    }
    
    $('#list').append($('<li>').append($('<button id="userBtn" class="w3-btn w3-red w3-block"></button>').text("Groupe").css({"font-size":"18px"})));
    $('#panel1').scrollTop($('#panel1').prop("scrollHeight"));
  });
 

  //Clic sur le bouton
  $(document).on("click","#userBtn",function(){

    //messages vides.
    $('#messages').empty();
    $('#typing').text("");
    $('#chatForm').show(); //montrer la forme du chat.
    $('#sendBtn').hide(); //cacher le bouton «envoyer» pour ne pas envoyer des messages vides  .
    msgCount = 0;
    noChat = 0;
    oldInitDone = 0;

    //attribuer les nom des utilisateur à qui les messages sont adressés. 
    //et si la discussion est en groupe en appuyant sur le bouton Groupe.
    toUser = $(this).text();

    //afficher et masquer quelques infos (bouton, texte ...) 
    $('#frndName').text(toUser);
    $('#initMsg').hide();
    $('#chatForm').show(); //Montrer la forme du chat
    $('#sendBtn').show(); //cacher le bouton «envoyer» pour ne pas envoyer des messages vides 

    //attribuer deux noms pour la pièce. ce qui aide dans le chat individuel et en groupe.
    if(toUser == "Groupe"){
      var currentRoom = "Group-Group";
      var reverseRoom = "Group-Group";
    }
    else{
      var currentRoom = username+"-"+toUser;
      var reverseRoom = toUser+"-"+username;
    }

    //Evenement pour définir la room et rejoindre
    socket.emit('set-room',{name1:currentRoom,name2:reverseRoom});

  }); 

  //Définir roomId.
  socket.on('set-room',function(room){
    //messages vides.
    $('#messages').empty();
    $('#typing').text("");

    msgCount = 0;
    noChat = 0;
    oldInitDone = 0;
    //Affectation de id de la room  à variable roomId. 
    roomId = room;
    console.log("roomId : "+roomId);
    //événement pour obtenir l'historique du chat en cliquant sur le bouton ou lorsque la salle est définie.
    socket.emit('old-chats-init',{room:roomId,username:username,msgCount:msgCount});

  }); 

  //charger plus d'anciens chats.
  $('#panel2').scroll(function(){

    if($('#panel2').scrollTop() == 0 && noChat == 0 && oldInitDone == 1){
      $('#loading').show();
      socket.emit('old-chats',{room:roomId,username:username,msgCount:msgCount});
    }

  }); 

  //lister l'evenement old-chats.
  socket.on('old-chats',function(data){

    if(data.room == roomId){
      oldInitDone = 1; // =>  premier evenement old-chat est terminé.
      if(data.result.length != 0){
        $('#noChat').hide(); //masquer plus aucun message de chat.
        for (var i = 0;i < data.result.length;i++) {
          //style de message de chat.
          var chatDate = moment(data.result[i].createdOn).format("MMMM Do YYYY, hh:mm:ss a");
          var txt1 = $('<span></span>').text(data.result[i].msgFrom+" : ").css({"color":"#006080"});
          var txt2 = $('<span></span>').text(chatDate).css({"float":"right","color":"#a6a6a6","font-size":"16px"});
          var txt3 = $('<p></p>').append(txt1,txt2);
          var txt4 = $('<p></p>').text(data.result[i].msg).css({"color":"#000000"});
          //Afficher le chat dans le box des chats.
          $('#messages').prepend($('<li>').append(txt3,txt4));
          msgCount++;

        }
        console.log(msgCount);
      }
      else {
        $('#noChat').show(); //aucun affichagfe de massage du chat
        noChat = 1; 
      }
      //masquer la barre de chargement.
      $('#loading').hide();

     // définir la position de la barre de défilement pendant le chargement des 5 premiers msg.
      if(msgCount <= 5){
        $('#panel2').scrollTop($('#panel2').prop("scrollHeight"));
      }
    }

  });

  // Gestion de touches 
  $('#myMsg').keyup(function(){
    if($('#myMsg').val()){
      $('#sendBtn').show(); //montrer la touche «Envoyer».
      socket.emit('typing');
    }
  });

  //recevoir le message de saisie .
  socket.on('typing',function(msg){
    var setTime;
    //effacerla fonction setTimeout précédente.
    clearTimeout(setTime);
    //afficher le message de saisie.
    $('#typing').text(msg);
    //affichage du message de saisie uniquement pendant quelques secondes.
    setTime = setTimeout(function(){
      $('#typing').text("");
    },3500);
  });

  //Envoyer un message
  $('form').submit(function(){
    socket.emit('chat-msg',{msg:$('#myMsg').val(),msgTo:toUser,date:Date.now()});
    $('#myMsg').val("");
    $('#sendBtn').show();
    return false;
  });

  //recevoir des messages.
  socket.on('chat-msg',function(data){
    //style de messages du chat.
    var chatDate = moment(data.date).format("MMMM Do YYYY, hh:mm:ss a");
    var txt1 = $('<span></span>').text(data.msgFrom+" : ").css({"color":"#006080"});
    var txt2 = $('<span></span>').text(chatDate).css({"float":"right","color":"#a6a6a6","font-size":"16px"});
    var txt3 = $('<p></p>').append(txt1,txt2);
    var txt4 = $('<p></p>').text(data.msg).css({"color":"#000000"});
    //afficher le message dans la boite du chat
    $('#messages').append($('<li>').append(txt3,txt4));
      msgCount++;
      console.log(msgCount);
      $('#typing').text("");
      $('#panel2').scrollTop($('#panel2').prop("scrollHeight"));
  });

  //Déconnexion.
  //Transmission de données sur la déconnexion
  socket.on('disconnect',function(){
    
    //afficher et masquer les infos.
    $('#list').empty();
    $('#messages').empty();
    $('#typing').text("");
    $('#frndName').text("Déconnecté..");
    $('#loading').hide();
    $('#noChat').hide();
    $('#initMsg').show().text("Veuillez rafraîchir votre page...");
    $('#chatForm').hide();
    msgCount = 0;
    noChat = 0;
  });
});
