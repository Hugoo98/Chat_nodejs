//vérifier l'identidfiant et l'@mail uniques.
$(function(){

  var socket = io('/signup');

  var uflag = eflag = pflag = 0;

  //vérifier l'identifiant unique
  $('#uname').keyup(function(){
    var uname = $('#uname').val();
    if(uname.length < 4){
      uflag = 0;
      $('#aa').hide();
      $('#bb').show();
      $('#error1').show().text("L'identifiant doit contenir au moins 4 caractères.");
    }
    else{
      socket.emit('checkUname',uname);
      socket.on('checkUname',function(data){
        if(data == 1){
          uflag = 1;
          $('#aa').show();
          $('#bb').hide();
          $('#error1').hide();
        }
        else{
          uflag = 0;
          $('#aa').hide();
          $('#bb').show();
          $('#error1').show().text("Cet identifiant existe déjà. Svp changer le.");
        }
      });
    }
  });

  //Vérifier les @mail
  $('#email').keyup(function(){

    var email = $('#email').val();
    var atpos = email.indexOf("@");
    var dotpos = email.lastIndexOf(".");

    if (atpos < 1 || dotpos < atpos+2 || dotpos+2 >= email.length){
      eflag = 0;
      $('#aa1').hide();
      $('#bb1').show();
      $('#error1').show().text("Veuillez saisir une adresse @mail valide.");
    }
    else{
      socket.emit('checkEmail',email);
      socket.on('checkEmail',function(data){
        if(data == 1){
          eflag = 1;
          $('#aa1').show();
          $('#bb1').hide();
          $('#error1').hide();
        }
        else{
          eflag = 0;
          $('#aa1').hide();
          $('#bb1').show();
          $('#error1').show().text("@mail existe déjà.svp changez le.");
        }
      });
    }
  }); 

  //Vérifier les mots de passe.
  $('#pass').keyup(function(){
    var pass = $('#pass').val();
    if(pass.length < 4){
      pflag = 0;
      $('#aa2').hide();
      $('#bb2').show();
      $('#error1').show().text("Mot de passe doit contenir au moins 4 caractères.");
    }
    else{
      pflag = 1;
      $('#aa2').show();
      $('#bb2').hide();
      $('#error1').hide();
    }
  }); 

  //soumettre le code.
  $('form').submit(function(){
    //valider l'action
    if(uflag == 1 && eflag == 1 && pflag == 1){
      return true;
    }
    else{
      $('#error1').show().text("Entrée incorrecte, Changez.");
      return false;
    }
  });

});
