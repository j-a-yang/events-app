exports.signup = function(req, res){
   message = '';
   if(req.method == "POST"){
      //post data

   } else {
      res.render('signup');
   }
};

// USER.LOGIN
exports.login = function(req, res){
   //var message = '';
	var existing_user = req.body;
     
      var sql="SELECT * FROM Users WHERE email =" + req.body.email;                           
      db.query(sql, function(err, results){  
		  if(err){
			  console.log(err);
		  }
		  
    	if(results.length){
          	console.log("no matching user");
		} else if(results[0].password != req.body.password){
			console.log("bad password");
			res.redirect("/home");
		} else {
			req.session.userId = results[0].id;
            req.session.user = results[0];
            console.log(results[0].id);
            res.redirect('/home/dashboard');
		}        
     });
};

// USER.SIGNUP
exports.signup = function(req, res){
	// var message = '';
   	var newUser = req.body;
    db.query("INSERT INTO Users SET ?", newUser, function(err, result){
		if(err){
			console.log("error", err);
			res.render("register");
		} else {
			// then, redirect to index.
			res.redirect("home");
		}	
	});
};

exports.dashboard = function(req, res, next){
	
	var user =  req.session.user,
	userId = req.session.userId;
	
	if(userId == null){
		res.redirect("/home");
		return;
	}
	 
	 var sql="SELECT * FROM Users WHERE userid ='"+userId+"'";
	 
	   db.query(sql, function(err, results){
		   
		   console.log(results);
		   
		   res.redirect("/events");	  
		  
		});	 
};

exports.authenticate = function(req){
	//var user =  req.session.user,
	var userId = req.session.userId;
	
	if(userId == null){
		res.redirect("/home");
		console.log("no user in session");
		return false;
	} else {
		return true;
	}
};