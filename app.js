// Import module dependencies
var methodOverride 	= require('method-override'),
	LocalStrategy 	= require('passport-local').Strategy,
	session 		= require('express-session'),
	bodyParser 		= require('body-parser'),
	passport 		= require('passport'),
	express 		= require('express'),
	mysql 			= require('mysql'),
	routes = require('./routes'),
	user = require('./routes/user'),
	app = express();

// ============================================


function authenticate(req){
	//var user =  req.session.user,
	var userId = req.session.userId;
	
	if(userId == null){
		console.log("no user in session");
		return false;
	} else {
		return true;
	}
};

// Configure Express Framework
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  //cookie: { maxAge: 60000 }
}));
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(methodOverride("_method"));
//app.use(passport.initialize());
//app.use(passport.session());
app.use(bodyParser.urlencoded({extended: true}));


// ============================================

// Connect to the mysql database.
var connection = mysql.createConnection({
	host		: 'localhost',
	user		: 'root',
	database	: 'events_db'
});

connection.connect(function(err) {
  if (err) throw err;
  console.log("Connected to database");
});

global.db = connection;
// ============================================

// ===============
// Auth Routes
// ===============

// HOME/LOGIN PAGE
app.get("/", function(req, res){
	res.redirect("/home");
});

app.get("/home", function(req, res){
	res.render("home");
});

app.post("/home", function(req, res){
	var existing_user = req.body;
                              
      db.query("SELECT * FROM Users WHERE email =?", [req.body.email], function(err, results){  
		  if(err){
			  console.log(err);
		  }
		// no matches in database
    	if(!results.length){
          	console.log("no matching user");
			res.render("home");
		} else if(results[0].password != req.body.password){
			console.log("bad password");
			res.redirect("/home");
		} else {
			req.session.userId = results[0].userid;
            req.session.user = results[0];
            console.log(results[0].userid);
            res.redirect("/events");
		}        
});
});







// REGISTER PAGE
app.get("/register", function(req, res){
	res.render("register");
});

// REGISTER POST
app.post("/register", user.signup);


// ============================================
// CRUD ROUTES
// ============================================

// INDEX ROUTE 
app.get("/events", function(req, res) {
	
	if(authenticate(req)){
	
		var user = req.session.user;
		console.log("/events", user);
		
		var sql = "SELECT * FROM Events WHERE type = ?";
		var publicEvents;
		var privateEvents;
		var rsoEvents;
		
		connection.query(sql, [0], function(err, publicResults) {
			if(err){
				console.log("Error");
			} else{
				console.log(publicResults);
				publicEvents = publicResults;
			}
		});
		connection.query(sql, [1], function(err, privateResults) {
			if(err){
				console.log("Error");
			} else{
				privateEvents = privateResults;
			}
		});
		connection.query(sql, [2], function(err, rsoResults) {
			if(err){
				console.log("Error");
			} else{
				rsoEvents = rsoResults;
				res.render("index", {publicEvents: publicEvents, privateEvents: privateEvents, rsoEvents: rsoEvents });
			}
		});
		
	} else {
		res.redirect("/home");
	}
});

// INDEX MY EVENTS ROUTE
app.get("/myevents", function(req, res){
	if(!authenticate(req)){
		res.redirect("/home");
	} else{
		var user = req.session.user;
		var sql = "SELECT * FROM Events WHERE event_id IN (SELECT event_id FROM Attendance WHERE attendee_id = ?)";
		connection.query(sql, [user.userid], function(err, myEventResults) {
			if(err){
				console.log(err);
			} else{
				console.log(myEventResults);
				res.render("my_events", { myEvents: myEventResults });
			}
		});
	}
});

// NEW ROUTE
app.get("/events/new", function(req, res){
	
	if(authenticate(req)){
		var user = req.session.user;
		console.log("/events", user);
		res.render("new", {user: user } );
	} else {
		res.redirect("/home");
	}
	
});

// CREATE ROUTE
app.post("/events", function(req, res){
	// Create new event
	
	var newEvent = req.body.newEvent;
	var user = req.session.user;
	newEvent.admin_id = user.userid;
	
	connection.query("INSERT INTO Events SET ?", newEvent, function(err, result){
		if(err){
			console.log("error", err);
			res.render("new");
		} else {
			connection.query("SELECT event_id FROM Events WHERE name = ? AND admin_id = ?", [newEvent.name, user.userid], function(err, eventIdResult){
					if(err){
						console.log(err);
						res.render("new");
					} else{
						console.log(eventIdResult);
						connection.query("INSERT INTO Attendance SET ?", {attendee_id: user.userid, event_id: eventIdResult[0].event_id }, function(err, result){
							if(err){
								console.log(err);
								res.render("new");
							} else{
								res.redirect("/events");
							}
						});
					}				 
				});
		}
	});
});

// SHOW ROUTE
app.get("/events/:id", function(req, res){
	console.log("SHOW CALLED");
	if(!authenticate(req)){
		res.redirect("/home");
	} else {
		var user = req.session.user;
		var q = "SELECT * FROM Events WHERE event_id = ?";
		
		connection.query(q, [req.params.id], function(err, foundEvent){
			if(err){
				res.redirect("/events")
			} else {
				console.log("foundEvent", foundEvent);
				connection.query("SELECT * FROM Attendance WHERE event_id = ? AND attendee_id = ?", [req.params.id, user.userid], function(err, result){
					if(err){
						console.log(err);
						res.redirect("/events");
					} else{
						console.log("attendance result", result);
						res.render("show", {event: foundEvent[0], user: user, isAttending: result.length } );
					}
				});
			}
		});
	}
});

// EDIT ROUTE
app.get("/events/:id/edit", function(req, res){
	var q = "SELECT * FROM Events WHERE event_id =" + req.params.id;
	connection.query(q, function(err, foundEvent){
		if(err){
			res.redirect("/events")
		} else {
			res.render("edit", {event: foundEvent[0]} );
		}
	});
});

// UPDATE ROUTE
app.put("/events/:id", function(req, res){
	var updatedBlog = req.body.blog;
	connection.query("UPDATE Events SET ? WHERE event_id = ?", [updatedEvent, req.params.id], function(err, eventUpdated){
		if(err){
			res.redirect("/events");
		} else {
			res.redirect("/events/" + req.params.id);
		}
	});
});

// DELETE ROUTE
app.delete("/events/:id", function(req, res){
	//destroy blog
	var sql = "DELETE FROM Events WHERE event_id = " + req.params.id;
	connection.query(sql, function(err, result){
		if(err){
			res.redirect("/events"); // I may want to redirect back to show and display the same blog I attempted to delete.
		} else {
			// redirect	
			res.redirect("/events");
		}
	});
}); 
// ATTEND EVENT ROUTE
app.get("/events/:id/attend", function(req, res){
	if(!authenticate(req)){
		res.redirect("/home");
	} else {
		var user = req.session.user;
		connection.query("INSERT INTO Attendance SET ?", {attendee_id: user.userid, event_id: req.params.id }, function(err, result){
			if(err){
				console.log(err);
				res.redirect("/events");
			} else{
				res.redirect("/events");
			}
		});
	}
});

// RSO INDEX ROUTE
app.get("/rso", function(req, res){
	
	if(!authenticate(req)){
		res.redirect("/home");
	}else{
		var user = req.session.user;
		var myRsoResults;
		var otherRsoResults;
		
		var sql = "SELECT * FROM Rsos WHERE rso_id IN (SELECT rso_id FROM Rso_memberships WHERE member_id = ?)";
		connection.query(sql, [user.userid], function(err, foundRsos){
			if(err){
				console.log(err);
				res.redirect("/events")
			} else {
				myRsoResults = foundRsos;
				connection.query("SELECT * FROM Rsos WHERE rso_id NOT IN (SELECT rso_id FROM Rso_memberships WHERE member_id = ?)", [user.userid], function(err, otherRsos){
					if(err){
						res.redirect("/events")
					} else {
						console.log(otherRsos);
						otherRsoResults = otherRsos;
						res.render("rso_index", {myRsos: myRsoResults, otherRsos: otherRsos, user: user} );
					}
				});
			}
		});
	}
});
	
// RSO NEW ROUTE
app.get("/rso/new", function(req, res){
	
	if(!authenticate(req)){
		res.redirect("/home");
	} else {
		var user = req.session.user;
		res.render("rso_new", {user: user } );
	}
});

// RSO CREATE
app.post("/rso", function(req, res){
	if(!authenticate(req)){
		res.redirect("/home");
	} else {
		var newRso = req.body.newRso;
		var user = req.session.user;
		
		newRso.member_count = 1;
		newRso.owner_id = user.userid;
		
		connection.query("INSERT INTO Rsos SET ?", newRso, function(err, result){
			if(err){
				console.log("error", err);
				res.render("rso_new");
			} else {
				console.log(result);
				connection.query("SELECT rso_id FROM Rsos WHERE name = ?", [newRso.name], function(err, rsoIdResult){
					if(err){
						console.log(err);
						res.render("rso_new");
					} else{
						console.log(rsoIdResult);
						connection.query("INSERT INTO Rso_memberships SET ?", {member_id: user.userid, rso_id: rsoIdResult[0].rso_id }, function(err, result){
							if(err){
								console.log(err);
								res.render("rso_new");
							} else{
								res.redirect("/rso");
							}
						});
					}				 
				});
			}
		});
	}
});


// RSO SHOW ROUTE
app.get("/rso/:id", function(req, res){
	if(!authenticate(req)){
		res.redirect("/home");
	}else{
		var user = req.session.user;
		var q = "SELECT * FROM Rsos WHERE rso_id = ?";
		
		connection.query(q, [req.params.id], function(err, RsoResult){
			if(err){
				res.redirect("/rso")
			} else {
				connection.query("SELECT * FROM Rso_memberships WHERE rso_id = ? AND member_id = ?", [req.params.id, user.userid], function(err, result){
					if(err){
						console.log(err);
						res.redirect("/rso");
					} else{
						res.render("rso_show", {rso: RsoResult[0], user: user, isMember: result.length } );
					}
				});
			}
		});
	}
});

// NEW RSO EVENT ROUTE
app.get("/events/new_rso_event/:id", function(req, res){
	if(!authenticate(req)){
		res.redirect("/home");
	} else {
		var user = req.session.user;
		connection.query("SELECT * FROM Rsos WHERE rso_id = ?", [req.params.id], function(err, foundRso){
			if(err){
				console.log(err);
				res.render("rso_index");
			} else{
				res.render("new_rso_event", {user: user, rso: foundRso[0] });
			}
		});
	}
});

// RSO EVENT CREATE ROUTE
app.post("/events/new_rso_event", function(req, res){
	// Create new event
	
	var newEvent = req.body.newRsoEvent;
	var user = req.session.user;
	newEvent.admin_id = user.userid;
	newEvent.type = 2;
	
	connection.query("INSERT INTO Events SET ?", newEvent, function(err, newEvent){
		if(err){
			console.log("error", err);
			res.render("new");
		} else {
			connection.query("SELECT event_id FROM Events WHERE name = ? AND owner_id = ?", [newEvent.name, user.userid], function(err, eventIdResult){
					if(err){
						console.log(err);
						res.render("new");
					} else{
						connection.query("INSERT INTO Attendance SET ?", {attendee_id: user.userid, event_id: eventIdResult[0].event_id }, function(err, result){
							if(err){
								console.log(err);
								res.render("new");
							} else{
								res.redirect("/events");
							}
						});
					}				 
				});
			

			// then, redirect to index.
			res.redirect("/events");
		}
	});
});

// JOIN RSO ROUTE
app.get("/rso/:id/join", function(req, res){
	if(!authenticate(req)){
		res.redirect("/home");
	} else {
		var user = req.session.user;
		connection.query("INSERT INTO Rso_memberships SET ?", {rso_id: req.params.id, member_id: user.userid }, function(err, result){
			if(err){
				console.log(err);
				res.render("rso_index");
			} else{
				connection.query("UPDATE Rsos SET member_count = member_count + 1 WHERE rso_id = ?", [req.params.id], function(err, result){
					if(err){
						console.log(err);
						res.render("rso" + req.params.id);
					} else{
						res.redirect("/rso");
					}
				});
			}
		});
	}
});


app.get("/signup", function(req, res) {
	res.render("signup");
});

// app.post('/login', user.login);//call for login post

// app.post('/signup', user.signup);//call for signup post

app.get('/home/dashboard', user.dashboard);//call for dashboard page after login





app.get("/test", function(req, res){
	res.render("show");
});



app.listen(3000, function() {
	console.log("Server running on 3000!");
});

