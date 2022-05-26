DROP DATABASE IF EXISTS events_db;
CREATE DATABASE IF NOT EXISTS events_db;
USE events_db;

CREATE TABLE IF NOT EXISTS Users (
	userid INT AUTO_INCREMENT,
	firstName VARCHAR(255) NOT NULL,
	lastName VARCHAR(255) NOT NULL,
	email VARCHAR(255) UNIQUE NOT NULL,
	password VARCHAR(255) NOT NULL,
	# access_type INT NOT NULL,
	# uni_id INT NOT NULL,
	created_at TIMESTAMP DEFAULT NOW(),
	PRIMARY KEY (userid)
);

# CREATE TABLE IF NOT EXISTS Locations (
# 	location_name VARCHAR(255) NOT NULL,
# 	location_coord VARCHAR(255) NOT NULL,
# 	PRIMARY KEY (location_name)
# );

# CREATE TABLE IF NOT EXISTS Universities (
# 	uni_id INT AUTO_INCREMENT,
# 	uni_name VARCHAR(255) NOT NULL,
# 	super_id INT NOT NULL,
# 	PRIMARY KEY (uni_id),
# 	FOREIGN KEY (super_id) REFERENCES Users(userid)
# );

CREATE TABLE IF NOT EXISTS Events (
	event_id INT AUTO_INCREMENT,
	name VARCHAR(255) NOT NULL,
	type INT NOT NULL, ## public = 0, private = 1, RSO = 2.
	rso_id INT NOT NULL DEFAULT 0,
	admin_id INT NOT NULL,
	image VARCHAR(255),
	description VARCHAR(255),
	location_name VARCHAR(255) NOT NULL,
	date VARCHAR(50) NOT NULL,
	time VARCHAR(50) NOT NULL,
	# approved INT NOT NULL, ## FALSE = 0, TRUE = 1
	# uni_id INT NOT NULL,
	PRIMARY KEY (event_id),
	FOREIGN KEY (admin_id) REFERENCES Users(userid) ON DELETE CASCADE
	# FOREIGN KEY (location_name) REFERENCES Locations(location_name)
	# FOREIGN KEY (uni_id) REFERENCES Universities(uni_id)
);

CREATE TABLE IF NOT EXISTS Rsos (
	rso_id INT AUTO_INCREMENT,
	name VARCHAR(255) NOT NULL,
	member_count INT NOT NULL DEFAULT 0,
	owner_id INT NOT NULL,
	description VARCHAR(255),
	image VARCHAR(255),
	PRIMARY KEY (rso_id),
	FOREIGN KEY (owner_id) REFERENCES Users(userid)
);

CREATE TABLE IF NOT EXISTS Rso_memberships (
	member_id INT NOT NULL,
	rso_id INT NOT NULL,
	PRIMARY KEY (member_id, rso_id),
	FOREIGN KEY (member_id) REFERENCES Users(userid),
	FOREIGN KEY (rso_id) REFERENCES Rsos(rso_id)
);

CREATE TABLE IF NOT EXISTS Attendance (
	attendee_id INT NOT NULL,
	event_id INT NOT NULL,
	PRIMARY KEY (attendee_id, event_id),
	FOREIGN KEY (attendee_id) REFERENCES Users(userid),
	FOREIGN KEY (event_id) REFERENCES Events(event_id) ON DELETE CASCADE
);

# CREATE TABLE IF NOT EXISTS Blogs (
# 	blog_id INT AUTO_INCREMENT,
# 	title VARCHAR(255),
# 	image VARCHAR(255),
# 	body VARCHAR(255),
# 	created_at TIMESTAMP DEFAULT NOW(),
# 	PRIMARY KEY (blog_id)
# );


