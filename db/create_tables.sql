DROP TABLE IF EXISTS to_dos;


CREATE TABLE to_dos (
    id SERIAL PRIMARY KEY,
    task character varying(255), 
  	time timestamp not null default now()
);

DROP TABLE IF EXISTS completed_todos;



CREATE TABLE completed_dos (
    id SERIAL PRIMARY KEY,
    task character varying(255),
	completed_time timestamp not null default now()
);





