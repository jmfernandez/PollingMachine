-- The participants (both voters and proposers)
CREATE TABLE POLLUSER (
	id_mail VARCHAR(64) NOT NULL,
	name VARCHAR(64) NOT NULL,
	surname VARCHAR(64) NOT NULL,
	photo BLOB,
	photo_mime VARCHAR(32),
	PRIMARY KEY (id_mail)
);

-- Each poll has an entry in this table
CREATE TABLE POLL (
	poll_id VARCHAR(64) NOT NULL,
	title VARCHAR(64) NOT NULL,
	description TEXT NOT NULL,
	gatherstart TIMESTAMP,
	gatherend TIMESTAMP,
	pollstart TIMESTAMP,
	pollend TIMESTAMP,
	photo BLOB,
	photo_mime VARCHAR(32),
	PRIMARY KEY (poll_id)
);

-- The candidates for an specific polling
CREATE TABLE CANDIDATE (
	cand_id VARCHAR(64) NOT NULL,
	poll_id VARCHAR(64) NOT NULL,
	title VARCHAR(64) NOT NULL,
	description TEXT NOT NULL,
	PRIMARY KEY (cand_id),
	FOREIGN KEY (poll_id) REFERENCES POLL(poll_id)
);

-- The proposed photos
CREATE TABLE PROPOSED_BY (
	cand_id VARCHAR(64) NOT NULL,
	id_mail VARCHAR(64) NOT NULL,
	moment TIMESTAMP NOT NULL,
	photo BLOB,
	photo_mime VARCHAR(32) DEFAULT 'image/jpeg',
	FOREIGN KEY (cand_id) REFERENCES CANDIDATE(cand_id),
	FOREIGN KEY (id_mail) REFERENCES POLLUSER(id_mail)
);

CREATE TABLE VOTER (
	voter_id VARCHAR(64) NOT NULL,
	poll_id VARCHAR(64) NOT NULL,
	id_mail VARCHAR(64) NOT NULL,
	PRIMARY KEY(voter_id),
	UNIQUE (poll_id,id_mail),
	FOREIGN KEY (id_mail) REFERENCES POLLUSER(id_mail),
	FOREIGN KEY (poll_id) REFERENCES POLL(poll_id)
);

CREATE TABLE VOTETYPE (
	name VARCHAR(16) NOT NULL,
	colour VARCHAR(24) NOT NULL,
	photo BLOB,
	photo_mime VARCHAR(32) DEFAULT 'image/jpeg',
	PRIMARY KEY(name)
);

INSERT INTO VOTETYPE(name,colour) VALUES ('gold','#EDDA74');
INSERT INTO VOTETYPE(name,colour) VALUES ('silver','#BCC6CC');
INSERT INTO VOTETYPE(name,colour) VALUES ('bronze','#CD7F32');
INSERT INTO VOTETYPE(name,colour) VALUES ('blind','#00CC00');

CREATE TABLE VOTE (
	voter_id VARCHAR(64) NOT NULL,
	vote VARCHAR(64) NOT NULL,
	cand_id VARCHAR(64) NOT NULL,
	moment TIMESTAMP NOT NULL,
	FOREIGN KEY (voter_id) REFERENCES VOTER(voter_id),
	FOREIGN KEY (vote) REFERENCES VOTETYPE(name),
	FOREIGN KEY (cand_id) REFERENCES CANDIDATE(cand_id)
);

CREATE TABLE VOTEVALUE(
	name VARCHAR(16) NOT NULL,
	poll_id VARCHAR(64) NOT NULL,
	score INTEGER NOT NULL,
	isblind BOOLEAN NOT NULL DEFAULT 0,
	UNIQUE (name, poll_id),
	FOREIGN KEY (name) REFERENCES VOTETYPE(name),
	FOREIGN KEY (poll_id) REFERENCES POLL(poll_id)
);
